import { User, Message } from "../models/index.model.js";
import { Request, Response } from "express";

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