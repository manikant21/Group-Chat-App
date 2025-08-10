import {User, Group, Message, UserGroup} from "../models/index.model.js";
import { sequelize } from "../config/db.config.js";
import {Op} from 'sequelize';
import { Request, Response } from "express";
import { Error } from "sequelize";

interface AuthenticatedRequest extends Request {
    user?: any
}

export const createGroup = async (req: AuthenticatedRequest, res: Response) => {
    const transaction = await sequelize.transaction();
    try {

    const { groupName, description, memberIds } = req.body;
    console.log("Body received:", req.body);
console.log("Type of members:", typeof req.body.memberIds, req.body.memberIds);

    const ownerId = req.user.id;

    if (!groupName || !Array.isArray(memberIds)) {
      return res.status(400).json({ message: 'Group name and member IDs are required' });
    }

    // create the group with ownerId
    const group = await Group.create(
      {
        name: groupName,
        description,
        ownerId
      },
      { transaction }
    );

    // add owner and other members to the group
    const allUserIds = [ownerId, ...memberIds];
    const userGroupEntries = allUserIds.map((userId) => ({
      userId,
      groupId: group.id
    }));

    await UserGroup.bulkCreate(userGroupEntries, { transaction});

    //commit transaction
    await transaction.commit();
    res.status(201).json({ message: 'Group created successfully', group });

  } catch (err) {
    await transaction.rollback();
    console.error(err);
     const error = err as Error;
    res.status(500).json({ message: 'Failed to create group', error: error.message });
  }
}

export const getMyGroups = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const groups = await Group.findAll({
      include: [
        {
          model: User,
          attributes: ["id", "name"],
          through: { attributes: [] }, 
          where: { id: userId }
        }
      ]
    });

    res.status(200).json({ data: groups });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch groups" });
  }
};

export const addMemberIfNotExists = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const adminId = req.user.id;
    const { groupId, userIds } = req.body;

    if (!groupId || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: "Group ID and userIds array are required" });
    }

    
    const group = await Group.findOne({
      where: { id: groupId, ownerId: adminId }
    });

    if (!group) {
      return res.status(401).json({ message: "Unauthorized - You are not the group owner" });
    }

    const existingMembers = await UserGroup.findAll({
      where: {
        groupId,
        userId: userIds
      }
    });

    const existingUserIds = existingMembers.map(m => m.userId);

 
    const newUserIds = userIds.filter(id => !existingUserIds.includes(id));

    if (newUserIds.length === 0) {
      return res.status(200).json({ message: "All selected users are already in the group" });
    }


    const newMembers = newUserIds.map(userId => ({ groupId, userId }));
    await UserGroup.bulkCreate(newMembers);

    return res.status(201).json({ message: "New members added successfully", addedUserIds: newUserIds });
  } catch (error) {
    console.error("Error adding member:", error);
    res.status(500).json({ message: "Failed to add member" });
  }
};



export const getAvailableUsersForGroup = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { groupId } = req.params;

    // fetch the group along with its current members
    const group = await Group.findByPk(groupId, {
      include: [
        {
          model: User,
          attributes: ["id", "name", "email"], // we only need minimal fields
          through: { attributes: [] }, // hides UserGroup table fields
        },
      ],
    });
    console.log(group?.Users);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    //extract the IDs of users already in this group
    const existingUserIds = group.Users?.map((u) => u.id) || [];

    // find all users who are NOT already in the group
    const availableUsers = await User.findAll({
      where: {
        id: { 
          
          [Op.notIn]: existingUserIds 
        },
      },
      attributes: ["id", "name", "email"],
    });

    res.json({ availableUsers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch available users" });
  }
};
