import { GoogleGenAI } from "@google/genai";

// Initialize the Gemini API client
// The API key is automatically injected from the environment
export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
