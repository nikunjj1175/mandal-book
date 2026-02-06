// Client-side date encryption using Web Crypto API
// This works in the browser environment
// Must be compatible with server-side encryption in dateEncryption.js

const ALGORITHM = 'AES-GCM';
const IV_LENGTH = 16; // 128 bits for GCM (matching server-side)
const KEY_LENGTH = 256;

/**
 * Get encryption key from environment
 * Uses the same key derivation as server-side for compatibility
 */
async function getKey() {
  const keyString = process.env.NEXT_PUBLIC_DATE_ENCRYPTION_KEY;
  
  if (!keyString) {
    throw new Error('NEXT_PUBLIC_DATE_ENCRYPTION_KEY environment variable is not set. Please set it in your .env file.');
  }
  
  // If key is a 64-character hex string (32 bytes), use it directly
  // Otherwise, derive from string using SHA-256 (matching server-side)
  const encoder = new TextEncoder();
  let keyData;
  
  if (keyString.length === 64 && /^[0-9a-fA-F]+$/.test(keyString)) {
    // Hex string - convert to bytes
    keyData = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      keyData[i] = parseInt(keyString.substr(i * 2, 2), 16);
    }
  } else {
    // Derive key from string using SHA-256 (matching server-side)
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(keyString));
    keyData = new Uint8Array(hashBuffer);
  }
  
  // Import as AES-GCM key
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: ALGORITHM },
    false,
    ['encrypt', 'decrypt']
  );

  return key;
}

/**
 * Encrypt a date string
 * @param {string} dateString - Date string to encrypt (ISO format)
 * @returns {Promise<string>} Encrypted date string
 * Format: iv:authTag:encrypted (hex strings, matching server-side)
 */
async function encryptDate(dateString) {
  if (!dateString || typeof dateString !== 'string') {
    return dateString;
  }

  try {
    const key = await getKey();
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const encoder = new TextEncoder();
    const data = encoder.encode(dateString);

    const encrypted = await crypto.subtle.encrypt(
      {
        name: ALGORITHM,
        iv: iv,
      },
      key,
      data
    );

    // Extract auth tag (last 16 bytes in GCM mode)
    const encryptedArray = new Uint8Array(encrypted);
    const authTagLength = 16;
    const authTag = encryptedArray.slice(-authTagLength);
    const ciphertext = encryptedArray.slice(0, -authTagLength);

    // Convert to hex strings and combine (matching server-side format: iv:authTag:encrypted)
    const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
    const authTagHex = Array.from(authTag).map(b => b.toString(16).padStart(2, '0')).join('');
    const encryptedHex = Array.from(ciphertext).map(b => b.toString(16).padStart(2, '0')).join('');

    return `${ivHex}:${authTagHex}:${encryptedHex}`;
  } catch (error) {
    console.error('Date encryption error:', error);
    return dateString; // Return original if encryption fails
  }
}

/**
 * Decrypt a date string
 * @param {string} encryptedDate - Encrypted date string
 * @returns {Promise<string>} Decrypted date string (ISO format)
 * Format: iv:authTag:encrypted (hex strings)
 */
async function decryptDate(encryptedDate) {
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

    const key = await getKey();
    
    // Convert hex strings to Uint8Array
    const iv = new Uint8Array(parts[0].match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    const authTag = new Uint8Array(parts[1].match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    const encrypted = new Uint8Array(parts[2].match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

    // Combine encrypted data with auth tag (GCM requires auth tag at the end)
    const combined = new Uint8Array(encrypted.length + authTag.length);
    combined.set(encrypted, 0);
    combined.set(authTag, encrypted.length);

    const decrypted = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv: iv,
      },
      key,
      combined
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    // If decryption fails, assume it's not encrypted
    return encryptedDate;
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
 * @returns {Promise<any>} Object with encrypted dates
 */
async function encryptDatesInObject(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    const results = await Promise.all(obj.map(item => encryptDatesInObject(item)));
    return results;
  }

  if (typeof obj === 'object') {
    const result = {};
    const entries = Object.entries(obj);
    
    for (const [key, value] of entries) {
      // Check if key suggests it's a date field
      const isDateField = /date|Date|createdAt|updatedAt|timestamp|Timestamp/i.test(key);
      
      if (isDateField && isDateString(value)) {
        result[key] = await encryptDate(value);
      } else if (typeof value === 'object') {
        result[key] = await encryptDatesInObject(value);
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
 * @returns {Promise<any>} Object with decrypted dates
 */
async function decryptDatesInObject(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    const results = await Promise.all(obj.map(item => decryptDatesInObject(item)));
    return results;
  }

  if (typeof obj === 'object') {
    const result = {};
    const entries = Object.entries(obj);
    
    for (const [key, value] of entries) {
      // Check if key suggests it's a date field
      const isDateField = /date|Date|createdAt|updatedAt|timestamp|Timestamp/i.test(key);
      
      if (isDateField && typeof value === 'string' && value.length > 20) {
        // Try to decrypt (encrypted strings are typically longer)
        const decrypted = await decryptDate(value);
        result[key] = decrypted;
      } else if (typeof value === 'object') {
        result[key] = await decryptDatesInObject(value);
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  return obj;
}

export {
  encryptDate,
  decryptDate,
  encryptDatesInObject,
  decryptDatesInObject,
  isDateString,
};
