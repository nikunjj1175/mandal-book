const DEFAULT_METHODS = 'GET,POST,PUT,PATCH,DELETE,OPTIONS';
const DEFAULT_HEADERS = 'Content-Type, Authorization, X-Requested-With, Accept';
const DEFAULT_ORIGINS = [
  'http://localhost:3000',
  'https://mandal-book.vercel.app',
  'https://mandal-book-main.vercel.app',
];

function parseOrigins() {
  const envOrigins = process.env.CORS_ORIGIN || process.env.NEXT_PUBLIC_CORS_ORIGIN || '';
  if (!envOrigins.trim()) return [];

  return envOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const allowedOrigins = Array.from(new Set([...parseOrigins(), ...DEFAULT_ORIGINS]));
if (!allowedOrigins.length) {
  allowedOrigins.push('*');
}

function matchesOrigin(pattern, origin) {
  if (!pattern || !origin) return false;
  if (pattern === '*') return true;
  if (pattern === origin) return true;

  if (pattern.includes('*')) {
    const escaped = pattern.replace(/[-/\\^$+?.()|[\]{}]/g, '\\$&').replace(/\*/g, '.*');
    const regex = new RegExp(`^${escaped}$`, 'i');
    return regex.test(origin);
  }

  return false;
}

function resolveAllowedOrigin(requestOrigin) {
  if (!requestOrigin) {
    return allowedOrigins.includes('*') ? '*' : allowedOrigins[0] || '*';
  }

  if (allowedOrigins.some((pattern) => matchesOrigin(pattern, requestOrigin))) {
    return requestOrigin;
  }

  return allowedOrigins.includes('*') ? requestOrigin : null;
}

async function applyCors(req, res) {
  const requestOrigin = req.headers.origin;
  const allowOrigin = resolveAllowedOrigin(requestOrigin);

  if (allowOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowOrigin === '*' ? '*' : allowOrigin);
    res.setHeader('Vary', 'Origin');
    if (allowOrigin !== '*') {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'null');
  }

  res.setHeader('Access-Control-Allow-Methods', process.env.CORS_METHODS || DEFAULT_METHODS);
  res.setHeader('Access-Control-Allow-Headers', process.env.CORS_HEADERS || DEFAULT_HEADERS);

  if (req.method === 'OPTIONS') {
    res.status(allowOrigin ? 200 : 403).end();
    return true;
  }

  if (!allowOrigin) {
    res.status(403).json({
      success: false,
      error: 'Origin not allowed by CORS policy',
    });
    return true;
  }

  return false;
}

module.exports = applyCors;

