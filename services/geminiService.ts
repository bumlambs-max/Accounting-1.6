import { GoogleGenAI } from "@google/genai";
import { Category } from "../types.ts";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function suggestCategory(description: string, categories: Category[]) {
  const categoryNames = categories.map(c => c.name).join(', ');
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Based on the description "${description}", which of these categories best fits? Options: ${categoryNames}. Return only the category name.`,
    config: {
      temperature: 0.1,
    }
  });

  return response.text?.trim();
}
