import { User } from "./user.model.js";
import { Message } from "./messages.model.js";
import { Group } from "./group.model.js";
import { UserGroup } from "./usergroup.model.js";
import { GroupAdmin } from "./groupadmin.model.js";
import { Attachment } from "./attachment.model.js";


User.hasMany(Message, { foreignKey: "userId" });
Message.belongsTo(User, { foreignKey: "userId" });

Group.hasMany(Message, { foreignKey: "groupId" });
Message.belongsTo(Group, { foreignKey: "groupId" });

User.belongsToMany(Group, { through: UserGroup, foreignKey: 'userId', otherKey: 'groupId' });
Group.belongsToMany(User, { through: UserGroup, foreignKey: 'groupId', otherKey: 'userId' });
UserGroup.belongsTo(User, { foreignKey: "userId" });
UserGroup.belongsTo(Group, { foreignKey: "groupId" });
User.hasMany(UserGroup, { foreignKey: "userId" });
Group.hasMany(UserGroup, { foreignKey: "groupId" });


Group.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
User.hasMany(Group, { foreignKey: 'ownerId', as: 'ownedGroups' });


User.belongsToMany(Group, {
    through: GroupAdmin,
    as: "AdminGroups",
    foreignKey: "userId",
    otherKey: "groupId",
});

Group.belongsToMany(User, {
    through: GroupAdmin,
    as: "Admins",
    foreignKey: "groupId",
    otherKey: "userId",
});

User.hasMany(GroupAdmin, { foreignKey: "userId" });
GroupAdmin.belongsTo(User, { foreignKey: "userId" });


Group.hasMany(GroupAdmin, { foreignKey: "groupId" });
GroupAdmin.belongsTo(Group, { foreignKey: "groupId"});

Message.hasMany(Attachment, { as: "attachments", foreignKey: "messageId" });
Attachment.belongsTo(Message, { foreignKey: "messageId" });


export { User, Message, Group, UserGroup, GroupAdmin, Attachment };