import  mongoose,{ Schema, Types } from "mongoose";

 const ChatSchema = new Schema({
    name:{
        type: String,
        required: true,
     },
     groupChat:{
        type: Boolean,
        default: false,  
     },
     creator:{
        type:Types.ObjectId,
        ref:"User",
        index:true
     },
      members:{
        type:[
            {
            type:Types.ObjectId,
            ref:"User",
        }
    ],
     index:true
      },
 },{timestamps:true});


export const Chat = mongoose.model("Chat", ChatSchema);