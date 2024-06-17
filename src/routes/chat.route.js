import { Router } from "express";
 import { verifyJWT } from "../middlewares/auth.middleware.js";
 import { createGroup, myChat, singleGroup } from "../controllers/chat.controller.js";
const router = Router(); 


 
   // authenticated routes
   router.route("/createGroup").post(verifyJWT,createGroup);
   router.route("/myChat").get(verifyJWT,myChat);
   router.route("/group/:chatId").get(verifyJWT, singleGroup);
  
export default router;
