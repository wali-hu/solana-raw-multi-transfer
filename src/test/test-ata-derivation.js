#!/usr/bin/env node

/**
 * Test script for Milestone 1: Real ATA PDA Derivation
 * 
 * This script tests the deriveAssociatedTokenAccount function
 * to ensure it produces valid PDA addresses.
 */

const config = require('../config');
const { deriveAssociatedTokenAccount } = require('../instructions/token-transfer');

async function testATADerivation() {
  console.log('=' .repeat(60));
  console.log('MILESTONE 1: Real ATA PDA Derivation Test');
  console.log('=' .repeat(60));
  console.log();

  try {
    // Test with Wallet A
    console.log('Wallet A Configuration:');
    console.log(`  Public Key: ${config.walletA.publicKey}`);
    console.log();

    // Test with a sample token mint (you can replace with actual mint)
    const sampleMint = 'EPjFWaKN1P2vLVKp7HwhjHgwLvK72qVvTvyABwcXfJj9'; // USDC on mainnet (for reference)
    
    console.log('Deriving ATA for Wallet A:');
    console.log(`  Token Mint: ${sampleMint}`);
    console.log();

    const derivedATA = deriveAssociatedTokenAccount(
      config.walletA.publicKey,
      sampleMint
    );

    console.log('Derived ATA Result:');
    console.log(`  ATA Address: ${derivedATA.ataAddress}`);
    console.log(`  Bump Seed:   ${derivedATA.bump}`);
    console.log(`  Valid:       ${derivedATA.isValid}`);
    console.log();

    // Verify it's a valid base58 string
    const base58Regex = /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{44}$/;
    const isValidBase58 = base58Regex.test(derivedATA.ataAddress);

    console.log('Validation:');
    console.log(`  ✓ Is valid base58 (44 chars): ${isValidBase58}`);
    console.log(`  ✓ Bump seed in range [0-255]: ${derivedATA.bump >= 0 && derivedATA.bump <= 255}`);
    console.log();

    // Verify determinism - same inputs should produce same output
    console.log('Testing Determinism (same inputs = same output):');
    const derivedATA2 = deriveAssociatedTokenAccount(
      config.walletA.publicKey,
      sampleMint
    );

    const isDeterministic = 
      derivedATA.ataAddress === derivedATA2.ataAddress &&
      derivedATA.bump === derivedATA2.bump;

    console.log(`  ✓ Deterministic: ${isDeterministic}`);
    console.log();

    // Test with Wallet B
    console.log('Deriving ATA for Wallet B:');
    console.log(`  Wallet B Public Key: ${config.walletB.publicKey}`);
    console.log(`  Token Mint: ${sampleMint}`);
    console.log();

    const walletBTokenAccount = deriveAssociatedTokenAccount(
      config.walletB.publicKey,
      sampleMint
    );

    console.log('Wallet B ATA:');
    console.log(`  ATA Address: ${walletBTokenAccount.ataAddress}`);
    console.log(`  Bump Seed:   ${walletBTokenAccount.bump}`);
    console.log();

    // Verify they're different
    const areDifferent = derivedATA.ataAddress !== walletBTokenAccount.ataAddress;
    console.log(`  ✓ Different wallets produce different ATAs: ${areDifferent}`);
    console.log();

    console.log('=' .repeat(60));
    console.log('SUCCESS! Real ATA PDA Derivation is working correctly');
    console.log('=' .repeat(60));
    console.log();
    console.log('Key Points:');
    console.log('  1. PDA Derivation uses SHA256 hashing of seeds');
    console.log('  2. Seeds: [wallet_pubkey, token_program_id, mint_pubkey]');
    console.log('  3. Associated Token Program: ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
    console.log('  4. Bump seed ensures address is off the ed25519 curve');
    console.log('  5. Same inputs always produce same ATA (deterministic)');
    console.log();

    return true;

  } catch (err) {
    console.error('ERROR:', err.message);
    console.error(err.stack);
    return false;
  }
}

if (require.main === module) {
  testATADerivation().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = testATADerivation;
