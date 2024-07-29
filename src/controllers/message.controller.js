import { ApiError } from "../utils/ErrorHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Chat } from "../models/chat.model.js";
import { emitEvent } from "../utils/functionns.js";
import { NEW_ATTACHMENT, NEW_MESSAGE_ALERT } from "../constants.js";
import { User } from "../models/user.model.js";
import { Message } from "../models/message.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Types } from "mongoose";

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
  const cloudinaryUploadPromises = files.map((file) =>
    uploadOnCloudinary(file.path)
  );

  const uploadedResults = await Promise.all(cloudinaryUploadPromises);

  const attachments = uploadedResults.map((result) => ({
    url: result.secure_url,
    filename: result.original_filename,
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
  emitEvent(req, NEW_MESSAGE_ALERT, chat.members, {
    chatId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, { message }, "Attachments sent successfully"));
});

const getMeassage = asyncHandler(async (req, res) => {
  const chatId = req.params.id;
  const { page = 1 } = req.query;
  
  if (!Types.ObjectId.isValid(chatId)) {
    return res.status(400).json({ message: "Invalid chat ID format" });
  }

  const pageSize = 20;
  const [messages, totalMessages] = await Promise.all([
    Message.find({ chat: chatId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .populate("sender", "fullName avatar")
      .lean(),
    Message.countDocuments({ chat: chatId }),
  ]);

  const totalPages = Math.ceil(totalMessages / pageSize);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { messages: messages.reverse(), totalPages },
        "Messages fetched successfully"
      )
    );
});

export { sendAttachments, getMeassage};
