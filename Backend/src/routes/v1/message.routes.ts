import { Router } from "express";
import { verifyJWT } from "../../middlewares/auth.js";
import { messageByAUser, getMessageByAUser, getOlderMessages, getGroupMessages, postGroupMessage } from "../../controllers/message.controller.js";

const router = Router();


router.post("/addmessage", verifyJWT, messageByAUser);
router.get("/getmessage", verifyJWT, getMessageByAUser);
router.get("/getoldmessages", verifyJWT, getOlderMessages);
router.get("/:id/getGroupMessage", verifyJWT, getGroupMessages);
router.post("/:id/postGroupMessage", verifyJWT, postGroupMessage);

export {router};
