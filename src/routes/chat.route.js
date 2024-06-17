import { Router } from "express";
 import { verifyJWT } from "../middlewares/auth.middleware.js";
 import { createGroup, myChat } from "../controllers/chat.controller.js";
const router = Router(); 


 
   // authenticated routes
   router.route("/createGroup").post(verifyJWT,createGroup);
   router.route("/myChat").get(verifyJWT,myChat);
  
export default router;
