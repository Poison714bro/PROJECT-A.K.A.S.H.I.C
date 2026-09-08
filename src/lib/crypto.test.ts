import { describe, it, expect, beforeEach } from 'vitest';
import { encrypt, decrypt, generateHmac } from './crypto';

describe('Crypto primitives', () => {
  beforeEach(() => {
    // Need 32 byte base64 keys
    process.env.FIELD_ENCRYPTION_KEY = 'EujxaKE4vmT54sWVVUNoRkHhXxjied3j9DbpgwNDYDM=';
    process.env.SEARCH_HMAC_KEY = 'zU5mvcXQF777fV8ZrilO4E2k/Qyo4cTEQdGMhBDYYm0=';
  });

  it('encrypts and decrypts a string correctly', () => {
    const plaintext = 'secret data 123';
    const encrypted = encrypt(plaintext, false);
    
    expect(encrypted).toContain('v1::'); // empty HMAC section
    expect(encrypted).not.toEqual(plaintext);
    
    const decrypted = decrypt(encrypted);
    expect(decrypted).toEqual(plaintext);
  });

  it('encrypts and decrypts a queryable string correctly', () => {
    const plaintext = 'john.doe@example.com';
    const encrypted = encrypt(plaintext, true);
    
    const hmac = generateHmac(plaintext);
    expect(encrypted).toContain(`v1:${hmac}:`);
    
    const decrypted = decrypt(encrypted);
    expect(decrypted).toEqual(plaintext);
  });

  it('returns original string if not encrypted', () => {
    const plaintext = 'not encrypted string';
    const decrypted = decrypt(plaintext);
    expect(decrypted).toEqual(plaintext);
  });
  
  it('throws error on wrong key', () => {
    const plaintext = 'secret data';
    const encrypted = encrypt(plaintext, false);
    
    // change key
    process.env.FIELD_ENCRYPTION_KEY = 'zU5mvcXQF777fV8ZrilO4E2k/Qyo4cTEQdGMhBDYYm0=';
    
    expect(() => decrypt(encrypted)).toThrow(/Decryption failed/);
  });
});
