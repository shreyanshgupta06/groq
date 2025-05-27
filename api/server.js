const express = require('express');
const dotenv = require('dotenv');
const fetch = require('node-fetch');

dotenv.config();

const app = express();
const port = 3000;

app.use(express.json());

// Serve static files (e.g., your index.html)
app.use(express.static('public'));

// Proxy endpoint to forward requests to Groq API
app.post('/api/groq', async (req, res) => {
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
      res.status(500).send({ error: 'Stream error' });
    });
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).send({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
