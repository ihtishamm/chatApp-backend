// utils/socketAsyncHandler.js
const socketAsyncHandler = (fn) => {
    return (socket, next) => {
      Promise.resolve(fn(socket, next)).catch((err) => next(err));
    };
  };
  
  export default socketAsyncHandler;
  