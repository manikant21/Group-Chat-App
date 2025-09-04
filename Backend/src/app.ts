import express from "express";
import { createServer } from "http";
import { Server } from "socket.io"; 
import { PORT } from "./config/server.config.js";
import { sequelize } from "./config/db.config.js";
import { router as apiRoute } from "./routes/index.js";
import cors from "cors";
import { registerMessageHandlers } from "./services/socket.service.js";
import { init as initIo, getIo } from "./services/socketManager.js"; // Import your manager
import "./services/corn.dervice.js";

const app = express();
const httpServer = createServer(app);

app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api", apiRoute);

// Initialize Socket.IO using the manager
// const io = initIo(httpServer);

const io: Server = initIo(httpServer);


io.use((socket, next) => {
    const token = socket.handshake.auth.token as string;
    if (!token) {
        return next(new Error("Authentication error: No token provided"));
    }
    next();
});

// io.on("connection", (socket) => {
//     registerMessageHandlers(io, socket);
// });

io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // This is the crucial line to ensure all clients are in the global chat room
    socket.join("global-chat");

    registerMessageHandlers(io, socket);

    socket.on("disconnect", () => {
        console.log("User disconnected");
    });
});

await sequelize.sync();

httpServer.listen(PORT, (): void => {
    console.log(`Server is up and running at ${PORT}`);
});

