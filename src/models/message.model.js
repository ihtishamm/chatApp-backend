import  mongoose,{ Schema, Types } from "mongoose";

const AttachmentSchema = new Schema({
    url: {
      type: String,
      required: true,
    },
    filename: {
      type: String,
      required: true,
    },
  });
  

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
        attachments:[AttachmentSchema]
    
     

 },{timestamps:true});


export const Message = mongoose.model("Message", MessageSchema);