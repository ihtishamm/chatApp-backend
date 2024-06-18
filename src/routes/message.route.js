import { Router } from "express";
 import { verifyJWT } from "../middlewares/auth.middleware.js";
import { sendAttachments, getMeassage} from "../controllers/message.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
const router = Router(); 

router.route("/attachments").post(verifyJWT,upload.array("files",5) ,sendAttachments)
router.route("/:id").get(verifyJWT,getMeassage)

export default router;
