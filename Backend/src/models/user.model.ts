import { sequelize } from "../config/db.config.js";
import { DataType, DataTypes, Model, Optional } from "sequelize";

interface userAttributes {
    id: number,
    name: string,
    email: string,
    phoneNo: string,
    password: string,
    createdAt?: Date;
    updatedAt?: Date;
}

interface userCreationAttributes extends Optional<userAttributes, 'id'> {}


export class User extends Model<userAttributes, userCreationAttributes> implements userAttributes {
    public id!: number;
    public name!: string;
    public email!: string;
    public phoneNo!: string;
    public password!: string;

}

User.init (
    {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false
    },
    phoneNo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    }
},
{
    sequelize,
    timestamps: true
}
)