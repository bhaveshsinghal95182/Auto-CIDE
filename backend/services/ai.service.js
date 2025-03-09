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
      description: "List of all necessary terminal commands to build the project",
      items: {
        type: SchemaType.STRING,
      },
    },
    code: {
      type: SchemaType.OBJECT,
      properties: {
        filetree: {
          type: SchemaType.ARRAY,
          description: "List of files and directories in the project",
          items: {
            type: SchemaType.OBJECT,
            properties: {
              path: {
                type: SchemaType.STRING,
                description: "Full path of the file or directory (e.g., 'myproject/directory/foo.js')",
              },
              type: {
                type: SchemaType.STRING,
                description: "Type of the item: 'file' or 'directory'",
              },
              content: {
                type: SchemaType.STRING,
                description: "Content of the file (only for type 'file')",
              },
              language: {
                type: SchemaType.STRING,
                description: "Programming language of the file (only for type 'file')",
              },
              symlink: {
                type: SchemaType.STRING,
                description: "Target path for symlinks (only for files that are symlinks)",
              },
              isSymlink: {
                type: SchemaType.BOOLEAN,
                description: "Whether the file is a symlink",
              }
            },
            required: ["path", "type"],
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
      `You are a helpful assistant which is able to generate a project description based on the user's prompt. 
      
      For the file structure, use the following format:
      - Each file should have a "path" (e.g., "myproject/src/index.js"), "type" ("file"), and "content" (the actual code)
      - For regular files, include "content" and optionally "language"
      - For symlinks, set "isSymlink" to true and include "symlink" pointing to the target
      - Directories should have "type" set to "directory" and "path" set to their full path
      
      Example of a valid response:
      {
        "text": "Here's a simple React project",
        "code": {
          "filetree": [
            {
              "path": "myproject",
              "type": "directory"
            },
            {
              "path": "myproject/src",
              "type": "directory"
            },
            {
              "path": "myproject/src/index.js",
              "type": "file",
              "content": "import React from 'react';\\nimport ReactDOM from 'react-dom';\\nimport App from './App';\\n\\nReactDOM.render(<App />, document.getElementById('root'));",
              "language": "javascript"
            },
            {
              "path": "myproject/src/App.js",
              "type": "file",
              "content": "import React from 'react';\\n\\nfunction App() {\\n  return <div>Hello World</div>;\\n}\\n\\nexport default App;",
              "language": "javascript"
            },
            {
              "path": "myproject/src/link.js",
              "type": "file",
              "isSymlink": true,
              "symlink": "./App.js"
            }
          ]
        },
        "buildcommands": [
          "cd myproject",
          "npm install",
          "npm start"
        ]
      }
      `,
  }
);
  const result = await model.generateContent(prompt);
  return result.response.text();
};
