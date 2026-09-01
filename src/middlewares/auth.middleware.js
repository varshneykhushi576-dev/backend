import { User } from "../models/user.model.js";
import { APIerror } from "../utils/APIerror.js";
import { asyncHandler } from "../utils/asynchandler.js";
import jwt from "jsonwebtoken"

export const verifyJWT = asyncHandler(async(req,res,next)=>{
    try{
        const token = req.cookies?.accessToken || req.header
        ("Authorisation")?.replace("Bearer ","")

        if(!token){
            throw new APIerror(401,"unauthorised request" )
        }
       const decodedtoken =  jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
       if(!decodedtoken){
        console.log("FAILING HERE")
       }

      const user = await User.findById(decodedtoken?._id).select("-password -refreshtoken")

      if(!user){
        throw new APIerror(401,"invalid user")
      }

      req.user = user
      next()


    }catch(error){
      console.log(error)
      throw new APIerror(401,error?.message || "invalid access token")
    }
    
})