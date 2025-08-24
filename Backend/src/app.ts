// app.ts
// app.ts
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io"; 
import { PORT } from "./config/server.config.js";
import { sequelize } from "./config/db.config.js";
import { router as apiRoute } from "./routes/index.js";
import cors from "cors";
import { registerMessageHandlers } from "./services/socket.service.js";
import { init as initIo, getIo } from "./services/socketManager.js"; // Import your manager

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

// import express, { urlencoded } from "express";
// import { createServer } from "http";
// import { Server } from "socket.io";
// import { PORT } from "./config/server.config.js";
// import { sequelize } from "./config/db.config.js";
// import cookieParser from "cookie-parser";
// import { router as apiRoute } from "./routes/index.js";
// import cors from "cors";
// import { registerMessageHandlers } from "./services/socket.service.js";

// const app = express();
// const httpServer = createServer(app);

// const corsOptions = {
//     origin: "*",
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization'],
//     credentials: false
// };

// app.use(cors(corsOptions));
// app.use(express.json());
// app.use(urlencoded({ extended: true }));
// app.use(cookieParser());
// app.use("/api", apiRoute);

// const io = new Server(httpServer, {
//     cors: corsOptions
// });

// // We'll store the `io` instance globally to access it from controllers
// (global as any).io = io;

// io.on("connection", (socket) => {
//     console.log(`User connected: ${socket.id}`);
    
//     // Immediately join the global chat room
//     socket.join("global-chat");

//     registerMessageHandlers(io, socket);

//     socket.on("disconnect", () => {
//         console.log("User disconnected");
//     });
// });

// await sequelize.sync();

// httpServer.listen(PORT, (): void => {
//     console.log(`Server is up and running at ${PORT}`);
// });

// import express, { urlencoded } from "express";
// import { PORT } from "./config/server.config.js";
// import { sequelize } from "./config/db.config.js";
// import cookieParser from "cookie-parser";
// import {router as apiRoute} from "./routes/index.js";
// import cors from "cors";


// const app = express();

// app.use(cors({
//     // origin: ["http://localhost:5500", "http://127.0.0.1:5500"],
//     origin: "*",
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//     allowedHeaders: ['Content-Type', 'Authorization'],
//     // credentials: true,
//     credentials: false
// }));
// app.use(express.json());
// app.use(urlencoded({extended: true}));
// app.use(cookieParser())
// app.use("/api", apiRoute);


// await sequelize.sync();

// app.listen(PORT , ():void => {
//     console.log(`Server is up and running at ${PORT}`)
// })

