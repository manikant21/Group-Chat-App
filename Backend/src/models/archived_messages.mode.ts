import { sequelize } from "../config/db.config.js";
import { DataTypes, Model, Optional } from "sequelize";

interface archivedMessageAttributes {
  id: number;
  originalMessageId: number;
  userId: number;
  groupId?: number | null;
  content?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface archivedMessageCreationAttributes extends Optional<archivedMessageAttributes, "id"> { }

export class ArchivedMessage extends Model<
  archivedMessageAttributes,
  archivedMessageCreationAttributes
> implements archivedMessageAttributes {
  id!: number;
  originalMessageId!: number;
  userId!: number;
  groupId!: number;
  content!: string;
  createdAt?: Date;
  updatedAt?: Date;
}

ArchivedMessage.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    originalMessageId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    groupId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    content: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    sequelize,
    timestamps: true,
  }
);
