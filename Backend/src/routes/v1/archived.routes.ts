import { Router } from "express";
import { verifyJWT } from "../../middlewares/auth.js";
import { getArchivedGlobalMessages , getArchivedGroupMessages} from "../../controllers/archived.controller.js";

const router = Router();

router.get("/globalmessage", verifyJWT, getArchivedGlobalMessages);
router.get("/:id/groupmessage", verifyJWT, getArchivedGroupMessages);


export {router};