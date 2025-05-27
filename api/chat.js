const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // Ensure the request is a POST
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
        'x-groq-api-key': process.env.GROQ_API_KEY
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
        messages: req.body.messages,
        stream: true
      })
    });

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
