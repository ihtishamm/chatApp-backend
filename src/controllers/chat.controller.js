import { ApiError } from "../utils/ErrorHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Chat } from "../models/chat.model.js";
import { emitEvent } from "../utils/functionns.js";
import {
  ALERT,
  REFETCH_CHATS,
} from "../constants.js";
import { getOtherUser, validateUserIds } from "../utils/helper.js";
import { User } from "../models/user.model.js";
import { Message } from "../models/message.model.js";

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
  const chat = await Chat.findById(chatId).populate(
    "members",
    "fullName avatar"
  );

  if (!chat) {
    throw new ApiError(404, "Chat not found");
  }

  if (
    !chat.members.some(
      (member) => member._id.toString() === req.user._id.toString()
    )
  ) {
    throw new ApiError(403, "You are not a member of this chat");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { chat }, "Chat fetched successfully"));
});

const addMember = asyncHandler(async (req, res) => {
  const { chatId, members } = req.body;
  const chat = await Chat.findById(chatId);
  if (!chat) {
    throw new ApiError(404, "Chat not found");
  }
  if (!chat.groupChat) {
    throw new ApiError(400, "This chat is not a group chat");
  }

  if (!members || members.length < 1) {
    throw new ApiError(400, "Please Provide the members");
  }
  if (chat.creator.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to add members to this group");
  }

  //   const allMembersPromise = members.map((i) => User.findById(i).select("fullName"));

  //   const allMembers = await Promise.all(allMembersPromise);

  const allMembers = await validateUserIds(members);

  const uniqueMembers = allMembers
    .filter((i) => !chat.members.includes(i._id.toString()))
    .map((i) => i._id);
  chat.members.push(...uniqueMembers);

  if (chat.members.length > 100) {
    throw new ApiError(400, "Group members cannot exceed 100");
  }

  await chat.save();

  const allUsersName = allMembers.map((i) => i.fullName).join(",");
  emitEvent(
    req,
    ALERT,
    chat.members,
    `${allUsersName} have been added to ${chat.name} group by ${req.user.name}`
  );
  emitEvent(req, REFETCH_CHATS, chat.members);

  return res
    .status(200)
    .json(new ApiResponse(200, { allMembers }, "Members added successfully"));
});

const removeMember = asyncHandler(async (req, res) => {
  const { chatId, userId } = req.body;

  const [chat, removedUser] = await Promise.all([
    Chat.findById(chatId),
    User.findById(userId).select("fullName"),
  ]);

  if (!chat) {
    throw new ApiError(404, "Chat not found");
  }
  if (!chat.groupChat) {
    throw new ApiError(400, "This chat is not a group chat");
  }
  if (chat.creator.toString() !== req.user._id.toString()) {
    throw new ApiError(
      403,
      "You are not allowed to remove members to this group"
    );
  }

  if (chat.members.length <= 3) {
    throw new ApiError(400, "Group must have at least 3 members");
  }
  chat.members = chat.members.filter((i) => i.toString() !== userId);

  await chat.save();
  emitEvent(
    req,
    ALERT,
    chat.members,
    `${removedUser.fullName} have been removed from ${chat.name} group by ${req.user.name}`
  );
  emitEvent(req, REFETCH_CHATS, chat.members);

  return res
    .status(200)
    .json(new ApiResponse(200, { removedUser }, "Member removed successfully"));
});

const leaveGroup = asyncHandler(async (req, res) => {
  const chatId = req.params.id;

  const chat = await Chat.findById(chatId);
  if (!chat) {
    throw new ApiError(404, "Chat not found");
  }
  if (!chat.groupChat) {
    throw new ApiError(400, "This chat is not a group chat");
  }

  const remaningMembers = chat.members.filter(
    (i) => i.toString() !== req.user._id.toString()
  );

  if (
    chat.creator.toString() === req.user._id.toString() &&
    chat.members.length > 0
  ) {
    chat.creator = remaningMembers[0];
  }

  // If no more members, delete the chat
  if (chat.members.length === 0) {
    await chat.remove();
    return res
      .status(200)
      .json(
        new ApiResponse(200, null, "Chat deleted as it has no members left")
      );
  }
  chat.members = remaningMembers;

  await chat.save();
  emitEvent(
    req,
    "ALERT",
    chat.members,
    `${req.user.fullName} has left the ${chat.name} group`
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        req.user.fullName,
        "You have left the group successfully"
      )
    );
});



export {
  createGroup,
  myChat,
  singleGroup,
  addMember,
  removeMember,
  leaveGroup,
};
