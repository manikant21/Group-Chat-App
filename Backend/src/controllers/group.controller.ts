import { User, Group, Message, UserGroup, GroupAdmin } from "../models/index.model.js";
import { sequelize } from "../config/db.config.js";
import { Model, NUMBER, Op } from 'sequelize';
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

        await UserGroup.bulkCreate(userGroupEntries, { transaction });

        await GroupAdmin.create({
            groupId: group.id,
            userId: ownerId
        }, { transaction });

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

        // const groups = await Group.findAll({
        //     include: [
        //         {
        //             model: User,
        //             through: UserGroup,
        //             where: { id: userId },
        //             attributes: [] // Don't include user data in response
        //         },
        //         {
        //             model: User,
        //             as: "owner",
        //             attributes: ["id", "name"]
        //         }
        //     ]
        // });

        const userGroups = await UserGroup.findAll({
            where: { userId: userId },
            include: [
                {
                    model: Group,
                    attributes: ["id", "name", "description", "ownerId"]
                }
            ]
        });
        const groups = userGroups.map(userGroup => ({
            id: userGroup.Group?.id,
            name: userGroup.Group?.name,
            description: userGroup.Group?.description,
            ownerId: userGroup.Group?.ownerId,
            joinedAt: userGroup.createdAt  // When user joined this group
        }));

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


        // const group = await Group.findOne({
        //     where: { id: groupId, ownerId: adminId }
        // });

        const group =  await GroupAdmin.findOne({
            where: {
                groupId,
                userId: adminId
            }
        })

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

        if (!groupId) {
            return res.status(400).json({ error: "groupId is required" });
        }

        // Step 1: Get all userIds already in this group
        const existingMembers = await UserGroup.findAll({
            where: { groupId },
            attributes: ["userId"], // only fetch userId column
        });

        const existingUserIds = existingMembers.map(member => member.userId);

        // Step 2: Fetch users who are NOT in the group
        const availableUsers = await User.findAll({
            where: {
                id: {
                    [Op.notIn]: existingUserIds.length > 0 ? existingUserIds : [0], 
                },
            },
            attributes: ["id", "name", "email"], // choose fields you need
        });


        return res.status(200).json({ availableUsers });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch available users" });
    }
};

export const addAdmins = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { groupId } = req.params;
        const { userIds } = req.body;
        const userId: number = req.user.id;

        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ message: 'User IDs are required' });
        }

        const admin = await GroupAdmin.findOne({
            where: {
                groupId,
                userId
            }
        })

        if (!admin) {
            return res.status(401).json({ message: "Unauthorized - You are not the group admin" });
        };

        const groupAdminEntries = userIds.map((userId) => ({
            groupId: Number(groupId),
            userId
        }));

        await GroupAdmin.bulkCreate(groupAdminEntries);

        return res.status(201).json({ message: "Admin added successfully" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to make users admin!" });
    }
}

export const removeAdmins = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { groupId } = req.params;
        const { userIds } = req.body;
        const userId: number = req.user.id;

        if (!Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ message: 'User IDs are required' });
        }

        // const owner = await Group.findOne({
        //     where: {
        //         id: groupId,
        //         ownerId: userId
        //     }
        // })

        const admin = await GroupAdmin.findOne({
            where: {
                groupId: Number(groupId),
                userId: userId
            }
        })
        // console.log(admin);

        if (!admin) {
            return res.status(401).json({ message: "Unauthorized - You are not the group admin" });
        }

        const existingAdmin = await GroupAdmin.findAll({
            where: {
                groupId: Number(groupId),
                userId: { [Op.in]: userIds }
            }
        });

        // if (existingAdmin.length !== userIds.length) {
        //     return res.status(400).json({
        //         message: "Some users are not members of this group"
        //     });
        // }
        console.log(existingAdmin);
        const ids = userIds.map((id: string | number) => Number(id));
        console.log(ids);

        await GroupAdmin.destroy({
            where: {
                groupId: Number(groupId),
                userId: {
                    [Op.in]: ids
                }

            }
        })
        return res.status(201).json({ message: "Users removed from admin successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to remove users from admin!" });
    }
}

export const fetchAdmin = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { groupId } = req.params;
        const admins = await GroupAdmin.findAll({
            where: {
                groupId: Number(groupId)
            },
            include: [{
                model: User,
                attributes: ['id', 'name', 'email']  // Include user details
            }],
            order: [['createdAt', 'ASC']]  // Order by when they became admin
        });

        // Also get the group owner info
        const group = await Group.findByPk(groupId, {
            include: [{
                model: User,
                as: "owner",
                attributes: ['id', 'name', 'email']
            }]
        });

        if (!group) {
            return res.status(404).json({ message: "Group not found" });
        }

        // Format the response
        const response = {
            groupInfo: {
                id: group.id,
                name: group.name,
                owner: group.owner
            },
            admins: admins.map(admin => ({
                id: admin.id,
                userId: admin.User?.id,
                name: admin.User?.name,
                email: admin.User?.email,
                addedAt: admin.createdAt ?? null
            })),
            totalAdmins: admins.length
        };

        return res.status(200).json({
            message: "Admins fetched successfully",
            data: response
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch admin list" });
    }
}

export const removeMembers = async (req: AuthenticatedRequest, res: Response) => {
    const transaction = await sequelize.transaction();
    try {
        const { groupId } = req.params;
        const { userIds } = req.body;
        const userId: number = req.user.id;
        if (!groupId || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({ message: "User IDs are required" });
        }

        const isAdmin = await GroupAdmin.findOne({
            where: { groupId: Number(groupId), userId }
        });

        const group = await Group.findByPk(groupId);

        if (!isAdmin && group?.ownerId !== userId) {
            return res.status(403).json({ message: "Not authorized to remove members" });
        }

        const existingAdmins = await GroupAdmin.findAll({
            where: {
                groupId: Number(groupId),
                userId: { [Op.in]: userIds }
            }
        });
        const existingAdminIds = existingAdmins.map(admin => admin.userId);
        await UserGroup.destroy({
            where: {
                groupId: Number(groupId),
                userId: { [Op.in]: userIds }
            },
            transaction
        });

        if (existingAdminIds.length > 0) {
            await GroupAdmin.destroy({
                where: {
                    groupId: Number(groupId),
                    userId: { [Op.in]: existingAdminIds }
                },
                transaction
            });
        }

        await transaction.commit();

        return res.status(200).json({ message: "Users removed from group" });



    } catch (err) {
        console.error(err);
        await transaction.rollback();
        res.status(500).json({ message: "Failed to remove memeber from gruop" });
    }
}

export const getGroupMembers = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId: number = req.user.id;
        const {groupId} = req.params;
         if (!groupId) {
            return res.status(400).json({ error: "groupId is required" });
        }

        
        const existingMembers = await UserGroup.findAll({
            where: { groupId },
            attributes: ["userId"], 
        });

        const existingUserIds = existingMembers.map(member => member.userId);

        // Step 2: Fetch users who are in the group
        const availableUsers = await User.findAll({
            where: {
                id: {
                    [Op.in]: existingUserIds.length > 0 ? existingUserIds : [0], 
                },
            },
            attributes: ["id", "name", "email"], // choose fields you need
        });

        return res.status(200).json({availableUsers});

  
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to load members from gruop" });
    }
}

export const getNonAdminMember = async (req: AuthenticatedRequest, res:Response) => {
    try {
          const { groupId } = req.params;
        //   const { userIds } = req.body;

          const allUser = await UserGroup.findAll({
            where: {
                groupId: Number(groupId)
            },
            attributes: ["userId"]
          });
          const userId = allUser.map(member => member.userId);
          const admin = await GroupAdmin.findAll({
            where: {
                groupId: Number(groupId),
                userId: {
                    [Op.in]: userId.length > 0 ? userId : [0], 
                },
            },
            raw:true
          });
          const adminId = admin.map(ad => ad.userId);

          const nonadmin = await User.findAll({
            where: {
                id : {
                    [Op.notIn]: adminId
                }
            },
            attributes: ["id" , "name", "email"] 
          })

          console.log(nonadmin);
          return res.status(200).json({message: nonadmin});
    } catch (error) {
        
    }
}

export const getGroupMembersWithAdminStatus = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { groupId } = req.params;

        //  Get all members from UserGroup + their user details
        const members = await UserGroup.findAll({
            where: { groupId: Number(groupId) },
            include: [
                {
                    model: User,
                    attributes: ["id", "name", "email"]
                }
            ],
            raw: true,
            nest: true
        });

        if (!members.length) {
            return res.status(404).json({ message: "No members found for this group" });
        }

        //  Get all admins for this group
        const admins = await GroupAdmin.findAll({
            where: { groupId: Number(groupId) },
            attributes: ["userId"],
            raw: true
        });

        const adminIds = admins.map(a => a.userId);

        //  Add isAdmin flag to each member
        const result = members.map(member => ({
            id: member.User?.id,
            name: member.User?.name,
            email: member.User?.email,
            isAdmin: member.User ? adminIds.includes(member.User.id) : false
        }));

        return res.status(200).json(result);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to fetch group members" });
    }
};

export const deleteGroup = async (req: AuthenticatedRequest, res: Response) => {
  const transaction = await sequelize.transaction();
  try {
    const userId: number = req.user.id;
    const { groupId } = req.params;

    // 1. Check ownership
    const group = await Group.findOne({
      where: { id: groupId, ownerId: userId },
      transaction
    });

    if (!group) {
      await transaction.rollback();
      return res.status(401).json({ message: "User is not authorized to delete this group!" });
    }

    // 2. Delete related records (if cascade isn’t enabled)
    await Message.destroy({ where: { groupId }, transaction });
    await UserGroup.destroy({ where: { groupId }, transaction });
    await GroupAdmin.destroy({ where: { groupId }, transaction });

    // 3. Delete the group
    await Group.destroy({
      where: { id: groupId, ownerId: userId },
      transaction
    });

    await transaction.commit();
    return res.status(200).json({ message: "Group and related data deleted successfully" });

  } catch (error) {
    console.error(error);
    await transaction.rollback();
    res.status(500).json({ message: "Failed to delete group" });
  }
};