import { Router } from "express";
import { verifyJWT } from "../../middlewares/auth.js";
import { messageByAUser } from "../../controllers/message.controller.js";

const router = Router();


router.post("/addmessage", verifyJWT, messageByAUser);

export {router};
