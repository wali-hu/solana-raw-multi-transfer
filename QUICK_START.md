# Quick Start - Command Flow

## Step 1: Configure Solana CLI for Devnet

```bash
solana config set --url https://api.devnet.solana.com
solana config get
```

## Step 2: Verify Wallet and Get SOL (if needed)

```bash
solana address
solana balance
```

If balance is 0 or low:
```bash
solana airdrop 2
```

## Step 3: Create SPL Token (6 decimals)

```bash
spl-token create-token --decimals 6
```

SAVE THE OUTPUT: Token address (e.g., EjvFKa29XSuQ8w9HzB8Kx9vqSz2vPCRfg9U2n5b9p5s6)

```bash
export TOKEN_MINT="<paste-token-address-here>"
echo $TOKEN_MINT
```

## Step 4: Create Associated Token Account for Wallet A (Sender)

```bash
spl-token create-account $TOKEN_MINT
```

SAVE THE OUTPUT: Wallet A ATA address

```bash
export WALLET_A_ATA="<paste-wallet-a-ata-here>"
echo $WALLET_A_ATA
```

## Step 5: Create Associated Token Account for Wallet B (Receiver)

```bash
spl-token create-account $TOKEN_MINT --owner 4hzk4sSocyaN9wN8vmZsceby5CGhH363szdq1LNEfmVH
```

SAVE THE OUTPUT: Wallet B ATA address

```bash
export WALLET_B_ATA="<paste-wallet-b-ata-here>"
echo $WALLET_B_ATA
```

## Step 6: Mint 1 Million Tokens to Wallet A

```bash
spl-token mint $TOKEN_MINT 1000000
```

## Step 7: Verify Token Balance

```bash
spl-token balance $TOKEN_MINT
```

Output should show: 1000000

## Step 8: Create token-config.json in Project Root

In directory: /home/abdullah/solana-raw-multitransfer/

Create file: token-config.json

Content:
```json
{
  "tokenMint": "PASTE_TOKEN_MINT_HERE",
  "walletATokenAccount": "PASTE_WALLET_A_ATA_HERE",
  "walletBTokenAccount": "PASTE_WALLET_B_ATA_HERE",
  "tokenDecimals": 6
}
```

Replace the values with your addresses from steps 3, 4, and 5.

Example:
```json
{
  "tokenMint": "EjvFKa29XSuQ8w9HzB8Kx9vqSz2vPCRfg9U2n5b9p5s6",
  "walletATokenAccount": "A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8S9t0U1v2W3x4Y5z6",
  "walletBTokenAccount": "Z1y2X3w4V5u6T7s8R9q0P1o2N3m4L5k6J7i8H9g0F1e2D3c4",
  "tokenDecimals": 6
}
```

## Step 9: Run the Multi-Transfer

From project root:
```bash
cd /home/abdullah/solana-raw-multitransfer
npm run send
```

## What Happens

1. Loads configuration
2. Loads your wallet private key from .env
3. Creates 4 transfer instructions:
   - SOL transfer to Wallet A
   - SOL transfer to Wallet B
   - Token transfer to Wallet A
   - Token transfer to Wallet B
4. Bundles all 4 into ONE transaction
5. Signs the transaction
6. Submits to Solana devnet RPC
7. Waits for confirmation
8. Displays transaction signature

## Expected Output

```
Starting Solana Raw Multi-Transfer

Configuration:
  Network: devnet
  RPC: https://api.devnet.solana.com
  Sender: 8oqK9tb7QREwG9w3JRZuvWvaS9K7YBtyY2eeCBVEQXmV
  Receiver A: 8oqK9tb7QREwG9w3JRZuvWvaS9K7YBtyY2eeCBVEQXmV
  Receiver B: 4hzk4sSocyaN9wN8vmZsceby5CGhH363szdq1LNEfmVH
  SOL per transfer: 1000000 lamports
  Token per transfer: 1000000

Loading token configuration...
Token Mint: EjvFKa29XSuQ8w9HzB8Kx9vqSz2vPCRfg9U2n5b9p5s6
Wallet A Token Account: A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7r8S9t0U1v2W3x4Y5z6
Wallet B Token Account: Z1y2X3w4V5u6T7s8R9q0P1o2N3m4L5k6J7i8H9g0F1e2D3c4
Token Decimals: 6

Loading sender keypair...
Sender public key loaded: 8oqK9tb7QREwG9w3JRZuvWvaS9K7YBtyY2eeCBVEQXmV

Creating SOL transfer instructions...
SOL transfers created:
  1. 8oqK9tb... -> 8oqK9tb...
  2. 8oqK9tb... -> 4hzk4sS...

Creating SPL token transfer instructions...
Using real token accounts from token-config.json

Token transfers created:
  1. Wallet A token account -> Wallet A token account (transfer to self)
  2. Wallet A token account -> Wallet B token account

Building transaction with all 4 instructions...

Instructions added to transaction:
  1. SOL transfer to Wallet A
  2. SOL transfer to Wallet B
  3. Token transfer to Wallet A
  4. Token transfer to Wallet B

Building, signing, and submitting transaction...

Fetching recent blockhash from network...
Blockhash fetched: XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

Building transaction message with 4 instructions...
Transaction structure: 1 signers, 5 non-signers

Signing transaction...
Transaction signed: XXXXX...

Assembling transaction...
Transaction assembled: XXX bytes

Submitting transaction to network...
Transaction submitted: XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

Waiting for transaction confirmation...

Transaction completed successfully!
Signature: XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
View on Solana Explorer: https://explorer.solana.com/tx/XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX?cluster=devnet
```

## Verification

Check token balance:
```bash
spl-token balance $TOKEN_MINT
```

View transaction on Solana Explorer (use the signature from output):
```
https://explorer.solana.com/tx/<SIGNATURE>?cluster=devnet
```

Check if transaction is successful (all 4 instructions executed atomically).

## Complete Command Sequence (Copy-Paste)

```bash
# 1. Setup devnet
solana config set --url https://api.devnet.solana.com

# 2. Check wallet
solana address
solana balance

# 3. Airdrop SOL if needed
solana airdrop 2

# 4. Create token
spl-token create-token --decimals 6
# SAVE TOKEN_MINT from output
TOKEN_MINT="paste-token-address"

# 5. Create ATA for Wallet A
spl-token create-account $TOKEN_MINT
# SAVE WALLET_A_ATA from output
WALLET_A_ATA="paste-wallet-a-ata"

# 6. Create ATA for Wallet B
spl-token create-account $TOKEN_MINT --owner 4hzk4sSocyaN9wN8vmZsceby5CGhH363szdq1LNEfmVH
# SAVE WALLET_B_ATA from output
WALLET_B_ATA="paste-wallet-b-ata"

# 7. Mint tokens
spl-token mint $TOKEN_MINT 1000000

# 8. Verify
spl-token balance $TOKEN_MINT

# 9. Create token-config.json in project root with addresses
# (See Step 8 above for format)

# 10. Run transfer
cd /home/abdullah/solana-raw-multitransfer
npm run send
```
