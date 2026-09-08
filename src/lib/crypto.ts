import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const VERSION_PREFIX = 'v1';

function getFieldEncryptionKey(): Buffer {
  const keyBase64 = process.env.FIELD_ENCRYPTION_KEY;
  if (!keyBase64) throw new Error('FIELD_ENCRYPTION_KEY is not set');
  const key = Buffer.from(keyBase64, 'base64');
  if (key.length !== 32) throw new Error('FIELD_ENCRYPTION_KEY must be exactly 32 bytes when decoded');
  return key;
}

function getSearchHmacKey(): Buffer {
  const keyBase64 = process.env.SEARCH_HMAC_KEY;
  if (!keyBase64) throw new Error('SEARCH_HMAC_KEY is not set');
  const key = Buffer.from(keyBase64, 'base64');
  if (key.length !== 32) throw new Error('SEARCH_HMAC_KEY must be exactly 32 bytes when decoded');
  return key;
}

export function generateHmac(plaintext: string): string {
  const hmac = crypto.createHmac('sha256', getSearchHmacKey());
  hmac.update(plaintext);
  return hmac.digest('base64');
}

/**
 * Encrypts a plaintext string.
 * @param plaintext The text to encrypt
 * @param queryable If true, adds an HMAC for exact-match querying
 * @returns Formatted string: `v1:<HMAC_OR_EMPTY>:<IV>:<CIPHERTEXT>:<AUTH_TAG>`
 */
export function encrypt(plaintext: string, queryable: boolean = false): string {
  if (plaintext === null || plaintext === undefined) return plaintext;
  
  const iv = crypto.randomBytes(12); // 96-bit IV is standard for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, getFieldEncryptionKey(), iv);
  
  let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
  ciphertext += cipher.final('base64');
  const authTag = cipher.getAuthTag().toString('base64');
  
  const hmacSection = queryable ? generateHmac(plaintext) : '';
  
  return `${VERSION_PREFIX}:${hmacSection}:${iv.toString('base64')}:${ciphertext}:${authTag}`;
}

/**
 * Decrypts an encrypted string if it follows the known format.
 * Returns the original string if it doesn't match the encrypted format (for backward compatibility during migration).
 */
export function decrypt(encryptedValue: string): string {
  if (!encryptedValue || typeof encryptedValue !== 'string') return encryptedValue;
  if (!encryptedValue.startsWith(`${VERSION_PREFIX}:`)) {
    // Return as-is if not encrypted with the expected prefix
    return encryptedValue;
  }

  const parts = encryptedValue.split(':');
  if (parts.length !== 5) {
    throw new Error('Invalid encrypted format');
  }

  const [, , ivBase64, ciphertextBase64, authTagBase64] = parts;
  
  const iv = Buffer.from(ivBase64, 'base64');
  const authTag = Buffer.from(authTagBase64, 'base64');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, getFieldEncryptionKey(), iv);
  decipher.setAuthTag(authTag);
  
  let plaintext = decipher.update(ciphertextBase64, 'base64', 'utf8');
  try {
    plaintext += decipher.final('utf8');
  } catch (err) {
    throw new Error('Decryption failed. Authentication tag mismatch or wrong key.');
  }
  
  return plaintext;
}
