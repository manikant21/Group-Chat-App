import { Router } from "express";
import { verifyJWT } from "../../middlewares/auth.js";
import { uploadFiles } from "../../controllers/multimedia.controller.js";
import  { upload } from "../../middlewares/upload.middleware.js";


const router = Router();
router.post("/multimedia", verifyJWT, upload.array("files", 5), uploadFiles);


export {router};