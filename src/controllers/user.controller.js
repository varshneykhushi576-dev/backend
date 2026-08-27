import { asyncHandler } from "../utils/asynchandler.js";
import {APIerror} from "../utils/APIerror.js";
import {User} from "../models/user.model.js"
import {uploadoncloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"


const registeruser = asyncHandler(async(req,res)=>{
    //get user details from frontend
    // validation - not empty
    //check if user already exists- username,email
    //check for images,check fr avatar
    //upload them on cloudnary - avatar
    //create user object ,entry in db
    //remove password and refresh token field from response
    //check for user creation
    //return res


    const {username, fullName, email, password} = req.body
    console.log("email:", email);

    if(
        [fullName ,email, username, password].some((field)=>
            field?.trim() === "")
    ) {
        throw new  APIerror (400, "all fields  are required")
    }

    const existeduser  =  await User.findOne({
        $or: [{username},{email}]
    })

    if(existeduser){
        throw new APIerror(409,"user with email and username already exists")
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    if(!avatarLocalPath){
        throw new APIerror(400,"avatar is required")
    }

   const avatar =  await uploadoncloudinary(avatarLocalPath)
   const coverImage = await uploadoncloudinary(coverImageLocalPath)

   if(!avatar){
         throw new APIerror(400,"avatar is required")
   }

   const user = await User.create({
    fullName,
    email,
    password,
    username: username.toLowerCase(),
    avatar: avatar.url,
    coverImage: coverImage?.url || ""

   })

   const createuser = await User.findById(user._id).select(
    "-password  -refreshToken"
 )

 if(!createuser){
    throw new APIerror(500, "tere toh lag gye ")
 }

 return res.status(201).json(
    new ApiResponse(200,createuser,"user registered successfully")
 )

})

export {registeruser}