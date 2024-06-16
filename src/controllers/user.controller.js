import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ErrorHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { uploadOnCloudinary } from "../utils/cloudinary.js";


// const generateAccessAndRefereshTokens = async (userId) => {
//     try {
//       const user = await User.findById(userId);
  
//       const accessToken = user.generateAccessToken();
  
//       const refreshToken = user.generateRefreshToken();
//       user.refreshToken = refreshToken;
//       await user.save({ validateBeforeSave: false });
//       return { accessToken, refreshToken };
//     } catch (error) {
//       throw new ApiError(
//         500,
//         "Something went wrong while generating refresh and access token"
//       );
//     }
//   };


const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res
  
    const { fullName, email, username, password } = req.body;
  
    if (
      [fullName, email, username, password].some((field) => field?.trim() === ("" || undefined))
    ) {
      throw new ApiError(400, "All fields are required");
    }
  
    const existedUser = await User.findOne({
      $or: [{ username }, { email }],
    });
   
    if (existedUser) {
      throw new ApiError(409, "User with email or username already exists");
    }
  
    const avatarLocalPath = req.file?.path;
    console.log("avatarPath", avatarLocalPath);
  
    if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar file path is required");
    }
  
    const avatar = await uploadOnCloudinary(avatarLocalPath);
  
    if (!avatar) {
      throw new ApiError(400, "Avatar file is required");
    }
  
    const user = await User.create({
      fullName,
      avatar: avatar?.url,
      email,
      password,
      username: username.toLowerCase(),
    });
  
    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );
  
    if (!createdUser) {
      throw new ApiError(500, "Something went wrong while registering the user");
    }
  
    return res
      .status(201)
      .json(new ApiResponse(200, createdUser, "User registered Successfully"));
  });


  export { registerUser };