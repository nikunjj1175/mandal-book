const DEFAULT_METHODS = 'GET,POST,PUT,PATCH,DELETE,OPTIONS';
const DEFAULT_HEADERS = 'Content-Type, Authorization, X-Requested-With, Accept';

const parseOrigins = () => {
  const envOrigins = process.env.CORS_ORIGIN || process.env.NEXT_PUBLIC_CORS_ORIGIN;
  if (!envOrigins) return ['*'];
  return envOrigins.split(',').map((origin) => origin.trim()).filter(Boolean);
};

const allowedOrigins = parseOrigins();

function getAllowedOrigin(requestOrigin) {
  if (!requestOrigin) return allowedOrigins.includes('*') ? '*' : allowedOrigins[0];
  if (allowedOrigins.includes('*')) return requestOrigin;
  return allowedOrigins.includes(requestOrigin) ? requestOrigin : allowedOrigins[0];
}

async function applyCors(req, res) {
  const requestOrigin = req.headers.origin;
  const allowOrigin = getAllowedOrigin(requestOrigin);

  res.setHeader('Access-Control-Allow-Origin', allowOrigin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', process.env.CORS_METHODS || DEFAULT_METHODS);
  res.setHeader('Access-Control-Allow-Headers', process.env.CORS_HEADERS || DEFAULT_HEADERS);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }

  return false;
}

module.exports = applyCors;

