import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();


app.use(
    cors({
      origin: process.env.CORS_ORIGIN,
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
   app.use("api/v1/request", requestRouter);

export { app };
