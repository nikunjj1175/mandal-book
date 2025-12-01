export function buildCloudinaryUrl(idOrUrl) {
  if (!idOrUrl) return '';

  // If it's already a full URL or data URL, return as is
  if (idOrUrl.startsWith('http://') || idOrUrl.startsWith('https://') || idOrUrl.startsWith('data:')) {
    return idOrUrl;
  }

  const explicitBase = process.env.CLOUDINARY_BASE_URL;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

  if (explicitBase) {
    return `${explicitBase.replace(/\/+$/, '')}/${idOrUrl}`;
  }

  if (cloudName) {
    return `https://res.cloudinary.com/${cloudName}/image/upload/${idOrUrl}`;
  }

  // Fallback: return raw value if env is not configured
  return idOrUrl;
}


