// Client-side encryption & privacy utilities for profile data and vault items

export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`maatjie_salt_${pin}_secure`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function encryptPayload(data: any, passkey: string = 'maatjie-family-vault-key'): string {
  try {
    const jsonStr = JSON.stringify(data);
    // Base64 + XOR reversible encryption with passkey for synchronized backups
    let result = '';
    for (let i = 0; i < jsonStr.length; i++) {
      const charCode = jsonStr.charCodeAt(i) ^ passkey.charCodeAt(i % passkey.length);
      result += String.fromCharCode(charCode);
    }
    return btoa(result);
  } catch (err) {
    console.error('Encryption failed, returning encoded fallback', err);
    return btoa(JSON.stringify(data));
  }
}

export function decryptPayload(encryptedBase64: string, passkey: string = 'maatjie-family-vault-key'): any {
  try {
    const decoded = atob(encryptedBase64);
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ passkey.charCodeAt(i % passkey.length);
      result += String.fromCharCode(charCode);
    }
    return JSON.parse(result);
  } catch (err) {
    console.error('Decryption failed', err);
    return null;
  }
}
