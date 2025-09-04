import cron from "node-cron";
import { sequelize } from "../config/db.config.js";
import { Message } from "../models/messages.model.js";
import { Attachment } from "../models/attachment.model.js";
import { ArchivedMessage } from "../models/archived_messages.mode.js";
import { ArchivedAttachment } from "../models/archived_attachment.model.js";
import { Op } from "sequelize";


cron.schedule("31 0 * * *", async () => {
  console.log("Archiving old messages...");

  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  const t = await sequelize.transaction();

  try {
   
    const oldMessages = await Message.findAll({
      where: { createdAt: { [Op.lt]: oneDayAgo } },
      include: [{ model: Attachment, as: "attachments" }],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (oldMessages.length === 0) {
      console.log("No old messages to archive");
      await t.commit();
      return;
    }

    for (const msg of oldMessages) {
     
      const [archivedMsg] = await ArchivedMessage.findOrCreate({
        where: { originalMessageId: msg.id },
        defaults: {
          originalMessageId: msg.id,
          content: msg.content ?? null,
          userId: msg.userId,
          groupId: msg.groupId ?? null,
          createdAt: msg.createdAt,
          updatedAt: msg.updatedAt,
        },
        transaction: t,
      });

      if (msg.attachments && msg.attachments.length > 0) {
        const archivedAttachments = msg.attachments.map((att: any) => ({
          originalAttachmentId: att.id,
          archivedMessageId: archivedMsg.id,
          fileUrl: att.fileUrl,
          fileType: att.fileType,
          fileName: att.fileName,
          size: att.size,
          createdAt: att.createdAt,
          updatedAt: att.updatedAt,
        }));

        await ArchivedAttachment.bulkCreate(archivedAttachments, {
          ignoreDuplicates: true,
          transaction: t,
        });
      }
    }

 
    const oldMessageIds = oldMessages.map((m) => m.id);

    await Attachment.destroy({ where: { messageId: oldMessageIds }, transaction: t });
    await Message.destroy({ where: { id: oldMessageIds }, transaction: t });

    await t.commit();
    console.log(`Archived ${oldMessages.length} messages`);
  } catch (err) {
    await t.rollback();
    console.error("Error archiving messages:", err);
  }
});
