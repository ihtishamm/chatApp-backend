import { Router } from "express";
 import { verifyJWT } from "../middlewares/auth.middleware.js";
 import { addMember, changeGroupName, createGroup, getChatDetails, leaveGroup, myChat, removeMember, singleGroup } from "../controllers/chat.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
const router = Router(); 


 
   // authenticated routes
   router.route("/createGroup").post(verifyJWT,createGroup);
   router.route("/myChat").get(verifyJWT,myChat);
   
   router.route("/group/addMember").patch(verifyJWT, addMember);
   router.route("/group/removeMember").patch(verifyJWT, removeMember);
    router.route("/group/leave/:id").delete(verifyJWT, leaveGroup);
   router.route("/group/:chatId").get(verifyJWT, singleGroup);
    
     router.route("/:chatId").get(verifyJWT,getChatDetails ).patch(verifyJWT,changeGroupName).delete()
export default router;
