// Confirm Stripe session server-side and create/update order
// POST /api/confirm-session { session_id }

const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { session_id } = req.body || {};
    if (!session_id) return res.status(400).json({ error: 'Missing session_id' });

    const isTest = process.env.STRIPE_MODE === 'test';
    const stripeSecret = isTest && process.env.STRIPE_SECRET_KEY_TEST
      ? process.env.STRIPE_SECRET_KEY_TEST
      : process.env.STRIPE_SECRET_KEY;
    const stripe = new Stripe(stripeSecret, { apiVersion: '2023-10-16' });

    const session = await stripe.checkout.sessions.retrieve(session_id, { expand: ['payment_intent','customer'] });
    if (!session || session.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Session not paid' });
    }

    const orderId = session.metadata?.order_id;
    if (!orderId) return res.status(400).json({ error: 'Missing order_id in metadata' });

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    );

    const amountTotal = typeof session.amount_total === 'number' ? session.amount_total : null;
    const customerEmail = session.customer_details?.email || session.customer_email || null;
    const customerName = session.customer_details?.name || null;
    const customerPhone = session.customer_details?.phone || null;
    const paymentId = session.payment_intent?.id || session.payment_intent || session.id;

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

    const { data, error } = await supabase
      .from('song_requests')
      .upsert(orderRecord, { onConflict: 'order_id' })
      .select('order_id');

    if (error) {
      console.error('Confirm-session upsert error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true, order_id: data?.[0]?.order_id || orderId });
  } catch (e) {
    console.error('Confirm-session exception:', e);
    return res.status(500).json({ error: 'Internal error' });
  }
}


