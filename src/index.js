import dotenv from "dotenv"
import connectDB from "./db/index.js";
import {server } from "./app.js";

dotenv.config({
    path: './.env'
})


connectDB()
.then(() => {
    server.listen(process.env.PORT, () => {
        console.log(`Server is running at port:  ${process.env.PORT}`)
    })
    server.on("error", (error) => {
        console.log("ERRR: ", error);
        throw error
     })
})
.catch((err) => {
    console.log("Mongodb connection faild !!!",err)
})


