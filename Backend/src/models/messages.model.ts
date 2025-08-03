import { sequelize } from "../config/db.config.js";
import { Model, Optional, DataTypes } from "sequelize";


interface messageAttributes {
    id: number,
    content: string,
    userId: number,
    createdAt?: Date;
    updatedAt?: Date;
}

interface messageCreationAttributes extends Optional<messageAttributes, 'id'> { }

export class Message extends Model<messageAttributes, messageCreationAttributes> implements messageAttributes {
    id!: number;
    content!: string;
    userId!: number;
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
            allowNull: false,

        },
        userId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false
        }
    },
    {
        sequelize,
        timestamps: true
    }

)