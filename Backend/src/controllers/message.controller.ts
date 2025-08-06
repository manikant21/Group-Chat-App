import { User, Message } from "../models/index.model.js";
import { Request, Response } from "express";
import { Op } from "sequelize";

interface AuthenticatedRequest extends Request {
    user?: any
}

interface userMessage {
    content: string
}

export const messageByAUser = async (req: AuthenticatedRequest & { body: userMessage }, res: Response) => {
    try {
        const userId = req.user.id;
        const {message} = req.body;

        const messages = await Message.create({
            content: message,
            userId: userId
        })
         return res.status(201).json({ data: messages });

    } catch (error) {
        console.error("Posting Message Error:", error);
        return res.status(500).json("Something went wrong");
    }
}

export const getMessageByAUser = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId: number = req.user.id;
        const maxId = req.query.lastMessageId;
        let message;
        if (maxId == undefined || isNaN(Number(maxId))) {
                message = await Message.findAll({
            // where: {
            //     userId: userId,
            // },
            include: {
                model: User,
                attributes: ["name"]
            }
        })
        }
        else {
             message = await Message.findAll({
            where: {
                // userId: userId,
                id: {
                    [Op.gt]: Number(maxId)
                }
            },
            include: {
                model: User,
                attributes: ["name"]
            }
        })
        }
    
         return res.status(201).json({ data: message });
    } catch (error) {
         console.error("Fetching Message Error:", error);
        return res.status(500).json("Something went wrong");
    }
}


export const getOlderMessages = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const beforeId = Number(req.query.beforeMessageId);
        const messages = await Message.findAll({
            where: {
                id: { [Op.lt]: beforeId }
            },
            limit: 10,
            order: [['id', 'DESC']],
            include: { model: User, attributes: ["name"] }
        });
        res.status(200).json({ data: messages.reverse() });
    } catch (error) {
        console.error("Error fetching older messages:", error);
        res.status(500).json("Something went wrong");
    }
}
