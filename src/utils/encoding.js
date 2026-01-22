/**
 * Manual instruction encoding utilities for Solana
 * Following Solana program specifications
 */

/**
 * Layout-based encoder for structured data
 * Each field specifies type and size for encoding
 */
class Encoder {
  constructor() {
    this.buffer = [];
  }

  /**
   * Encode little-endian 32-bit unsigned integer
   */
  writeU32(value) {
    const buf = Buffer.allocUnsafe(4);
    buf.writeUInt32LE(value, 0);
    this.buffer.push(buf);
    return this;
  }

  /**
   * Encode little-endian 64-bit unsigned integer (bigint)
   */
  writeU64(value) {
    const buf = Buffer.allocUnsafe(8);
    // Handle both number and bigint
    const bigIntValue = typeof value === 'bigint' ? value : BigInt(value);
    buf.writeBigUInt64LE(bigIntValue, 0);
    this.buffer.push(buf);
    return this;
  }

  /**
   * Encode little-endian 8-bit unsigned integer
   */
  writeU8(value) {
    const buf = Buffer.allocUnsafe(1);
    buf.writeUInt8(value, 0);
    this.buffer.push(buf);
    return this;
  }

  /**
   * Write raw bytes
   */
  writeBytes(bytes) {
    if (typeof bytes === 'string') {
      this.buffer.push(Buffer.from(bytes, 'hex'));
    } else {
      this.buffer.push(Buffer.from(bytes));
    }
    return this;
  }

  /**
   * Finalize and return complete buffer
   */
  toBuffer() {
    return Buffer.concat(this.buffer);
  }
}

/**
 * Encode account metadata for transaction instruction
 * Format: [1 byte isSigner][1 byte isWritable][32 bytes pubkey]
 */
function encodeAccountMeta(pubkeyBytes, isSigner, isWritable) {
  const encoder = new Encoder();
  encoder.writeU8(isSigner ? 1 : 0);
  encoder.writeU8(isWritable ? 1 : 0);
  encoder.writeBytes(pubkeyBytes);
  return encoder.toBuffer();
}

/**
 * Create instruction structure
 * Format: [program_id][accounts_count][...accounts][data_length][...data]
 */
function encodeInstruction(programIdBytes, accounts, data) {
  const encoder = new Encoder();
  
  // Program ID
  encoder.writeBytes(programIdBytes);
  
  // Number of accounts
  encoder.writeU8(accounts.length);
  
  // Accounts
  for (const account of accounts) {
    encoder.writeBytes(account);
  }
  
  // Instruction data length
  encoder.writeU32(data.length);
  
  // Instruction data
  encoder.writeBytes(data);
  
  return encoder.toBuffer();
}

/**
 * Encode transaction header
 * Format: [num_required_signatures][num_readonly_unsigned][num_readonly_signed]
 */
function encodeTransactionHeader(numSigners, numReadonlyUnsigned, numReadonlySigned) {
  const encoder = new Encoder();
  encoder.writeU8(numSigners);
  encoder.writeU8(numReadonlyUnsigned);
  encoder.writeU8(numReadonlySigned);
  return encoder.toBuffer();
}

/**
 * Encode compact array (length-prefixed)
 * Used for account count and instruction count in transactions
 */
function encodeCompactArray(items) {
  const encoder = new Encoder();
  encoder.writeU8(items.length);
  for (const item of items) {
    encoder.writeBytes(item);
  }
  return encoder.toBuffer();
}

module.exports = {
  Encoder,
  encodeAccountMeta,
  encodeInstruction,
  encodeTransactionHeader,
  encodeCompactArray,
};
