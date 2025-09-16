// Stripe Checkout session creator (Vercel serverless)
// POST /api/create-checkout-session

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      orderId,
      customerName,
      customerEmail,
      customerPhone,
      successUrl,
      cancelUrl
    } = req.body || {};

    // Basic validation
    if (!orderId || !successUrl || !cancelUrl) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const amount = 3500; // AED 35.00 in minor unit

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      currency: 'aed',
      line_items: [
        {
          price_data: {
            currency: 'aed',
            product_data: {
              name: 'Custom Song',
              description: 'Personalized song (instant delivery)'
            },
            unit_amount: amount
          },
          quantity: 1
        }
      ],
      customer_email: customerEmail || undefined,
      metadata: {
        order_id: orderId,
        customer_name: customerName || '',
        customer_phone: customerPhone || ''
      },
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
      cancel_url: cancelUrl,
      allow_promotion_codes: false
    });

    return res.status(200).json({ id: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe create session error:', error);
    return res.status(500).json({ error: error.message });
  }
}


