# SPL Token Setup Guide

Before running the multi-transfer script, you need to:
1. Create an SPL token on Solana devnet
2. Create Associated Token Accounts (ATAs) for both wallets
3. Mint 1 million tokens to Wallet A

## Prerequisites

Install Solana CLI: https://docs.solana.com/cli/install-solana-cli-tools

Verify installation:
```bash
solana --version
spl-token --version
```

## Setup Steps

### Step 1: Configure Solana CLI for Devnet

```bash
solana config set --url https://api.devnet.solana.com
solana config get
```

### Step 2: Import Your Wallet

```bash
solana config set --keypair ~/.config/solana/id.json
```

Or import your wallet A private key:
```bash
solana-keygen recover ~/.config/solana/id.json
```

Verify your wallet:
```bash
solana address
solana account
```

### Step 3: Get Devnet SOL (if needed)

```bash
solana airdrop 2
```

Check balance:
```bash
solana balance
```

### Step 4: Create SPL Token

Create a new token with 6 decimals:
```bash
spl-token create-token --decimals 6
```

Output example:
```
Creating token EjvFKa29XSuQ8w9HzB8Kx9vqSz2vPCRfg9U2n5b9p5s6

Signature: 5XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

Save the token mint address (e.g., `EjvFKa29XSuQ8w9HzB8Kx9vqSz2vPCRfg9U2n5b9p5s6`)

### Step 5: Create Associated Token Accounts (ATAs)

Create ATA for Wallet A (your default wallet):
```bash
spl-token create-account <TOKEN_MINT_ADDRESS>
```

Output example:
```
Creating account A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8S9t0U1v2W3x4Y5z6

Signature: 5XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

Save the Wallet A token account address

Create ATA for Wallet B:
```bash
spl-token create-account <TOKEN_MINT_ADDRESS> --owner 4hzk4sSocyaN9wN8vmZsceby5CGhH363szdq1LNEfmVH
```

Save the Wallet B token account address

### Step 6: Mint 1 Million Tokens

```bash
spl-token mint <TOKEN_MINT_ADDRESS> 1000000
```

Verify:
```bash
spl-token balance <TOKEN_MINT_ADDRESS>
```

Should show `1000000`

### Step 7: Update token-config.json

Create/update `token-config.json` in project root:

```json
{
  "tokenMint": "<your-token-mint-address>",
  "walletATokenAccount": "<wallet-a-ata-address>",
  "walletBTokenAccount": "<wallet-b-ata-address>",
  "tokenDecimals": 6
}
```

Example:
```json
{
  "tokenMint": "EjvFKa29XSuQ8w9HzB8Kx9vqSz2vPCRfg9U2n5b9p5s6",
  "walletATokenAccount": "A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8S9t0U1v2W3x4Y5z6",
  "walletBTokenAccount": "Z1y2X3w4V5u6T7s8R9q0P1o2N3m4L5k6J7i8H9g0F1e2D3c4",
  "tokenDecimals": 6
}
```

### Step 8: Run the Multi-Transfer

```bash
npm run send
```

## Verification

Check token balances:
```bash
spl-token balance <TOKEN_MINT_ADDRESS> --owner <wallet-address>
```

View transaction on Solana Explorer:
```
https://explorer.solana.com/tx/<SIGNATURE>?cluster=devnet
```

## Troubleshooting

Account not found:
```bash
spl-token account <TOKEN_ACCOUNT_ADDRESS>
```

Wrong network:
```bash
solana config get
solana config set --url https://api.devnet.solana.com
```

No balance:
```bash
solana airdrop 2
solana balance
```

Token not found:
```bash
spl-token supply <TOKEN_MINT_ADDRESS>
```

## Quick Copy-Paste Commands

```bash
# 1. Set up devnet
solana config set --url https://api.devnet.solana.com

# 2. Create token
spl-token create-token --decimals 6

# 3. Create ATAs (replace TOKEN_MINT)
spl-token create-account <TOKEN_MINT>
spl-token create-account <TOKEN_MINT> --owner 4hzk4sSocyaN9wN8vmZsceby5CGhH363szdq1LNEfmVH

# 4. Mint tokens
spl-token mint <TOKEN_MINT> 1000000

# 5. Update token-config.json with addresses

# 6. Run transfer
npm run send
```
