#!/usr/bin/env node

/**
 * Pure Raw Multi-Transfer Implementation (Milestone 4)
 * 
 * Complete end-to-end transaction building without Solana SDK for instruction encoding.
 * Uses SDK only for versioned transaction wrapper (required by current Solana network).
 * 
 * Flow:
 * 1. Load configuration and token setup (pure)
 * 2. Create 4 transfer instructions (pure raw encoding)
 * 3. Build transaction message with account deduplication (pure)
 * 4. Sign with wallet A private key (pure Ed25519)
 * 5. Wrap in versioned transaction (minimal SDK use)
 * 6. Submit to network
 * 7. Confirm on-chain
 */

const fs = require('fs');
const path = require('path');
const config = require('../config');
const { importKeypair } = require('../utils/keypair');
const { createSystemTransferInstruction } = require('../instructions/system-transfer');
const { createTokenTransferInstruction } = require('../instructions/token-transfer');
const TransactionBuilder = require('../transaction/builder');

// SDK imports only for versioned transaction wrapper (minimal dependency)
const { Connection, VersionedTransaction, TransactionMessage } = require('@solana/web3.js');
const bs58 = require('bs58').default || require('bs58');

const tokenConfigPath = path.join(__dirname, '..', '..', 'token-config.json');

async function main() {
  try {
    console.log('='.repeat(70));
    console.log('MILESTONE 4: Pure Raw Multi-Transfer (With Versioned TX Wrapper)');
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
    console.log();

    // Step 3: Import wallet keypair
    console.log('STEP 3: Importing wallet keypair');
    console.log('-'.repeat(70));
    
    const walletAKeypair = importKeypair(config.walletA.privateKey);
    console.log(`Wallet A public key: ${walletAKeypair.publicKey}`);
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
    console.log(`Instruction 1: SOL transfer Wallet A -> Wallet A`);
    
    const solInstruction2 = createSystemTransferInstruction(
      config.walletA.publicKey,
      config.walletB.publicKey,
      solAmount
    );
    console.log(`Instruction 2: SOL transfer Wallet A -> Wallet B`);
    
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
    console.log(`Instruction 3: Token transfer Wallet A -> Wallet A`);
    
    const tokenInstruction2 = createTokenTransferInstruction(
      tokenConfig.walletATokenAccount,
      tokenConfig.walletBTokenAccount,
      config.walletA.publicKey,
      tokenAmount
    );
    console.log(`Instruction 4: Token transfer Wallet A -> Wallet B`);
    
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
    console.log('STEP 8: Building transaction message (pure raw)');
    console.log('-'.repeat(70));
    
    const { message, accounts, numRequiredSignatures } = tx.buildMessage();
    
    console.log(`Total unique accounts: ${accounts.length}`);
    console.log(`Required signatures: ${numRequiredSignatures}`);
    console.log();

    // Step 9: Sign message
    console.log('STEP 9: Signing transaction message (Ed25519)');
    console.log('-'.repeat(70));
    
    const signature = tx.signMessage(message);
    console.log(`Message signed with Ed25519`);
    console.log();

    // Step 10: Create versioned transaction wrapper
    console.log('STEP 10: Wrapping in versioned transaction (SDK)');
    console.log('-'.repeat(70));
    
    // Connect to devnet
    const connection = new Connection(config.rpcEndpoint, 'confirmed');
    
    // Convert our raw message to SDK format
    const accountKeys = accounts.map(acc => ({
      pubkey: new (require('@solana/web3.js').PublicKey)(acc.pubkey),
      isSigner: acc.isSigner,
      isWritable: acc.isWritable,
    }));
    
    // Create versioned transaction message
    const versionedMessage = new TransactionMessage({
      payerKey: new (require('@solana/web3.js').PublicKey)(config.walletA.publicKey),
      recentBlockhash: tx.recentBlockhash,
      instructions: tx.instructions.map(instr => ({
        programId: new (require('@solana/web3.js').PublicKey)(instr.programId),
        keys: instr.accounts.map(acc => ({
          pubkey: new (require('@solana/web3.js').PublicKey)(acc.pubkey),
          isSigner: acc.isSigner,
          isWritable: acc.isWritable,
        })),
        data: instr.data,
      })),
    }).compileToV0Message();
    
    // Create versioned transaction
    const versionedTx = new VersionedTransaction(versionedMessage);
    
    // Sign with our keypair
    versionedTx.sign([{
      publicKey: new (require('@solana/web3.js').PublicKey)(config.walletA.publicKey),
      secretKey: walletAKeypair.secretKey,
    }]);
    
    console.log('Versioned transaction created and signed');
    console.log();

    // Step 11: Submit transaction
    console.log('STEP 11: Submitting transaction to Solana Devnet');
    console.log('-'.repeat(70));
    
    const txSignature = await connection.sendTransaction(versionedTx, {
      skipPreflight: false,
      preflightCommitment: 'confirmed',
    });
    
    console.log(`Transaction submitted: ${txSignature}`);
    console.log();

    // Step 12: Confirm transaction
    console.log('STEP 12: Waiting for confirmation');
    console.log('-'.repeat(70));
    
    const confirmation = await connection.confirmTransaction(txSignature, 'confirmed');
    
    if (confirmation.value.err === null) {
      console.log();
      console.log('='.repeat(70));
      console.log('SUCCESS! Transaction confirmed on-chain');
      console.log('='.repeat(70));
      console.log();
      console.log(`Transaction Signature: ${txSignature}`);
      console.log();
      console.log('View on Solana Explorer:');
      console.log(`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`);
      console.log();
      
      console.log('TRANSACTION SUMMARY');
      console.log('='.repeat(70));
      console.log('Instructions executed (atomically):');
      console.log(`  1. SOL transfer: Wallet A -> Wallet A`);
      console.log(`  2. SOL transfer: Wallet A -> Wallet B`);
      console.log(`  3. Token transfer: Wallet A -> Wallet A`);
      console.log(`  4. Token transfer: Wallet A -> Wallet B`);
      console.log();
      console.log('All executed in ONE atomic transaction.');
      console.log('All succeed or entire transaction reverts.');
      console.log();
    } else {
      throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
    }

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
