import { User, Message, Group, UserGroup, Attachment } from "../models/index.model.js";
import { Request, Response } from "express";
import { Op } from "sequelize";
import { getIo } from "../services/socketManager.js";

interface AuthenticatedRequest extends Request {
    user?: any
}

interface userMessage {
    content: string
}

export const messageByAUser = async (req: AuthenticatedRequest & { body: userMessage }, res: Response) => {
    try {
        const userId = req.user.id;
        const { message } = req.body;

        const newMessage = await Message.create({
            content: message,
            userId: userId,
            groupId: null
        })
        //  return res.status(201).json({ data: messages });
        // Fetch user details for the message
        const messageWithUser = await Message.findByPk(newMessage.id, {
            include: [{ model: User, attributes: ["id", "name"] }],
            nest: true,
            raw: true
        });

        if (messageWithUser) {
            // Emit the message to all clients in the global chat room
            getIo().to("global-chat").emit("new_global_message", messageWithUser);
        }

        return res.status(201).json({ data: newMessage });


    } catch (error) {
        console.error("Posting Message Error:", error);
        return res.status(500).json("Something went wrong");
    }
}

// export const getMessageByAUser = async (req: AuthenticatedRequest, res: Response) => {
//     try {
//         const userId: number = req.user.id;
//         const maxId = req.query.lastMessageId;
//         let message;
//         if (!maxId || isNaN(Number(maxId))) {
//             // First time OR no messages in localStorage
//             message = await Message.findAll({
//                 where: { groupId: null },
//                 include: [
//                     { model: User, attributes: ["name"] },
//                     { model: Attachment, as: "attachments", attributes: ["fileUrl", "fileName", "fileType", "size"] }
//                 ],
//                 limit: 10,
//                 order: [["id", "DESC"]],
//             });

//             return res.status(200).json({ data: message.reverse() });

//         }
//         else {
//             message = await Message.findAll({
//                 where: {
//                     groupId: null,
//                     id: {
//                         [Op.gt]: Number(maxId)
//                     }
//                 },
//                 include: [
//                     { model: User, attributes: ["name"] },
//                     { model: Attachment, as: "attachments", attributes: ["fileUrl", "fileName", "fileType", "size"] }
//                 ],
//                 limit: 10,
//                 order: [["id", "DESC"]],
//             })
//             console.log(message);
//         }

//         return res.status(201).json({ data: message.reverse() });
//     } catch (error) {
//         console.error("Fetching Message Error:", error);
//         return res.status(500).json("Something went wrong");
//     }
// }

export const getMessageByAUser = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const maxId = req.query.lastMessageId ? Number(req.query.lastMessageId) : undefined;

        let messages;

        if (!maxId || isNaN(maxId)) {
            // ✅ Initial load: fetch latest 10 global messages
            messages = await Message.findAll({
                where: { groupId: null },
                include: [
                    { model: User, attributes: ["name"] },
                    { model: Attachment, as: "attachments", attributes: ["fileUrl", "fileName", "fileType", "size"] }
                ],
                order: [["id", "DESC"]],
                limit: 10,
            });
            console.log(messages)

            // Return in ascending order for correct chat flow
            return res.status(200).json({ data: messages.reverse() });
        }

        // ✅ Subsequent fetch: fetch only messages newer than lastMessageId
        messages = await Message.findAll({
            where: {
                groupId: null,
                id: { [Op.gt]: maxId }
            },
            include: [
                { model: User, attributes: ["name"] },
                { model: Attachment, as: "attachments", attributes: ["fileUrl", "fileName", "fileType", "size"] }
            ],
            order: [["id", "ASC"]],
        });
        console.log(messages);

        return res.status(200).json({ data: messages });
    } catch (error) {
        console.error("Fetching Message Error:", error);
        return res.status(500).json("Something went wrong");
    }
};


export const getOlderMessages = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const beforeId = Number(req.query.beforeMessageId);

        const messages = await Message.findAll({
            where: {
                id: { [Op.lt]: beforeId },
                groupId: null, // only global messages
            },
            limit: 10,
            order: [["id", "DESC"]],
            include: [
                { model: User, attributes: ["name"] },
                { model: Attachment, attributes: ["fileUrl", "fileName", "fileType", "size"], as: "attachments", },
            ],
        });

        res.status(200).json({ data: messages.reverse() });
    } catch (error) {
        console.error("Error fetching older messages:", error);
        res.status(500).json("Something went wrong");
    }
};



export const getGroupMessages = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id: groupId } = req.params;
        const userId = req.user.id;
        const checkExistingmember = await UserGroup.findOne({
            where: {
                groupId,
                userId
            }
        });

        if (!checkExistingmember) {
            return res.status(404).json({ message: "Not authorized" })
        }

        const messages = await Message.findAll({
            where: { groupId },
            include: [
                { model: User, attributes: ["id", "name"] },
                { model: Attachment, as: "attachments", attributes: ["fileUrl", "fileName", "fileType", "size"] }
            ],
            order: [["createdAt", "ASC"]]
        });

        res.json({ data: messages });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch messages" });
    }
};

// export const postGroupMessage = async (req: AuthenticatedRequest, res: Response) => {
//   try {

//     const { id } = req.params;
//     const { content } = req.body;
//     const userId = req.user.id;
//     const groupId = Number(id);

//     const newMsg = await Message.create({ content, userId, groupId });

//     res.status(201).json({ data: newMsg });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Failed to send message" });
//   }
// };

export const postGroupMessage = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id: groupId } = req.params;
        const { content } = req.body;
        const userId = req.user.id;

        const newMsg = await Message.create({ content, userId, groupId: Number(groupId) });

        const messageWithUser = await Message.findByPk(newMsg.id, {
            include: [{ model: User, attributes: ["id", "name"] }],
            nest: true,
            raw: true
        });

        if (messageWithUser) {
            // Emit the message to all clients in the group's room
            getIo().to(`group-${groupId}`).emit("new_group_message", messageWithUser);
        }

        res.status(201).json({ data: newMsg });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to send message" });
    }
};


