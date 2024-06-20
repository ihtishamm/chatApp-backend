import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { recieveRequest, sendRequest } from "../controllers/request.controller.js";


const router = Router();


router.route("/send").patch(verifyJWT, sendRequest);
router.route("/recieve").get(verifyJWT, recieveRequest)


export default router;