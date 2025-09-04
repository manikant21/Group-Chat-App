import { Request, Response } from "express";
import { ArchivedMessage } from "../models/archived_messages.mode.js";
import { ArchivedAttachment } from "../models/archived_attachment.model.js";
import { UserGroup } from "../models/usergroup.model.js";
import { User } from "../models/user.model.js";

interface AuthenticatedRequest extends Request {
    user?: any
}

export const getArchivedGlobalMessages = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const { count, rows } = await ArchivedMessage.findAndCountAll({
            where: {
                groupId: null
            },
            include: [
                { model: User, attributes: ["id", "name"] },
                { model: ArchivedAttachment, as: "attachments", attributes: ["fileUrl", "fileName", "fileType", "size"] },
            ],
            order: [["id", "DESC"]],
            limit,
            offset,
        });

        return res.status(200).json({
            data: rows.reverse(),
            pagination: {
                total: count,
                page,
                pages: Math.ceil(count / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching archived messages:", error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};


export const getArchivedGroupMessages = async (req: AuthenticatedRequest, res: Response) => {
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

        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const totalMessages = await ArchivedMessage.count({ where: { groupId } });

        const messages = await ArchivedMessage.findAll({
            where: { groupId },
            include: [
                { model: User, attributes: ["id", "name"] },
                { model: ArchivedAttachment, as: "attachments", attributes: ["fileUrl", "fileName", "fileType", "size"] }
            ],
            order: [["id", "DESC"]],
            limit,
            offset
        });
        return res.json({
            data: messages,
            pagination: {
                page,
                limit,
                total: totalMessages,
                pages: Math.ceil(totalMessages / limit)
            }
        }); 
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch group messages" });
    }
};




