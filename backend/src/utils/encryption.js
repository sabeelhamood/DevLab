/**
 * Encryption Utilities
 * Data encryption and decryption helpers
 */

import crypto from 'crypto';

const algorithm = 'aes-256-gcm';
const keyLength = 32;
const ivLength = 16;
const saltLength = 64;
const tagLength = 16;

/**
 * Generate encryption key from password
 */
const generateKey = (password, salt) => {
  return crypto.pbkdf2Sync(password, salt, 100000, keyLength, 'sha512');
};

/**
 * Encrypt sensitive data
 */
export const encrypt = (text, password) => {
  try {
    const salt = crypto.randomBytes(saltLength);
    const key = generateKey(password, salt);
    const iv = crypto.randomBytes(ivLength);
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    // Combine salt, iv, tag, and encrypted data
    return salt.toString('hex') + ':' + iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
  } catch (error) {
    throw new Error('Encryption failed: ' + error.message);
  }
};

/**
 * Decrypt sensitive data
 */
export const decrypt = (encryptedData, password) => {
  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 4) {
      throw new Error('Invalid encrypted data format');
    }
    
    const salt = Buffer.from(parts[0], 'hex');
    const iv = Buffer.from(parts[1], 'hex');
    const tag = Buffer.from(parts[2], 'hex');
    const encrypted = parts[3];
    
    const key = generateKey(password, salt);
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error('Decryption failed: ' + error.message);
  }
};

/**
 * Hash data (one-way, for passwords, etc.)
 */
export const hash = (data) => {
  return crypto.createHash('sha256').update(data).digest('hex');
};




