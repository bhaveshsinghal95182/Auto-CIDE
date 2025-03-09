# WebSocket Documentation

This document provides detailed information about the Auto-CIDE backend WebSocket implementation, including connection setup, authentication, events, and best practices for real-time communication.

## Table of Contents

- [Overview](#overview)
- [Connection Setup](#connection-setup)
- [Authentication](#authentication)
- [Events](#events)
  - [Server Events](#server-events)
  - [Client Events](#client-events)
- [Rooms and Namespaces](#rooms-and-namespaces)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)
- [Examples](#examples)

## Overview

Auto-CIDE uses Socket.IO for real-time bidirectional communication between clients and the server. This enables features like:

- Real-time collaboration on projects
- Live code updates
- Instant AI generation results
- User presence indicators
- Chat functionality

## Connection Setup

The WebSocket server is initialized in `server.js` using the Socket.IO library:

```javascript
// server.js
import http from "http";
import app from "./app.js";
import { Server } from "socket.io";

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// Socket.IO middleware and event handlers
// ...

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
```

## Authentication

Socket.IO connections are authenticated using JWT tokens to ensure secure communication:

```javascript
// Socket.IO middleware for authentication
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    const projectId = socket.handshake.query.projectId;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return next(new Error("Invalid project ID"));
    }

    socket.project = await Project.findById(projectId);

    if (!token) {
      return next(new Error("Authentication token is required"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    
    // Check if user has access to the project
    const hasAccess = socket.project.owner.equals(socket.user.id) || 
                      socket.project.collaborators.some(id => id.equals(socket.user.id));
    
    if (!hasAccess) {
      return next(new Error("Not authorized to access this project"));
    }

    next();
  } catch (error) {
    return next(new Error("Authentication error: " + error.message));
  }
});
```

## Events

### Server Events

Events emitted from the server to clients:

#### `connection`

Fired when a client successfully connects to the WebSocket server.

```javascript
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.user.id}`);
  
  // Join the project room
  socket.join(socket.project._id.toString());
  
  // Notify other users about the new connection
  socket.to(socket.project._id.toString()).emit("user:joined", {
    userId: socket.user.id,
    email: socket.user.email
  });
  
  // Handle other events...
});
```

#### `project:update`

Emitted when a project is updated, including file changes, settings changes, etc.

```javascript
// Example payload
{
  "type": "file:change",
  "data": {
    "path": "src/components/Button.js",
    "content": "// Updated code content"
  },
  "userId": "60d21b4667d0d8992e610c85",
  "timestamp": "2023-01-01T00:00:00.000Z"
}
```

#### `ai:generate:progress`

Emitted during AI generation to provide progress updates.

```javascript
// Example payload
{
  "progress": 50,
  "message": "Generating code...",
  "requestId": "gen-123456"
}
```

#### `ai:generate:complete`

Emitted when AI generation is complete.

```javascript
// Example payload
{
  "result": "Generated code or response",
  "requestId": "gen-123456"
}
```

#### `user:joined`

Emitted when a user joins a project.

```javascript
// Example payload
{
  "userId": "60d21b4667d0d8992e610c85",
  "email": "user@example.com"
}
```

#### `user:left`

Emitted when a user leaves a project.

```javascript
// Example payload
{
  "userId": "60d21b4667d0d8992e610c85"
}
```

#### `error`

Emitted when an error occurs.

```javascript
// Example payload
{
  "message": "Error message",
  "code": "ERROR_CODE"
}
```

### Client Events

Events that clients can emit to the server:

#### `project:update`

Emitted when a client makes changes to a project.

```javascript
// Example client code
socket.emit("project:update", {
  type: "file:change",
  data: {
    path: "src/components/Button.js",
    content: "// New code content"
  }
});
```

#### `ai:generate:request`

Emitted when a client requests AI code generation.

```javascript
// Example client code
socket.emit("ai:generate:request", {
  prompt: "Write a function to calculate the Fibonacci sequence",
  language: "javascript",
  context: "// Optional code context"
});
```

#### `cursor:move`

Emitted when a user moves their cursor in the editor.

```javascript
// Example client code
socket.emit("cursor:move", {
  path: "src/components/Button.js",
  position: {
    line: 10,
    column: 15
  }
});
```

#### `disconnect`

Automatically emitted when a client disconnects.

## Rooms and Namespaces

Socket.IO rooms are used to organize connections by project:

```javascript
// Join a project room
socket.join(projectId);

// Broadcast to all users in a project room except the sender
socket.to(projectId).emit("project:update", updateData);

// Broadcast to all users in a project room including the sender
io.in(projectId).emit("project:update", updateData);
```

## Error Handling

Error events are emitted to clients when issues occur:

```javascript
// Emitting an error event
socket.emit("error", {
  message: "Failed to update project",
  code: "UPDATE_FAILED"
});

// Handling connection errors
io.on("connect_error", (err) => {
  console.error("Connection error:", err.message);
});
```

## Best Practices

1. **Authenticate All Connections**:
   - Always verify JWT tokens
   - Check project access permissions

2. **Use Rooms for Project Isolation**:
   - Each project should have its own room
   - Prevents data leakage between projects

3. **Implement Reconnection Logic**:
   - Handle temporary disconnections gracefully
   - Restore state on reconnection

4. **Throttle High-Frequency Events**:
   - Limit cursor movement events
   - Batch small updates together

5. **Implement Proper Error Handling**:
   - Provide meaningful error messages
   - Log errors on the server

6. **Secure Sensitive Data**:
   - Don't send sensitive information over WebSockets
   - Validate all incoming data

## Examples

### Complete Connection Example (Server)

```javascript
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.user.id}`);
  
  // Join the project room
  const projectId = socket.project._id.toString();
  socket.join(projectId);
  
  // Notify others about the new connection
  socket.to(projectId).emit("user:joined", {
    userId: socket.user.id,
    email: socket.user.email
  });
  
  // Handle project updates
  socket.on("project:update", (data) => {
    // Validate data
    if (!data.type || !data.data) {
      return socket.emit("error", {
        message: "Invalid update data",
        code: "INVALID_DATA"
      });
    }
    
    // Process the update
    // ...
    
    // Broadcast to other clients
    socket.to(projectId).emit("project:update", {
      ...data,
      userId: socket.user.id,
      timestamp: new Date().toISOString()
    });
  });
  
  // Handle AI generation requests
  socket.on("ai:generate:request", async (data) => {
    try {
      const requestId = `gen-${Date.now()}`;
      
      // Send progress updates
      socket.emit("ai:generate:progress", {
        progress: 0,
        message: "Starting generation...",
        requestId
      });
      
      // Generate AI response
      const result = await generateResult(data.prompt, data.language, data.context);
      
      // Send complete result
      socket.emit("ai:generate:complete", {
        result,
        requestId
      });
    } catch (error) {
      socket.emit("error", {
        message: "AI generation failed: " + error.message,
        code: "AI_GENERATION_FAILED"
      });
    }
  });
  
  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.user.id}`);
    socket.to(projectId).emit("user:left", {
      userId: socket.user.id
    });
  });
});
```

### Client Connection Example

```javascript
// Client-side code
import { io } from "socket.io-client";

const connectToProject = (projectId, token) => {
  const socket = io("http://localhost:5000", {
    query: { projectId },
    auth: { token }
  });
  
  // Connection events
  socket.on("connect", () => {
    console.log("Connected to server");
  });
  
  socket.on("connect_error", (error) => {
    console.error("Connection error:", error.message);
  });
  
  // Project events
  socket.on("project:update", (data) => {
    console.log("Project update:", data);
    // Update UI based on the change
  });
  
  // User events
  socket.on("user:joined", (data) => {
    console.log(`User joined: ${data.email}`);
    // Update collaborator list
  });
  
  socket.on("user:left", (data) => {
    console.log(`User left: ${data.userId}`);
    // Update collaborator list
  });
  
  // AI events
  socket.on("ai:generate:progress", (data) => {
    console.log(`AI generation progress: ${data.progress}%`);
    // Update progress indicator
  });
  
  socket.on("ai:generate:complete", (data) => {
    console.log("AI generation complete:", data.result);
    // Display the result
  });
  
  // Error handling
  socket.on("error", (data) => {
    console.error(`Error (${data.code}):`, data.message);
    // Display error to user
  });
  
  return socket;
};

export default connectToProject; 