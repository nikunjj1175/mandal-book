const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const DEFAULT_OPTIONS = {
  resource_type: 'image',
  format: 'jpg',
  quality: 'auto:good',
  fetch_format: 'auto',
  width: 1920,
  height: 1920,
  crop: 'limit',
};

function dataUrlToBuffer(dataUrl) {
  const base64String = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
  return Buffer.from(base64String, 'base64');
}

function uploadBuffer(buffer, options) {
  return new Promise((resolve, reject) => {
    try {
      const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else if (result) {
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
          });
        } else {
          reject(new Error('Upload failed'));
        }
      });

      const bufferStream = new Readable();
      bufferStream.push(buffer);
      bufferStream.push(null);
      bufferStream.pipe(uploadStream);
    } catch (error) {
      console.error('Cloudinary upload exception:', error);
      reject(error);
    }
  });
}

async function uploadToCloudinary(source, folder, publicId) {
  const options = {
    ...DEFAULT_OPTIONS,
    folder,
    public_id: publicId,
  };

  if (Buffer.isBuffer(source)) {
    return uploadBuffer(source, options);
  }

  if (typeof source === 'string') {
    const trimmed = source.trim();
    if (/^https?:\/\//i.test(trimmed)) {
      const result = await cloudinary.uploader.upload(trimmed, options);
      return {
        secure_url: result.secure_url,
        public_id: result.public_id,
      };
    }

    if (trimmed.startsWith('data:') || /^[A-Za-z0-9+/]+=*$/.test(trimmed)) {
      const buffer = dataUrlToBuffer(trimmed);
      return uploadBuffer(buffer, options);
    }
  }

  throw new Error('Unsupported file type for Cloudinary upload');
}

async function deleteFromCloudinary(publicId) {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
}

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
  cloudinary,
};

