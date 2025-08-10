import { Router } from "express";
import { registerUser, loginUser, getAllUser} from "../../controllers/user.controller.js";
import { verifyJWT } from "../../middlewares/auth.js";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/all", verifyJWT, getAllUser);
// router.post("/logout", logoutUser); 

export {router};