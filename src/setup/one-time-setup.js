#!/usr/bin/env node

/**
 * One-time Setup: Create SPL Token, ATAs, and Mint Tokens
 * This script runs ONCE to set up everything needed for the multi-transfer
 * 
 * Uses @solana/web3.js for setup only (one-time use)
 * The main transfer script uses pure raw instruction encoding (no SDKs)
 * 
 * What it does:
 * 1. Creates SPL token mint on devnet using Wallet A
 * 2. Creates Associated Token Account (ATA) for Wallet A
 * 3. Creates Associated Token Account (ATA) for Wallet B
 * 4. Mints 1 million tokens to Wallet A's token account
 * 5. Saves all addresses to token-config.json
 * 
 * After this runs ONCE, you only need to run: npm run send
 */

const fs = require('fs');
const path = require('path');
const { Connection, Keypair, PublicKey } = require('@solana/web3.js');
const { createMint, createAssociatedTokenAccount, mintTo } = require('@solana/spl-token');
const config = require('../config');
const bs58 = require('bs58');

const tokenConfigPath = path.join(__dirname, '..', '..', 'token-config.json');

async function setupTokens() {
  try {
    console.log('Starting one-time SPL token setup...\n');
    console.log('Wallet A: ' + config.walletA.publicKey);
    console.log('Wallet B: ' + config.walletB.publicKey + '\n');

    // Connect to devnet
    console.log('Connecting to Solana devnet...');
    const connection = new Connection(config.rpcEndpoint, 'confirmed');

    // Import Wallet A keypair
    console.log('Loading Wallet A keypair...');
    const walletAPrivateKeyBuffer = bs58.decode(config.walletA.privateKey);
    const walletAKeypair = Keypair.fromSecretKey(walletAPrivateKeyBuffer);
    
    console.log(`Wallet A public key: ${walletAKeypair.publicKey.toString()}`);
    console.log(`Wallet A balance: ${await connection.getBalance(walletAKeypair.publicKey)} lamports\n`);

    // Check Wallet A has SOL
    const balance = await connection.getBalance(walletAKeypair.publicKey);
    if (balance < 10000000) {
      throw new Error('Wallet A has insufficient SOL. Need at least 0.01 SOL for setup.');
    }

    // Step 1: Create token mint
    console.log('Step 1: Creating SPL token mint...');
    const mint = await createMint(
      connection,
      walletAKeypair,
      walletAKeypair.publicKey,
      walletAKeypair.publicKey,
      6 // 6 decimals
    );
    console.log(`Token mint created: ${mint.toString()}\n`);

    // Step 2: Create ATA for Wallet A
    console.log('Step 2: Creating Associated Token Account for Wallet A...');
    const walletATokenAccount = await createAssociatedTokenAccount(
      connection,
      walletAKeypair,
      mint,
      walletAKeypair.publicKey
    );
    console.log(`Wallet A ATA created: ${walletATokenAccount.toString()}\n`);

    // Step 3: Create ATA for Wallet B
    console.log('Step 3: Creating Associated Token Account for Wallet B...');
    const walletBPublicKey = new PublicKey(config.walletB.publicKey);
    const walletBTokenAccount = await createAssociatedTokenAccount(
      connection,
      walletAKeypair,
      mint,
      walletBPublicKey
    );
    console.log(`Wallet B ATA created: ${walletBTokenAccount.toString()}\n`);

    // Step 4: Mint 1 million tokens to Wallet A
    console.log('Step 4: Minting 1,000,000 tokens to Wallet A...');
    await mintTo(
      connection,
      walletAKeypair,
      mint,
      walletATokenAccount,
      walletAKeypair.publicKey,
      1000000 * Math.pow(10, 6) // 1 million with 6 decimals
    );
    console.log('Tokens minted successfully!\n');

    // Save configuration
    console.log('Step 5: Saving configuration to token-config.json...');
    const tokenConfig = {
      setupDate: new Date().toISOString(),
      status: 'READY',
      tokenMint: mint.toString(),
      walletATokenAccount: walletATokenAccount.toString(),
      walletBTokenAccount: walletBTokenAccount.toString(),
      tokenDecimals: 6,
      walletA: config.walletA.publicKey,
      walletB: config.walletB.publicKey,
    };

    fs.writeFileSync(tokenConfigPath, JSON.stringify(tokenConfig, null, 2));
    console.log(`Configuration saved to: ${tokenConfigPath}\n`);

    console.log('==================================================');
    console.log('SUCCESS! Setup complete. Ready to run transfers.');
    console.log('==================================================\n');
    console.log('Token Details:');
    console.log(`  Token Mint: ${mint.toString()}`);
    console.log(`  Wallet A ATA: ${walletATokenAccount.toString()}`);
    console.log(`  Wallet B ATA: ${walletBTokenAccount.toString()}\n`);

    console.log('Next step: Run the multi-transfer');
    console.log('  npm run send\n');

    return tokenConfig;
  } catch (err) {
    console.error('Error during setup:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  setupTokens();
}

module.exports = setupTokens;
