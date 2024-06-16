import  mongoose,{ Schema } from "mongoose";

 const UserSchema = new Schema({
    username:{
        type: String,
        required: true,
        unique: true,
         lowercase: true,
         trim: true,
          index: true
     },
     email:{
        type: String,
        required: true,
        unique: true,
         lowercase: true,
         trim: true,     
     },
     fullName:{
        type: String,
        required: true,
         trim: true,
          index: true
     },
      password:{
        type: String,
        required: true,
            select: false
      },
      avatar:{
        type: String, // cloudinary url
        required: true,
     },
 },{timestamps:true});


export const User = mongoose.model("User", UserSchema);