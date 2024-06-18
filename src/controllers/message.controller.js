import { ApiError } from "../utils/ErrorHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Chat } from "../models/chat.model.js";
import { emitEvent } from "../utils/functionns.js";
import {
  ALERT,
  NEW_ATTACHMENT,
  NEW_MESSAGE_ALERT,
  REFETCH_CHATS,
} from "../constants.js";
import { User } from "../models/user.model.js";
import { Message } from "../models/message.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const sendAttachments = asyncHandler(async (req, res) => {
    const { chatId } = req.body;
  
    const [chat, user] = await Promise.all([
      Chat.findById(chatId),
      User.findById(req.user._id).select("fullName avatar"),
    ]);
  
    if (!chat) {
      throw new ApiError(404, "Chat not found");
    }
  
    const files = req.files || [];
  
    if (files.length < 1) {
      throw new ApiError(400, "Please provide attachments");
    }
  
    // Upload files to Cloudinary
    const cloudinaryUploadPromises = files.map(file => uploadOnCloudinary(file.path));
  
    const uploadedResults = await Promise.all(cloudinaryUploadPromises);
  
    const attachments = uploadedResults.map(result => ({
      url: result.secure_url,
      filename: result.original_filename
    }));
  
    const messageContent = "hi";
  
    const messagedb = {
      content: messageContent,
      attachments: attachments,
      sender: user._id,
      chat: chatId,
    };
  
    const realtimeMessage = {
      ...messagedb,
      sender: {
        _id: user._id,
        fullName: user.fullName,
        avatar: user.avatar,
      },
    };
  
    const message = await Message.create(messagedb);
  
    await chat.save();
  
    emitEvent(req, NEW_ATTACHMENT, chat.members, {
      message: realtimeMessage,
      chatId,
    });
    emitEvent(req,NEW_MESSAGE_ALERT, chat.members, {
      chatId,
    });
  
    return res
      .status(200)
      .json(new ApiResponse(200, { message }, "Attachments sent successfully"));
  });

  export {sendAttachments}