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
      hasAPI1: !!process.env.API1_ENDPOINT && !!process.env.API1_KEY,
      hasAPI3: !!process.env.API3_ENDPOINT && !!process.env.API3_KEY,
      hasAPI5: !!process.env.API5_ENDPOINT && !!process.env.API5_KEY,
    })

    const models = []

    // API1 - DeepSeek R1
    if (process.env.API1_ENDPOINT && process.env.API1_KEY) {
      models.push({
        id: "deepseek-r1",
        name: "🧠 DeepSeek R1",
        provider: "DeepSeek",
        description: "Advanced reasoning model with chain-of-thought capabilities",
      })
    }

    // API3 - Llama 3
    if (process.env.API3_ENDPOINT && process.env.API3_KEY) {
      models.push({
        id: "llama-3",
        name: "🦙 Llama 3 70B",
        provider: "Meta",
        description: "Large language model optimized for conversation and reasoning",
      })
    }

    // API5 - GPT 3.5
    if (process.env.API5_ENDPOINT && process.env.API5_KEY) {
      models.push({
        id: "gpt-3.5",
        name: "🤖 GPT-3.5 Turbo",
        provider: "OpenAI",
        description: "Fast and efficient model for general-purpose tasks",
      })
    }

    console.log(
      `Returning ${models.length} configured models:`,
      models.map((m) => m.name),
    )

    if (models.length === 0) {
      return res.status(500).json({
        success: false,
        error: "No AI models configured. Please set up environment variables.",
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
