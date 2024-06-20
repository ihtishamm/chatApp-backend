

import { ApiError } from "../utils/ErrorHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Request } from "../models/request.model.js";
import { emitEvent } from "../utils/functionns.js";

const sendRequest = asyncHandler(async (req, res) => { 
    const { reqId } = req.body;

    if (!reqId) {
        throw new ApiError(400, "Receiver Id is required");
    }

    // Check if a request already exists between the sender and receiver
    const existingRequest = await Request.findOne({
        $or: [
            { sender: req.user._id, receiver: reqId },
            { sender: reqId, receiver: req.user._id }
        ]
    });

    if (existingRequest) {
        throw new ApiError(400, "Request already sent");
    }

  
    const request = await Request.create({
        sender: req.user._id,
        receiver: reqId
    });

    
    emitEvent(req, "newRequest", [reqId], "request");

    return res.status(200).json(new ApiResponse(200, request, "Request sent successfully"));
});

export { sendRequest };
