import { Router } from "express";
import {router as userRoute} from "./user.routes.js";
import { router as messageRoute} from "./message.routes.js";
import {router as groupRoute} from "./group.routes.js";

const router = Router();

router.use("/user", userRoute);
router.use("/message", messageRoute);
router.use("/group", groupRoute);


export {router};