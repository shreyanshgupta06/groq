export default function handler(req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")

  if (req.method === "OPTIONS") {
    res.status(200).end()
    return
  }

  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" })
    return
  }

  try {
    console.log("Models API called")
    console.log("Environment check:", {
      hasAPI1: !!process.env.API1_ENDPOINT && !!process.env.API1_KEY && !!process.env.API1_MODEL,
      hasAPI3: !!process.env.API3_ENDPOINT && !!process.env.API3_KEY && !!process.env.API3_MODEL,
      hasAPI5: !!process.env.API5_ENDPOINT && !!process.env.API5_KEY && !!process.env.API5_MODEL,
    })

    const models = []

    // API1 - DeepSeek R1
    if (process.env.API1_ENDPOINT && process.env.API1_KEY && process.env.API1_MODEL) {
      models.push({
        id: "deepseek-r1",
        name: "🧠 DeepSeek R1",
        provider: "DeepSeek",
        model: process.env.API1_MODEL,
        description: "Advanced reasoning model with chain-of-thought capabilities",
      })
    }

    // API3 - Llama 3
    if (process.env.API3_ENDPOINT && process.env.API3_KEY && process.env.API3_MODEL) {
      models.push({
        id: "llama-3",
        name: "🦙 Llama 3 70B",
        provider: "Meta/Groq",
        model: process.env.API3_MODEL,
        description: "Large language model optimized for conversation and reasoning",
      })
    }

    // API5 - GPT 3.5
    if (process.env.API5_ENDPOINT && process.env.API5_KEY && process.env.API5_MODEL) {
      models.push({
        id: "gpt-3.5",
        name: "🤖 GPT-3.5 Turbo",
        provider: "OpenAI",
        model: process.env.API5_MODEL,
        description: "Fast and efficient model for general-purpose tasks",
      })
    }

    console.log(
      `Returning ${models.length} configured models:`,
      models.map((m) => `${m.name} (${m.model})`),
    )

    if (models.length === 0) {
      return res.status(500).json({
        success: false,
        error: "No AI models configured. Please set up API1, API3, and API5 environment variables (ENDPOINT, KEY, MODEL).",
        models: [],
      })
    }

    res.status(200).json({
      success: true,
      models: models,
      count: models.length,
    })
  } catch (error) {
    console.error("Error in models API:", error)
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: error.message,
      models: [],
    })
  }
}
