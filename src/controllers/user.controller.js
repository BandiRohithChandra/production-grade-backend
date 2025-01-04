import asyncHandler from '../utils/asyncHandler.js';
import ApiError from "../utils/ApiError.js"
import User from "../models/user.model.js"
import uploadOnCloudinary from "../utils/cloudinary.js"
import ApiResponse from '../utils/ApiResponse.js'


const registerUser = asyncHandler(async (req, res) => {


    // get user details from frontend

    const { username, fullName, email, password } = req.body 
    console.log("email: ", email)

    // validation - not empty

    if (
        [fullName, username, email, password].some((field) => field? .trim() === "")
    ) {
        throw new ApiError(400, "All Fields are required");
        
    }

    // check if user already exists: username, email

    const existedUser = User.findOne({
        $or: [{username}, {email}]
    })

    if (existedUser){
        throw new ApiError(409, "user with email or username already existed")
    }


    // check for images, check for avatar

    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path 

    if (!avatarLocalPath){
        throw new ApiError(400, "avatar is required")
    }



    // upload them to cloudinary, avatar

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar){
        throw new ApiError(400, "avatar file is required")
    }



    // create user object - create entry in db

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || ""
        password,
        email,
        username: username.toLowerCase()
    })

    // remove password and refresh token in field from response

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    // check for user creation

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    // return response 

    return res.status(201).json({
        new ApiResponse(200, createdUser, "User created Successfully")
    })

})


export default registerUser