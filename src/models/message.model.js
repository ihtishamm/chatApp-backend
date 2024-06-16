import  mongoose,{ Schema, Types } from "mongoose";

 const MessageSchema = new Schema({
    
     sender: {
            type: Types.ObjectId,
            ref:"User",
            required: true,
        },
        chat:{
            type: Types.ObjectId,
            ref:"Chat",
            required: true,
        },
        content:{
            type: String,
            required: true,
        },
        attachments:{
            type: String,
            required: false
        }
    
     

 },{timestamps:true});


export const Message = mongoose.model("Message", MessageSchema);