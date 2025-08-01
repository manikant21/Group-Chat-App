import { Router } from "express";
import {router as v1Routes} from "../routes/v1/index.js";

const router = Router();

router.use("/v1", v1Routes);

export {router};