export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, model: modelId } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // API Configuration
    const API_CONFIGS = {
      api1: {
        name: 'Llama 3',
        endpoint: process.env.API1_ENDPOINT,
        apiKey: process.env.API1_KEY,
        model: process.env.API1_MODEL || 'llama3-70b-8192'
      },
      api3: {
        name: 'GPT 3.5 Turbo',
        endpoint: process.env.API3_ENDPOINT,
        apiKey: process.env.API3_KEY,
        model: process.env.API3_MODEL || 'gpt-3.5-turbo'
      },
      api5: {
        name: 'Deepseek R1',
        endpoint: process.env.API5_ENDPOINT,
        apiKey: process.env.API5_KEY,
        model: process.env.API5_MODEL || 'deepseek-r1'
      }
    };
    
    const config = API_CONFIGS[modelId];
    if (!config || !config.endpoint || !config.apiKey) {
      return res.status(400).json({ error: 'Invalid or unconfigured model' });
    }
    
    console.log(`Making request to ${config.name} (${modelId})`);
    
    // Set up headers based on API type
    const headers = {
      'Content-Type': 'application/json'
    };
    
    let requestBody;
    let url = config.endpoint;
    
    // Configure request based on API provider
    if (modelId === 'api2') { // Claude
      headers['x-api-key'] = config.apiKey;
      headers['anthropic-version'] = '2023-06-01';
      requestBody = {
        model: config.model,
        max_tokens: 2048,
        messages: messages.map(msg => ({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content
        })),
        stream: true
      };
    } else if (modelId === 'api4') { // Gemini
      url += `?key=${config.apiKey}`;
      requestBody = {
        contents: messages.filter(msg => msg.role === 'user').map(msg => ({
          parts: [{ text: msg.content }]
        })),
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.7
        }
      };
    } else {
      // Standard OpenAI-compatible format (api1, api3, api5)
      headers['Authorization'] = `Bearer ${config.apiKey}`;
      requestBody = {
        model: config.model,
        messages: messages,
        stream: true,
        max_tokens: 2048,
        temperature: 0.7
      };
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error (${response.status}):`, errorText);
      return res.status(response.status).json({ 
        error: `API request failed: ${response.statusText}` 
      });
    }
    
    // Set up streaming response
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    
    // Handle non-streaming APIs (like Gemini)
    if (modelId === 'api4') {
      const data = await response.json();
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const text = data.candidates[0].content.parts[0].text;
        res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
      }
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }
    
    // Handle streaming APIs
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') {
              res.write('data: [DONE]\n\n');
              res.end();
              return;
            }
            
            try {
              const parsed = JSON.parse(data);
              let content = '';
              
              // Parse based on API type
              if (modelId === 'api2') { // Claude
                if (parsed.type === 'content_block_delta' && parsed.delta && parsed.delta.text) {
                  content = parsed.delta.text;
                }
              } else {
                // Standard OpenAI format
                if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content) {
                  content = parsed.choices[0].delta.content;
                }
              }
              
              if (content) {
                res.write(`data: ${JSON.stringify({ content })}\n\n`);
              }
            } catch (e) {
              // Ignore JSON parse errors
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error);
      res.write(`data: ${JSON.stringify({ content: 'Sorry, an error occurred while streaming the response.' })}\n\n`);
    }
    
    res.write('data: [DONE]\n\n');
    res.end();
    
  } catch (error) {
    console.error('Chat API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}