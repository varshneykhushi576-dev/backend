import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
// Ensure dotenv is loaded BEFORE cloudinary.config reads process.env

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadoncloudinary = async (localfilepath) => {
    try {
        if (!localfilepath) return null;

        // Upload file to Cloudinary
        const response = await cloudinary.uploader.upload(localfilepath, {
            resource_type: "auto"
        });

        // Delete local temporary file after successful upload
        if (fs.existsSync(localfilepath)) {
            fs.unlinkSync(localfilepath);
        }

        return response;
    } catch (error) {
        console.log("CLOUDINARY UPLOAD ERROR:", error);
        
        // Remove temporary file on failure
        if (localfilepath && fs.existsSync(localfilepath)) {
            fs.unlinkSync(localfilepath);
        }
        return null;
    }
};

export { uploadoncloudinary };