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
        apiConfig = {
          endpoint: process.env.API1_ENDPOINT,
          key: process.env.API1_KEY,
          model: "deepseek-reasoner", // or deepseek-chat
          headers: {
            Authorization: `Bearer ${process.env.API1_KEY}`,
            "Content-Type": "application/json",
          },
        }
        break

      case "llama-3":
        apiConfig = {
          endpoint: process.env.API3_ENDPOINT,
          key: process.env.API3_KEY,
          model: "llama-3.1-70b-versatile", // Groq model name
          headers: {
            Authorization: `Bearer ${process.env.API3_KEY}`,
            "Content-Type": "application/json",
          },
        }
        break

      case "gpt-3.5":
        apiConfig = {
          endpoint: process.env.API5_ENDPOINT,
          key: process.env.API5_KEY,
          model: "gpt-3.5-turbo",
          headers: {
            Authorization: `Bearer ${process.env.API5_KEY}`,
            "Content-Type": "application/json",
          },
        }
        break

      default:
        return res.status(400).json({ error: "Invalid model selected" })
    }

    if (!apiConfig.endpoint || !apiConfig.key) {
      return res.status(500).json({
        error: `Model ${model} is not configured. Please check environment variables.`,
      })
    }

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
      stream: false, // Disable streaming for simplicity
    }

    console.log("Making API request to:", apiConfig.endpoint)

    // Make request to AI API
    const response = await fetch(apiConfig.endpoint, {
      method: "POST",
      headers: apiConfig.headers,
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("API Error:", response.status, errorText)

      let errorMessage = `API request failed: ${response.status}`
      try {
        const errorData = JSON.parse(errorText)
        errorMessage = errorData.error?.message || errorData.message || errorMessage
      } catch (e) {
        // Use default error message
      }

      throw new Error(errorMessage)
    }

    const data = await response.json()
    console.log("API response received successfully")

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
      model: model,
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
