import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";

export const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export const geminiModel = genAI
  ? genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
  : null;
