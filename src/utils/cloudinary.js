import { v2 as cloudinary } from "cloudinary";
import fs from 'fs';




cloudinary.config({
  cloud_name: process.env.CLOUDINRY_CLOUD_NAME,
  api_key: process.env.CLOUDINRY_API_KEY,
  api_secret: process.env.CLOUDINRY_API_SECRET, // Click 'View API Keys' above to copy your API secret
});


const uploadoncloudinary = async(localfilepath)=>{
    try{
        if(!localfilepath) return null
        //upload file on cloudinary
        const response= await cloudinary.uploader.upload(localfilepath,{
            resource_type: "auto"
        })
        //file successfulliy uploaded
        console.log("file uploaded on cloudinary", response.url);
        return response;
    }catch(error){
        fs.unlinkSync(localfilepath);
        return null;
    }

}

export {uploadoncloudinary}