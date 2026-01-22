# Solana Raw Multi-Transfer

A pure implementation of Solana transaction creation with **4 native transfer instructions** executed in a **single atomic transaction**, without using any Solana SDKs or external libraries.

## 🎯 Objective

Create and submit a Solana transaction containing:
- **2 SOL transfers** (System Program)
- **2 SPL token transfers** (Token Program)
- All 4 instructions bundled in **ONE transaction**
- Atomic behavior: all succeed or entire transaction fails
- Manual instruction encoding per Solana specs

## 🔧 Technology Stack

- **Runtime:** Node.js (CommonJS)
- **Crypto:** TweetNaCl.js (for signing only)
- **Network:** Solana Devnet
- **Zero Solana SDKs:** No `@solana/web3.js`, no `@solana/spl-token`

## 📁 Project Structure

```
src/
├── index.js                    # Entry point - loads config
├── config.js                   # Wallet, RPC, transfer config
├── utils/
│   ├── rpc.js                 # Raw HTTP RPC calls to Solana
│   ├── keypair.js             # Key pair handling, base58 encode/decode
│   └── encoding.js            # Manual instruction encoding utilities
├── instructions/
│   ├── system-transfer.js      # System Program SOL transfer builder
│   └── token-transfer.js       # Token Program SPL transfer builder
├── transaction/
│   └── builder.js             # Transaction assembly and submission
└── run/
    └── send_all_transfers.js  # Main execution script
```

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy and configure `.env`:

```bash
cp .env.example .env
```

Edit `.env` with your wallet details and private keys:

```env
WALLET_A_PUBLIC_KEY=<your-wallet-a-public-key>
WALLET_A_PRIVATE_KEY=<your-wallet-a-private-key>

WALLET_B_PUBLIC_KEY=<your-wallet-b-public-key>
WALLET_B_PRIVATE_KEY=<your-wallet-b-private-key>

RPC_ENDPOINT=https://api.devnet.solana.com
SOL_TRANSFER_AMOUNT_LAMPORTS=1000000
TOKEN_TRANSFER_AMOUNT=1000000
TOKEN_MINT_ADDRESS=<your-token-mint>
```

⚠️ **Security:** Never commit `.env` to version control. It's automatically ignored by `.gitignore`.

### 3. Verify Configuration

```bash
npm start
```

Output should display loaded wallets and transfer amounts.

### 4. Send Transaction

```bash
npm run send
```

This will:
1. Create 4 transfer instructions (2 SOL, 2 SPL token)
2. Bundle them into a single transaction
3. Sign with Wallet A's private key
4. Submit to Solana devnet
5. Confirm transaction on-chain

## 🔬 How It Works

### Instruction Encoding

Each Solana instruction follows this format:
```
[program_id: 32 bytes]
[num_accounts: 1 byte]
[...account_metadata: 34 bytes each]
[data_length: 4 bytes]
[instruction_data: variable]
```

#### System Program Transfer (SOL)
- Instruction opcode: `2` (for Transfer)
- Data: `[2][amount as u64 little-endian]`
- Accounts: `[from (signer, writable), to (writable)]`

#### Token Program Transfer (SPL Token)
- Instruction opcode: `3` (for Transfer)
- Data: `[3][amount as u64 little-endian]`
- Accounts: `[source token account, mint, destination token account, owner (signer)]`

### Transaction Structure

```
[header: 3 bytes]
[num_accounts: 1 byte]
[...account keys: 32 bytes each]
[recent_blockhash: 32 bytes]
[num_instructions: 1 byte]
[...instructions: variable]
```

### Signing

1. Serialize the transaction message (without signatures)
2. Hash it with SHA-512
3. Sign hash with Ed25519 using private key
4. Attach signature to transaction

## 🛠️ Utilities Reference

### `config.js`
Loads environment variables and provides centralized configuration.

**Exports:**
- `rpcEndpoint` - Solana RPC URL
- `network` - Network name ('devnet')
- `walletA` / `walletB` - Wallet public/private keys
- `transfers` - SOL and token amounts
- `tokenMint` - SPL token mint address

### `rpc.js`
Raw HTTP JSON-RPC calls to Solana endpoint.

**Functions:**
- `rpcCall(endpoint, method, params)` - Generic RPC call
- `getLatestBlockhash(endpoint)` - Get recent blockhash
- `getAccountInfo(endpoint, pubkey)` - Get account data
- `sendRawTransaction(endpoint, txBytes)` - Submit transaction
- `confirmTransaction(endpoint, signature, maxRetries)` - Wait for confirmation

### `keypair.js`
Cryptographic key operations and base58 encoding.

**Functions:**
- `importKeypair(privateKeyBase58)` - Import keypair from private key
- `signMessage(message, secretKey)` - Sign with Ed25519
- `base58Encode(bytes)` - Encode to base58
- `base58Decode(encoded)` - Decode from base58
- `pubkeyToBytes(pubkeyBase58)` - Convert pubkey string to bytes
- `bytesToPubkey(bytes)` - Convert bytes to pubkey string

### `encoding.js`
Manual instruction encoding following Solana specifications.

**Classes:**
- `Encoder` - Buffer construction helper with methods:
  - `writeU8(value)` - Write 8-bit integer
  - `writeU32(value)` - Write 32-bit integer (little-endian)
  - `writeU64(value)` - Write 64-bit integer (little-endian)
  - `writeBytes(bytes)` - Write raw bytes
  - `toBuffer()` - Get final buffer

**Functions:**
- `encodeAccountMeta(pubkey, isSigner, isWritable)` - Encode account metadata
- `encodeInstruction(programId, accounts, data)` - Build complete instruction
- `encodeTransactionHeader(numSigners, ...)` - Build tx header
- `encodeCompactArray(items)` - Length-prefixed array

## 📊 Milestones

- ✅ **Milestone 1:** Setup & Core Utilities
  - Config, RPC, keypair, encoding utilities
  
- ⏳ **Milestone 2:** SOL Transfer Instructions
  - System Program instruction builders
  
- ⏳ **Milestone 3:** SPL Token Transfer Instructions
  - Token Program instruction builders
  
- ⏳ **Milestone 4:** Transaction Assembly & Submission
  - Full end-to-end implementation

## 📝 Notes

- All amounts are in **lamports** for SOL (1 SOL = 1,000,000 lamports)
- Token amounts depend on token decimals (usually 1,000,000 for 6 decimals)
- Transactions are built for **Devnet** - use different RPC for Mainnet
- Private keys are stored in `.env` which is gitignored - never commit secrets

## 🔗 References

- [Solana System Program Spec](https://docs.rs/solana-program/latest/solana_program/system_instruction/enum.SystemInstruction.html)
- [Solana Token Program Spec](https://docs.rs/spl-token/latest/spl_token/)
- [Solana Transaction Format](https://docs.solana.com/developing/programming-model/transactions)
- [Ed25519 Signing](https://tweetnacl.js.org/)
