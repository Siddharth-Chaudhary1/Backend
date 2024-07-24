import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken";
import mongoose from "mongoose"

const generateAccessTokenAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return {accessToken,refreshToken}

    } catch (error) {
        throw new ApiError(500,"Something went wrong while generation access and refresh token");
    }
}

const registerUser = asyncHandler( async (req,res) =>{
    // get user details from frontend
    // validation - not empty 
    // check if user already exists: username,email
    // check for images,check for avtar
    // upload then to cloudinary, avatr
    // create user object - create entry in db
    // remove password and refresh token from response
    // check for user creation
    // return response

    // if response if in the form of json or form we use req.body
    const {fullName,email,username,password} = req.body;
    // console.log("email: ",email);

    //  to validate each field 
    if(
        [fullName,email,username,password].some((field) => field?.trim() === "")
    )
    {
        throw new ApiError(400,"All fields are required");
    }

    // user is imported and will be used to check for unique logins
    // this is mongodb operators
    const existedUser = await User.findOne({
        $or: [{ username },{ email }]
    })

    if(existedUser){
        throw new ApiError(409,"User with email or username already exist")
    }

    // image kliye
    // ?. is like asking if there exist then do else do nothing
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400,"Avatar file is required");
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
    })

    // ye password and refreshToken delect krne kliye
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering the user");
    }

    // sab theek to response bhej do
    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered successfully")
    )
})

const loginUser = asyncHandler( async(req,res) => {
    //  req body -> data
    // username or email access
    // find the user
    // password check
    // access and refresh token
    // send cookies
    // send response

    // taking data using request body
    const {email,username,password} = req.body;

    if(!username && !email){
        throw new ApiError(400,"username or email is required");
    }

    // this is mongodb operators
    const user = await User.findOne({
        $or: [{username},{email}]
    })

    if(!user){
        throw new ApiError(404,"User does not exist");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid){
        throw new ApiError(401,"Invalid user credentials");
    }

    const {accessToken,refreshToken} = await generateAccessTokenAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    // sending cookies securly
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser,accessToken,refreshToken
            },
            "User logged in successfully"
        )
    )
})

const logoutUser = asyncHandler( async(req,res) =>{
    // refresh token delete
    await User.findByIdAndUpdate(
        req.user._id,
        {
            // mongooes operator
            $set: {
                refreshToken: undefined,
            }
        },
        {
            new: true,
        }
    )

    // cookies delete
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User logged Out"))
})

const refreshAccessToken = asyncHandler( async(req,res) => {
    
    const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken){
        throw new ApiError(401,"unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id);
    
        if(!user){
            throw new ApiError(401,"Invalid refresh Token")
        }    
         
        // checking if refresh token of user is same or not
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"Refresh token is expired or used")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken,newRefreshToken} = await generateAccessTokenAndRefreshTokens(user._id,)
    
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {accessToken,refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid refresh token");        
    }
})

const changeCurrentPassword = asyncHandler( async(req,res) => {
    const {oldPassword,newPassword} = req.body;

    // this is possible only because user is verified by jwt token using uth.middleware.js
    // and we have set logined user in user 
    const user = await User.findById(user?._id);

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if(!isPasswordCorrect){
        throw new ApiError(400,"Invalid Password")
    }

    user.password = newPassword;
    await user.save({validateBeforeSave: false});

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Password changed succefully")) 

})

const getCurrentUser = asyncHandler( async(req,res) => {
    return res
    .status(200)
    .json(200,req.user,"User fetched succesfully")
}) 

const updateAccountDetails = asyncHandler(async(req, res) => {
    const {fullName, email} = req.body

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email
            }
        },
        {new: true}
        
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))
});

const updateUserAvatar = asyncHandler(async(req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    //TODO: delete old image - assignment

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar image updated successfully")
    )
})

const updateUserCoverImage = asyncHandler(async(req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }

    //TODO: delete old image - assignment

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on Cover image")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            // this is Mongoose operator used to set value in data base
            $set:{
                coverImage: coverImage.url
            }
        },
        // pecifies that the method should return the updated document rather than the original document
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover image updated successfully")
    )
})

const getUserChannelProfile = asyncHandler(async(req,res) => {
    // req.params, contains route parameters
    // Params object contains key-value pairs, where the keys are the names of the 
    // route parameters and the values are the corresponding values from the "URL".
    // aur aise username extract kr skte h url se
    const {username} = req.params;

    // trim() Method: This method is used to remove whitespace from both ends of a string.
    if(!username?.trim()){
        throw new ApiError(400,"username is missing")
    }

    // this is aggregation pipeline that is joining two our more tables together
    // it accept array and inside {} pipeline is writen 
    const channel = await User.aggregate([
        {
            // this is first pipeline that uses username to match 
            $match:{
                username: username?.toLowerCase(),
            }
        },
        // now to find subscriber we need lookup
        {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        // To find channel I have subscribed to use lookup 
        {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields:{
                // To count subscribers and subscribedTo
                subscribersCount:{
                    // this is a field so use $ sign
                    $size:"$subscribers"
                },
                channelSubscribedToCount:{
                    // this is a field so use $ sign
                    $size:"$subscribedTo"
                },
                // To check is i am subscribed to this channel or not
                isSubscribed:{
                    $cond:{
                        // here we check whether we are in subscriber lsit of that channel or not
                        // so $in operator is used
                        if:{$in:[req.user?._id,"$subscribers.subscriber"]}  ,
                        then: true,
                        else: false,  
                    }
                }
            }
        },
        {
            // it is used to return selected parameters
            $project:{
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,

            }
        }
    ]);

    if(!channel?.length){
        throw new ApiError(404,"channel does not exists");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,channel[0],"User channel fetched succesfully")
    )
})

const getWatchHistory = asyncHandler(async(req,res) => {
    const user = await User.aggregate([
        {
            $match:{
                // as req.user?._id gives string and not mongobd id 
                // and here direct code is send to mongodb
                // so we have to use new mongoose.Types.ObjectId()
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            // with this pipeline all data will be projected in owner 
                            pipeline:[
                                {
                                    $project:{
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1,
                                    }
                                }
                            ]
                        }
                    },
                    // this to optimize the output value
                    {
                        $addFields:{
                            // this will set first value of owner array in owner
                            owner:{
                                $first: "$owner",
                            }
                        }
                    }
                ]
            }  
        }
    ])

    return res
    .status(200)
    .json(
        new ApiError(
            200,
            user[0].watchHistory,
            "Watch history fetched successfully"
        )
    )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory,
}