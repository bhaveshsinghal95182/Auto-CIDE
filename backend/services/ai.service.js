import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// const schema = {
//   description: "This is the response schema for the AI",
//   type: SchemaType.OBJECT,
//   properties: {
//     text: { type: SchemaType.STRING },
//     code: { type: SchemaType.OBJECT},
//   },
// };

const schema = {
  description: "Response containing text and a file tree structure",
  type: SchemaType.OBJECT,
  properties: {
    text: {
      type: SchemaType.STRING,
      description: "Response message",
    },
    buildcommands: {
      type: SchemaType.ARRAY,
      description: "List of all necessary terminalcommands to build the project",
      items: {
        type: SchemaType.STRING,
      },
    },
    code: {
      type: SchemaType.OBJECT,
      properties: {
        filetree: {
          type: SchemaType.ARRAY, // Change from OBJECT to ARRAY
          description: "List of files in the file tree",
          items: {
            type: SchemaType.OBJECT,
            properties: {
              filename: {
                type: SchemaType.STRING,
                description: "Name of the file",
              },
              content: {
                type: SchemaType.STRING,
                description: "File content",
              },
              language: {
                type: SchemaType.STRING,  
                description: "Language of the file",
              }
            },
            required: ["filename", "content", "language"],
          },
        },
      },
      required: ["filetree"],
    },
  },
  required: ["text", "code"],
};



export const generateResult = async (prompt) => {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema,
    },
    systemInstruction:
      `You are a helpful assistant which is able to generate a project description based on the user's prompt. Always return the code using following format, only use triple backticks for code blocks, and only use one language for each code block.
      `,
  }
);
  const result = await model.generateContent(prompt);
  return result.response.text();
};
