/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['res.cloudinary.com'],
  },
  experimental: {
    // Ensure Tesseract.js core/worker/WASM files are bundled for serverless functions
    outputFileTracingIncludes: {
      '/pages/api/contribution/upload-slip': [
        './node_modules/tesseract.js-core/**/*',
        './node_modules/tesseract.js/dist/worker.min.js',
      ],
      '/pages/api/loan/pay': [
        './node_modules/tesseract.js-core/**/*',
        './node_modules/tesseract.js/dist/worker.min.js',
      ],
      '/pages/api/user/upload-documents': [
        './node_modules/tesseract.js-core/**/*',
        './node_modules/tesseract.js/dist/worker.min.js',
      ],
    },
  },
};

module.exports = nextConfig;


