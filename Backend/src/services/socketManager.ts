// src/services/socketManager.ts
import { Server } from "socket.io";

let io: Server;

export const init = (httpServer: any) => {
    io = new Server(httpServer, {
        cors: {
            origin: "*",
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization'],
            credentials: false
        },
         allowEIO3: true, // Add this for compatibility
        transports: ['websocket', 'polling'] // Add polling as fallback
    });
    return io;
};

export const getIo = () => {
    if (!io) {
        throw new Error('Socket.IO not initialized!');
    }
    return io;
};