// Create order after Stripe redirects to success page
// POST /api/create-order

const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { order } = req.body || {};
    if (!order || !order.order_id) {
      return res.status(400).json({ error: 'Missing order payload or order_id' });
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    );

    const { data, error } = await supabase
      .from('song_requests')
      .upsert(order, { onConflict: 'order_id' })
      .select('order_id');

    if (error) {
      console.error('Create order error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true, order_id: data?.[0]?.order_id || order.order_id });
  } catch (e) {
    console.error('Create order exception:', e);
    return res.status(500).json({ error: 'Internal error' });
  }
}


