import { sequelize } from "../config/db.config.js";
import { DataTypes, Model, Optional } from "sequelize";
import { User } from "./user.model.js";

interface groupAttributes {
  id: number;
  name: string;
  description?: string;
  ownerId: number;
  createdAt?: Date;
  updatedAt?: Date;

}

interface groupCreationAttributes extends Optional<groupAttributes, "id"> {}

export class Group extends Model<groupAttributes, groupCreationAttributes> implements groupAttributes {
   id!: number;
   name!: string;
   description?: string;
   ownerId!: number;

   public Users?: User[];
}

Group.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ownerId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
  },
  {
    sequelize,
    timestamps: true,
  }
);
