import { Router } from "express";
import { verifyJWT } from "../../middlewares/auth.js";
import { messageByAUser, getMessageByAUser } from "../../controllers/message.controller.js";

const router = Router();


router.post("/addmessage", verifyJWT, messageByAUser);
router.get("/getmessage", verifyJWT, getMessageByAUser);

export {router};
