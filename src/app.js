import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";
import { createServer } from "http";
import { Message } from "./models/message.model.js";
const app = express();

 const  server = createServer(app);
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials:true
    },
  });


app.use(
    cors({
      origin: 'http://localhost:5173',
      credentials: true,
    })
  );

  app.use(
    express.json({
      limit: "16kb",
    })
  );
  
  app.use(express.urlencoded({ extended: true, limit: "16kb" }));
  
  app.use(express.static("public"));
  app.use(cookieParser());


import userRouter from "./routes/user.route.js";
import chatRouter from "./routes/chat.route.js";
import messageRouter from "./routes/message.route.js";
import requestRouter from "./routes/request.route.js";
import { NEW_MESSAGE, NEW_MESSAGE_ALERT } from "./constants.js";
import { randomUUID } from "crypto";
import { getSockets } from "./utils/helper.js";
import { SocketAuth } from "./middlewares/auth.middleware.js";

 
   app.use("/api/v1/user", userRouter);
   app.use("/api/v1/chat", chatRouter);
   app.use("/api/v1/message", messageRouter);
   app.use("/api/v1/request", requestRouter);

    const SocketUserIds = new Map();



   io.use(SocketAuth);
 
  
    io.on("connection", (socket) => {
      
      const user = {
        _id: "60f3b3b3b3b3b3b3b3b3b3b3",
        name: "Shami",
        avatar: "https://www.gravatar.com/avatar/205e460b479e2e5b48aec07710c08d50",
       };
       console.log("socket user",SocketAuth.user)
      console.log("a user connected", socket.id);
      SocketUserIds.set(user._id.toString(), socket.id);


        socket.on(NEW_MESSAGE, async ({chatId, members, message}) => {

             const messageForRealtime = {
              content:message,
              _id:randomUUID(),
              sender:{
                _id:user._id,
                fullName:user.name,
                avatar: user.avatar
              },
              chat:chatId,
              createdAt: new Date().toISOString()
             }

              const messageForDb = {
                content:message,
                sender:user._id,
                chat:chatId
              }
  
                const MembersSockets = getSockets(members);
                io.to(MembersSockets).emit(NEW_MESSAGE,{
                  chatId, message: messageForRealtime
                });
                io.to(MembersSockets).emit(NEW_MESSAGE_ALERT,{chatId})



           try {
             await Message.create(messageForDb);
            
           } catch (error) {
             console.error(error);
            
           }
        });






      socket.on("disconnect", () => {
        console.log("user disconnected");
        SocketUserIds.delete(user._id.toString())
      });
    } );


   

export { server };
