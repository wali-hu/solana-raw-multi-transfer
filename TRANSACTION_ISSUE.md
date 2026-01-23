# Transaction Submission Issue - Versioned Transactions

## Issue Description

The pure raw transaction building is working correctly (369 bytes assembled), but submission fails with:
```
RPC Error: failed to deserialize solana_transaction::versioned::VersionedTransaction: 
io error: failed to fill whole buffer
```

## Root Cause

Solana's current network implementation requires **Versioned Transactions** (v0 format), which have a different structure than legacy transactions.

**Legacy Format (What we built):**
```
[1 byte] Signature count
[64 bytes] Signature
[message] Message
```

**Versioned Format (What network expects):**
```
[1 byte] Version header (255 = versioned)
[1 byte] Version number (0)
[1 byte] Signature count
[64 bytes] Signatures
[message] Message
```

## Solution

Two options:

### Option 1: Use SDK for RPC Submission Only (Current Approach)
Keep the pure raw instruction building but use SDK's sendTransaction for final submission:
- All instruction encoding: Pure raw
- Transaction building: Pure raw
- Final submission: Use @solana/web3.js (minimal dependency)

### Option 2: Implement Full Versioned Transaction Format
Extend TransactionBuilder to support v0 versioned transaction format:
- Add version header encoding
- Implement address lookup tables support
- Full end-to-end pure implementation

## Current Status

Milestones 1-4 are complete:
- Instruction encoding works
- Account deduplication works
- Message compilation works
- Signing works

The only issue is the final RPC format, which requires either:
1. Using SDK's transaction format for RPC (minimal)
2. Implementing versioned transaction format (complex)

## Recommendation

For production use, Option 1 is recommended:
- Keep 95% pure implementation
- Use SDK only for versioned transaction wrapper
- This is common in production systems (use tools where needed)

