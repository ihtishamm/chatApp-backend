import { ApiError } from "../utils/ErrorHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {Chat} from "../models/Chat.js";
import { emitEvent } from "../utils/functionns.js";
import { ALERT, REFETCH_CHATS } from "../constants.js";

const createGroup = asyncHandler(async (req, res) => {
  const { name, members } = req.body;

  if(members.length < 2){
    throw new ApiError(400, "Group must have at least 3 members");
  }

   const allMembers =[...members,req.user];

  const group = await Chat.create({
    name,
    groupChat: true,
    creator: req.user,
    members:allMembers
  });

   emitEvent(req,ALERT,allMembers,`welcome to ${name} group`)
   emitEvent(req,REFETCH_CHATS,members)
  return res
    .status(201)
    .json(new ApiResponse(201, { group }, "Group created successfully"));
}  );

export { createGroup };