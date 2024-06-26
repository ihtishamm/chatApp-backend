import { User } from "../models/user.model.js";

export const getOtherUser = (members, userId) => {
    return members.find(member => member._id.toString() !== userId.toString())
}

export const validateUserIds = async (userIds) => {
    const validUsers = await User.find({ '_id': { $in: userIds } }, '_id fullName');
    if (validUsers.length !== userIds.length) {
      throw new ApiError(400, "One or more user IDs are invalid");
    }
    return validUsers;
  };