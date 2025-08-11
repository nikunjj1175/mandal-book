import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export function getUserFolder(userId: string) {
  return `mandal-book/users/${userId}`;
}

export function getProfileFolder(userId: string) {
  return `${getUserFolder(userId)}/profile`;
}

export function getAddressFolder(userId: string) {
  return `${getUserFolder(userId)}/address`;
}

export function getDocumentsFolder(userId: string) {
  return `${getUserFolder(userId)}/documents`;
}

export default cloudinary;