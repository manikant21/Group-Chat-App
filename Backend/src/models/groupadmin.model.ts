import { User, Group } from './index.model.js';
import { sequelize } from '../config/db.config.js';
import { Model, Optional, DataTypes } from 'sequelize';


interface groupAdminAttributes {
    id: number,
    groupId: number,
    userId: number
}

interface groupAdminCreationAttributes extends Optional<groupAdminAttributes, 'id'> { }

export class GroupAdmin extends Model<groupAdminAttributes, groupAdminCreationAttributes> implements groupAdminAttributes {
    id!: number;
    groupId!: number;
    userId!: number

    // public Users?: User[];
     public User?: User;
    public Group?: Group;


  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

GroupAdmin.init(
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        groupId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            references: { model: Group, key: "id" },
            onDelete: "CASCADE",
        },
        userId: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            references: { model: User, key: "id" },
            onDelete: "CASCADE",
        }
    },
    {
        sequelize,
        timestamps: true,
    }
)