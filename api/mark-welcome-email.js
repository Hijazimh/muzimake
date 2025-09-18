// Mark welcome email as sent for an order_id
const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { order_id } = req.body || {};
    if (!order_id) return res.status(400).json({ error: 'Missing order_id' });

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    );

    const { error } = await supabase
      .from('song_requests')
      .update({ welcome_email_sent_at: new Date().toISOString() })
      .eq('order_id', order_id);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  } catch (e) {
    return res.status(500).json({ error: 'Internal error' });
  }
}


