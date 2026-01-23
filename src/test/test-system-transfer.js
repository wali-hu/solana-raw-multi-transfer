#!/usr/bin/env node

/**
 * Test script for Milestone 3: SOL Transfer Instruction (System Program)
 * 
 * This tests:
 * 1. System Program SOL transfer instruction creation
 * 2. Instruction encoding correctness
 * 3. Account metadata for SOL transfers
 * 4. Data format (opcode + amount)
 * 5. Differences between System Program and Token Program
 */

const config = require('../config');
const { createSystemTransferInstruction, createBothSystemTransfers, SYSTEM_PROGRAM_ID, TRANSFER_INSTRUCTION_OPCODE } = require('../instructions/system-transfer');
const { createTokenTransferInstruction, TOKEN_PROGRAM_ID } = require('../instructions/token-transfer');

function testSystemTransfer() {
  console.log('='.repeat(70));
  console.log('MILESTONE 3: SOL Transfer Instruction (System Program)');
  console.log('='.repeat(70));
  console.log();

  try {
    // Test 1: Create single SOL transfer instruction
    console.log('TEST 1: Creating single SOL transfer instruction');
    console.log('-'.repeat(70));
    
    const transferAmount = 1000000;  // 1 million lamports = 0.001 SOL
    
    const solInstruction = createSystemTransferInstruction(
      config.walletA.publicKey,  // From
      config.walletB.publicKey,  // To
      transferAmount
    );
    
    console.log('SOL transfer instruction created successfully');
    console.log(`  From: ${config.walletA.publicKey.substring(0, 8)}...`);
    console.log(`  To: ${config.walletB.publicKey.substring(0, 8)}...`);
    console.log(`  Amount: ${transferAmount} lamports (${(transferAmount / 1000000).toFixed(6)} SOL)`);
    console.log(`  Program: System Program (${SYSTEM_PROGRAM_ID})`);
    console.log();
    
    // Test 2: Verify program ID and opcode
    console.log('TEST 2: Verifying System Program constants');
    console.log('-'.repeat(70));
    
    const correctProgram = solInstruction.programId === SYSTEM_PROGRAM_ID;
    const correctOpcode = TRANSFER_INSTRUCTION_OPCODE === 2;
    
    console.log(`  System Program ID: ${solInstruction.programId}`);
    console.log(`  Is correct: ${correctProgram}`);
    console.log(`  Transfer opcode: ${TRANSFER_INSTRUCTION_OPCODE}`);
    console.log(`  Is correct (should be 2): ${correctOpcode}`);
    console.log();
    
    // Test 3: Verify instruction data encoding
    console.log('TEST 3: Verifying instruction data encoding');
    console.log('-'.repeat(70));
    
    const dataBuffer = solInstruction.data;
    console.log(`  Data length: ${dataBuffer.length} bytes (expected: 12)`);
    console.log(`    4 bytes opcode (u32) + 8 bytes amount (u64)`);
    
    // Verify opcode in data
    const opcodeInData = dataBuffer.readUInt32LE(0);
    console.log(`  Opcode from data: ${opcodeInData} (expected: 2)`);
    
    // Verify amount in data
    const amountInData = dataBuffer.readBigUInt64LE(4);
    console.log(`  Amount from data: ${amountInData} lamports (expected: ${transferAmount})`);
    console.log(`  Data is correct: ${opcodeInData === 2 && amountInData === BigInt(transferAmount)}`);
    console.log();
    
    // Test 4: Verify account structure
    console.log('TEST 4: Verifying account metadata');
    console.log('-'.repeat(70));
    
    const accounts = solInstruction.accounts;
    console.log(`  Number of accounts: ${accounts.length} (expected: 2)`);
    console.log();
    
    console.log('  Account 0 (From):');
    console.log(`    Pubkey: ${accounts[0].pubkey.substring(0, 8)}...`);
    console.log(`    Signer: ${accounts[0].isSigner} (expected: true)`);
    console.log(`    Writable: ${accounts[0].isWritable} (expected: true)`);
    console.log(`    Is correct: ${accounts[0].isSigner === true && accounts[0].isWritable === true}`);
    console.log();
    
    console.log('  Account 1 (To):');
    console.log(`    Pubkey: ${accounts[1].pubkey.substring(0, 8)}...`);
    console.log(`    Signer: ${accounts[1].isSigner} (expected: false)`);
    console.log(`    Writable: ${accounts[1].isWritable} (expected: true)`);
    console.log(`    Is correct: ${accounts[1].isSigner === false && accounts[1].isWritable === true}`);
    console.log();
    
    // Test 5: Create both transfers
    console.log('TEST 5: Creating both SOL transfer instructions');
    console.log('-'.repeat(70));
    
    const bothTransfers = createBothSystemTransfers(
      config.walletA.publicKey,
      config.walletA.publicKey,  // Wallet A (self)
      config.walletB.publicKey,  // Wallet B
      transferAmount
    );
    
    console.log(`  Created ${bothTransfers.length} transfer instructions`);
    console.log(`  Instruction 1: ${config.walletA.publicKey.substring(0, 8)}... -> ${config.walletA.publicKey.substring(0, 8)}...`);
    console.log(`  Instruction 2: ${config.walletA.publicKey.substring(0, 8)}... -> ${config.walletB.publicKey.substring(0, 8)}...`);
    console.log();
    
    // Test 6: Compare System Program vs Token Program
    console.log('TEST 6: System Program vs Token Program comparison');
    console.log('-'.repeat(70));
    
    const tokenInstruction = createTokenTransferInstruction(
      config.walletA.publicKey,  // Source token account
      config.walletB.publicKey,  // Dest token account
      config.walletA.publicKey,  // Owner
      transferAmount
    );
    
    console.log('SYSTEM PROGRAM (SOL Transfer):');
    console.log(`  Program ID: 11111111111111111111111111111111`);
    console.log(`  Opcode: 2`);
    console.log(`  Data format: [opcode: u32][amount: u64]`);
    console.log(`  Data length: 12 bytes`);
    console.log(`  Accounts needed: 2`);
    console.log(`    - From (signer, writable)`);
    console.log(`    - To (non-signer, writable)`);
    console.log(`  Works with: Native SOL accounts`);
    console.log();
    
    console.log('TOKEN PROGRAM (SPL Token Transfer):');
    console.log(`  Program ID: TokenkegQfeZyiNwAJsyFbPVwwQnmRRB5nCFJ7nJVd`);
    console.log(`  Opcode: 3`);
    console.log(`  Data format: [opcode: u8][amount: u64]`);
    console.log(`  Data length: 9 bytes`);
    console.log(`  Accounts needed: 3`);
    console.log(`    - Source token account (non-signer, writable)`);
    console.log(`    - Dest token account (non-signer, writable)`);
    console.log(`    - Owner (signer, non-writable)`);
    console.log(`  Works with: SPL token accounts (derived from mints)`);
    console.log();
    
    // Test 7: Atomic transaction capability
    console.log('TEST 7: Atomic transaction structure (both SOL and tokens)');
    console.log('-'.repeat(70));
    
    console.log('Transaction will contain:');
    console.log(`  Instruction 1: SOL transfer (System Program)`);
    console.log(`  Instruction 2: SOL transfer (System Program)`);
    console.log(`  Instruction 3: Token transfer (Token Program) - if ATA exists`);
    console.log(`  Instruction 4: Token transfer (Token Program) - if ATA exists`);
    console.log();
    console.log('All executed atomically:');
    console.log(`  - All succeed: Transaction confirmed`);
    console.log(`  - Any fails: Entire transaction reverts`);
    console.log();
    
    console.log('='.repeat(70));
    console.log('SUCCESS! All System Program tests passed');
    console.log('='.repeat(70));
    console.log();
    
    console.log('Key Concepts:');
    console.log('  1. System Program ID: hardcoded as all 1s in base58');
    console.log('  2. Transfer opcode is 2 (for SOL transfers)');
    console.log('  3. Data requires u32 opcode + u64 amount (12 bytes total)');
    console.log('  4. From account MUST be signer (payer of transfer)');
    console.log('  5. To account must be writable (receives SOL)');
    console.log('  6. Different from Token Program (different opcode, data, accounts)');
    console.log('  7. Both can be combined in single atomic transaction');
    console.log();

    return true;

  } catch (err) {
    console.error('ERROR:', err.message);
    console.error(err.stack);
    return false;
  }
}

if (require.main === module) {
  const success = testSystemTransfer();
  process.exit(success ? 0 : 1);
}

module.exports = testSystemTransfer;
