// to verify if user has access

import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import {User} from "../models/user.model.js"

export const verifyJWT = asyncHandler(async(req,res,next) => {
    try {
        const token = req.cookies?.accessToken  || req.header("Authorization")?.replace("Bearer ","");
    
        if(!token){
            throw new ApiError(401,"Unauthorized request");
        }
    
        const decodedToken = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
    
        if(!user){
            // frontend talk
            throw new ApiError(401,"Invalid access token");
        }
    
        // ye dene ka mltb ye h ki tum accesstoken se user verify kiye ki ye login h ki nhi
        // agar h to req k user me user (jisko logout krna h aur verify kiye ho access token se) ko set krdo
        // takin sedhe lougout kr ske (Token delete kr ske)
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid access token");
    }
    
})