import { Router } from "express";
import { verifyJWT } from "../../middlewares/auth.js";
import { createGroup, getMyGroups, addMemberIfNotExists, getAvailableUsersForGroup } from "../../controllers/group.controller.js";

const router = Router();

router.post("/creategroup", verifyJWT, createGroup);
router.get("/my",verifyJWT, getMyGroups);
router.post("/addmember", verifyJWT, addMemberIfNotExists);
router.get("/:groupId/availableusers", verifyJWT, getAvailableUsersForGroup)



export {router};