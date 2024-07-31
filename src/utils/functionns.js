import { getSockets } from "./helper.js";

const emitEvent = (req, event, users,data) => {
     let io = req.app.get("io");
     const usersSocket = getSockets(users);
     io.to(usersSocket).emit(event,data);
}

export {emitEvent}