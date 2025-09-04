import { sequelize } from "../config/db.config.js";
import { DataTypes, Model, Optional } from "sequelize";
import { ArchivedMessage } from "./archived_messages.mode.js";

interface archivedAttachmentAttributes {
  id: number;
  originalAttachmentId: number;
  archivedMessageId: number;
  fileUrl: string;
  fileType: string;
  fileName?: string;
  size?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface archivedAttachmentCreationAttributes
  extends Optional<archivedAttachmentAttributes, "id"> { }

export class ArchivedAttachment extends Model<
  archivedAttachmentAttributes,
  archivedAttachmentCreationAttributes
> implements archivedAttachmentAttributes {
  id!: number;
  originalAttachmentId!: number;
  archivedMessageId!: number;
  fileUrl!: string;
  fileType!: string;
  fileName?: string;
  size?: number;
}

ArchivedAttachment.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    originalAttachmentId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    archivedMessageId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: ArchivedMessage, key: "id" },
      onDelete: "CASCADE",
    },
    fileUrl: { type: DataTypes.STRING, allowNull: false },
    fileType: { type: DataTypes.STRING, allowNull: false },
    fileName: { type: DataTypes.STRING, allowNull: true },
    size: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  },
  {
    sequelize,
    timestamps: true,
  }
);
