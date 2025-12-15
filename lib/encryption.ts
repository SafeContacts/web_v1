// lib/encryption.ts
// Encryption utilities for sensitive contact data
import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const TAG_POSITION = SALT_LENGTH + IV_LENGTH;
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH;

// Get encryption key from environment or use a default (for development only)
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY || 'default-dev-key-32-chars-long!!';
  if (key.length < 32) {
    throw new Error('ENCRYPTION_KEY must be at least 32 characters long');
  }
  return crypto.scryptSync(key, 'salt', 32);
}

/**
 * Encrypt sensitive data (phone numbers, emails, addresses, notes)
 */
export function encrypt(text: string): string {
  if (!text) return text;
  
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  // Combine salt + iv + tag + encrypted
  return salt.toString('hex') + iv.toString('hex') + tag.toString('hex') + encrypted;
}

/**
 * Decrypt sensitive data
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return encryptedText;
  
  // Check if already decrypted (plain text)
  if (!encryptedText.match(/^[0-9a-f]+$/i) || encryptedText.length < ENCRYPTED_POSITION) {
    return encryptedText; // Assume it's already plain text
  }
  
  try {
    const key = getEncryptionKey();
    const salt = Buffer.from(encryptedText.slice(0, SALT_LENGTH * 2), 'hex');
    const iv = Buffer.from(encryptedText.slice(SALT_LENGTH * 2, TAG_POSITION * 2), 'hex');
    const tag = Buffer.from(encryptedText.slice(TAG_POSITION * 2, ENCRYPTED_POSITION * 2), 'hex');
    const encrypted = encryptedText.slice(ENCRYPTED_POSITION * 2);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (err) {
    console.error('Decryption error:', err);
    return encryptedText; // Return as-is if decryption fails
  }
}

/**
 * Encrypt an array of objects (e.g., phones, emails)
 */
export function encryptArray(items: any[]): any[] {
  if (!Array.isArray(items)) return items;
  return items.map(item => {
    if (typeof item === 'object' && item.value) {
      return {
        ...item,
        value: encrypt(item.value),
      };
    }
    return item;
  });
}

/**
 * Decrypt an array of objects
 */
export function decryptArray(items: any[]): any[] {
  if (!Array.isArray(items)) return items;
  return items.map(item => {
    if (typeof item === 'object' && item.value) {
      return {
        ...item,
        value: decrypt(item.value),
      };
    }
    return item;
  });
}

/**
 * Encrypt contact data before saving
 */
export function encryptContactData(contact: any): any {
  return {
    ...contact,
    phones: encryptArray(contact.phones || []),
    emails: encryptArray(contact.emails || []),
    addresses: (contact.addresses || []).map((addr: string) => encrypt(addr)),
    notes: contact.notes ? encrypt(contact.notes) : '',
  };
}

/**
 * Decrypt contact data after loading
 */
export function decryptContactData(contact: any): any {
  return {
    ...contact,
    phones: decryptArray(contact.phones || []),
    emails: decryptArray(contact.emails || []),
    addresses: (contact.addresses || []).map((addr: string) => decrypt(addr)),
    notes: contact.notes ? decrypt(contact.notes) : '',
  };
}

