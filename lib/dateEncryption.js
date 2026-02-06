const crypto = require('crypto');

// Encryption key - should be stored in environment variable
const ENCRYPTION_KEY = process.env.DATE_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Get encryption key as buffer
 */
function getKey() {
  // If key is hex string, convert to buffer, otherwise use directly
  if (typeof ENCRYPTION_KEY === 'string' && ENCRYPTION_KEY.length === 64) {
    return Buffer.from(ENCRYPTION_KEY, 'hex');
  }
  // Generate key from string using SHA-256
  return crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
}

/**
 * Encrypt a date string
 * @param {string} dateString - Date string to encrypt (ISO format)
 * @returns {string} Encrypted date string
 */
function encryptDate(dateString) {
  if (!dateString || typeof dateString !== 'string') {
    return dateString;
  }

  try {
    const key = getKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(dateString, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    // Combine IV, authTag, and encrypted data
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Date encryption error:', error);
    return dateString; // Return original if encryption fails
  }
}

/**
 * Decrypt a date string
 * @param {string} encryptedDate - Encrypted date string
 * @returns {string} Decrypted date string (ISO format)
 */
function decryptDate(encryptedDate) {
  if (!encryptedDate || typeof encryptedDate !== 'string') {
    return encryptedDate;
  }

  // Check if it's already decrypted (doesn't contain colons in the encrypted format)
  if (!encryptedDate.includes(':') || encryptedDate.split(':').length !== 3) {
    return encryptedDate;
  }

  try {
    const parts = encryptedDate.split(':');
    if (parts.length !== 3) {
      return encryptedDate;
    }

    const key = getKey();
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Date decryption error:', error);
    return encryptedDate; // Return original if decryption fails
  }
}

/**
 * Check if a value looks like a date string
 */
function isDateString(value) {
  if (typeof value !== 'string') return false;
  
  // Check for ISO date format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)
  const dateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
  if (dateRegex.test(value)) {
    return !isNaN(Date.parse(value));
  }
  
  return false;
}

/**
 * Recursively encrypt all date fields in an object
 * @param {any} obj - Object to process
 * @returns {any} Object with encrypted dates
 */
function encryptDatesInObject(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => encryptDatesInObject(item));
  }

  if (typeof obj === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      // Check if key suggests it's a date field
      const isDateField = /date|Date|createdAt|updatedAt|timestamp|Timestamp/i.test(key);
      
      if (isDateField && isDateString(value)) {
        result[key] = encryptDate(value);
      } else if (typeof value === 'object') {
        result[key] = encryptDatesInObject(value);
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  return obj;
}

/**
 * Recursively decrypt all date fields in an object
 * @param {any} obj - Object to process
 * @returns {any} Object with decrypted dates
 */
function decryptDatesInObject(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => decryptDatesInObject(item));
  }

  if (typeof obj === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      // Check if key suggests it's a date field
      const isDateField = /date|Date|createdAt|updatedAt|timestamp|Timestamp/i.test(key);
      
      if (isDateField && typeof value === 'string' && value.includes(':')) {
        // Try to decrypt
        const decrypted = decryptDate(value);
        result[key] = decrypted;
      } else if (typeof value === 'object') {
        result[key] = decryptDatesInObject(value);
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  return obj;
}

module.exports = {
  encryptDate,
  decryptDate,
  encryptDatesInObject,
  decryptDatesInObject,
  isDateString,
};
