#!/usr/bin/env node

/**
 * SPL Token Setup Helper
 * Creates a new SPL token mint and derives Associated Token Accounts (ATAs)
 * 
 * Note: This is a helper script. In production, you would use Solana CLI or web UI.
 * 
 * Instructions:
 * 1. Use Solana CLI to create a new token mint
 * 2. This script will store the token addresses for use in main transfer script
 */

const fs = require('fs');
const path = require('path');
const config = require('../config');

const tokenConfigPath = path.join(__dirname, '..', '..', 'token-config.json');

function generateTokenSetupInstructions() {
  const instructions = `
SPL Token Setup Instructions
=============================

This project requires an SPL token on Solana devnet for testing token transfers.

Step 1: Create a new token mint using Solana CLI
-------------------------------------------------
  spl-token create-token --decimals 6

  This will output a token mint address. Save it for the next step.
  Example output: Token: EjvFKa29...

Step 2: Create Associated Token Accounts (ATAs)
-------------------------------------------------
  For Wallet A (Sender):
    spl-token create-account <TOKEN_MINT_ADDRESS>

  For Wallet B (Receiver):
    spl-token create-account <TOKEN_MINT_ADDRESS> --owner ${config.walletB.publicKey}

  This will output ATA addresses. Save them.
  Example output: Creating account A... Account: E2w1...

Step 3: Mint tokens to Wallet A
---------------------------------
  spl-token mint <TOKEN_MINT_ADDRESS> 1000000

  This creates 1,000,000 tokens (with 6 decimals = 1,000,000 base units)

Step 4: Update token-config.json
---------------------------------
  Create token-config.json in project root with:
  {
    "tokenMint": "<your-token-mint-address>",
    "walletATokenAccount": "<wallet-a-ata-address>",
    "walletBTokenAccount": "<wallet-b-ata-address>",
    "tokenDecimals": 6
  }

Step 5: Run the transfer script
---------------------------------
  npm run send

Solana CLI Installation
========================

If you don't have Solana CLI installed:
  https://docs.solana.com/cli/install-solana-cli-tools

Make sure you're on devnet:
  solana config set --url https://api.devnet.solana.com

Verify setup:
  solana address
  spl-token balance <TOKEN_MINT_ADDRESS>
`;

  return instructions;
}

function createTokenConfig() {
  const defaultConfig = {
    tokenMint: 'SET_THIS_AFTER_CREATING_TOKEN',
    walletATokenAccount: 'SET_THIS_AFTER_CREATING_ATA_FOR_WALLET_A',
    walletBTokenAccount: 'SET_THIS_AFTER_CREATING_ATA_FOR_WALLET_B',
    tokenDecimals: 6,
    created: new Date().toISOString(),
  };

  if (!fs.existsSync(tokenConfigPath)) {
    fs.writeFileSync(tokenConfigPath, JSON.stringify(defaultConfig, null, 2));
    console.log(`Created token-config.json at ${tokenConfigPath}`);
  }

  return defaultConfig;
}

function loadTokenConfig() {
  if (fs.existsSync(tokenConfigPath)) {
    const data = fs.readFileSync(tokenConfigPath, 'utf-8');
    return JSON.parse(data);
  }
  return null;
}

function main() {
  console.log('SPL Token Setup Helper\n');
  console.log('This project requires an SPL token and Associated Token Accounts (ATAs) for testing.\n');

  const instructions = generateTokenSetupInstructions();
  console.log(instructions);

  const tokenConfig = createTokenConfig();
  console.log('\nToken configuration template saved to: token-config.json\n');
  console.log('Current template:');
  console.log(JSON.stringify(tokenConfig, null, 2));
}

if (require.main === module) {
  main();
}

module.exports = {
  generateTokenSetupInstructions,
  createTokenConfig,
  loadTokenConfig,
  tokenConfigPath,
};
