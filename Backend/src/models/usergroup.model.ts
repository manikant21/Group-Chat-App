import { sequelize } from "../config/db.config.js";
import { DataTypes, Model, Optional } from "sequelize";
interface userGroupAttributes {
    id: number;
    userId: number;
    groupId: number;
    createdAt?: Date;
    updatedAt?: Date;
}

interface userGroupCreationAttributes extends Optional<userGroupAttributes, "id"> { }

export class UserGroup extends Model<userGroupAttributes, userGroupCreationAttributes> implements userGroupAttributes {
    id!: number;
    userId!: number;
    groupId!: number;
}

UserGroup.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
        },
        groupId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
        },
    },
    {
        sequelize,
        timestamps: true,
    }
);