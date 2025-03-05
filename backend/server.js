import "dotenv/config";
import http from "http";
import app from "./app.js";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import projectModel from "./models/project.model.js";

const port = process.env.PORT || 5000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    const projectId = socket.handshake.query.projectId;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return next(new Error("Invalid project ID"));
    }

    socket.project = await projectModel.findById(projectId);

    if (!token) {
      return next(new Error("No token provided"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return next(new Error("Invalid token"));
    }
    socket.user = decoded;
    next();
  } catch (error) {
    console.error("Socket authentication error:", error.message);
    next(error);
  }
});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.roomId = socket.handshake.query.projectId.toString();
  socket.join(socket.roomId);

  socket.on("project-message", async (data) => {
    socket.broadcast.to(socket.roomId).emit("project-message", data);
  });
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
