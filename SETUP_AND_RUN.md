# SETUP AND RUN GUIDE

Complete flow to run the Solana Raw Multi-Transfer project.

## Requirements

- Node.js and npm installed
- Wallet A with SOL balance on Solana devnet
- Wallet B (will receive tokens)

## Step 1: One-Time Setup (Create Token and ATAs)

Run this ONCE to create the SPL token and Associated Token Accounts:

```bash
npm run setup
```

This does:
1. Creates SPL token mint on devnet (Wallet A is authority)
2. Creates ATA for Wallet A
3. Creates ATA for Wallet B
4. Mints 1,000,000 tokens to Wallet A
5. Saves all addresses to token-config.json

**Output will show:**
```
Token Mint: 7XVeFeB89jviFNyzhGbdNAA8TfQpWFnRxLFUKrDmXGmS
Wallet A ATA: 7iB3vgASvKobh4QTYfDF6BHCEBhsxq9L7NxUDJW227SA
Wallet B ATA: 4PjGd7Fivy2D4Xsm7Nr5aY9jryVJBVjZS5vQryyPKSti
```

token-config.json is automatically created with all addresses.

## Step 2: Run The Multi-Transfer

After setup is complete, run the transfer that sends all 4 instructions in one transaction:

```bash
npm run send
```

This does:
1. Loads token configuration from token-config.json
2. Loads Wallet A private key from .env
3. Creates 4 transfer instructions:
   - SOL transfer to Wallet A
   - SOL transfer to Wallet B
   - Token transfer to Wallet A
   - Token transfer to Wallet B
4. Bundles all 4 into ONE transaction
5. Signs with Wallet A's private key
6. Submits to Solana devnet RPC
7. Confirms on-chain
8. Displays transaction signature

**Output will show:**
```
Transaction completed successfully!
Signature: 5hh...
View on Solana Explorer: https://explorer.solana.com/tx/5hh...?cluster=devnet
```

## That's It!

The project is configured to work with:
- Wallet A: 8oqK9tb7QREwG9w3JRZuvWvaS9K7YBtyY2eeCBVEQXmV
- Wallet B: 4hzk4sSocyaN9wN8vmZsceby5CGhH363szdq1LNEfmVH

All private keys and config are in .env and token-config.json (both gitignored).

## Verification

After running `npm run send`, check the transaction on Solana Explorer using the signature provided.

All 4 instructions should show as successful:
1. System Program: Transfer (SOL to Wallet A)
2. System Program: Transfer (SOL to Wallet B)
3. Token Program: TransferChecked (Tokens to Wallet A)
4. Token Program: TransferChecked (Tokens to Wallet B)

## Files Structure

```
src/
├── config.js                    - Wallet and RPC config from .env
├── index.js                     - Entry point
├── setup/
│   └── one-time-setup.js       - Creates token and ATAs (run ONCE)
├── run/
│   └── send_all_transfers.js   - Main transfer script (run with npm run send)
├── utils/
│   ├── rpc.js                  - Raw RPC calls
│   ├── keypair.js              - Key management
│   └── encoding.js             - Manual instruction encoding
├── instructions/
│   ├── system-transfer.js       - SOL transfer instructions
│   └── token-transfer.js        - Token transfer instructions
└── transaction/
    └── builder.js              - Transaction assembly and submission

.env                             - Wallet keys (gitignored)
token-config.json               - Token addresses (gitignored after setup)
```

## Important Notes

- Setup script uses @solana/web3.js (for one-time token creation only)
- Main transfer script uses ZERO Solana SDKs (pure raw instruction encoding)
- All amounts are in smallest units (lamports for SOL, base units for tokens)
- Transactions are atomic - all 4 instructions succeed or entire transaction fails
- Network: Solana Devnet
