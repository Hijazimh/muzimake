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
  const { data, error } = await supabase
    .from('song_requests')
    .update(patch)
    .eq('order_id', orderId)
    .select('order_id');
  
  if (error) {
    console.error('Error updating order:', error);
    throw error;
  }
  
  if (!data || data.length === 0) {
    console.warn(`No order found to update for order_id: ${orderId}`);
  } else {
    console.log(`Successfully updated order ${orderId}`);
  }
  
  return data;
}

async function ensureOrder(orderId: string, insertPatch: Record<string, any>) {
  const { data, error } = await supabase
    .from('song_requests')
    .select('order_id')
    .eq('order_id', orderId)
    .maybeSingle();
  
  if (error) {
    console.error('Error checking order existence:', error);
    throw error;
  }
  
  if (!data) {
    console.log(`Creating new order for order_id: ${orderId}`);
    const { data: insertData, error: insertError } = await supabase
      .from('song_requests')
      .insert([{ order_id: orderId, ...insertPatch }])
      .select('order_id');
    
    if (insertError) {
      console.error('Error creating order:', insertError);
      throw insertError;
    }
    
    console.log(`Successfully created order ${orderId}`);
    return insertData;
  } else {
    console.log(`Updating existing order for order_id: ${orderId}`);
    return await updateOrder(orderId, insertPatch);
  }
}

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

serve(async (req) => {
  try {
    console.log('Webhook received:', req.method, req.url);
    
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      console.error('Missing Stripe signature');
      return jsonResponse(400, { error: 'Missing Stripe signature' });
    }
    
    const rawBody = await req.text();
    console.log('Raw body length:', rawBody.length);
    
    const event = stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET);
    console.log('Event type:', event.type, 'Event ID:', event.id);

    // Idempotency: record event id
    try { 
      const processed = await markEventProcessed(event.id);
      if (!processed) {
        console.log(`Event ${event.id} already processed, skipping`);
        return jsonResponse(200, { received: true, message: 'Event already processed' });
      }
    } catch (error) {
      console.error('Error marking event as processed:', error);
    }

    // Handle payment_intent.created - Initial payment intent creation
    if (event.type === 'payment_intent.created') {
      const pi: any = event.data.object;
      const orderId = pi.metadata?.order_id;
      if (orderId) {
        console.log(`Payment intent created for order ${orderId}. Payment Intent ID: ${pi.id}`);
        await ensureOrder(orderId, {
          status: 'pending_payment',
          payment_status: 'pending',
          payment_id: pi.id,
          price: pi.amount ? pi.amount / 100 : 35,
          updated_at: new Date().toISOString()
        });
      }
    }

    // Handle charge.succeeded - Charge was successful, but payment intent might still be processing
    if (event.type === 'charge.succeeded') {
      const charge: any = event.data.object;
      const paymentIntentId = charge.payment_intent;
      
      // Get the payment intent to find the order_id
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      const orderId = paymentIntent.metadata?.order_id;
      
      if (orderId) {
        console.log(`Charge succeeded for order ${orderId}. Charge ID: ${charge.id}`);
        await updateOrder(orderId, {
          payment_status: 'processing',
          status: 'processing',
          updated_at: new Date().toISOString()
        });
      }
    }

    // Handle payment_intent.succeeded - Payment intent completed successfully
    if (event.type === 'payment_intent.succeeded') {
      const pi: any = event.data.object;
      const orderId = pi.metadata?.order_id;
      if (orderId) {
        console.log(`Payment intent succeeded for order ${orderId}. Payment Intent ID: ${pi.id}`);
        await updateOrder(orderId, { 
          payment_status: 'paid', 
          status: 'paid', 
          payment_id: pi.id, 
          updated_at: new Date().toISOString() 
        });
      }
    }

    // Handle checkout.session.completed - Final confirmation with full session details
    if (event.type === 'checkout.session.completed') {
      const session: any = event.data.object;
      const orderId = session.metadata?.order_id;
      if (orderId) {
        console.log(`Checkout session completed for order ${orderId}. Session ID: ${session.id}`);
        
        // Retrieve full session with payment intent details
        const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
          expand: ['payment_intent']
        });
        
        const paymentIntent = fullSession.payment_intent as any;
        const stripePaymentStatus = paymentIntent?.status || 'unknown';
        
        // Map Stripe payment status to our status
        let paymentStatus = 'pending';
        let orderStatus = 'pending_payment';
        
        switch (stripePaymentStatus) {
          case 'succeeded':
            paymentStatus = 'paid';
            orderStatus = 'paid';
            break;
          case 'requires_payment_method':
          case 'requires_confirmation':
          case 'requires_action':
            paymentStatus = 'pending';
            orderStatus = 'pending_payment';
            break;
          case 'canceled':
            paymentStatus = 'canceled';
            orderStatus = 'canceled';
            break;
          case 'processing':
            paymentStatus = 'processing';
            orderStatus = 'processing';
            break;
          default:
            paymentStatus = 'unknown';
            orderStatus = 'pending_payment';
        }
        
        const amount = typeof fullSession.amount_total === 'number' ? fullSession.amount_total / 100 : null;
        await ensureOrder(orderId, {
          status: orderStatus,
          payment_status: paymentStatus,
          payment_id: paymentIntent?.id || fullSession.id,
          price: amount ?? 35,
          customer_email: fullSession.customer_details?.email ?? fullSession.customer_email ?? null,
          customer_name: fullSession.customer_details?.name ?? null,
          customer_phone: fullSession.customer_details?.phone ?? null,
          updated_at: new Date().toISOString()
        });
      }
    }

    // Handle payment_intent.payment_failed - Payment failed
    if (event.type === 'payment_intent.payment_failed') {
      const pi: any = event.data.object;
      const orderId = pi.metadata?.order_id;
      if (orderId) {
        console.log(`Payment intent failed for order ${orderId}. Payment Intent ID: ${pi.id}`);
        await ensureOrder(orderId, { 
          payment_status: 'failed', 
          status: 'failed', 
          updated_at: new Date().toISOString() 
        });
      }
    }

    // Handle payment_intent.canceled - Payment canceled
    if (event.type === 'payment_intent.canceled') {
      const pi: any = event.data.object;
      const orderId = pi.metadata?.order_id;
      if (orderId) {
        console.log(`Payment intent canceled for order ${orderId}. Payment Intent ID: ${pi.id}`);
        await updateOrder(orderId, { 
          payment_status: 'canceled', 
          status: 'canceled', 
          updated_at: new Date().toISOString() 
        });
      }
    }

    // Handle payment_intent.requires_action - Payment requires additional action
    if (event.type === 'payment_intent.requires_action') {
      const pi: any = event.data.object;
      const orderId = pi.metadata?.order_id;
      if (orderId) {
        console.log(`Payment intent requires action for order ${orderId}. Payment Intent ID: ${pi.id}`);
        await updateOrder(orderId, { 
          payment_status: 'requires_action', 
          status: 'pending_payment', 
          updated_at: new Date().toISOString() 
        });
      }
    }

    return jsonResponse(200, { received: true });
  } catch (e) {
    console.error('Webhook error:', e);
    return jsonResponse(500, { error: String(e?.message || e) });
  }
});


