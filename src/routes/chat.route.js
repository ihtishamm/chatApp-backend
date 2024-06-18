import { Router } from "express";
 import { verifyJWT } from "../middlewares/auth.middleware.js";
 import { addMember, createGroup, myChat, removeMember, singleGroup } from "../controllers/chat.controller.js";
const router = Router(); 


 
   // authenticated routes
   router.route("/createGroup").post(verifyJWT,createGroup);
   router.route("/myChat").get(verifyJWT,myChat);
   router.route("/group/:chatId").get(verifyJWT, singleGroup);
   router.route("/group/addMember").patch(verifyJWT, addMember);
   router.route("/group/removeMember").patch(verifyJWT, removeMember);
   
export default router;
