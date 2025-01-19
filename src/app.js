import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";
import { createServer } from "http";
import dotenv from "dotenv";
import { Message } from "./models/message.model.js";
import {
  CHAT_JOINED,
  CHAT_LEAVED,
  NEW_MESSAGE,
  NEW_MESSAGE_ALERT,
  ONLINE_USERS,
  START_TYPING,
  STOP_TYPING,
} from "./constants.js";
import { randomUUID } from "crypto";
import { getSockets } from "./utils/helper.js";
import { SocketAuth } from "./middlewares/auth.middleware.js";

const app = express();

dotenv.config({
  path: "./.env",
});

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});
const SocketUserIds = new Map();
const onlineUsers = new Set();

app.set("io", io);

app.use(
  cors({
    origin: process.env.CLIENT_URL,
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

app.use("/api/v1/user", userRouter);
app.use("/api/v1/chat", chatRouter);
app.use("/api/v1/message", messageRouter);
app.use("/api/v1/request", requestRouter);

io.use(SocketAuth);

io.on("connection", (socket) => {
  const user = socket.user;
  SocketUserIds.set(user._id.toString(), socket.id);

  socket.on(NEW_MESSAGE, async ({ chatId, members, message }) => {
    const messageForRealtime = {
      content: message,
      _id: randomUUID(),
      sender: {
        _id: user._id,
        fullName: user.fullName,
        avatar: user.avatar,
      },
      chat: chatId,
      createdAt: new Date().toISOString(),
    };

    const messageForDb = {
      content: message,
      sender: user._id,
      chat: chatId,
    };
    const MembersSockets = getSockets(members);
    console.log("Emitting new message to members:", MembersSockets);

    io.to(MembersSockets).emit(NEW_MESSAGE, {
      chatId,
      message: messageForRealtime,
    });

    io.to(MembersSockets).emit(NEW_MESSAGE_ALERT, { chatId });

    try {
      await Message.create(messageForDb);
    } catch (error) {
      console.error(error);
    }
  });
  socket.on(START_TYPING, ({ members, chatId }) => {
    const membersSockets = getSockets(members);
    socket.to(membersSockets).emit(START_TYPING, { chatId });
  });

  socket.on(STOP_TYPING, ({ members, chatId }) => {
    const membersSockets = getSockets(members);
    socket.to(membersSockets).emit(STOP_TYPING, { chatId });
  });

  socket.on(CHAT_JOINED, ({ userId, members }) => {
    onlineUsers.add(userId.toString());

    const membersSocket = getSockets(members);
    io.to(membersSocket).emit(ONLINE_USERS, Array.from(onlineUsers));
  });

  socket.on(CHAT_LEAVED, ({ userId, members }) => {
    onlineUsers.delete(userId.toString());

    const membersSocket = getSockets(members);
    io.to(membersSocket).emit(ONLINE_USERS, Array.from(onlineUsers));
  });

  socket.on("disconnect", () => {
    SocketUserIds.delete(user._id.toString());
    onlineUsers.delete(user._id.toString());
    socket.broadcast.emit(ONLINE_USERS, Array.from(onlineUsers));
  });
});

export { server, SocketUserIds };
