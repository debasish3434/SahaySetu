import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary SDK with credentials from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage engine for profile photos
export const profileStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'sahay-setu/profile-photos',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 500, height: 500, crop: 'fill', gravity: 'face' }],
  },
});

// Storage engine for incident photos (supports multiple files)
export const incidentStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'sahay-setu/incident-photos',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1280, height: 1280, crop: 'limit' }],
  },
});

// Storage engine for incident videos
export const incidentVideoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'sahay-setu/incident-videos',
    resource_type: 'video',
    allowed_formats: ['mp4', 'mov', 'webm'],
  },
});

export default cloudinary;
