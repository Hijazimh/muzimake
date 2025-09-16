// Supabase Edge Function: stripe-webhook
// - Verifies Stripe signatures
// - Handles all Stripe payment events to reflect exact payment status
// - Updates song_requests by metadata.order_id
// - Records processed event IDs (idempotency)

// deno-lint-ignore-file no-explicit-any
import Stripe from "https://esm.sh/stripe@12.17.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const isTest = (Deno.env.get('STRIPE_MODE') || '').toLowerCase() === 'test';
const STRIPE_SECRET_KEY = isTest && Deno.env.get('STRIPE_SECRET_KEY_TEST')
  ? Deno.env.get('STRIPE_SECRET_KEY_TEST')!
  : Deno.env.get('STRIPE_SECRET_KEY')!;
const STRIPE_WEBHOOK_SECRET = isTest && Deno.env.get('STRIPE_WEBHOOK_SECRET_TEST')
  ? Deno.env.get('STRIPE_WEBHOOK_SECRET_TEST')!
  : Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function markEventProcessed(eventId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('processed_events')
    .insert({ id: eventId })
    .select('id');
  if (error) {
    // If duplicate, it's already processed
    if (String(error.message).toLowerCase().includes('duplicate')) return false;
    throw error;
  }
  return !!(data && data.length);
}

async function updateOrder(orderId: string, patch: Record<string, any>) {
  await supabase.from('song_requests').update(patch).eq('order_id', orderId);
}

async function ensureOrder(orderId: string, insertPatch: Record<string, any>) {
  const { data, error } = await supabase
    .from('song_requests')
    .select('order_id')
    .eq('order_id', orderId)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    await supabase.from('song_requests').insert([{ order_id: orderId, ...insertPatch }]);
  } else {
    await updateOrder(orderId, insertPatch);
  }
}

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

serve(async (req) => {
  try {
    const signature = req.headers.get('stripe-signature');
    if (!signature) return jsonResponse(400, { error: 'Missing Stripe signature' });
    const rawBody = await req.text();
    const event = stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET);

    console.log(`Processing Stripe event: ${event.type} (${event.id})`);

    // Idempotency: record event id
    try { await markEventProcessed(event.id); } catch (_) {}

    let orderId: string | null = null;
    let paymentStatus: string = 'pending_payment';
    let orderStatus: string = 'pending_payment';
    let paymentId: string | null = null;
    let amount: number | null = null;
    let customerEmail: string | null = null;
    let customerName: string | null = null;
    let customerPhone: string | null = null;

    // Handle different Stripe events to get exact payment status
    switch (event.type) {
      case 'checkout.session.completed': {
        const session: any = event.data.object;
        orderId = session.metadata?.order_id;
        paymentId = session.payment_intent || session.id;
        amount = typeof session.amount_total === 'number' ? session.amount_total / 100 : null;
        customerEmail = session.customer_details?.email ?? session.customer_email ?? null;
        customerName = session.customer_details?.name ?? null;
        customerPhone = session.customer_details?.phone ?? null;
        
        // Check the actual payment status from the session
        if (session.payment_status === 'paid') {
          paymentStatus = 'paid';
          orderStatus = 'paid';
        } else if (session.payment_status === 'unpaid') {
          paymentStatus = 'unpaid';
          orderStatus = 'pending_payment';
        } else {
          paymentStatus = session.payment_status || 'pending_payment';
          orderStatus = 'pending_payment';
        }
        console.log(`Checkout session completed - Payment status: ${paymentStatus}, Order: ${orderId}`);
        break;
      }

      case 'payment_intent.succeeded': {
        const pi: any = event.data.object;
        orderId = pi.metadata?.order_id;
        paymentId = pi.id;
        amount = typeof pi.amount === 'number' ? pi.amount / 100 : null;
        paymentStatus = 'paid';
        orderStatus = 'paid';
        console.log(`Payment intent succeeded - Order: ${orderId}`);
        break;
      }

      case 'payment_intent.payment_failed': {
        const pi: any = event.data.object;
        orderId = pi.metadata?.order_id;
        paymentId = pi.id;
        paymentStatus = 'failed';
        orderStatus = 'pending_payment';
        console.log(`Payment intent failed - Order: ${orderId}`);
        break;
      }

      case 'payment_intent.canceled': {
        const pi: any = event.data.object;
        orderId = pi.metadata?.order_id;
        paymentId = pi.id;
        paymentStatus = 'canceled';
        orderStatus = 'pending_payment';
        console.log(`Payment intent canceled - Order: ${orderId}`);
        break;
      }

      case 'payment_intent.requires_action': {
        const pi: any = event.data.object;
        orderId = pi.metadata?.order_id;
        paymentId = pi.id;
        paymentStatus = 'requires_action';
        orderStatus = 'pending_payment';
        console.log(`Payment intent requires action - Order: ${orderId}`);
        break;
      }

      case 'payment_intent.requires_payment_method': {
        const pi: any = event.data.object;
        orderId = pi.metadata?.order_id;
        paymentId = pi.id;
        paymentStatus = 'requires_payment_method';
        orderStatus = 'pending_payment';
        console.log(`Payment intent requires payment method - Order: ${orderId}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
        return jsonResponse(200, { received: true, message: `Unhandled event type: ${event.type}` });
    }

    // Update the order with exact Stripe payment status
    if (orderId) {
      const updateData = {
        payment_status: paymentStatus,
        status: orderStatus,
        payment_id: paymentId,
        updated_at: new Date().toISOString()
      };

      // Add amount and customer details if available
      if (amount !== null) updateData.price = amount;
      if (customerEmail) updateData.customer_email = customerEmail;
      if (customerName) updateData.customer_name = customerName;
      if (customerPhone) updateData.customer_phone = customerPhone;

      await ensureOrder(orderId, updateData);
      console.log(`Updated order ${orderId} with payment_status: ${paymentStatus}, status: ${orderStatus}`);
    }

    return jsonResponse(200, { received: true, order_id: orderId, payment_status: paymentStatus });
  } catch (e) {
    console.error('Webhook error:', e);
    return jsonResponse(400, { error: String(e?.message || e) });
  }
});


