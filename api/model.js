export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // API Configuration - Keys stay on server only!
  const API_CONFIGS = {
    api1: {
      name: 'Llama 3',
      description: 'Most capable model for complex tasks',
      icon: '🦙',
      endpoint: process.env.API1_ENDPOINT,
      apiKey: process.env.API1_KEY,
      model: process.env.API1_MODEL || 'llama3-70b-8192'
    },
    api3: {
      name: 'GPT 3.5 Turbo',
      description: 'Fast and efficient for most tasks',
      icon: '🤖',
      endpoint: process.env.API3_ENDPOINT,
      apiKey: process.env.API3_KEY,
      model: process.env.API3_MODEL || 'gpt-3.5-turbo'
    },
    api5: {
      name: 'Deepseek R1',
      description: 'Specialized for coding tasks',
      icon: '🧠',
      endpoint: process.env.API5_ENDPOINT,
      apiKey: process.env.API5_KEY,
      model: process.env.API5_MODEL || 'deepseek-r1'
    }
  };

  const availableModels = Object.entries(API_CONFIGS)
    .filter(([_, config]) => config.endpoint && config.apiKey)
    .map(([id, config]) => ({
      id,
      name: config.name,
      description: config.description,
      icon: config.icon
    }));
  
  res.json({ models: availableModels });
}