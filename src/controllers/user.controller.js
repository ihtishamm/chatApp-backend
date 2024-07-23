import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ErrorHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { Chat } from "../models/chat.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = user.generateAccessToken();

    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};
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
    [fullName, email, username, password].some(
      (field) => field?.trim() === ("" || undefined)
    )
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
const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;
  console.log(email);

  if (!username && !email) {
    throw new ApiError(400, "username or email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  }).select("+password");
  if (!user) {
    throw new ApiError(404, "User does not exist");
  }
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }
  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
    user._id
  );
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged In Successfully"
      )
    );
});
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

const RefreshAccessToken = asyncHandler(async (req, res) => {
  const IncomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!IncomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      IncomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token");
    }

    if (IncomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh Token is expired or used");
    }

    const optons = {
      httpOnly: true,
      secure: true,
    };
    const { accessToken, newRefreshToken } =
      await generateAccessAndRefereshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, optons)
      .cookie("refreshToken", newRefreshToken, optons)
      .json(
        new ApiResponse(200, { accessToken, refreshToken: newRefreshToken })
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});
const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, req.user, "current user"));
});
const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading on Cloudinary");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar Image is updated successfully"));
});
 
 const searchUser = asyncHandler(async (req, res) => {
     const {fullName="" } = req.query

      const myChats = await Chat.find({gropuChat:false, members: req.user})
        
      const allFrieds = myChats.flatMap(chat => chat.members)

        const  allotherusers = await User.find({_id: {$nin: allFrieds},_id: {$nin: req.user}, fullName:{$regex: fullName, $options: "i"}  }).select("-password -refreshToken -email -username -createdAt -updatedAt -__v")

      return res.status(200).json(new ApiResponse(200, allotherusers, "All Users"))
 });

 const myFriends = asyncHandler(async (req, res) => {
  try {
      const myChats = await Chat.find({
          groupChat: false,
          members: req.user._id
      }).lean();

      const allFriends = myChats.flatMap(chat => chat.members);
      const uniqueFriends = [...new Set(allFriends.map(friend => friend.toString()))];
      const friendsToExclude = uniqueFriends.filter(friend => friend !== req.user._id.toString());

      const friends = await User.find({
          _id: { $in: friendsToExclude }
      }).select('-password -refreshToken -email -username -createdAt -updatedAt -__v').lean();

      res.status(200).json(new ApiResponse(200, friends, "All Friends"));
  } catch (error) {
      console.error(error);
      res.status(500).json(new ApiResponse(500, null, "Internal Server Error"));
  }
});

export {
  registerUser,
  loginUser,
  logoutUser,
  RefreshAccessToken,
  getCurrentUser,
  updateUserAvatar,
  searchUser,
  myFriends
};
