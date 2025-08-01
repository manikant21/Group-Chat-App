import { Router } from "express";
import {router as userRoute} from "./user.routes.js";

const router = Router();

router.use("/user", userRoute);


export {router};