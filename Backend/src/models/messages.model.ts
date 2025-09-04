import { sequelize } from "../config/db.config.js";
import { Model, Optional, DataTypes } from "sequelize";


interface messageAttributes {
    id: number,
    content?: string | null,
    userId: number,
    groupId?: number | null;
    createdAt?: Date;
    updatedAt?: Date;
}

interface messageCreationAttributes extends Optional<messageAttributes, 'id'> { }

export class Message extends Model<messageAttributes, messageCreationAttributes> implements messageAttributes {
    id!: number;
    content?: string | null;
    userId!: number;
    groupId?: number | null;

    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    public readonly attachments?: any[];

}

Message.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        content: {
            type: DataTypes.STRING,
            allowNull: true,

        },
        userId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false
        },
        groupId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
        },
    },
    {
        sequelize,
        timestamps: true
    }

)