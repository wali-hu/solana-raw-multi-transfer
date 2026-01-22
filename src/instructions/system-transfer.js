const { Encoder, encodeAccountMeta } = require('../utils/encoding');
const { pubkeyToBytes } = require('../utils/keypair');

/**
 * System Program constants
 */
const SYSTEM_PROGRAM_ID = '11111111111111111111111111111111';
const TRANSFER_INSTRUCTION_OPCODE = 2; // Transfer opcode in System Program

/**
 * Create a System Program Transfer instruction for native SOL
 * 
 * @param {string} fromPubkey - Sender's public key (base58)
 * @param {string} toPubkey - Receiver's public key (base58)
 * @param {number|bigint} lamports - Amount in lamports to transfer
 * @returns {object} - Instruction object with programId, accounts, and data
 * 
 * Format:
 * - Program: System Program (11111111111111111111111111111111)
 * - Instruction opcode: 2 (Transfer)
 * - Data: [opcode: u32][amount: u64]
 * - Accounts: [from (signer, writable), to (writable)]
 */
function createSystemTransferInstruction(fromPubkey, toPubkey, lamports) {
  // Convert public keys to bytes
  const fromPubkeyBytes = pubkeyToBytes(fromPubkey);
  const toPubkeyBytes = pubkeyToBytes(toPubkey);
  const programIdBytes = pubkeyToBytes(SYSTEM_PROGRAM_ID);

  // Encode instruction data
  // Format: [opcode: u32][amount: u64]
  const dataEncoder = new Encoder();
  dataEncoder.writeU32(TRANSFER_INSTRUCTION_OPCODE);
  dataEncoder.writeU64(lamports);
  const instructionData = dataEncoder.toBuffer();

  // Encode account metadata
  // From account: signer, writable
  const fromAccountMeta = encodeAccountMeta(fromPubkeyBytes, true, true);
  // To account: not signer, writable
  const toAccountMeta = encodeAccountMeta(toPubkeyBytes, false, true);

  return {
    programId: SYSTEM_PROGRAM_ID,
    programIdBytes,
    accounts: [
      {
        pubkey: fromPubkey,
        pubkeyBytes: fromPubkeyBytes,
        isSigner: true,
        isWritable: true,
        meta: fromAccountMeta,
      },
      {
        pubkey: toPubkey,
        pubkeyBytes: toPubkeyBytes,
        isSigner: false,
        isWritable: true,
        meta: toAccountMeta,
      },
    ],
    data: instructionData,
    encodedData: instructionData,
  };
}

/**
 * Create TWO System Program transfer instructions
 * Instruction 1: Sender -> Wallet A
 * Instruction 2: Sender -> Wallet B
 * 
 * @param {string} senderPubkey - Sender's public key
 * @param {string} walletAPubkey - Wallet A public key
 * @param {string} walletBPubkey - Wallet B public key
 * @param {number|bigint} lamports - Amount per transfer
 * @returns {array} - Array of 2 instruction objects
 */
function createBothSystemTransfers(senderPubkey, walletAPubkey, walletBPubkey, lamports) {
  const instruction1 = createSystemTransferInstruction(senderPubkey, walletAPubkey, lamports);
  const instruction2 = createSystemTransferInstruction(senderPubkey, walletBPubkey, lamports);

  return [instruction1, instruction2];
}

module.exports = {
  SYSTEM_PROGRAM_ID,
  TRANSFER_INSTRUCTION_OPCODE,
  createSystemTransferInstruction,
  createBothSystemTransfers,
};
