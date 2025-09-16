// Test webhook endpoint to verify Stripe webhook configuration
module.exports = async function handler(req, res) {
  console.log('Test webhook called:', req.method, req.url);
  console.log('Headers:', req.headers);
  
  if (req.method === 'POST') {
    const body = await new Promise((resolve, reject) => {
      let data = '';
      req.on('data', chunk => data += chunk);
      req.on('end', () => resolve(data));
      req.on('error', reject);
    });
    
    console.log('Body length:', body.length);
    console.log('Body preview:', body.substring(0, 200));
  }
  
  res.status(200).json({ 
    message: 'Test webhook working',
    timestamp: new Date().toISOString(),
    method: req.method,
    headers: Object.keys(req.headers)
  });
};
