// Stripe webhook handler to mark orders paid
// POST /api/stripe-webhook

const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

const isTest = process.env.STRIPE_MODE === 'test';
const stripeSecret = isTest && process.env.STRIPE_SECRET_KEY_TEST
  ? process.env.STRIPE_SECRET_KEY_TEST
  : process.env.STRIPE_SECRET_KEY;
const stripe = new Stripe(stripeSecret, { apiVersion: '2023-10-16' });

export const config = {
  api: {
    bodyParser: false
  }
};

function buffer(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

module.exports = async function handler(req, res) {
  console.log('Vercel webhook received:', req.method, req.url);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];
  const endpointSecret = isTest && process.env.STRIPE_WEBHOOK_SECRET_TEST
    ? process.env.STRIPE_WEBHOOK_SECRET_TEST
    : process.env.STRIPE_WEBHOOK_SECRET;

  console.log('Webhook secret configured:', !!endpointSecret);
  console.log('Test mode:', isTest);

  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
    console.log('Event type:', event.type, 'Event ID:', event.id);
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    );

    // Handle payment_intent.created - Initial payment intent creation
    if (event.type === 'payment_intent.created') {
      const pi = event.data.object;
      const orderId = pi.metadata?.order_id;
      if (orderId) {
        console.log(`Payment intent created for order ${orderId}. Payment Intent ID: ${pi.id}`);
        const orderRecord = {
          order_id: orderId,
          status: 'pending_payment',
          payment_status: 'pending',
          payment_id: pi.id,
          price: pi.amount ? pi.amount / 100 : 35.0,
          updated_at: new Date().toISOString()
        };

        const { data: updData, error: updError } = await supabase
          .from('song_requests')
          .update(orderRecord)
          .eq('order_id', orderId)
          .select('order_id');
        if (updError) {
          console.error('Supabase update error:', updError);
        } else if (!updData || updData.length === 0) {
          console.warn('No draft row found to update for order_id:', orderId);
        } else {
          console.log(`Successfully updated order ${orderId} with payment status: ${orderRecord.payment_status}`);
        }
      }
    }

    // Handle charge.succeeded - Charge was successful, but payment intent might still be processing
    if (event.type === 'charge.succeeded') {
      const charge = event.data.object;
      const paymentIntentId = charge.payment_intent;
      
      // Get the payment intent to find the order_id
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      const orderId = paymentIntent.metadata?.order_id;
      
      if (orderId) {
        console.log(`Charge succeeded for order ${orderId}. Charge ID: ${charge.id}`);
        const orderRecord = {
          payment_status: 'processing',
          status: 'processing',
          updated_at: new Date().toISOString()
        };

        const { data: updData, error: updError } = await supabase
          .from('song_requests')
          .update(orderRecord)
          .eq('order_id', orderId)
          .select('order_id');
        if (updError) {
          console.error('Supabase update error:', updError);
        }
      }
    }

    // Handle payment_intent.succeeded - Payment intent completed successfully
    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object;
      const orderId = pi.metadata?.order_id;
      if (orderId) {
        console.log(`Payment intent succeeded for order ${orderId}. Payment Intent ID: ${pi.id}`);
        const orderRecord = {
          payment_status: 'paid',
          status: 'paid',
          payment_id: pi.id,
          updated_at: new Date().toISOString()
        };

        const { data: updData, error: updError } = await supabase
          .from('song_requests')
          .update(orderRecord)
          .eq('order_id', orderId)
          .select('order_id');
        if (updError) {
          console.error('Supabase update error:', updError);
        }
      }
    }

    // Handle checkout.session.completed - Final confirmation with full session details
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const sessionId = session.id;
      // Retrieve full session to get customer details (robustness)
      const fullSession = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['payment_intent', 'customer']
      });

      const orderId = fullSession.metadata?.order_id || session.metadata?.order_id;
      const paymentId = fullSession.payment_intent?.id || fullSession.payment_intent || session.payment_intent || session.id;
      const currency = fullSession.currency || 'aed';
      const amountTotal = typeof fullSession.amount_total === 'number' ? fullSession.amount_total : null;
      const customerEmail = fullSession.customer_details?.email || fullSession.customer_email || null;
      const customerName = fullSession.customer_details?.name || null;
      const customerPhone = fullSession.customer_details?.phone || null;

      if (orderId) {
        console.log(`Checkout session completed for order ${orderId}. Session ID: ${session.id}`);
        
        // Get the actual payment intent status from Stripe
        const paymentIntent = fullSession.payment_intent;
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
        
        const orderRecord = {
          order_id: orderId,
          status: orderStatus,
          payment_status: paymentStatus,
          payment_id: paymentId,
          price: amountTotal ? amountTotal / 100 : 35.0,
          customer_email: customerEmail,
          customer_name: customerName,
          customer_phone: customerPhone,
          updated_at: new Date().toISOString()
        };

        // Update existing draft (preferred). If no row, log; we can decide to insert minimal later.
        const { data: updData, error: updError } = await supabase
          .from('song_requests')
          .update(orderRecord)
          .eq('order_id', orderId)
          .select('order_id');
        if (updError) {
          console.error('Supabase update error:', updError);
        } else if (!updData || updData.length === 0) {
          console.warn('No draft row found to update for order_id:', orderId);
        } else {
          console.log(`Successfully updated order ${orderId} with payment status: ${orderRecord.payment_status}`);
        }
      }
    }

    // Handle payment_intent.payment_failed - Payment failed
    if (event.type === 'payment_intent.payment_failed') {
      const pi = event.data.object;
      const orderId = pi.metadata?.order_id;
      if (orderId) {
        console.log(`Payment intent failed for order ${orderId}. Payment Intent ID: ${pi.id}`);
        const orderRecord = {
          payment_status: 'failed',
          status: 'failed',
          updated_at: new Date().toISOString()
        };

        const { data: updData, error: updError } = await supabase
          .from('song_requests')
          .update(orderRecord)
          .eq('order_id', orderId)
          .select('order_id');
        if (updError) {
          console.error('Supabase update error:', updError);
        }
      }
    }

    // Handle payment_intent.canceled - Payment canceled
    if (event.type === 'payment_intent.canceled') {
      const pi = event.data.object;
      const orderId = pi.metadata?.order_id;
      if (orderId) {
        console.log(`Payment intent canceled for order ${orderId}. Payment Intent ID: ${pi.id}`);
        const orderRecord = {
          payment_status: 'canceled',
          status: 'canceled',
          updated_at: new Date().toISOString()
        };

        const { data: updData, error: updError } = await supabase
          .from('song_requests')
          .update(orderRecord)
          .eq('order_id', orderId)
          .select('order_id');
        if (updError) {
          console.error('Supabase update error:', updError);
        }
      }
    }

    // Handle payment_intent.requires_action - Payment requires additional action
    if (event.type === 'payment_intent.requires_action') {
      const pi = event.data.object;
      const orderId = pi.metadata?.order_id;
      if (orderId) {
        console.log(`Payment intent requires action for order ${orderId}. Payment Intent ID: ${pi.id}`);
        const orderRecord = {
          payment_status: 'requires_action',
          status: 'pending_payment',
          updated_at: new Date().toISOString()
        };

        const { data: updData, error: updError } = await supabase
          .from('song_requests')
          .update(orderRecord)
          .eq('order_id', orderId)
          .select('order_id');
        if (updError) {
          console.error('Supabase update error:', updError);
        }
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handling error:', error);
    res.status(500).json({ error: 'Internal error' });
  }
}


