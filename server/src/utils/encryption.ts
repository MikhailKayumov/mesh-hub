import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

/**
 * Encrypts a plaintext string using AES-256-CBC.
 * Returns a hex string in the format `<ivHex>:<ciphertextHex>`.
 */
export function encryptAes256(plaintext: string, keyHex: string): string {
  const key = Buffer.from(keyHex, 'hex');
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

/**
 * Decrypts a ciphertext string produced by `encryptAes256`.
 * Throws if the input is malformed or the key is incorrect.
 */
export function decryptAes256(ciphertext: string, keyHex: string): string {
  const parts = ciphertext.split(':');
  if (parts.length !== 2) {
    throw new Error('Invalid ciphertext format');
  }
  const [ivHex, dataHex] = parts;
  const key = Buffer.from(keyHex, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = createDecipheriv('aes-256-cbc', key, iv);
  return Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]).toString('utf8');
}
