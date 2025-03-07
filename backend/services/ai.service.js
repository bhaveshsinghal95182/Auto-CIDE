import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

export const generateResult = async (prompt) => {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction:
      "You are a helpful assistant which is able to generate a project description based on the user's prompt.",
  });
  const result = await model.generateContent(prompt);
  return result.response.text();
};
