import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js"
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/register").post(
    // here multer middleware is used to handle file before execution of registerUser
    // field is used to store data of different feild in array
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount:1
        },
    ]),
    registerUser
)

export default router
