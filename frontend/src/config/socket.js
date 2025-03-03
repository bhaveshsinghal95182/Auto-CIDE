import socket from 'socket.io-client';

let socketInstance = null;

export const initializeSocket = (token) => {

    socketInstance = socket(import.meta.env.VITE_API_URL, {
        auth: {
            token: localStorage.getItem('token')
        }
    });
    return socketInstance;
}

export const receiveMessage = (eventName, callback) => {
    socketInstance.on(eventName, callback);
}

export const sendMessage = (eventName, data) => {
    socketInstance.emit(eventName, data);
}