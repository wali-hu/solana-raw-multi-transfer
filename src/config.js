const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  
  if (!fs.existsSync(envPath)) {
    throw new Error('.env file not found. Create it from .env.example');
  }

  const envFile = fs.readFileSync(envPath, 'utf-8');
  const env = {};

  envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      env[key.trim()] = value.trim();
    }
  });

  return env;
}

const env = loadEnv();

module.exports = {
  // Network
  rpcEndpoint: env.RPC_ENDPOINT || 'https://api.devnet.solana.com',
  network: 'devnet',

  // Wallet A - Sender (for minting/sending)
  walletA: {
    publicKey: env.WALLET_A_PUBLIC_KEY,
    privateKey: env.WALLET_A_PRIVATE_KEY,
  },

  // Wallet B - Receiver
  walletB: {
    publicKey: env.WALLET_B_PUBLIC_KEY,
    privateKey: env.WALLET_B_PRIVATE_KEY,
  },

  // Transfer Configuration
  transfers: {
    solAmount: parseInt(env.SOL_TRANSFER_AMOUNT_LAMPORTS || '1000000'), // lamports
    tokenAmount: parseInt(env.TOKEN_TRANSFER_AMOUNT || '1000000'),
  },

  // Token Mint Address
  tokenMint: env.TOKEN_MINT_ADDRESS || 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',

  // System Program ID (hardcoded, standard on all Solana clusters)
  systemProgram: '11111111111111111111111111111111',

  // Token Program ID (hardcoded, standard on all Solana clusters)
  tokenProgram: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
};
