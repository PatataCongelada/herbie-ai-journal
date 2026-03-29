/**
 * Herbie Crypto Utility
 * Implementing Client-Side End-to-End Encryption (E2EE)
 * Using Web Crypto API (AES-GCM + PBKDF2)
 */

const ITERATIONS = 100000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;

/**
 * Derives an encryption key from a password and salt.
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordKey = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as Uint8Array,
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts data using a password.
 */
export async function encryptData(data: any, password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = window.crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(password, salt);

  const encryptedContent = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    encoder.encode(JSON.stringify(data))
  );

  const encryptedArray = new Uint8Array(encryptedContent);
  const resultArray = new Uint8Array(SALT_LENGTH + IV_LENGTH + encryptedArray.length);
  resultArray.set(salt, 0);
  resultArray.set(iv, SALT_LENGTH);
  resultArray.set(encryptedArray, SALT_LENGTH + IV_LENGTH);

  // Convert to base64 for storage
  return btoa(String.fromCharCode(...resultArray));
}

/**
 * Decrypts data using a password.
 */
export async function decryptData(encryptedBase64: string, password: string): Promise<any> {
  try {
    const binaryString = atob(encryptedBase64);
    const totalArray = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      totalArray[i] = binaryString.charCodeAt(i);
    }

    const salt = totalArray.slice(0, SALT_LENGTH);
    const iv = totalArray.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const encryptedArray = totalArray.slice(SALT_LENGTH + IV_LENGTH);

    const key = await deriveKey(password, salt);
    const decryptedContent = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      key,
      encryptedArray
    );

    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(decryptedContent));
  } catch (error) {
    console.error("Decryption failed:", error);
    throw new Error("Could not decrypt data. Check your password.");
  }
}
