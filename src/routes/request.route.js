import { Router } from "express";
import { sendRequest } from "../controllers/request.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();


router.route("/send").post(verifyJWT, sendRequest);


export default router;