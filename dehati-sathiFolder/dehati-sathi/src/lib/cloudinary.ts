import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default async function uploadOnCloudinary(file: File): Promise<string | null> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return await new Promise<string | null>((resolve) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "groceries",
          resource_type: "auto",
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary Error:", error);
            return resolve(null);
          }
          resolve(result?.secure_url || null);
        }
      );

      // Use streamifier to pipe the buffer into the upload stream
      streamifier.createReadStream(buffer).pipe(uploadStream);
    });
  } catch (error) {
    console.error("Upload Helper Error:", error);
    return null;
  }
}