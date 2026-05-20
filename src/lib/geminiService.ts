import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateContent(model: string, contents: any, config?: any) {
  return await ai.models.generateContent({
    model,
    contents,
    config,
  });
}
