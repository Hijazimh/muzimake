// Update song request details after successful payment
// POST /api/update-order-details { order_id, details }

const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { order_id, details } = req.body || {};
    if (!order_id || !details) return res.status(400).json({ error: 'Missing order_id or details' });

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    );

    // Only allow updating known fields
    const patch = {
      celebration: details.celebration ?? null,
      genre: details.genre ?? null,
      recipient_name: details.recipient_name ?? null,
      recipient_gender: details.recipient_gender ?? null,
      story: details.story ?? null,
      vibe: Array.isArray(details.vibe) ? details.vibe.join(', ') : (details.vibe ?? null),
      customer_name: details.customer_name ?? null,
      customer_email: details.customer_email ?? null,
      customer_phone: details.customer_phone ?? null,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('song_requests')
      .update(patch)
      .eq('order_id', order_id)
      .select('order_id');

    if (error) {
      console.error('update-order-details error:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true, order_id: order_id });
  } catch (e) {
    console.error('update-order-details exception:', e);
    return res.status(500).json({ error: 'Internal error' });
  }
}


