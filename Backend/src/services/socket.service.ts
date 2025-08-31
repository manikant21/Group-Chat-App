
// services/socket.service.ts

import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/server.config.js";
import { Message } from "../models/messages.model.js";
import { User } from "../models/user.model.js";
import { UserGroup } from "../models/usergroup.model.js";
import { Attachment } from "../models/attachment.model.js";
import { Server, Socket } from "socket.io";

interface Handlers {
    join_group: (groupId: number) => Promise<void>;
    new_global_message: (data: { message: string; attachments?: any[] }) => Promise<void>;
    new_group_message: (data: { groupId: number; message?: string; attachments?: any[] }) => Promise<void>;
}

export const registerMessageHandlers = (io: Server, socket: Socket): void => {

     
    socket.on("disconnect", (reason) => {
        console.log(`🔌 Socket ${socket.id} disconnected. Reason: ${reason}`);
        console.log(`👥 User was in rooms:`, Array.from(socket.rooms));
    });

    socket.on("join_group", async (groupId: number) => {
        const token = socket.handshake.auth.token as string;

        try {
            const decodedToken = jwt.verify(token, JWT_SECRET) as { userId: number };
            const userId = decodedToken.userId;

            const isMember = await UserGroup.findOne({
                where: { userId, groupId },
            });

            if (isMember) {
                socket.join(`group-${groupId}`);
                console.log(`User ${userId} joined group-${groupId}`);
                // ADD THIS DEBUG INFO
        console.log(`Total users in group-${groupId}:`, io.sockets.adapter.rooms.get(`group-${groupId}`)?.size || 0);
        console.log(` Socket rooms for this user:`, Array.from(socket.rooms));
                socket.emit("joined_group", { 
                    success: true, 
                    groupId, 
                    message: `Joined group ${groupId}` 
                });
            } else {
                console.log(`User ${userId} tried to join group-${groupId} but is not a member.`);
                socket.emit("error", { message: "You are not a member of this group." });
            }
        } catch (error: any) {
            console.error("Error joining group:", error.message);
            socket.emit("error", { message: "Authentication failed. Please log in again." });
            // socket.disconnect(true);
        }
    });

      // Join global chat room
    socket.on("join_global", async () => {
        const token = socket.handshake.auth.token as string;
        try {
            const decodedToken = jwt.verify(token, JWT_SECRET) as { userId: number };
             const userId = decodedToken.userId;
            
            // Get user info for logging
            const user = await User.findByPk(userId, { attributes: ["name"] });
            
            socket.join("global-chat");
            console.log(` User ${userId} (${user?.name || "Unknown"}) joined global-chat`);
            
            // Send confirmation back to client
            socket.emit("joined_global_chat", { 
                success: true, 
                message: "Successfully joined global chat",
                userId: userId,
                userName: user?.name || "Unknown"
            });
            
            console.log(`User ${decodedToken.userId} joined global-chat`);
        } catch (error: any) {
            console.error("Error joining global:", error.message);
            socket.emit("error", { message: "Authentication failed for global chat." });
        }
    });

    // Handler for new global chat messages (with optional attachments)
    socket.on("new_global_message", async (data: { message: string; attachments?: any[] }) => {
        const { message, attachments = [] } = data;
        const token = socket.handshake.auth.token as string;
        console.log(message);
        console.log(attachments);


        try {
            const decodedToken = jwt.verify(token, JWT_SECRET) as { userId: number };
            const userId = decodedToken.userId;

            const newMessage = await Message.create({
                content: message || null,
                userId,
                groupId: null,
            });

            // Save attachments if any
            if (attachments.length > 0) {
                for (const file of attachments) {
                    console.log(" Saving attachment:", file);
                    await Attachment.create({
                        messageId: newMessage.id,
                        fileUrl: file.fileUrl,
                        fileName: file.fileName,
                        fileType: file.fileType,
                        size: file.size,
                    });
                }
            }

            // Fetch message with user + attachments
            const messageWithUser = await Message.findOne({
                where: { id: newMessage.id },
                include: [
                    { model: User, attributes: ["name"] },
                    { model: Attachment,  as: "attachments"}, 
                ],
            });

             console.log(" Broadcasting message to global-chat room");
            console.log(" Rooms in global-chat:", io.sockets.adapter.rooms.get("global-chat")?.size || 0);

            io.to("global-chat").emit("new_global_message", messageWithUser);
        } catch (error: any) {
            console.error("Error handling global message:", error.message);
            socket.emit("error", { message: "Failed to send message." });
        }
    });

    // Handler for new group chat messages (with optional attachments)
    socket.on("new_group_message", async (data: { groupId: number; message?: string; attachments?: any[] }) => {
        const { groupId, message, attachments = [] } = data;
        const token = socket.handshake.auth.token as string;
        

        try {
            const decodedToken = jwt.verify(token, JWT_SECRET) as { userId: number };
            const userId = decodedToken.userId;

            // Check if the user is a member of the group
            const isMember = await UserGroup.findOne({
                where: { userId, groupId },
            });

            if (isMember) {
                const newMessage = await Message.create({
                    content: message || null,
                    userId,
                    groupId,
                });

                // Save attachments if any
                if (attachments.length > 0) {
                    for (const file of attachments) {
                        await Attachment.create({
                            messageId: newMessage.id,
                            fileUrl: file.fileUrl,
                            fileName: file.fileName,
                            fileType: file.fileType,
                            size: file.size,
                        });
                    }
                }

                // Fetch message with user + attachments
                const messageWithUser = await Message.findOne({
                    where: { id: newMessage.id },
                    include: [
                        { model: User, attributes: ["name"] },
                        { model: Attachment, as: "attachments"}, 
                    ],
                });
                 console.log(` Broadcasting message to group-${groupId} room`);
                console.log(` Users in group-${groupId}:`, io.sockets.adapter.rooms.get(`group-${groupId}`)?.size || 0);

                // Broadcast the new message to all group members
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
