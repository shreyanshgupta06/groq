import { groq } from 'groq-sdk';

export default async function handler(req, res) {
  try {
    // Initialize Groq client with environment variable
    const client = new groq.Client({
      apiKey: process.env.GROQ_API_KEY
    });

    // Get request body
    const { model, messages, stream } = req.body;

    // Create chat completion
    const completion = await client.chat.completions.create({
      model: model || "llama3-70b-8192",
      messages,
      stream: stream !== false
    });

    // Set headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Stream the response
    for await (const chunk of completion) {
      const data = {
        id: chunk.id,
        object: chunk.object,
        created: chunk.created,
        model: chunk.model,
        choices: chunk.choices.map(choice => ({
          index: choice.index,
          delta: {
            content: choice.delta?.content,
            role: choice.delta?.role
          },
          finish_reason: choice.finish_reason
        }))
      };
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Error in chat endpoint:', error);
    res.status(500).json({ error: error.message });
  }
}

export const config = {
  runtime: 'edge', // Important for streaming on Vercel
};