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

      const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

      if (orderId) {
        // Upsert the order in case it wasn't saved pre-checkout
        const orderRecord = {
          order_id: orderId,
          status: 'paid',
          payment_status: 'paid',
          payment_id: paymentId,
          price: amountTotal ? amountTotal / 100 : 35.0,
          customer_email: customerEmail,
          customer_name: customerName,
          customer_phone: customerPhone,
          updated_at: new Date().toISOString()
        };

        const { error: upsertError } = await supabase
          .from('song_requests')
          .upsert(orderRecord, { onConflict: 'order_id' });
        if (upsertError) console.error('Supabase upsert error:', upsertError);
      }
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handling error:', error);
    res.status(500).json({ error: 'Internal error' });
  }
}


