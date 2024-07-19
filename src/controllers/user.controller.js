import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"

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
    console.log("email: ",email);

    //  to validate each field 
    if(
        [fullName,email,username,password].some((field) => field?.trim() === "")
    )
    {
        throw new ApiError(400,"All fields are required");
    }

    // user is imported and will be used to check for unique logins
    const existedUser = User.findOne({
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

export {registerUser}