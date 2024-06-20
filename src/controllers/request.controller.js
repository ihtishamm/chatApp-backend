import { ApiError } from "../utils/ErrorHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const sendRequest = asyncHandler(async (req, res) => { 
    res.send("Request sent");
});

export { sendRequest };