#!/usr/bin/env node

/**
 * Main execution script: Send all 4 transfer instructions in one transaction
 * 2 SOL transfers + 2 SPL token transfers in a single atomic transaction
 */

const config = require('../config');
const { importKeypair } = require('../utils/keypair');
const { createBothSystemTransfers } = require('../instructions/system-transfer');
const { createBothTokenTransfers } = require('../instructions/token-transfer');
const TransactionBuilder = require('../transaction/builder');
const fs = require('fs');
const path = require('path');

async function loadTokenConfig() {
  const tokenConfigPath = path.join(__dirname, '..', '..', 'token-config.json');
  
  if (!fs.existsSync(tokenConfigPath)) {
    throw new Error(
      'token-config.json not found. Run: node src/setup/token-setup.js for instructions'
    );
  }

  const tokenConfig = JSON.parse(fs.readFileSync(tokenConfigPath, 'utf-8'));

  if (
    tokenConfig.tokenMint === 'SET_THIS_AFTER_CREATING_TOKEN' ||
    tokenConfig.walletATokenAccount === 'SET_THIS_AFTER_CREATING_ATA_FOR_WALLET_A' ||
    tokenConfig.walletBTokenAccount === 'SET_THIS_AFTER_CREATING_ATA_FOR_WALLET_B'
  ) {
    throw new Error(
      'token-config.json not configured. Follow instructions from: node src/setup/token-setup.js'
    );
  }

  return tokenConfig;
}

async function main() {
  try {
    console.log('Starting Solana Raw Multi-Transfer\n');
    console.log('Configuration:');
    console.log(`  Network: ${config.network}`);
    console.log(`  RPC: ${config.rpcEndpoint}`);
    console.log(`  Sender: ${config.walletA.publicKey}`);
    console.log(`  Receiver A: ${config.walletA.publicKey}`);
    console.log(`  Receiver B: ${config.walletB.publicKey}`);
    console.log(`  SOL per transfer: ${config.transfers.solAmount} lamports`);
    console.log(`  Token per transfer: ${config.transfers.tokenAmount}\n`);

    // Load token configuration
    console.log('Loading token configuration...');
    const tokenConfig = await loadTokenConfig();
    console.log(`Token Mint: ${tokenConfig.tokenMint}`);
    console.log(`Wallet A Token Account: ${tokenConfig.walletATokenAccount}`);
    console.log(`Wallet B Token Account: ${tokenConfig.walletBTokenAccount}`);
    console.log(`Token Decimals: ${tokenConfig.tokenDecimals}\n`);

    // Import sender keypair for signing
    console.log('Loading sender keypair...');
    const senderKeypair = importKeypair(config.walletA.privateKey);
    console.log(`Sender public key loaded: ${senderKeypair.publicKey}\n`);

    // Create SOL transfer instructions
    console.log('Creating SOL transfer instructions...');
    const [solTransfer1, solTransfer2] = createBothSystemTransfers(
      config.walletA.publicKey,
      config.walletA.publicKey,
      config.walletB.publicKey,
      config.transfers.solAmount
    );
    console.log('SOL transfers created:');
    console.log(`  1. ${config.walletA.publicKey.substring(0, 8)}... -> ${config.walletA.publicKey.substring(0, 8)}...`);
    console.log(`  2. ${config.walletA.publicKey.substring(0, 8)}... -> ${config.walletB.publicKey.substring(0, 8)}...\n`);

    // Create SPL token transfer instructions
    console.log('Creating SPL token transfer instructions...');
    console.log(`Using real token accounts from token-config.json\n`);

    const [tokenTransfer1, tokenTransfer2] = createBothTokenTransfers(
      tokenConfig.walletATokenAccount,
      tokenConfig.walletATokenAccount,
      tokenConfig.walletBTokenAccount,
      config.walletA.publicKey,
      config.transfers.tokenAmount
    );
    console.log('Token transfers created:');
    console.log(`  1. Wallet A token account -> Wallet A token account (transfer to self)`);
    console.log(`  2. Wallet A token account -> Wallet B token account\n`);

    // Build transaction
    console.log('Building transaction with all 4 instructions...\n');
    const txBuilder = new TransactionBuilder(config.rpcEndpoint);

    txBuilder
      .setFeePayer(config.walletA.publicKey, senderKeypair.secretKey)
      .addInstructions([solTransfer1, solTransfer2, tokenTransfer1, tokenTransfer2]);

    console.log('Instructions added to transaction:');
    console.log('  1. SOL transfer to Wallet A');
    console.log('  2. SOL transfer to Wallet B');
    console.log('  3. Token transfer to Wallet A');
    console.log('  4. Token transfer to Wallet B\n');

    // Build and submit
    console.log('Building, signing, and submitting transaction...\n');
    const result = await txBuilder.buildAndSubmit();

    if (result.success) {
      console.log('\nTransaction completed successfully!');
      console.log(`Signature: ${result.signature}`);
      console.log(`View on Solana Explorer: https://explorer.solana.com/tx/${result.signature}?cluster=devnet`);
    } else {
      console.log('\nTransaction failed:');
      console.log(`Error: ${result.error || result.message}`);
      if (result.signature) {
        console.log(`Signature: ${result.signature}`);
      }
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

main();

