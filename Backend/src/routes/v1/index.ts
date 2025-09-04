import { Router } from "express";
import {router as userRoute} from "./user.routes.js";
import { router as messageRoute} from "./message.routes.js";
import {router as groupRoute} from "./group.routes.js";
import {router as uploadRoute} from "./upload.routes.js";
import {router as archivedRoute} from "./archived.routes.js";

const router = Router();

router.use("/user", userRoute);
router.use("/message", messageRoute);
router.use("/group", groupRoute);
router.use("/upload", uploadRoute);
router.use("/archived", archivedRoute);


export {router};