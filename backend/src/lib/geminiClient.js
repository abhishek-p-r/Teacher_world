"use strict";

// geminiClient.js
// Handles calls to Google Gemini API using @google/genai package
// Implements safe initialization, timeout handling, and fallback models.

const { GoogleGenAI } = require("@google/genai");

let aiInstance = null;
let aiInitialized = false;

function getGeminiClient() {
  if (aiInitialized) {
    return aiInstance;
  }

  const apiKey = (process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "").trim();

  if (!apiKey) {
    console.warn("[GeminiClient] Notice: GEMINI_API_KEY is not configured in environment variables.");
    aiInitialized = true;
    aiInstance = null;
    return null;
  }

  try {
    aiInstance = new GoogleGenAI({ apiKey });
    aiInitialized = true;
    console.log("[GeminiClient] GoogleGenAI client initialized successfully.");
    return aiInstance;
  } catch (err) {
    console.error("[GeminiClient] Initialization error:", err.message);
    aiInitialized = true;
    aiInstance = null;
    return null;
  }
}

/**
 * Asynchronously generates a Gemini response for the given user message.
 * Supports timeout, model fallback ("gemini-2.5-flash" -> "gemini-1.5-flash"),
 * and safe fallback responses.
 *
 * @param {string} userMessage User input message / prompt for Gemini AI.
 * @returns {Promise<string>} Gemini response text or fallback error message.
 */
async function generateGeminiResponse(userMessage) {
  const client = getGeminiClient();

  if (!client) {
    return "I am TeacherWorld Assistant. The AI service is currently configuring or offline. Please contact support or explore our job search and profile tools directly.";
  }

  const modelsToTry = [
    process.env.GEMINI_MODEL || "gemini-2.5-flash",
    "gemini-1.5-flash",
  ];

  for (const model of modelsToTry) {
    try {
      const generatePromise = client.models.generateContent({
        model: model,
        contents: [userMessage],
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Gemini API request timed out after 15s")), 15000)
      );

      const response = await Promise.race([generatePromise, timeoutPromise]);

      if (response && response.text) {
        return response.text;
      }
    } catch (error) {
      console.warn(`[GeminiClient] Attempt with model '${model}' failed:`, error.message);
      // Try next model in list
    }
  }

  return "I'm having a little trouble connecting right now. Please try asking your question again in a moment, or visit the Job Search page for available teaching positions!";
}

module.exports = {
  generateGeminiResponse,
};
