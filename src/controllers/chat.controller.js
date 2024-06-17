import { ApiError } from "../utils/ErrorHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Chat } from "../models/chat.model.js";
import { emitEvent } from "../utils/functionns.js";
import { ALERT, REFETCH_CHATS } from "../constants.js";
import { getOtherUser } from "../utils/helper.js";

const createGroup = asyncHandler(async (req, res) => {
  const { name, members } = req.body;

  if (!Array.isArray(members) || members.length < 2) {
    throw new ApiError(
      400,
      "Group must have at least 3 members, including the creator"
    );
  }
  const uniqueMembers = [...new Set(members)];
  if (uniqueMembers.length !== members.length) {
    throw new ApiError(400, "Duplicate members found in the list");
  }

  // Add the current user to the members list if not already included
  const allMembers = [...new Set([...uniqueMembers, req.user])];
  //    const allMembers =[...members,req.user];

  const group = await Chat.create({
    name,
    groupChat: true,
    creator: req.user,
    members: allMembers,
  });

  emitEvent(req, ALERT, allMembers, `welcome to ${name} group`);
  emitEvent(req, REFETCH_CHATS, members);
  return res
    .status(201)
    .json(new ApiResponse(201, { group }, "Group created successfully"));
});

const myChat = asyncHandler(async (req, res) => {
    const userId = req.user._id;
  const chats = await Chat.find({ members: req.user }).populate(
    "members",
    "fullName avatar"
  );

  const transformedChat = chats.map(({ _id, name, members, groupChat }) => {
    const otherMember = getOtherUser(members, req.user);

    return {
      _id,
      groupChat,
      avatar: groupChat
        ? members.slice(0, 3).map(({ avatar }) => avatar)
        : [otherMember.avatar.url],
      name: groupChat ? name : otherMember.fullName,
      members: members.reduce((prev, curr) => {
        if (curr._id.toString() !== req.user.toString()) {
          prev.push(curr._id);
        }
        return prev;
      }, []),
    };
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { transformedChat },
        "User chats fetched successfully"
      )
    );
});

 const singleGroup = asyncHandler(async (req, res) => {
    const { chatId } = req.params;
    const chat = await Chat.findById(chatId).populate("members", "fullName avatar");

    if (!chat) {
        throw new ApiError(404, "Chat not found");
    }

    if (!chat.members.some(member => member._id.toString() === req.user._id.toString())) {
        throw new ApiError(403, "You are not a member of this chat");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, { chat }, "Chat fetched successfully"));
});

export { createGroup, myChat, singleGroup };
