#!/usr/bin/env node

/**
 * Pure Raw Multi-Transfer Implementation (Milestone 4)
 * 
 * Complete end-to-end transaction building without Solana SDK.
 * Uses manually encoded instructions and TransactionBuilder.
 * 
 * Flow:
 * 1. Load configuration and token setup
 * 2. Create 4 transfer instructions (2 SOL, 2 SPL tokens)
 * 3. Build transaction message with account deduplication
 * 4. Sign with wallet A private key
 * 5. Submit and confirm on-chain
 */

const fs = require('fs');
const path = require('path');
const config = require('../config');
const { importKeypair } = require('../utils/keypair');
const { createSystemTransferInstruction, createBothSystemTransfers } = require('../instructions/system-transfer');
const { createTokenTransferInstruction, createBothTokenTransfers, createAssociatedTokenAccountInstruction, deriveAssociatedTokenAccount } = require('../instructions/token-transfer');
const TransactionBuilder = require('../transaction/builder');
const { accountExists } = require('../utils/rpc');

const tokenConfigPath = path.join(__dirname, '..', '..', 'token-config.json');

async function main() {
  try {
    console.log('='.repeat(70));
    console.log('MILESTONE 4: Pure Raw Multi-Transfer (No SDK)');
    console.log('='.repeat(70));
    console.log();

    // Step 1: Load configuration
    console.log('STEP 1: Loading configuration');
    console.log('-'.repeat(70));
    
    console.log(`Network: ${config.network}`);
    console.log(`RPC: ${config.rpcEndpoint}`);
    console.log(`Sender (Payer): ${config.walletA.publicKey}`);
    console.log(`Receiver: ${config.walletB.publicKey}`);
    console.log();

    // Step 2: Load token configuration
    console.log('STEP 2: Loading token configuration');
    console.log('-'.repeat(70));
    
    if (!fs.existsSync(tokenConfigPath)) {
      throw new Error('token-config.json not found. Run: npm run setup first');
    }

    const tokenConfig = JSON.parse(fs.readFileSync(tokenConfigPath, 'utf-8'));
    
    if (tokenConfig.status !== 'READY') {
      throw new Error('Token setup not complete. Run: npm run setup first');
    }

    console.log(`Token Mint: ${tokenConfig.tokenMint}`);
    console.log(`Wallet A Token Account: ${tokenConfig.walletATokenAccount}`);
    console.log(`Wallet B Token Account: ${tokenConfig.walletBTokenAccount}`);
    console.log(`Token Decimals: ${tokenConfig.tokenDecimals}`);
    console.log();

    // Step 3: Import wallet keypair
    console.log('STEP 3: Importing wallet keypair');
    console.log('-'.repeat(70));
    
    const walletAKeypair = importKeypair(config.walletA.privateKey);
    console.log(`Wallet A public key: ${walletAKeypair.publicKey}`);
    console.log(`Private key loaded: ${config.walletA.privateKey.substring(0, 8)}...`);
    console.log();

    // Step 4: Create TransactionBuilder
    console.log('STEP 4: Creating TransactionBuilder');
    console.log('-'.repeat(70));
    
    const tx = new TransactionBuilder(config.rpcEndpoint);
    console.log('TransactionBuilder initialized');
    console.log();

    // Step 5: Build SOL transfer instructions
    console.log('STEP 5: Building SOL transfer instructions');
    console.log('-'.repeat(70));
    
    const solAmount = config.transfers.solAmount;
    
    const solInstruction1 = createSystemTransferInstruction(
      config.walletA.publicKey,
      config.walletA.publicKey,
      solAmount
    );
    console.log(`Instruction 1: SOL transfer Wallet A -> Wallet A (${solAmount} lamports)`);
    
    const solInstruction2 = createSystemTransferInstruction(
      config.walletA.publicKey,
      config.walletB.publicKey,
      solAmount
    );
    console.log(`Instruction 2: SOL transfer Wallet A -> Wallet B (${solAmount} lamports)`);
    
    tx.addInstruction(solInstruction1);
    tx.addInstruction(solInstruction2);
    console.log();

    // Step 6: Build token transfer instructions
    console.log('STEP 6: Building token transfer instructions');
    console.log('-'.repeat(70));
    
    const tokenAmount = config.transfers.tokenAmount;
    
    const tokenInstruction1 = createTokenTransferInstruction(
      tokenConfig.walletATokenAccount,
      tokenConfig.walletATokenAccount,
      config.walletA.publicKey,
      tokenAmount
    );
    console.log(`Instruction 3: Token transfer Wallet A -> Wallet A (${tokenAmount} tokens)`);
    
    const tokenInstruction2 = createTokenTransferInstruction(
      tokenConfig.walletATokenAccount,
      tokenConfig.walletBTokenAccount,
      config.walletA.publicKey,
      tokenAmount
    );
    console.log(`Instruction 4: Token transfer Wallet A -> Wallet B (${tokenAmount} tokens)`);
    
    tx.addInstruction(tokenInstruction1);
    tx.addInstruction(tokenInstruction2);
    console.log();

    // Step 7: Set fee payer and fetch blockhash
    console.log('STEP 7: Setting fee payer and fetching blockhash');
    console.log('-'.repeat(70));
    
    tx.setFeePayer(config.walletA.publicKey, walletAKeypair.secretKey);
    console.log(`Fee payer: ${config.walletA.publicKey}`);
    
    await tx.fetchBlockhash();
    console.log();

    // Step 8: Build transaction message
    console.log('STEP 8: Building transaction message');
    console.log('-'.repeat(70));
    console.log('Account deduplication and ordering...');
    
    const { message, accounts, numRequiredSignatures } = tx.buildMessage();
    
    console.log(`Total unique accounts: ${accounts.length}`);
    console.log(`Required signatures: ${numRequiredSignatures}`);
    console.log();
    
    console.log('Account list (ordered by: signers, writable, readonly):');
    accounts.forEach((acc, idx) => {
      const type = acc.isSigner ? 'SIGNER' : 'NON-SIGNER';
      const writable = acc.isWritable ? 'WRITABLE' : 'READONLY';
      console.log(`  ${idx}. ${type} ${writable}: ${acc.pubkey.substring(0, 8)}...`);
    });
    console.log();

    // Step 9: Sign message
    console.log('STEP 9: Signing transaction message');
    console.log('-'.repeat(70));
    
    const signature = tx.signMessage(message);
    console.log(`Message signed with Ed25519`);
    console.log(`Signature length: ${signature.length} bytes`);
    console.log();

    // Step 10: Assemble complete transaction
    console.log('STEP 10: Assembling complete transaction');
    console.log('-'.repeat(70));
    
    const finalTransaction = tx.assembleTransaction(message, signature);
    console.log(`Final transaction size: ${finalTransaction.length} bytes`);
    console.log();

    // Step 11: Submit transaction
    console.log('STEP 11: Submitting transaction to Solana Devnet');
    console.log('-'.repeat(70));
    
    const result = await tx.buildAndSubmit();
    
    if (result.success) {
      console.log();
      console.log('='.repeat(70));
      console.log('SUCCESS! Transaction confirmed on-chain');
      console.log('='.repeat(70));
      console.log();
      console.log(`Transaction Signature: ${result.signature}`);
      console.log();
      console.log('View on Solana Explorer:');
      console.log(`https://explorer.solana.com/tx/${result.signature}?cluster=devnet`);
      console.log();
    } else {
      console.log();
      console.log('='.repeat(70));
      console.log('TRANSACTION FAILED');
      console.log('='.repeat(70));
      console.log(result.message || result.error);
      console.log(`Signature: ${result.signature}`);
      process.exit(1);
    }

    // Step 12: Summary
    console.log('TRANSACTION SUMMARY');
    console.log('='.repeat(70));
    console.log('Instructions executed (atomically):');
    console.log(`  1. SOL transfer: Wallet A -> Wallet A (${solAmount} lamports)`);
    console.log(`  2. SOL transfer: Wallet A -> Wallet B (${solAmount} lamports)`);
    console.log(`  3. Token transfer: Wallet A -> Wallet A (${tokenAmount} tokens)`);
    console.log(`  4. Token transfer: Wallet A -> Wallet B (${tokenAmount} tokens)`);
    console.log();
    console.log('All executed in ONE atomic transaction.');
    console.log('All succeed or entire transaction reverts.');
    console.log();

  } catch (err) {
    console.error();
    console.error('='.repeat(70));
    console.error('FATAL ERROR');
    console.error('='.repeat(70));
    console.error(err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = main;
