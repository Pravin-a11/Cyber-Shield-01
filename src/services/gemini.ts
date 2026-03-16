import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const getGeminiResponse = async (prompt: string, systemInstruction?: string) => {
  try {
    const response = await genAI.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction || "You are CyberShield AI, a national cybercrime intelligence assistant.",
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I am currently offline. Please try again later.";
  }
};

export const predictFraud = async (complaintData: any) => {
  const prompt = `Analyze the following cybercrime complaint and predict the risk score (0-100) and potential cash withdrawal hotspots. Return JSON format.
  Data: ${JSON.stringify(complaintData)}`;
  
  const systemInstruction = "You are a predictive analytics engine for cybercrime. Analyze patterns and return a risk assessment.";
  
  const response = await getGeminiResponse(prompt, systemInstruction);
  try {
    return JSON.parse(response || "{}");
  } catch {
    return { riskScore: 50, prediction: "Inconclusive data" };
  }
};
