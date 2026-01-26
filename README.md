# Solana Raw Multi-Transfer

A implementation of Solana transaction creation with **4 native transfer instructions** executed in a **single atomic transaction**, using **pure raw Solana protocol** without SDK dependencies in core logic.

## Project Summary

Execute a single atomic Solana transaction containing:
- **2 SOL transfers** (System Program)
- **2 SPL token transfers** (Token Program)
- All 4 instructions bundled in **ONE atomic transaction**
- Atomicity guarantee: all succeed or entire transaction fails
- Manual instruction encoding per Solana specifications
- **Zero SDK dependencies** in core transaction code

## Status

- **All Milestones:** COMPLETE
- **All Tests:** PASSING
- **Production Ready:** YES
- **Documentation:** Comprehensive (see below)

## Complete Documentation

For detailed documentation covering all aspects of this project, see:

### PROJECT_DOCUMENTATION.md

This comprehensive guide includes:
- All 4 Milestones with detailed explanations
- Setup and run guide (2-command flow)
- Architecture and code organization
- Technology stack explanation
- Real ATA PDA derivation (Milestone 1)
- ATA creation instructions (Milestone 2)
- System Program SOL transfers (Milestone 3)
- Full transaction building (Milestone 4)
- Security considerations
- Code quality metrics
- Test coverage details
- Key technical achievements
- Future enhancements

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. One-Time Setup (Creates Token & ATAs)

```bash
npm run setup
```

### 3. Run Multi-Transfer

```bash
npm run send-raw
```

This executes all 4 instructions in a single atomic transaction.

### 4. Run Tests

```bash
npm test
```

## Project Structure

```
src/
├── config.js                    # Configuration loader
├── index.js                     # Entry point
├── setup/
│   └── one-time-setup.js       # Token creation and ATA setup
├── run/
│   └── send_raw_multi_transfer.js  # Pure raw transaction execution
├── instructions/
│   ├── system-transfer.js       # System Program SOL transfers
│   └── token-transfer.js        # Token Program + ATA derivation
├── transaction/
│   └── builder.js              # TransactionBuilder class
├── utils/
│   ├── rpc.js                  # Raw HTTP RPC calls
│   ├── keypair.js              # Keypair management & Ed25519
│   └── encoding.js             # Manual instruction encoding
└── test/
    ├── test-ata-derivation.js
    ├── test-ata-creation.js
    ├── test-system-transfer.js
    └── test-transaction-builder.js
```

## Technology Stack

**Core Only (No SDKs):**
- Node.js (CommonJS)
- TweetNaCl.js (Ed25519 signing only)
- HTTPS (RPC communication)
- Built-in crypto (SHA-512, SHA-256)

**Optional (One-Time Setup Only):**
- @solana/web3.js (token creation only)
- @solana/spl-token (token initialization only)

**Zero dependencies in main transaction code:**
- No @solana/web3.js for transaction building
- No @solana/spl-token for instruction creation
- Manual instruction encoding per Solana specs

## Key Features

- Atomic Transactions: All 4 instructions succeed or entire TX reverts
- Pure Raw Implementation: Manual instruction encoding
- Account Deduplication: 10 raw accounts -> 4 unique accounts
- Proper Ordering: Signers first, then writable, then readonly
- Ed25519 Signing: SHA-512 hashing + Ed25519 signature
- RPC Submission: Full confirmation polling
- Comprehensive Tests: 4 test suites covering all functionality
- Production Ready: Error handling, validation, security  

## What Gets Created

After running `npm run setup`:
- SPL token mint on Solana devnet
- Associated Token Account (ATA) for Wallet A
- Associated Token Account (ATA) for Wallet B
- 1,000,000 tokens minted to Wallet A

After running `npm run send-raw`:
- Single atomic transaction with 4 instructions
- 1 million lamports to Wallet A
- 1 million lamports to Wallet B
- 1 million tokens to Wallet A
- 1 million tokens to Wallet B

## Security

- Private keys in `.env` (gitignored)
- No hardcoded secrets
- Token config auto-generated
- Read-only configuration usage
- Proper `.gitignore` setup

## Available Commands

```bash
npm run start       # Load and display configuration
npm run setup      # One-time setup (create token, ATAs, mint)
npm run send       # Send with SDK (for reference)
npm run send-raw   # Send with pure raw implementation
npm test           # Run all test suites
```

## Key Technical Achievements

### Account Deduplication
```
Before: 10 accounts (2+2+3+3 from 4 instructions)
After:  4 unique accounts (Wallet A, B, System, Token)
```

### Account Ordering
```
Order 1: Signers first (Wallet A)
Order 2: Writable non-signers (Wallet B)
Order 3: Readonly programs (System, Token)
```

### Transaction Assembly
```
Signature:    64 bytes
Message:      240 bytes
Total:        305 bytes
```

### Pure Implementation
- Real PDA derivation (SHA256, bump seeds)
- ATA creation instruction encoding (6 accounts)
- System Program SOL transfers (opcode 2)
- Token Program transfers (opcode 3)
- Message compilation per Solana spec
- Ed25519 signing
- Transaction assembly
- RPC submission & confirmation

## Example Transaction

**Network:** Solana Devnet
**Signature:** `4hNLvqVpEidhN2qKSpH5ejvkoBVUFv6e5sUg5Af1D8LsHNc16Q1MpXuD1VHsFny95PKBW1L3k7feuW1TmojNM9ay`

**Instructions (Atomic):**
1. SOL: Wallet A -> Wallet A (1,000,000 lamports)
2. SOL: Wallet A -> Wallet B (1,000,000 lamports)
3. Token: Wallet A -> Wallet A (1,000,000 tokens)
4. Token: Wallet A -> Wallet B (1,000,000 tokens)

**View on Explorer:**
https://explorer.solana.com/tx/4hNLvqVpEidhN2qKSpH5ejvkoBVUFv6e5sUg5Af1D8LsHNc16Q1MpXuD1VHsFny95PKBW1L3k7feuW1TmojNM9ay?cluster=devnet

## References

- [Solana Docs - Transactions](https://docs.solana.com/developing/programming-model/transactions)
- [Solana Docs - System Program](https://docs.rs/solana-program/latest/solana_program/system_instruction/enum.SystemInstruction.html)
- [Solana Docs - Token Program](https://docs.rs/spl-token/latest/spl_token/)
- [Ed25519 - TweetNaCl.js](https://tweetnacl.js.org/)

## Full Documentation

For comprehensive documentation including:
- Detailed milestone descriptions
- Architecture deep-dive
- Security considerations
- Code quality metrics
- Future enhancement ideas

See PROJECT_DOCUMENTATION.md

---

**Project Status:** PRODUCTION READY
**Repository:** https://github.com/wali-hu/solana-raw-multi-transfer
**Network:** Solana Devnet
**Last Updated:** 2026-01-26
