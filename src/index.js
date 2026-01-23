/**
 * Solana Raw Multi-Transfer
 * Single transaction with 4 native transfer instructions (2 SOL, 2 SPL token)
 * No Solana SDKs or external libraries used - pure raw instruction encoding
 */

const config = require('./config');

console.log('Solana Raw Multi-Transfer Project');
console.log(`Network: ${config.network}`);
console.log(`RPC: ${config.rpcEndpoint}`);
console.log('\nWallets loaded:');
console.log(`  Wallet A (Sender): ${config.walletA.publicKey}`);
console.log(`  Wallet B (Receiver): ${config.walletB.publicKey}`);
console.log('\nTransfer Configuration:');
console.log(`  SOL per transfer: ${config.transfers.solAmount} lamports`);
console.log(`  Token per transfer: ${config.transfers.tokenAmount}`);
console.log(`  Token Mint: ${config.tokenMint}\n`);

console.log('Config loaded successfully. Ready for instruction building.\n');
