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
    const { message, messages = [] } = req.body

    if (!message) {
      return res.status(400).json({ error: "Message is required" })
    }

    console.log("Chat request:", { messageLength: message.length, historyLength: messages.length })

    // Use environment variables for API configuration
    const API_KEY = process.env.GROQ_API_KEY
    const API_URL = process.env.GROQ_API_URL || "https://api.groq.com/openai/v1/chat/completions"
    const MODEL = process.env.GROQ_MODEL || "llama-3.1-70b-versatile"

    if (!API_KEY) {
      return res.status(500).json({
        error: "API configuration missing. Please check environment variables.",
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

    console.log("Making API request to Groq...")

    // Make request to Groq API
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: conversationMessages,
        max_tokens: 2000,
        temperature: 0.7,
        stream: false,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Groq API Error:", response.status, errorText)

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
    } else {
      console.error("Unexpected API response format:", data)
      throw new Error("Unexpected response format from AI API")
    }

    // Clean up response
    responseText = responseText.trim()

    res.status(200).json({
      success: true,
      response: responseText,
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
