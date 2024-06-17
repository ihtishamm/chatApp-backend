import { Router } from "express";
 import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router(); 


 
   // authenticated routes
   router.route("/createGroup").post(verifyJWT,createGroup);

export default router;
