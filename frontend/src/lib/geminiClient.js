// geminiClient.js
// Client-side helper that routes chat requests securely through the Teacher World backend
// NEVER exposes Gemini API keys in frontend code or client bundles

import { API_URL } from "../config/api"

export async function generateGeminiResponse(prompt) {
  if (!prompt || typeof prompt !== "string") {
    throw new Error("Prompt is required")
  }

  try {
    const cleanBase = API_URL.replace(/\/api\/?$/i, "")
    const response = await fetch(`${cleanBase}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: prompt }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || errorData.message || `Server error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.response || "Something went wrong. Please try again."
  } catch (error) {
    console.error("Error generating Gemini response via backend:", error)
    throw error
  }
}
