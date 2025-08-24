import { Router } from "express";
import { verifyJWT } from "../../middlewares/auth.js";
import { createGroup, getMyGroups, addMemberIfNotExists, getAvailableUsersForGroup, addAdmins, removeAdmins, fetchAdmin, removeMembers, getGroupMembers, getNonAdminMember, getGroupMembersWithAdminStatus, deleteGroup } from "../../controllers/group.controller.js";

const router = Router();

router.post("/creategroup", verifyJWT, createGroup);
router.get("/my",verifyJWT, getMyGroups);
router.post("/addmember", verifyJWT, addMemberIfNotExists);
router.get("/:groupId/availableusers", verifyJWT, getAvailableUsersForGroup);
router.post("/:groupId/addadmin", verifyJWT, addAdmins);
router.post("/:groupId/removeadmins", verifyJWT, removeAdmins);
router.get("/:groupId/fetchadmin", verifyJWT, fetchAdmin);
router.post("/:groupId/removemembers", verifyJWT, removeMembers);
router.get("/:groupId/member", verifyJWT, getGroupMembers);
router.get("/:groupId/nonadmin", verifyJWT, getNonAdminMember);
router.get("/:groupId/allmembers", verifyJWT, getGroupMembersWithAdminStatus);
router.delete("/:groupId/deletegroup", verifyJWT, deleteGroup);



export {router};