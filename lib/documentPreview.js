/**
 * Detect if a Cloudinary (or other) URL points to a PDF vs an image for preview UI.
 */
export function isDocumentPdf(url) {
  if (!url || typeof url !== 'string') return false;
  const lower = url.toLowerCase();
  if (lower.includes('.pdf')) return true;
  if (lower.includes('/raw/upload/')) return true;
  return false;
}

export function isLikelyImage(url) {
  if (!url || typeof url !== 'string') return false;
  const lower = url.toLowerCase();
  return /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i.test(lower) || lower.includes('/image/upload/');
}
