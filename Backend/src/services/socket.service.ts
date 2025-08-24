// // services/socket.service.ts
// services/socket.service.js

// services/socket.service.ts

import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/server.config.js";
import { Message } from "../models/messages.model.js";
import { User } from "../models/user.model.js";
import { UserGroup } from "../models/usergroup.model.js";
import { Server, Socket } from "socket.io";

interface Handlers {
    join_group: (groupId: number) => Promise<void>;
    new_global_message: (data: { message: string }) => Promise<void>;
    new_group_message: (data: { groupId: number; message: string }) => Promise<void>;
}

export const registerMessageHandlers = (io: Server, socket: Socket): void => {
    // Handler for joining a group room
    socket.on("join_group", async (groupId: number) => {
        const token = socket.handshake.auth.token as string;

        try {
            const decodedToken = jwt.verify(token, JWT_SECRET) as { userId: number };
            const userId = decodedToken.userId;

            const isMember = await UserGroup.findOne({
                where: {
                    userId: userId,
                    groupId: groupId,
                },
            });

            if (isMember) {
                socket.join(`group-${groupId}`);
                console.log(`User ${userId} joined group-${groupId}`);
            } else {
                console.log(`User ${userId} tried to join group-${groupId} but is not a member.`);
                socket.emit("error", { message: "You are not a member of this group." });
            }
        } catch (error: any) {
            console.error("Error joining group:", error.message);
            socket.emit("error", { message: "Authentication failed. Please log in again." });
            socket.disconnect(true);
        }
    });

    // Handler for new global chat messages
    socket.on("new_global_message", async (data: { message: string }) => {
        const { message } = data;
        const token = socket.handshake.auth.token as string;

        try {
            const decodedToken = jwt.verify(token, JWT_SECRET) as { userId: number };
            const userId = decodedToken.userId;

            const newMessage = await Message.create({
                content: message,
                userId: userId,
                groupId: null, // Global messages have no group ID
            });

            const messageWithUser = await Message.findOne({
                where: { id: newMessage.id },
                include: [{ model: User, attributes: ['name'] }],
            });

            // Broadcast the new message to all clients in the global-chat room
            io.to("global-chat").emit("new_global_message", messageWithUser);
        } catch (error: any) {
            console.error("Error handling global message:", error.message);
            socket.emit("error", { message: "Failed to send message." });
        }
    });

    // Handler for new group chat messages
    socket.on("new_group_message", async (data: { groupId: number; message: string }) => {
        const { groupId, message } = data;
        const token = socket.handshake.auth.token as string;

        try {
            const decodedToken = jwt.verify(token, JWT_SECRET) as { userId: number };
            const userId = decodedToken.userId;

            // Check if the user is a member of the group
            const isMember = await UserGroup.findOne({
                where: {
                    userId: userId,
                    groupId: groupId,
                },
            });

            if (isMember) {
                const newMessage = await Message.create({
                    content: message,
                    userId: userId,
                    groupId: groupId,
                });

                const messageWithUser = await Message.findOne({
                    where: { id: newMessage.id },
                    include: [{ model: User, attributes: ['name'] }],
                });

                // Broadcast the new message to all members in the group's room
                io.to(`group-${groupId}`).emit("new_group_message", messageWithUser);
            } else {
                console.log(`User ${userId} tried to send a message to group ${groupId} but is not a member.`);
                socket.emit("error", { message: "You are not authorized to send messages to this group." });
            }
        } catch (error: any) {
            console.error("Error handling group message:", error.message);
            socket.emit("error", { message: "Failed to send message." });
        }
    });
};

// import { Server, Socket } from "socket.io";
// import jwt from "jsonwebtoken";
// import { User } from "../models/index.model.js";

// interface UserPayload {
//   userId: number;
// }

// export const registerMessageHandlers = (io: Server, socket: Socket) => {
//     socket.on("join_group", async (groupId: number, token: string) => {
//         try {
//             const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string) as UserPayload;
//             const user = await User.findByPk(decoded.userId);

//             if (user) {
//                 // Join the Socket.IO room for the specific group
//                 socket.join(`group-${groupId}`);
//                 console.log(`User ${user.name} joined group room: group-${groupId}`);
//             }
//         } catch (error) {
//             console.error("Authentication failed for socket connection:", error);
//             socket.emit("auth_error", "Authentication failed");
//             socket.disconnect(true);
//         }
//     });
// };

// export const getIo = (): Server => {
//     // This is a simple way to access the IO instance from anywhere in your app
//     // In a production environment, you might use a more robust dependency injection
//     // pattern. For now, we'll export a simple singleton pattern.
//     if (!(global as any).io) {
//         throw new Error("Socket.IO not initialized!");
//     }
//     return (global as any).io;
// };

// // Add this to your app.ts right after `const io = ...`
// // (global as any).io = io;