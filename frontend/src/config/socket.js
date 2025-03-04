import socket from "socket.io-client";

let socketInstance = null;

export const initializeSocket = (projectId) => {
  const token = localStorage.getItem("token");

  socketInstance = socket(import.meta.env.VITE_API_URL, {
    auth: {
      token: token,
    },
    query: {
      projectId: projectId,
    },
  });

  // Log connection status
  socketInstance.on('connect', () => {
    console.log('Socket connected successfully');
  });

  socketInstance.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
  });

  return socketInstance;
};

export const receiveMessage = (eventName, callback) => {
  socketInstance.on(eventName, callback);
};

export const sendMessage = (eventName, data) => {
  socketInstance.emit(eventName, data);
};

export { socketInstance };
