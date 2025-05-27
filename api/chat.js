const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // Ensure the request is a POST
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Log environment variables to debug (visible in Vercel logs)
  console.log('GROQ_API_KEY:', process.env.GROQ_API_KEY);
  console.log('GROQ_API_URL:', process.env.GROQ_API_URL);
  console.log('GROQ_MODEL:', process.env.GROQ_MODEL);

  // Check if environment variables are defined
  if (!process.env.GROQ_API_KEY || !process.env.GROQ_API_URL || !process.env.GROQ_MODEL) {
    res.status(500).json({ error: 'Environment variables are missing' });
    return;
  }

  try {
    const groqResponse = await fetch(process.env.GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
        'x-groq-api-key': process.env.GROQ_API_KEY
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL,
        messages: req.body.messages,
        stream: true
      })
    });

    if (!groqResponse.ok) {
      const errorData = await groqResponse.json();
      console.error('Groq API error:', errorData);
      res.status(groqResponse.status).json({ error: 'Failed to fetch from Groq API', details: errorData });
      return;
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = groqResponse.body;
    stream.pipe(res);

    stream.on('end', () => {
      res.end();
    });

    stream.on('error', (err) => {
      console.error('Stream error:', err);
      res.status(500).json({ error: 'Stream error' });
    });
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: error.message });
  }
};
