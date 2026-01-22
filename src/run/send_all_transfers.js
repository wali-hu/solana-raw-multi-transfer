#!/usr/bin/env node

const config = require('../config');
const { importKeypair } = require('../utils/keypair');
const { createBothSystemTransfers } = require('../instructions/system-transfer');
const { createBothTokenTransfers } = require('../instructions/token-transfer');
const fs = require('fs');
const path = require('path');
const { Connection, Keypair, PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction } = require('@solana/web3.js');
const { TOKEN_PROGRAM_ID, createTransferInstruction } = require('@solana/spl-token');
const bs58 = require('bs58').default || require('bs58');

const tokenConfigPath = path.join(__dirname, '..', '..', 'token-config.json');

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
    console.log(`Token Decimals: ${tokenConfig.tokenDecimals}\n`);

    // Connect to devnet
    const connection = new Connection(config.rpcEndpoint, 'confirmed');

    // Import Wallet A keypair
    console.log('Loading sender keypair...');
    const walletAPrivateKeyBuffer = bs58.decode(config.walletA.privateKey);
    const walletAKeypair = Keypair.fromSecretKey(walletAPrivateKeyBuffer);
    
    console.log(`Sender public key loaded: ${walletAKeypair.publicKey.toString()}\n`);

    // Create transaction
    console.log('Creating transaction with 4 instructions...\n');
    const transaction = new Transaction();

    // Instruction 1: SOL transfer to Wallet A (self)
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: walletAKeypair.publicKey,
        toPubkey: walletAKeypair.publicKey,
        lamports: config.transfers.solAmount,
      })
    );
    console.log('Instruction 1: SOL transfer to Wallet A');

    // Instruction 2: SOL transfer to Wallet B
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: walletAKeypair.publicKey,
        toPubkey: new PublicKey(config.walletB.publicKey),
        lamports: config.transfers.solAmount,
      })
    );
    console.log('Instruction 2: SOL transfer to Wallet B');

    // Instruction 3: Token transfer to Wallet A (self)
    transaction.add(
      createTransferInstruction(
        new PublicKey(tokenConfig.walletATokenAccount),
        new PublicKey(tokenConfig.walletATokenAccount),
        walletAKeypair.publicKey,
        config.transfers.tokenAmount
      )
    );
    console.log('Instruction 3: Token transfer to Wallet A');

    // Instruction 4: Token transfer to Wallet B
    transaction.add(
      createTransferInstruction(
        new PublicKey(tokenConfig.walletATokenAccount),
        new PublicKey(tokenConfig.walletBTokenAccount),
        walletAKeypair.publicKey,
        config.transfers.tokenAmount
      )
    );
    console.log('Instruction 4: Token transfer to Wallet B\n');

    console.log('Signing and submitting transaction...\n');

    // Send and confirm transaction
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [walletAKeypair],
      { commitment: 'confirmed' }
    );

    console.log('Transaction completed successfully!');
    console.log(`Signature: ${signature}`);
    console.log(`View on Solana Explorer: https://explorer.solana.com/tx/${signature}?cluster=devnet\n`);

  } catch (err) {
    console.error('Fatal error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

main();
