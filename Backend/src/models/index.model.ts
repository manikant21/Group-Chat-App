import { User } from "./user.model.js";
import { Message } from "./messages.model.js";
import { Group } from "./group.model.js";
import { UserGroup } from "./usergroup.model.js";

// User.hasMany(Message, {
//     foreignKey: "userId"
// })

// Message.belongsTo(User, {
//     foreignKey: "userId"
// })

// Group.hasMany(Message, {
//     foreignKey: "groupId"
// })

// Message.belongsTo(Group, {
//     foreignKey: "groupId"
// })

// User.belongsToMany(Group, {
//     through: UserGroup
// });

// Group.belongsToMany(User, {
//     through: UserGroup
// });

// Group.belongsTo(User, { foreignKey: 'ownerId'})

User.hasMany(Message, { foreignKey: "userId" });
Message.belongsTo(User, { foreignKey: "userId" });

Group.hasMany(Message, { foreignKey: "groupId" });
Message.belongsTo(Group, { foreignKey: "groupId" });

User.belongsToMany(Group, { through: UserGroup, foreignKey: 'userId', otherKey: 'groupId' });
Group.belongsToMany(User, { through: UserGroup, foreignKey: 'groupId', otherKey: 'userId' });

Group.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });
User.hasMany(Group, { foreignKey: 'ownerId', as: 'ownedGroups' }); // ✅ reverse association


export { User, Message, Group, UserGroup};