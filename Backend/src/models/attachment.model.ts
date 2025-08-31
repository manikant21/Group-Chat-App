import { sequelize } from "../config/db.config.js";
import { DataTypes, Model, Optional } from "sequelize";
import { Message } from "./messages.model.js";

interface attachmentAttributes {
  id: number;
  messageId: number;
  fileUrl: string;       // S3 URL
  fileType: string;      // e.g. "image/png", "application/pdf"
  fileName?: string;     // original filename (optional)
  size?: number;         // size in bytes (optional)
  createdAt?: Date;
  updatedAt?: Date;
}

interface attachmentCreationAttributes extends Optional<attachmentAttributes, "id"> {}

export class Attachment extends Model<attachmentAttributes, attachmentCreationAttributes>
  implements attachmentAttributes {
  id!: number;
  messageId!: number;
  fileUrl!: string;
  fileType!: string;
  fileName?: string;
  size?: number;
}

Attachment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    messageId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: Message, key: "id" },
      onDelete: "CASCADE",
    },
    fileUrl: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fileType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    size: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
  },
  {
    sequelize,
    timestamps: true,
  }
);
