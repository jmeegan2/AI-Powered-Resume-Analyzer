import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('Error: GEMINI_API_KEY environment variable is required');
  process.exit(1);
}

export const ai = new GoogleGenAI({ apiKey }); 