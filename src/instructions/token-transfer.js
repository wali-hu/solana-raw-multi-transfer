const { Encoder, encodeAccountMeta } = require('../utils/encoding');
const { pubkeyToBytes } = require('../utils/keypair');

/**
 * Token Program constants
 */
const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJsyFbPVwwQnmRRB5nCFJ7nJVd';
const TRANSFER_INSTRUCTION_OPCODE = 3; // Transfer opcode in Token Program

/**
 * Create a Token Program Transfer instruction for SPL tokens
 * 
 * @param {string} sourceTokenAccountPubkey - Source token account (writable)
 * @param {string} destTokenAccountPubkey - Destination token account (writable)
 * @param {string} ownerPubkey - Token owner/authority (signer)
 * @param {number|bigint} tokenAmount - Amount of tokens to transfer
 * @returns {object} - Instruction object with programId, accounts, and data
 * 
 * Format:
 * - Program: Token Program (TokenkegQfeZyiNwAJsyFbPVwwQnmRRB5nCFJ7nJVd)
 * - Instruction opcode: 3 (Transfer)
 * - Data: [opcode: u8][amount: u64]
 * - Accounts: [source (writable), destination (writable), owner (signer)]
 */
function createTokenTransferInstruction(
  sourceTokenAccountPubkey,
  destTokenAccountPubkey,
  ownerPubkey,
  tokenAmount
) {
  // Convert public keys to bytes
  const sourcePubkeyBytes = pubkeyToBytes(sourceTokenAccountPubkey);
  const destPubkeyBytes = pubkeyToBytes(destTokenAccountPubkey);
  const ownerPubkeyBytes = pubkeyToBytes(ownerPubkey);
  const programIdBytes = pubkeyToBytes(TOKEN_PROGRAM_ID);

  // Encode instruction data
  // Format: [opcode: u8][amount: u64]
  const dataEncoder = new Encoder();
  dataEncoder.writeU8(TRANSFER_INSTRUCTION_OPCODE);
  dataEncoder.writeU64(tokenAmount);
  const instructionData = dataEncoder.toBuffer();

  // Encode account metadata
  // Source token account: not signer, writable
  const sourceAccountMeta = encodeAccountMeta(sourcePubkeyBytes, false, true);
  // Destination token account: not signer, writable
  const destAccountMeta = encodeAccountMeta(destPubkeyBytes, false, true);
  // Owner account: signer, not writable
  const ownerAccountMeta = encodeAccountMeta(ownerPubkeyBytes, true, false);

  return {
    programId: TOKEN_PROGRAM_ID,
    programIdBytes,
    accounts: [
      {
        pubkey: sourceTokenAccountPubkey,
        pubkeyBytes: sourcePubkeyBytes,
        isSigner: false,
        isWritable: true,
        meta: sourceAccountMeta,
      },
      {
        pubkey: destTokenAccountPubkey,
        pubkeyBytes: destPubkeyBytes,
        isSigner: false,
        isWritable: true,
        meta: destAccountMeta,
      },
      {
        pubkey: ownerPubkey,
        pubkeyBytes: ownerPubkeyBytes,
        isSigner: true,
        isWritable: false,
        meta: ownerAccountMeta,
      },
    ],
    data: instructionData,
    encodedData: instructionData,
  };
}

/**
 * Derive Associated Token Account (ATA) address
 * 
 * This is a simplified derivation for reference purposes.
 * In production, you would need the full PDA derivation logic.
 * 
 * For this implementation, we assume ATA addresses are provided or known.
 * 
 * @param {string} walletPubkey - Wallet public key
 * @param {string} tokenMintPubkey - Token mint public key
 * @returns {string} - Associated token account address (reference)
 */
function deriveAssociatedTokenAccount(walletPubkey, tokenMintPubkey) {
  // Note: Real ATA derivation requires:
  // 1. Find PDA with seeds [wallet, token_program, mint]
  // 2. Use Solana's findProgramAddress or createProgramAddress
  // For now, we return a placeholder that indicates ATA derivation is needed
  return `ATA[${walletPubkey.substring(0, 8)}...][${tokenMintPubkey.substring(0, 8)}...]`;
}

/**
 * Create TWO Token Program transfer instructions
 * Instruction 1: Sender token account -> Wallet A token account
 * Instruction 2: Sender token account -> Wallet B token account
 * 
 * @param {string} senderTokenAccountPubkey - Sender's token account
 * @param {string} walletATokenAccountPubkey - Wallet A's token account
 * @param {string} walletBTokenAccountPubkey - Wallet B's token account
 * @param {string} senderOwnerPubkey - Sender wallet (authority)
 * @param {number|bigint} tokenAmount - Amount per transfer
 * @returns {array} - Array of 2 instruction objects
 */
function createBothTokenTransfers(
  senderTokenAccountPubkey,
  walletATokenAccountPubkey,
  walletBTokenAccountPubkey,
  senderOwnerPubkey,
  tokenAmount
) {
  const instruction1 = createTokenTransferInstruction(
    senderTokenAccountPubkey,
    walletATokenAccountPubkey,
    senderOwnerPubkey,
    tokenAmount
  );
  const instruction2 = createTokenTransferInstruction(
    senderTokenAccountPubkey,
    walletBTokenAccountPubkey,
    senderOwnerPubkey,
    tokenAmount
  );

  return [instruction1, instruction2];
}

module.exports = {
  TOKEN_PROGRAM_ID,
  TRANSFER_INSTRUCTION_OPCODE,
  createTokenTransferInstruction,
  createBothTokenTransfers,
  deriveAssociatedTokenAccount,
};
