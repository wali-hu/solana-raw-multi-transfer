const crypto = require('crypto');
const nacl = require('tweetnacl');

/**
 * Import keypair from base58 private key string
 * @param {string} privateKeyBase58 - Private key in base58 format
 * @returns {object} - {publicKey, privateKey}
 */
function importKeypair(privateKeyBase58) {
  // Decode base58 private key to bytes
  const privateKeyBytes = base58Decode(privateKeyBase58);
  
  // Solana private keys are 64 bytes: 32 bytes seed + 32 bytes public key
  const secretKey = privateKeyBytes.slice(0, 32);
  
  // Generate keypair from secret key
  const keyPair = nacl.sign.keyPair.fromSeed(secretKey);
  
  return {
    publicKey: base58Encode(keyPair.publicKey),
    publicKeyBytes: keyPair.publicKey,
    secretKey: keyPair.secretKey,
  };
}

/**
 * Sign message with private key
 * @param {Buffer} message - Message to sign
 * @param {Uint8Array} secretKey - Secret key
 * @returns {Uint8Array} - Signature
 */
function signMessage(message, secretKey) {
  return nacl.sign.detached(message, secretKey);
}

/**
 * Base58 encode (simple implementation for Solana)
 * @param {Uint8Array|Buffer} bytes
 * @returns {string}
 */
function base58Encode(bytes) {
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  
  let encoded = '';
  let num = 0n;
  
  // Convert bytes to big number
  for (let byte of bytes) {
    num = num * 256n + BigInt(byte);
  }
  
  // Convert to base58
  if (num === 0n) {
    encoded = alphabet[0];
  } else {
    while (num > 0n) {
      encoded = alphabet[Number(num % 58n)] + encoded;
      num = num / 58n;
    }
  }
  
  // Add leading characters for leading zero bytes
  for (let byte of bytes) {
    if (byte === 0) {
      encoded = alphabet[0] + encoded;
    } else {
      break;
    }
  }
  
  return encoded;
}

/**
 * Base58 decode (simple implementation for Solana)
 * @param {string} encoded
 * @returns {Uint8Array}
 */
function base58Decode(encoded) {
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  
  let num = 0n;
  
  for (let char of encoded) {
    const digit = alphabet.indexOf(char);
    if (digit === -1) {
      throw new Error(`Invalid base58 character: ${char}`);
    }
    num = num * 58n + BigInt(digit);
  }
  
  // Convert back to bytes
  const bytes = [];
  while (num > 0n) {
    bytes.unshift(Number(num % 256n));
    num = num / 256n;
  }
  
  // Add leading zero bytes
  for (let char of encoded) {
    if (char === '1') {
      bytes.unshift(0);
    } else {
      break;
    }
  }
  
  return new Uint8Array(bytes.length > 0 ? bytes : [0]);
}

/**
 * Convert base58 public key string to bytes
 * @param {string} pubkeyBase58
 * @returns {Uint8Array}
 */
function pubkeyToBytes(pubkeyBase58) {
  return base58Decode(pubkeyBase58);
}

/**
 * Convert bytes to base58 public key string
 * @param {Uint8Array|Buffer} bytes
 * @returns {string}
 */
function bytesToPubkey(bytes) {
  return base58Encode(bytes);
}

module.exports = {
  importKeypair,
  signMessage,
  base58Encode,
  base58Decode,
  pubkeyToBytes,
  bytesToPubkey,
};
