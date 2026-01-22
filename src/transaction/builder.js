const { Encoder } = require('../utils/encoding');
const { pubkeyToBytes, bytesToPubkey, importKeypair, signMessage } = require('../utils/keypair');
const { getLatestBlockhash, sendRawTransaction, confirmTransaction } = require('../utils/rpc');
const crypto = require('crypto');

/**
 * Build and sign a complete Solana transaction
 * Follows the Solana transaction message specification
 */
class TransactionBuilder {
  constructor(rpcEndpoint) {
    this.rpcEndpoint = rpcEndpoint;
    this.instructions = [];
    this.feePayer = null;
    this.recentBlockhash = null;
  }

  /**
   * Add an instruction to the transaction
   * @param {object} instruction - Instruction object with programId, accounts, data
   */
  addInstruction(instruction) {
    this.instructions.push(instruction);
    return this;
  }

  /**
   * Add multiple instructions
   * @param {array} instructions - Array of instruction objects
   */
  addInstructions(instructions) {
    this.instructions.push(...instructions);
    return this;
  }

  /**
   * Set the fee payer (must be a signer)
   * @param {string} publicKey - Fee payer public key
   * @param {Uint8Array} secretKey - Fee payer secret key for signing
   */
  setFeePayer(publicKey, secretKey) {
    this.feePayer = {
      publicKey,
      secretKey,
      publicKeyBytes: pubkeyToBytes(publicKey),
    };
    return this;
  }

  /**
   * Fetch recent blockhash from network
   */
  async fetchBlockhash() {
    console.log('Fetching recent blockhash from network...');
    const blockHashData = await getLatestBlockhash(this.rpcEndpoint);
    this.recentBlockhash = blockHashData.blockhash;
    this.lastValidBlockHeight = blockHashData.lastValidBlockHeight;
    console.log(`Blockhash fetched: ${this.recentBlockhash}`);
    return this.recentBlockhash;
  }

  /**
   * Build transaction message
   * Returns the serialized message that will be signed
   */
  buildMessage() {
    if (!this.feePayer) {
      throw new Error('Fee payer not set');
    }
    if (!this.recentBlockhash) {
      throw new Error('Recent blockhash not fetched');
    }
    if (this.instructions.length === 0) {
      throw new Error('No instructions added to transaction');
    }

    console.log(`Building transaction message with ${this.instructions.length} instructions...`);

    // Collect all unique account public keys
    const accountSet = new Map();
    const signers = new Set();

    // Add fee payer first (must be first and always a signer)
    accountSet.set(this.feePayer.publicKey, {
      pubkey: this.feePayer.publicKey,
      pubkeyBytes: this.feePayer.publicKeyBytes,
      isSigner: true,
      isWritable: true,
    });
    signers.add(this.feePayer.publicKey);

    // Add accounts from all instructions
    for (const instruction of this.instructions) {
      for (const account of instruction.accounts) {
        if (!accountSet.has(account.pubkey)) {
          accountSet.set(account.pubkey, {
            pubkey: account.pubkey,
            pubkeyBytes: account.pubkeyBytes,
            isSigner: account.isSigner,
            isWritable: account.isWritable,
          });
        }
        // Merge signer status
        const existing = accountSet.get(account.pubkey);
        if (account.isSigner) {
          existing.isSigner = true;
          signers.add(account.pubkey);
        }
        // Merge writable status
        if (account.isWritable) {
          existing.isWritable = true;
        }
      }
    }

    // Convert map to array
    const accounts = Array.from(accountSet.values());

    // Sort accounts: signers first, then writable, then readonly
    accounts.sort((a, b) => {
      const aSignerWeight = (a.isSigner ? 0 : 1) * 1000 + (a.isWritable ? 0 : 1) * 100;
      const bSignerWeight = (b.isSigner ? 0 : 1) * 1000 + (b.isWritable ? 0 : 1) * 100;
      return aSignerWeight - bSignerWeight;
    });

    // Count signer categories
    const numRequiredSignatures = accounts.filter(a => a.isSigner).length;
    const numReadonlyUnsignedAccounts = accounts.filter(a => !a.isSigner && !a.isWritable).length;
    const numReadonlySignedAccounts = 0; // No readonly signers in standard transactions

    console.log(`Transaction structure: ${numRequiredSignatures} signers, ${accounts.length - numRequiredSignatures} non-signers`);

    // Build message header
    const headerEncoder = new Encoder();
    headerEncoder.writeU8(numRequiredSignatures);
    headerEncoder.writeU8(numReadonlyUnsignedAccounts);
    headerEncoder.writeU8(numReadonlySignedAccounts);

    // Build account keys
    const accountKeysEncoder = new Encoder();
    accountKeysEncoder.writeU8(accounts.length);
    for (const account of accounts) {
      accountKeysEncoder.writeBytes(account.pubkeyBytes);
    }

    // Build recent blockhash (32 bytes)
    const blockhashBytes = this.base58ToBytes(this.recentBlockhash);

    // Build instructions
    const instructionsEncoder = new Encoder();
    instructionsEncoder.writeU8(this.instructions.length);

    for (const instruction of this.instructions) {
      // Find account indices
      const accountIndices = instruction.accounts.map(acc => {
        const index = accounts.findIndex(a => a.pubkey === acc.pubkey);
        if (index === -1) {
          throw new Error(`Account ${acc.pubkey} not found in transaction accounts`);
        }
        return index;
      });

      // Encode instruction
      instructionsEncoder.writeU8(instruction.accounts.length); // num accounts
      for (const idx of accountIndices) {
        instructionsEncoder.writeU8(idx);
      }

      // Find program index
      const programIndex = accounts.findIndex(a => a.pubkey === instruction.programId);
      if (programIndex === -1) {
        throw new Error(`Program ${instruction.programId} not found in transaction accounts`);
      }
      instructionsEncoder.writeU8(programIndex);

      // Instruction data
      instructionsEncoder.writeU32(instruction.data.length);
      instructionsEncoder.writeBytes(instruction.data);
    }

    // Build complete message
    const messageEncoder = new Encoder();
    messageEncoder.writeBytes(headerEncoder.toBuffer());
    messageEncoder.writeBytes(accountKeysEncoder.toBuffer());
    messageEncoder.writeBytes(blockhashBytes);
    messageEncoder.writeBytes(instructionsEncoder.toBuffer());

    const message = messageEncoder.toBuffer();
    console.log(`Transaction message built: ${message.length} bytes`);

    return {
      message,
      accounts,
      numRequiredSignatures,
    };
  }

  /**
   * Sign the transaction message
   */
  signMessage(message) {
    console.log('Signing transaction...');
    // Hash the message with SHA-512
    const messageHash = crypto.createHash('sha512').update(message).digest();
    // Sign with Ed25519
    const signature = signMessage(messageHash, this.feePayer.secretKey);
    console.log(`Transaction signed: ${bytesToPubkey(signature).substring(0, 8)}...`);
    return signature;
  }

  /**
   * Assemble complete transaction with signatures
   */
  assembleTransaction(message, signature) {
    console.log('Assembling transaction...');
    const transactionEncoder = new Encoder();

    // Signature count
    transactionEncoder.writeU8(1); // One signature from fee payer

    // Signature
    transactionEncoder.writeBytes(signature);

    // Message
    transactionEncoder.writeBytes(message);

    const transaction = transactionEncoder.toBuffer();
    console.log(`Transaction assembled: ${transaction.length} bytes`);

    return transaction;
  }

  /**
   * Build, sign, and submit transaction
   */
  async buildAndSubmit() {
    try {
      // Fetch blockhash
      await this.fetchBlockhash();

      // Build message
      const { message } = this.buildMessage();

      // Sign message
      const signature = this.signMessage(message);

      // Assemble transaction
      const transaction = this.assembleTransaction(message, signature);

      // Send transaction
      console.log('Submitting transaction to network...');
      const txSignature = await sendRawTransaction(this.rpcEndpoint, transaction);
      console.log(`Transaction submitted: ${txSignature}`);

      // Confirm transaction
      console.log('Waiting for transaction confirmation...');
      const confirmed = await confirmTransaction(this.rpcEndpoint, txSignature);

      if (confirmed) {
        console.log('Transaction confirmed on-chain!');
        return {
          success: true,
          signature: txSignature,
        };
      } else {
        console.log('Transaction confirmation timed out');
        return {
          success: false,
          signature: txSignature,
          message: 'Confirmation timeout',
        };
      }
    } catch (err) {
      console.error(`Transaction failed: ${err.message}`);
      return {
        success: false,
        error: err.message,
      };
    }
  }

  /**
   * Helper: Convert base58 to bytes
   */
  base58ToBytes(base58str) {
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let num = 0n;

    for (let char of base58str) {
      const digit = alphabet.indexOf(char);
      if (digit === -1) {
        throw new Error(`Invalid base58 character: ${char}`);
      }
      num = num * 58n + BigInt(digit);
    }

    // Convert to bytes
    const bytes = [];
    while (num > 0n) {
      bytes.unshift(Number(num % 256n));
      num = num / 256n;
    }

    // Pad to 32 bytes for blockhash
    while (bytes.length < 32) {
      bytes.unshift(0);
    }

    return Buffer.from(bytes.slice(0, 32));
  }
}

module.exports = TransactionBuilder;
