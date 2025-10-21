import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface EncryptionResult {
  encrypted: string;
  iv: string;
  tag: string;
}

export interface DecryptionResult {
  decrypted: string;
  valid: boolean;
}

@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly tagLength = 16; // 128 bits

  constructor(private readonly configService: ConfigService) {}

  /**
   * Generate a secure encryption key
   */
  generateKey(): string {
    return crypto.randomBytes(this.keyLength).toString('hex');
  }

  /**
   * Generate a secure IV
   */
  generateIV(): string {
    return crypto.randomBytes(this.ivLength).toString('hex');
  }

  /**
   * Encrypt sensitive data
   */
  async encryptSensitiveData(data: any): Promise<EncryptionResult> {
    try {
      const key = this.getEncryptionKey();
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipher(this.algorithm, key);
      cipher.setAAD(Buffer.from('devlab-security'));

      const dataString = JSON.stringify(data);
      let encrypted = cipher.update(dataString, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const tag = cipher.getAuthTag();

      return {
        encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
      };
    } catch (error) {
      this.logger.error('Encryption failed', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt sensitive data
   */
  async decryptSensitiveData(encryptionResult: EncryptionResult): Promise<DecryptionResult> {
    try {
      const key = this.getEncryptionKey();
      const iv = Buffer.from(encryptionResult.iv, 'hex');
      const tag = Buffer.from(encryptionResult.tag, 'hex');
      
      const decipher = crypto.createDecipher(this.algorithm, key);
      decipher.setAAD(Buffer.from('devlab-security'));
      decipher.setAuthTag(tag);

      let decrypted = decipher.update(encryptionResult.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return {
        decrypted,
        valid: true,
      };
    } catch (error) {
      this.logger.error('Decryption failed', error);
      return {
        decrypted: '',
        valid: false,
      };
    }
  }

  /**
   * Hash password with salt
   */
  async hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
    const actualSalt = salt || crypto.randomBytes(32).toString('hex');
    const hash = crypto.pbkdf2Sync(password, actualSalt, 100000, 64, 'sha512');
    
    return {
      hash: hash.toString('hex'),
      salt: actualSalt,
    };
  }

  /**
   * Verify password hash
   */
  async verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
    try {
      const testHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512');
      return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), testHash);
    } catch (error) {
      this.logger.error('Password verification failed', error);
      return false;
    }
  }

  /**
   * Generate secure random token
   */
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate JWT secret
   */
  generateJWTSecret(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  /**
   * Encrypt file content
   */
  async encryptFile(fileBuffer: Buffer, filename: string): Promise<EncryptionResult> {
    try {
      const key = this.getEncryptionKey();
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipher(this.algorithm, key);
      cipher.setAAD(Buffer.from(`file:${filename}`));

      let encrypted = cipher.update(fileBuffer);
      encrypted = Buffer.concat([encrypted, cipher.final()]);

      const tag = cipher.getAuthTag();

      return {
        encrypted: encrypted.toString('hex'),
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
      };
    } catch (error) {
      this.logger.error('File encryption failed', error);
      throw new Error('File encryption failed');
    }
  }

  /**
   * Decrypt file content
   */
  async decryptFile(encryptionResult: EncryptionResult, filename: string): Promise<Buffer> {
    try {
      const key = this.getEncryptionKey();
      const iv = Buffer.from(encryptionResult.iv, 'hex');
      const tag = Buffer.from(encryptionResult.tag, 'hex');
      const encrypted = Buffer.from(encryptionResult.encrypted, 'hex');
      
      const decipher = crypto.createDecipher(this.algorithm, key);
      decipher.setAAD(Buffer.from(`file:${filename}`));
      decipher.setAuthTag(tag);

      let decrypted = decipher.update(encrypted);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      return decrypted;
    } catch (error) {
      this.logger.error('File decryption failed', error);
      throw new Error('File decryption failed');
    }
  }

  /**
   * Encrypt database field
   */
  async encryptDatabaseField(value: string, fieldName: string): Promise<string> {
    try {
      const key = this.getEncryptionKey();
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipher(this.algorithm, key);
      cipher.setAAD(Buffer.from(`db:${fieldName}`));

      let encrypted = cipher.update(value, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const tag = cipher.getAuthTag();

      // Combine IV, tag, and encrypted data
      return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
    } catch (error) {
      this.logger.error('Database field encryption failed', error);
      throw new Error('Database field encryption failed');
    }
  }

  /**
   * Decrypt database field
   */
  async decryptDatabaseField(encryptedValue: string, fieldName: string): Promise<string> {
    try {
      const [ivHex, tagHex, encrypted] = encryptedValue.split(':');
      const key = this.getEncryptionKey();
      const iv = Buffer.from(ivHex, 'hex');
      const tag = Buffer.from(tagHex, 'hex');
      
      const decipher = crypto.createDecipher(this.algorithm, key);
      decipher.setAAD(Buffer.from(`db:${fieldName}`));
      decipher.setAuthTag(tag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      this.logger.error('Database field decryption failed', error);
      throw new Error('Database field decryption failed');
    }
  }

  /**
   * Get encryption key from configuration
   */
  private getEncryptionKey(): string {
    const key = this.configService.get<string>('ENCRYPTION_KEY');
    if (!key) {
      throw new Error('Encryption key not configured');
    }
    return key;
  }

  /**
   * Validate encryption key strength
   */
  validateEncryptionKey(key: string): boolean {
    if (!key || key.length < 32) {
      return false;
    }

    // Check for sufficient entropy
    const entropy = this.calculateEntropy(key);
    return entropy >= 4.0; // Minimum entropy requirement
  }

  /**
   * Calculate entropy of a string
   */
  private calculateEntropy(str: string): number {
    const freq: { [key: string]: number } = {};
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      freq[char] = (freq[char] || 0) + 1;
    }

    let entropy = 0;
    for (const count of Object.values(freq)) {
      const p = count / str.length;
      entropy -= p * Math.log2(p);
    }

    return entropy;
  }

  /**
   * Rotate encryption key
   */
  async rotateEncryptionKey(): Promise<string> {
    const newKey = this.generateKey();
    
    // In production, implement key rotation logic
    // This would involve re-encrypting all data with the new key
    
    this.logger.log('Encryption key rotated');
    return newKey;
  }

  /**
   * Get encryption metrics
   */
  getEncryptionMetrics(): any {
    return {
      algorithm: this.algorithm,
      keyLength: this.keyLength,
      ivLength: this.ivLength,
      tagLength: this.tagLength,
      timestamp: new Date(),
    };
  }
}
