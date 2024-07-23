import { Router } from "express";
import { registerUser, loginUser, logoutUser, RefreshAccessToken, getCurrentUser, updateUserAvatar, searchUser, myFriends } from "../controllers/user.controller.js";
 import { upload } from "../middlewares/multer.middleware.js";
 import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router(); 

 router.route("/register").post(upload.single("avatar"),registerUser);
 router.route("/login").post(loginUser)
 
   // authenticated routes
 router.route("/logout").post(verifyJWT,logoutUser)
 router.route("/refreshToken").post(verifyJWT,RefreshAccessToken)
 router.route("/current").get(verifyJWT,getCurrentUser)
 router.route("/updateAvatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
 router.route("/searchUser").get(verifyJWT, searchUser)
 router.route("/myFriends").get(verifyJWT, myFriends)
export default router;
