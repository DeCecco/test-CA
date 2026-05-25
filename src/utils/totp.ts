/**
 * TOTP (Time-Based One-Time Password) utilities for Google Authenticator / Microsoft Authenticator.
 * Uses the SubtleCrypto API built into all modern browsers.
 */

/**
 * Decodes a base32 string into a Uint8Array.
 * Fits standard RFC 4648 Base32 alphabet.
 */
export function base32ToBytes(b32: string): Uint8Array {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const cleanB32 = b32.toUpperCase().replace(/=+$/, "").replace(/\s/g, "");
  const bytes: number[] = [];
  let buffer = 0;
  let bitsLeft = 0;

  for (let i = 0; i < cleanB32.length; i++) {
    const val = alphabet.indexOf(cleanB32[i]);
    if (val === -1) {
      continue; // Skip invalid characters
    }
    buffer = (buffer << 5) | val;
    bitsLeft += 5;
    if (bitsLeft >= 8) {
      bytes.push((buffer >> (bitsLeft - 8)) & 0xff);
      bitsLeft -= 8;
    }
  }

  return new Uint8Array(bytes);
}

/**
 * Generates a TOTP code (6-digit string) for a specific counter index.
 */
export async function generateTOTPForCounter(secretB32: string, counter: number, digits = 6): Promise<string> {
  const keyBytes = base32ToBytes(secretB32);
  if (keyBytes.length === 0) {
    return "";
  }

  // Counter must be 8 bytes long (64-bit big endian integer)
  const counterBuffer = new ArrayBuffer(8);
  const view = new DataView(counterBuffer);
  view.setUint32(0, 0); // High 32 bits
  view.setUint32(4, counter); // Low 32 bits

  // Import the raw secret key material for SHA-1 HMAC signing
  const cryptoKey = await window.crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: { name: "SHA-1" } },
    false,
    ["sign"]
  );

  // Sign the 8-byte counter buffer using HMAC-SHA1
  const signature = await window.crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    counterBuffer
  );

  const hmacBytes = new Uint8Array(signature);

  // Dynamic truncation as specified in RFC 4226 / RFC 6238
  const offset = hmacBytes[hmacBytes.length - 1] & 0xf;
  const binary =
    ((hmacBytes[offset] & 0x7f) << 24) |
    ((hmacBytes[offset + 1] & 0xff) << 16) |
    ((hmacBytes[offset + 2] & 0xff) << 8) |
    (hmacBytes[offset + 3] & 0xff);

  const otp = binary % Math.pow(10, digits);
  return otp.toString().padStart(digits, "0");
}

/**
 * Generates the current TOTP code for the given secret.
 */
export async function generateCurrentTOTP(secretB32: string, timeStepSec = 30): Promise<string> {
  const epoch = Math.floor(Date.now() / 1000);
  const counter = Math.floor(epoch / timeStepSec);
  return generateTOTPForCounter(secretB32, counter);
}

/**
 * Verifies a 6-digit TOTP entered by the user.
 * Allows time drift (skews) of ±1 step (30 seconds) for real-world sync variance.
 */
export async function verifyTOTP(token: string, secretB32: string): Promise<boolean> {
  const cleanToken = token.trim();
  if (cleanToken.length !== 6 || isNaN(Number(cleanToken))) {
    return false;
  }

  const epoch = Math.floor(Date.now() / 1000);
  const currentCounter = Math.floor(epoch / 30);

  // Test current counter, previous counter, and next counter
  for (let skew = -1; skew <= 1; skew++) {
    const calculatedCode = await generateTOTPForCounter(secretB32, currentCounter + skew);
    if (calculatedCode === cleanToken) {
      return true;
    }
  }

  return false;
}

/**
 * Generates a random Base32 string to serve as a 2FA secret key.
 */
export function generateRandomBase32Secret(length = 16): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let result = "";
  const randomValues = new Uint32Array(length);
  window.crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += alphabet[randomValues[i] % alphabet.length];
  }
  return result;
}

/**
 * Generates an otpauth:// URL that can be encoded in a QR Code for Google Authenticator.
 */
export function getOTPAuthURL(label: string, issuer: string, secretB32: string): string {
  const cleanLabel = encodeURIComponent(label);
  const cleanIssuer = encodeURIComponent(issuer);
  return `otpauth://totp/${cleanIssuer}:${cleanLabel}?secret=${secretB32}&issuer=${cleanIssuer}&algorithm=SHA1&digits=6&period=30`;
}

/**
 * Generates a list of emergency backup codes.
 */
export function generateBackupCodes(count = 5): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const randomArray = new Uint32Array(1);
    window.crypto.getRandomValues(randomArray);
    // 8-digit randomized code
    const val = (randomArray[0] % 90000000) + 10000000;
    codes.push(val.toString());
  }
  return codes;
}
