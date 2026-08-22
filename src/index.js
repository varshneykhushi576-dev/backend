require ('dotenv').config({path:'./env'})


import connectDB from './db/index.js';



connectDB()










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