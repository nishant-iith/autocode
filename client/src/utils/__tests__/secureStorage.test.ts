import { SecureStorage } from '../secureStorage';

// Mock crypto API
const mockCrypto = {
  subtle: {
    importKey: jest.fn(),
    deriveKey: jest.fn(),
    encrypt: jest.fn(),
    decrypt: jest.fn(),
  },
  getRandomValues: jest.fn().mockReturnValue(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])),
};

Object.defineProperty(global, 'crypto', {
  value: mockCrypto,
  writable: true,
});

describe('SecureStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('isSupported', () => {
    it('should return true when crypto API is available', () => {
      expect(SecureStorage.isSupported()).toBe(true);
    });

    it('should return false when crypto API is not available', () => {
      Object.defineProperty(global, 'crypto', {
        value: undefined,
        writable: true,
      });
      expect(SecureStorage.isSupported()).toBe(false);
    });
  });

  describe('setSecureItem and getSecureItem', () => {
    beforeEach(() => {
      // Mock successful encryption/decryption
      mockCrypto.subtle.importKey.mockResolvedValue({});
      mockCrypto.subtle.deriveKey.mockResolvedValue({});
      mockCrypto.subtle.encrypt.mockResolvedValue(
        new ArrayBuffer(16)
      );
      mockCrypto.subtle.decrypt.mockResolvedValue(
        new TextEncoder().encode('test-value').buffer
      );
    });

    it('should store and retrieve encrypted data', async () => {
      await SecureStorage.setSecureItem('test-key', 'test-value');

      expect(mockCrypto.subtle.importKey).toHaveBeenCalled();
      expect(mockCrypto.subtle.deriveKey).toHaveBeenCalled();
      expect(mockCrypto.subtle.encrypt).toHaveBeenCalled();

      const result = await SecureStorage.getSecureItem('test-key');
      expect(result).toBe('test-value');
      expect(mockCrypto.subtle.decrypt).toHaveBeenCalled();
    });

    it('should return null for non-existent items', async () => {
      const result = await SecureStorage.getSecureItem('non-existent');
      expect(result).toBeNull();
    });

    it('should fall back to regular storage on encryption error', async () => {
      mockCrypto.subtle.encrypt.mockRejectedValue(new Error('Encryption failed'));

      await SecureStorage.setSecureItem('test-key', 'test-value');
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'secure_test-key',
        expect.any(String)
      );

      // Should still be able to retrieve with fallback
      mockCrypto.subtle.decrypt.mockRejectedValue(new Error('Decryption failed'));
      localStorage.getItem.mockReturnValue('test-value');

      const result = await SecureStorage.getSecureItem('test-key');
      expect(result).toBe('test-value');
    });
  });

  describe('removeSecureItem', () => {
    it('should remove both secure and fallback items', () => {
      localStorage.removeItem = jest.fn();

      SecureStorage.removeSecureItem('test-key');

      expect(localStorage.removeItem).toHaveBeenCalledWith('secure_test-key');
      expect(localStorage.removeItem).toHaveBeenCalledWith('test-key');
    });
  });

  describe('migrateToSecure', () => {
    beforeEach(() => {
      mockCrypto.subtle.importKey.mockResolvedValue({});
      mockCrypto.subtle.deriveKey.mockResolvedValue({});
      mockCrypto.subtle.encrypt.mockResolvedValue(
        new ArrayBuffer(16)
      );
    });

    it('should migrate existing plaintext to secure storage', async () => {
      localStorage.getItem.mockReturnValue('existing-value');

      await SecureStorage.migrateToSecure('old-key', 'new-key');

      expect(localStorage.getItem).toHaveBeenCalledWith('old-key');
      expect(mockCrypto.subtle.encrypt).toHaveBeenCalled();
      expect(localStorage.removeItem).toHaveBeenCalledWith('old-key');
    });

    it('should not migrate when no existing value', async () => {
      localStorage.getItem.mockReturnValue(null);

      await SecureStorage.migrateToSecure('old-key', 'new-key');

      expect(mockCrypto.subtle.encrypt).not.toHaveBeenCalled();
      expect(localStorage.removeItem).not.toHaveBeenCalledWith('old-key');
    });
  });
});