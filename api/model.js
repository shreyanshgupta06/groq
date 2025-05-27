export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    console.log('Models API called');
    console.log('Environment check:', {
      hasAPI1: !!process.env.API1_ENDPOINT,
      hasAPI1Key: !!process.env.API1_KEY,
      hasAPI3: !!process.env.API3_ENDPOINT,
      hasAPI3Key: !!process.env.API3_KEY,
      hasAPI5: !!process.env.API5_ENDPOINT,
      hasAPI5Key: !!process.env.API5_KEY
    });

    const models = [];

    // API 1 - Llama (if configured)
    if (process.env.API1_ENDPOINT && process.env.API1_KEY) {
      models.push({
        id: 'llama-3.1-70b',
        name: 'Llama 3.1 70B',
        provider: 'Meta',
        apiIndex: 1
      });
    }

    // API 2 - Claude (if configured)
    if (process.env.API2_ENDPOINT && process.env.API2_KEY) {
      models.push({
        id: 'claude-3-sonnet',
        name: 'Claude 3 Sonnet',
        provider: 'Anthropic',
        apiIndex: 2
      });
    }

    // API 3 - GPT (if configured)
    if (process.env.API3_ENDPOINT && process.env.API3_KEY) {
      models.push({
        id: 'gpt-4o',
        name: 'GPT-4o',
        provider: 'OpenAI',
        apiIndex: 3
      });
    }

    // API 4 - Gemini (if configured)
    if (process.env.API4_ENDPOINT && process.env.API4_KEY) {
      models.push({
        id: 'gemini-pro',
        name: 'Gemini Pro',
        provider: 'Google',
        apiIndex: 4
      });
    }

    // API 5 - DeepSeek (if configured)
    if (process.env.API5_ENDPOINT && process.env.API5_KEY) {
      models.push({
        id: 'deepseek-chat',
        name: 'DeepSeek Chat',
        provider: 'DeepSeek',
        apiIndex: 5
      });
    }

    // API 6 - Mistral (if configured)
    if (process.env.API6_ENDPOINT && process.env.API6_KEY) {
      models.push({
        id: 'mistral-large',
        name: 'Mistral Large',
        provider: 'Mistral AI',
        apiIndex: 6
      });
    }

    console.log(`Returning ${models.length} configured models`);

    // Return available models
    res.status(200).json({
      success: true,
      models: models,
      count: models.length
    });

  } catch (error) {
    console.error('Error in models API:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}
