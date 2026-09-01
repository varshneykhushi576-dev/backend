//require ('dotenv').config({path:'./env'})
import "dotenv/config"
import connectDB from './db/index.js';
import app from "./app.js"




connectDB()
.then(()=>{
    app.listen(3000, '127.0.0.1', () => {
    console.log("server running at the port: 3000");
});
    
})
.catch((err)=>{
   console.log("mongodb is not connected",err);
})










// import express from 'express'
// import { log } from 'node:console';
// const app = express()

// (async ()=>{
//     try{
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_name}
//         `)
//         app.on("error",(error)=>{
//             console.log("err: ",error)
//             throw error
//         })

//         app.listen(process.env.PORT,()=>{
//             console.log(`app is listen at port ${process.env.PORT}`)

//         })
//     } catch(error){
//         console.error("ERROR: ", error)
//         throw err
//     }
// })()