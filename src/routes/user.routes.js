import { Router } from "express";
import { 
        loginUser,
        logoutUser,
        registerUser,
        refreshAccessToken,
        changeCurrentPassword,
        getCurrentUser,
        updateAccountDetails,
        updateUserAvatar,
        updateUserCoverImage,
        getUserChannelProfile,
        getWatchHistory 
} from "../controllers/user.controller.js"
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

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

router.route("/login").post(loginUser)

// secured routes
router.route("/logout").post(verifyJWT,logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/changed-password").post(verifyJWT,changeCurrentPassword)
router.route("/current-user").get(verifyJWT,getCurrentUser)
router.route("/update-account").patch(verifyJWT,updateAccountDetails)
router.route("/avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar)
router.route("/cover-Image").patch(verifyJWT,upload.single("/coverImage"),updateUserCoverImage)

// since we are taking data from params so we need this syntex (: this is important /c/ can be given any name)
// since we have set default value as username hence we need to use "username" here
router.route("/c/:username").get(verifyJWT,getUserChannelProfile)
router.route("/history").get(verifyJWT,getWatchHistory)

export default router