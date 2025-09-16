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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];
  const endpointSecret = isTest && process.env.STRIPE_WEBHOOK_SECRET_TEST
    ? process.env.STRIPE_WEBHOOK_SECRET_TEST
    : process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    );

    // Handle payment_intent.created - Just log, don't create records yet
    if (event.type === 'payment_intent.created') {
      const pi = event.data.object;
      const orderId = pi.metadata?.order_id;
      if (orderId) {
        console.log(`Payment intent created for order ${orderId}. Payment Intent ID: ${pi.id} - Waiting for payment success`);
      }
    }

    // Handle charge.succeeded - Charge was successful, but wait for payment_intent.succeeded
    if (event.type === 'charge.succeeded') {
      const charge = event.data.object;
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
      const pi = event.data.object;
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
      const session = event.data.object;
      const orderId = session.metadata?.order_id;
      if (orderId) {
        // Just log - the record should already be created by payment_intent.succeeded
        console.log(`Checkout session completed for order ${orderId}. Session ID: ${session.id} - Record should already exist`);
      }
    }

    // Handle payment_intent.payment_failed - Don't create records for failed payments
    if (event.type === 'payment_intent.payment_failed') {
      const pi = event.data.object;
      const orderId = pi.metadata?.order_id;
      if (orderId) {
        console.log(`Payment intent failed for order ${orderId}. Payment Intent ID: ${pi.id} - No record created for failed payment`);
      }
    }

    // Handle payment_intent.canceled - Don't create records for canceled payments
    if (event.type === 'payment_intent.canceled') {
      const pi = event.data.object;
      const orderId = pi.metadata?.order_id;
      if (orderId) {
        console.log(`Payment intent canceled for order ${orderId}. Payment Intent ID: ${pi.id} - No record created for canceled payment`);
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handling error:', error);
    res.status(500).json({ error: 'Internal error' });
  }
}


