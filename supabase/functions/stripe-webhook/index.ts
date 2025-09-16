// Supabase Edge Function: stripe-webhook
// - Verifies Stripe signatures
// - Handles checkout.session.completed, payment_intent.succeeded, payment_intent.payment_failed
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

    // Idempotency: record event id
    try { await markEventProcessed(event.id); } catch (_) {}

    // Handle payment_intent.created - Just log, don't create records yet
    if (event.type === 'payment_intent.created') {
      const pi: any = event.data.object;
      const orderId = pi.metadata?.order_id;
      if (orderId) {
        console.log(`Payment intent created for order ${orderId}. Payment Intent ID: ${pi.id} - Waiting for payment success`);
      }
    }

    // Handle charge.succeeded - Charge was successful, but wait for payment_intent.succeeded
    if (event.type === 'charge.succeeded') {
      const charge: any = event.data.object;
      const paymentIntentId = charge.payment_intent;
      
      // Get the payment intent to find the order_id
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      const orderId = paymentIntent.metadata?.order_id;
      
      if (orderId) {
        console.log(`Charge succeeded for order ${orderId}. Charge ID: ${charge.id} - Waiting for payment intent success`);
      }
    }

    // Handle payment_intent.succeeded - Payment intent completed successfully - CREATE THE RECORD
    if (event.type === 'payment_intent.succeeded') {
      const pi: any = event.data.object;
      const orderId = pi.metadata?.order_id;
      if (orderId) {
        // Create complete order record with all metadata from payment intent
        const orderRecord = {
          order_id: orderId,
          status: 'paid',
          payment_status: 'paid',
          payment_id: pi.id,
          price: pi.amount ? pi.amount / 100 : 35.0,
          customer_name: pi.metadata?.customer_name || null,
          customer_email: pi.metadata?.customer_email || null,
          customer_phone: pi.metadata?.customer_phone || null,
          celebration: pi.metadata?.moment || null,
          genre: pi.metadata?.song_style || null,
          recipient_name: pi.metadata?.recipient_name || null,
          recipient_gender: pi.metadata?.recipient_gender || null,
          story: pi.metadata?.story || null,
          vibe: pi.metadata?.vibe || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Insert the complete order record
        const { data, error } = await supabase
          .from('song_requests')
          .insert([orderRecord])
          .select();

        if (error) {
          console.error('Error creating order record:', error);
        } else {
          console.log(`Order record created successfully for ${orderId}. Payment Intent ID: ${pi.id}`);
        }
      }
    }

    // Handle checkout.session.completed - Final confirmation (record should already exist from payment_intent.succeeded)
    if (event.type === 'checkout.session.completed') {
      const session: any = event.data.object;
      const orderId = session.metadata?.order_id;
      if (orderId) {
        // Just log - the record should already be created by payment_intent.succeeded
        console.log(`Checkout session completed for order ${orderId}. Session ID: ${session.id} - Record should already exist`);
      }
    }

    // Handle payment_intent.payment_failed - Don't create records for failed payments
    if (event.type === 'payment_intent.payment_failed') {
      const pi: any = event.data.object;
      const orderId = pi.metadata?.order_id;
      if (orderId) {
        console.log(`Payment intent failed for order ${orderId}. Payment Intent ID: ${pi.id} - No record created for failed payment`);
      }
    }

    // Handle payment_intent.canceled - Don't create records for canceled payments
    if (event.type === 'payment_intent.canceled') {
      const pi: any = event.data.object;
      const orderId = pi.metadata?.order_id;
      if (orderId) {
        console.log(`Payment intent canceled for order ${orderId}. Payment Intent ID: ${pi.id} - No record created for canceled payment`);
      }
    }

    // Handle payment_intent.requires_action - Don't create records, just log
    if (event.type === 'payment_intent.requires_action') {
      const pi: any = event.data.object;
      const orderId = pi.metadata?.order_id;
      if (orderId) {
        console.log(`Payment intent requires action for order ${orderId}. Payment Intent ID: ${pi.id} - No record created, waiting for completion`);
      }
    }

    return jsonResponse(200, { received: true });
  } catch (e) {
    return jsonResponse(400, { error: String(e?.message || e) });
  }
});


