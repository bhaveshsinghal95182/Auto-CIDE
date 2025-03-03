import 'dotenv/config';
import http from 'http';
import app from './app.js';
import {Server} from 'socket.io';
import jwt from 'jsonwebtoken';

const port = process.env.PORT || 5000;

const server = http.createServer(app);
const io = new Server(server);

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.split(' ')[1];
    if (!token) {
      return next(new Error('No token provided'));
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return next(new Error('Invalid token'));
    }
    socket.user = decoded;
    next();
  } catch (error) {
    next(error)
  }
});

io.on('connection', (socket) => {
  console.log('A user connected');
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});