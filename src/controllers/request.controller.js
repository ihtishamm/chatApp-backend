import { ApiError } from "../utils/ErrorHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Request } from "../models/request.model.js";
import { emitEvent } from "../utils/functionns.js";
import { Chat } from "../models/chat.model.js";
import { REFETCH_CHATS } from "../constants.js";

const sendRequest = asyncHandler(async (req, res) => {
  const { reqId } = req.body;

  if (!reqId) {
    throw new ApiError(400, "Receiver Id is required");
  }

  // Check if a request already exists between the sender and receiver
  const existingRequest = await Request.findOne({
    $or: [
      { sender: req.user._id, receiver: reqId },
      { sender: reqId, receiver: req.user._id },
    ],
  });

  if (existingRequest) {
    throw new ApiError(400, "Request already sent");
  }

  const request = await Request.create({
    sender: req.user._id,
    receiver: reqId,
  });

  emitEvent(req, "newRequest", [reqId], "request");

  return res
    .status(200)
    .json(new ApiResponse(200, request, "Request sent successfully"));
});

const recieveRequest = asyncHandler(async (req, res) => {
  const requests = await Request.find({ receiver: req.user._id }).populate(
    "sender",
    "fullName  avatar"
  );
  return res
    .status(200)
    .json(new ApiResponse(200, requests, "Requests fetched successfully"));
});

const acceptRequest = asyncHandler(async (req, res) => {
  const { requestId, accept } = req.body;
   
   if(!requestId || !accept){
    throw new ApiError(400, "Request Id and accept field is required");
   }
   
  const request = await Request.findById(requestId)
    .populate("sender", "fullName avatar")
    .populate("receiver", "fullName avatar");
 
      console.log(request);
  if (!request) {
    throw new ApiError(404, "Request not found");
  }
  if (request.receiver._id.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to accept this request");
  }
  if (request.status !== "pending") {
    throw new ApiError(400, "Request is already accepted or rejected");
  }

  if (!accept) {
    request.status = "rejected";
    request.deleteOne();
    return res
      .status(200)
      .json(new ApiResponse(200, request, "Request rejected successfully"));
  }

  const members = [request.sender._id, request.receiver._id];

  await Promise.all([
    Chat.create({
      members,
      name: request.sender.fullName + " & " + request.receiver.fullName,
      avatar: request.sender.avatar
    }),
    request.deleteOne(),
  ]);
  emitEvent(req, REFETCH_CHATS, members);

  return res
    .status(200)
    .json(
      new ApiResponse(200, request.sender, "Request accepted successfully")
    );
});

export { sendRequest, recieveRequest, acceptRequest };
