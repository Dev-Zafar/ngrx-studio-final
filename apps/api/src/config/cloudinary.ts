import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export { cloudinary }

export async function uploadToCloudinary(
  filePath: string,
  folder: string,
  resourceType: 'image' | 'video' | 'raw' = 'image'
): Promise<{ url: string; publicId: string }> {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: `ngrx-studio/${folder}`,
    resource_type: resourceType,
    transformation: resourceType === 'image'
      ? [{ quality: 'auto', fetch_format: 'auto' }]
      : undefined,
  })
  return { url: result.secure_url, publicId: result.public_id }
}

export async function deleteFromCloudinary(publicId: string, resourceType: 'image' | 'video' = 'image') {
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
}
