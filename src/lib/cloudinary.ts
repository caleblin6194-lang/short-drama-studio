import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export const uploadToCloudinary = async (fileBuffer: Buffer, filename: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'short-drama-uploads',
        resource_type: 'auto',
        public_id: filename.replace(/\.[^.]+$/, ''),
      },
      (error, result) => {
        if (error) reject(error)
        else resolve(result!.secure_url)
      }
    )
    uploadStream.end(fileBuffer)
  })
}

export const deleteFromCloudinary = async (publicId: string) => {
  return cloudinary.uploader.destroy(publicId)
}

export { cloudinary }
