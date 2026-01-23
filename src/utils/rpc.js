const https = require('https');

/**
 * Make raw JSON-RPC call to Solana RPC endpoint
 * @param {string} endpoint - RPC endpoint URL
 * @param {string} method - RPC method name
 * @param {array} params - RPC method parameters
 * @returns {Promise<any>} - RPC response result
 */
async function rpcCall(endpoint, method, params = []) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method,
      params,
    });

    const url = new URL(endpoint);
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.error) {
            reject(new Error(`RPC Error: ${response.error.message}`));
          } else {
            resolve(response.result);
          }
        } catch (err) {
          reject(new Error(`Failed to parse RPC response: ${err.message}`));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

/**
 * Get recent blockhash for transaction
 * @param {string} endpoint - RPC endpoint
 * @returns {Promise<{blockhash: string, lastValidBlockHeight: number}>}
 */
async function getLatestBlockhash(endpoint) {
  const response = await rpcCall(endpoint, 'getLatestBlockhash', []);
  return response.value;
}

/**
 * Get account info (for token accounts, etc)
 * @param {string} endpoint - RPC endpoint
 * @param {string} pubkey - Account public key
 * @returns {Promise<any>} - Account info
 */
async function getAccountInfo(endpoint, pubkey) {
  const response = await rpcCall(endpoint, 'getAccountInfo', [pubkey]);
  return response;
}

/**
 * Send raw transaction to Solana network
 * @param {string} endpoint - RPC endpoint
 * @param {Buffer} txBytes - Raw transaction bytes
 * @returns {Promise<string>} - Transaction signature
 */
async function sendRawTransaction(endpoint, txBytes) {
  const txBase64 = txBytes.toString('base64');
  const signature = await rpcCall(endpoint, 'sendTransaction', [txBase64, { encoding: 'base64' }]);
  return signature;
}

/**
 * Confirm transaction
 * @param {string} endpoint - RPC endpoint
 * @param {string} signature - Transaction signature
 * @returns {Promise<boolean>} - Is confirmed
 */
async function confirmTransaction(endpoint, signature, maxRetries = 30) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const status = await rpcCall(endpoint, 'getSignatureStatus', [signature]);
      
      if (status && status[0]) {
        if (status[0].confirmationStatus === 'finalized' || status[0].confirmationStatus === 'confirmed') {
          return true;
        }
        if (status[0].err) {
          throw new Error(`Transaction failed: ${JSON.stringify(status[0].err)}`);
        }
      }
    } catch (err) {
      console.error(`Confirmation check error: ${err.message}`);
    }
    
    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return false;
}

/**
 * Check if an account exists on-chain
 * @param {string} endpoint - RPC endpoint
 * @param {string} pubkey - Account public key
 * @returns {Promise<boolean>} - Whether account exists
 */
async function accountExists(endpoint, pubkey) {
  try {
    const accountInfo = await getAccountInfo(endpoint, pubkey);
    return accountInfo !== null;
  } catch (err) {
    return false;
  }
}

module.exports = {
  rpcCall,
  getLatestBlockhash,
  getAccountInfo,
  sendRawTransaction,
  confirmTransaction,
  accountExists,
};
