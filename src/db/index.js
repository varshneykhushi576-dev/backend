import mongoose from "mongoose";
//import { DB_name } from "../constants.js";

const connectDB = async ()=>{
    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}`)
        console.log(`\n MongoDB connected !! DBHOST: ${connectionInstance.connection.host}`);
    }catch(error){
        console.log("Mongodb connection error here:", error);
        process.exit(1)

       
    }
}
export default connectDB