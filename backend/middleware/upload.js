import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import cloudinary, { profileStorage, incidentStorage } from '../config/cloudinary.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsRoot = path.join(__dirname, '..', 'uploads');

const isCloudinaryConfigured = () => {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  return (
    CLOUDINARY_CLOUD_NAME &&
    CLOUDINARY_API_KEY &&
    CLOUDINARY_API_SECRET &&
    CLOUDINARY_CLOUD_NAME !== 'your_cloud_name' &&
    CLOUDINARY_API_KEY !== 'your_api_key'
  );
};

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

const createLocalStorage = (subfolder) =>
  multer.diskStorage({
    destination: (_req, _file, cb) => {
      const dir = path.join(uploadsRoot, subfolder);
      ensureDir(dir);
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unique}${path.extname(file.originalname)}`);
    },
  });

const mediaFileFilter = (_req, file, cb) => {
  if (file.fieldname === 'photos' && file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else if (file.fieldname === 'videos' && file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type for field ${file.fieldname}`), false);
  }
};

const imageFileFilter = (_req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpg, jpeg, png, webp) are allowed'), false);
  }
};

const useCloudinary = isCloudinaryConfigured();

export const uploadProfilePhoto = multer({
  storage: useCloudinary ? profileStorage : createLocalStorage('profile-photos'),
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single('profilePhoto');

export const uploadIncidentPhotos = multer({
  storage: useCloudinary ? incidentStorage : createLocalStorage('incident-photos'),
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).array('photos', 5);

export const uploadIncidentMedia = multer({
  storage: useCloudinary
    ? multer.memoryStorage()
    : multer.diskStorage({
        destination: (_req, file, cb) => {
          const subfolder = file.fieldname === 'videos' ? 'incident-videos' : 'incident-photos';
          const dir = path.join(uploadsRoot, subfolder);
          ensureDir(dir);
          cb(null, dir);
        },
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${unique}${path.extname(file.originalname)}`);
        },
      }),
  fileFilter: mediaFileFilter,
  limits: { fileSize: 25 * 1024 * 1024 }, // overall max file size 25MB for videos
}).fields([
  { name: 'photos', maxCount: 5 },
  { name: 'videos', maxCount: 2 },
]);

/** Map uploaded file(s) to incident photo subdocuments */
export const mapUploadedPhotos = (files = []) =>
  files.map((file) => ({
    url: useCloudinary ? file.path : `/uploads/incident-photos/${file.filename}`,
    publicId: useCloudinary ? file.filename : file.filename,
    type: 'image',
  }));

/**
 * Upload buffer helper for Cloudinary stream API
 */
const uploadBufferToCloudinary = (fileBuffer, folder, resourceType) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
};

/**
 * Maps multer fields (req.files) into the incident `media` schema array.
 * Supports image and video uploads to Cloudinary or local disk storage.
 */
export const mapUploadedMedia = async (reqFiles = {}) => {
  const mediaList = [];
  const photos = reqFiles.photos || [];
  const videos = reqFiles.videos || [];

  for (const file of photos) {
    if (file.size > 5 * 1024 * 1024) {
      throw new Error(`Image ${file.originalname} exceeds 5MB limit`);
    }
    if (useCloudinary) {
      const res = await uploadBufferToCloudinary(file.buffer, 'sahay-setu/incident-photos', 'image');
      mediaList.push({ url: res.secure_url, publicId: res.public_id, type: 'image' });
    } else {
      mediaList.push({
        url: `/uploads/incident-photos/${file.filename}`,
        publicId: file.filename,
        type: 'image',
      });
    }
  }

  for (const file of videos) {
    if (file.size > 25 * 1024 * 1024) {
      throw new Error(`Video ${file.originalname} exceeds 25MB limit`);
    }
    if (useCloudinary) {
      const res = await uploadBufferToCloudinary(file.buffer, 'sahay-setu/incident-videos', 'video');
      mediaList.push({ url: res.secure_url, publicId: res.public_id, type: 'video' });
    } else {
      mediaList.push({
        url: `/uploads/incident-videos/${file.filename}`,
        publicId: file.filename,
        type: 'video',
      });
    }
  }

  return mediaList;
};

export { uploadsRoot, useCloudinary };
