import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { sendRequest } from "../controllers/request.controller.js";


const router = Router();


router.route("/send").patch(verifyJWT, sendRequest);


export default router;