/**
 * Secure Storage Utility
 *
 * Provides encrypted storage for sensitive data like API keys.
 * Uses the Web Crypto API for AES-GCM encryption.
 */

export class SecureStorage {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;
  private static readonly IV_LENGTH = 12;
  private static readonly SALT_LENGTH = 16;
  private static readonly ITERATIONS = 100000;

  /**
   * Derives an encryption key from a password and salt
   */
  private static async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: this.ITERATIONS,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: this.ALGORITHM, length: this.KEY_LENGTH },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Generates a cryptographically secure random string
   */
  private static generateRandomString(length: number): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Encrypts data and stores it in localStorage
   */
  static async setSecureItem(key: string, value: string): Promise<void> {
    try {
      // Generate a unique salt for this encryption
      const salt = crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));
      const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));

      // Create a semi-persistent password from device fingerprint
      const password = this.createDevicePassword();

      // Derive encryption key
      const encryptionKey = await this.deriveKey(password, salt);

      // Encrypt the data
      const encoder = new TextEncoder();
      const data = encoder.encode(value);

      const encrypted = await crypto.subtle.encrypt(
        { name: this.ALGORITHM, iv },
        encryptionKey,
        data
      );

      // Combine salt + iv + encrypted data for storage
      const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
      combined.set(salt, 0);
      combined.set(iv, salt.length);
      combined.set(new Uint8Array(encrypted), salt.length + iv.length);

      // Store as base64 string
      const base64Combined = btoa(String.fromCharCode(...combined));
      localStorage.setItem(`secure_${key}`, base64Combined);

    } catch (error) {
      console.error('Error storing secure item:', error);
      // Fallback to regular storage if encryption fails
      localStorage.setItem(key, value);
    }
  }

  /**
   * Retrieves and decrypts data from localStorage
   */
  static async getSecureItem(key: string): Promise<string | null> {
    try {
      const stored = localStorage.getItem(`secure_${key}`);
      if (!stored) return null;

      // Decode from base64
      const combined = new Uint8Array(
        atob(stored).split('').map(char => char.charCodeAt(0))
      );

      // Extract salt, iv, and encrypted data
      const salt = combined.slice(0, this.SALT_LENGTH);
      const iv = combined.slice(this.SALT_LENGTH, this.SALT_LENGTH + this.IV_LENGTH);
      const encrypted = combined.slice(this.SALT_LENGTH + this.IV_LENGTH);

      // Derive the same encryption key
      const password = this.createDevicePassword();
      const encryptionKey = await this.deriveKey(password, salt);

      // Decrypt the data
      const decrypted = await crypto.subtle.decrypt(
        { name: this.ALGORITHM, iv },
        encryptionKey,
        encrypted
      );

      const decoder = new TextDecoder();
      return decoder.decode(decrypted);

    } catch (error) {
      console.error('Error retrieving secure item:', error);
      // Try fallback to regular storage
      return localStorage.getItem(key);
    }
  }

  /**
   * Removes secure item from storage
   */
  static removeSecureItem(key: string): void {
    localStorage.removeItem(`secure_${key}`);
    localStorage.removeItem(key); // Also remove fallback
  }

  /**
   * Creates a device-specific password using available browser attributes
   */
  private static createDevicePassword(): string {
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      // Add more entropy factors
      (navigator.hardwareConcurrency || 'unknown'),
      (navigator.deviceMemory || 'unknown')
    ].join('|');

    return btoa(fingerprint).substring(0, 32);
  }

  /**
   * Checks if the browser supports the required crypto APIs
   */
  static isSupported(): boolean {
    return 'crypto' in window &&
           'subtle' in crypto &&
           crypto.subtle !== null &&
           typeof TextEncoder !== 'undefined' &&
           typeof TextDecoder !== 'undefined';
  }

  /**
   * Migrates existing plaintext values to encrypted storage
   */
  static async migrateToSecure(plainKey: string, secureKey: string): Promise<void> {
    try {
      const existingValue = localStorage.getItem(plainKey);
      if (existingValue) {
        await this.setSecureItem(secureKey, existingValue);
        localStorage.removeItem(plainKey);
      }
    } catch (error) {
      console.error('Error migrating to secure storage:', error);
    }
  }
}