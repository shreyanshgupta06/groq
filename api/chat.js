export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")

  if (req.method === "OPTIONS") {
    res.status(200).end()
    return
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" })
    return
  }

  try {
    const { message, model, messages = [] } = req.body

    if (!message || !model) {
      return res.status(400).json({ error: "Message and model are required" })
    }

    console.log("Chat request:", { model, messageLength: message.length })

    let apiConfig

    // Configure API based on selected model
    switch (model) {
      case "deepseek-r1":
        if (!process.env.API1_ENDPOINT || !process.env.API1_KEY || !process.env.API1_MODEL) {
          return res.status(500).json({ error: "DeepSeek R1 not configured. Missing API1 environment variables." })
        }
        apiConfig = {
          endpoint: process.env.API1_ENDPOINT,
          key: process.env.API1_KEY,
          model: process.env.API1_MODEL,
          headers: {
            Authorization: `Bearer ${process.env.API1_KEY}`,
            "Content-Type": "application/json",
          },
        }
        break

      case "llama-3":
        if (!process.env.API3_ENDPOINT || !process.env.API3_KEY || !process.env.API3_MODEL) {
          return res.status(500).json({ error: "Llama 3 not configured. Missing API3 environment variables." })
        }
        apiConfig = {
          endpoint: process.env.API3_ENDPOINT,
          key: process.env.API3_KEY,
          model: process.env.API3_MODEL,
          headers: {
            Authorization: `Bearer ${process.env.API3_KEY}`,
            "Content-Type": "application/json",
          },
        }
        break

      case "gpt-3.5":
        if (!process.env.API5_ENDPOINT || !process.env.API5_KEY || !process.env.API5_MODEL) {
          return res.status(500).json({ error: "GPT-3.5 not configured. Missing API5 environment variables." })
        }
        apiConfig = {
          endpoint: process.env.API5_ENDPOINT,
          key: process.env.API5_KEY,
          model: process.env.API5_MODEL,
          headers: {
            Authorization: `Bearer ${process.env.API5_KEY}`,
            "Content-Type": "application/json",
          },
        }
        break

      default:
        return res.status(400).json({ error: `Invalid model selected: ${model}` })
    }

    console.log(`Using model: ${apiConfig.model} at ${apiConfig.endpoint}`)

    // Prepare conversation history
    const conversationMessages = [
      {
        role: "system",
        content:
          "You are Shreyansh Cloud AI, a helpful and intelligent assistant. Provide clear, accurate, and helpful responses. Format your responses nicely with proper structure when needed.",
      },
      ...messages.slice(-10), // Keep last 10 messages for context
      {
        role: "user",
        content: message,
      },
    ]

    // Prepare request payload
    const payload = {
      model: apiConfig.model,
      messages: conversationMessages,
      max_tokens: 2000,
      temperature: 0.7,
      stream: false,
    }

    console.log("Making API request with payload:", {
      endpoint: apiConfig.endpoint,
      model: apiConfig.model,
      messageCount: conversationMessages.length,
    })

    // Make request to AI API
    const response = await fetch(apiConfig.endpoint, {
      method: "POST",
      headers: apiConfig.headers,
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("API Error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        model: apiConfig.model,
        endpoint: apiConfig.endpoint,
      })

      let errorMessage = `API request failed: ${response.status} ${response.statusText}`
      try {
        const errorData = JSON.parse(errorText)
        errorMessage = errorData.error?.message || errorData.message || errorMessage
      } catch (e) {
        // Use default error message
      }

      throw new Error(errorMessage)
    }

    const data = await response.json()
    console.log("API response received successfully for model:", apiConfig.model)

    // Extract response text
    let responseText
    if (data.choices && data.choices[0] && data.choices[0].message) {
      responseText = data.choices[0].message.content
    } else if (data.message && data.message.content) {
      responseText = data.message.content
    } else if (data.response) {
      responseText = data.response
    } else {
      console.error("Unexpected API response format:", data)
      throw new Error("Unexpected response format from AI API")
    }

    // Clean up response
    responseText = responseText.trim()

    res.status(200).json({
      success: true,
      response: responseText,
      model: apiConfig.model,
      provider: model,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Chat API error:", error)
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
      timestamp: new Date().toISOString(),
    })
  }
}
