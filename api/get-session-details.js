// Get Stripe session details
// GET /api/get-session-details?session_id=cs_xxx

const Stripe = require('stripe');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { session_id } = req.query || {};
    if (!session_id) return res.status(400).json({ error: 'Missing session_id' });

    const isTest = process.env.STRIPE_MODE === 'test';
    const stripeSecret = isTest && process.env.STRIPE_SECRET_KEY_TEST
      ? process.env.STRIPE_SECRET_KEY_TEST
      : process.env.STRIPE_SECRET_KEY;
    const stripe = new Stripe(stripeSecret, { apiVersion: '2023-10-16' });

    const session = await stripe.checkout.sessions.retrieve(session_id, { 
      expand: ['payment_intent', 'customer'] 
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    return res.status(200).json({ 
      success: true, 
      session: {
        id: session.id,
        customer_details: session.customer_details,
        customer_email: session.customer_email,
        metadata: session.metadata,
        payment_status: session.payment_status,
        status: session.status
      }
    });

  } catch (error) {
    console.error('Get session details error:', error);
    return res.status(500).json({ error: 'Failed to retrieve session details' });
  }
};
