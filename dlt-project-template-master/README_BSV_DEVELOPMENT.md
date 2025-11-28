# BSV Development Guide: From Ethereum/Web3 to Bitcoin

A practical guide for developers transitioning from Ethereum/Web3 to BSV blockchain development.

## Table of Contents
1. [Fundamental Paradigm Shift](#fundamental-paradigm-shift)
2. [Wallet Architecture](#wallet-architecture)
3. [Transaction Model: UTXO vs Account](#transaction-model-utxo-vs-account)
4. [Payment Protocols](#payment-protocols)
5. [Key Derivation & Privacy](#key-derivation--privacy)
6. [Data Storage](#data-storage)
7. [Tokens & Smart Contracts](#tokens--smart-contracts)
8. [Development Workflow](#development-workflow)

---

## 1. Fundamental Paradigm Shift

### Ethereum/Web3 Mindset
```javascript
// Ethereum: Smart contracts hold state
contract Crowdfunding {
    mapping(address => uint256) public investments;  // ← State on chain
    
    function invest() payable {
        investments[msg.sender] += msg.value;  // ← Modify contract state
    }
}
```

### BSV Mindset
```typescript
// BSV: Transactions are the primitive, UTXOs carry value
// NO global state on chain
// Database holds application state
const investment = new Investment({
    identityKey: userIdentity,  // ← State in database
    amount: satoshis,
    timestamp: Date.now()
});
await investment.insert();  // ← Off-chain storage

// Create UTXO (token) when needed
const tx = await wallet.createAction({
    outputs: [{ satoshis: 1, lockingScript: ... }]
});
```

**Key Difference**:
- **Ethereum**: Smart contract = database + logic on-chain
- **BSV**: Blockchain = payment rail, application state = off-chain database

---

## 2. Wallet Architecture

### 2.1 MetaMask vs BSV Wallet

| Feature | MetaMask (Ethereum) | BSV Desktop/Panda Wallet |
|---------|---------------------|--------------------------|
| **Connection** | Injected provider `window.ethereum` | Desktop app (HTTP/IPC) or Browser extension |
| **Network** | EVM chains (1 account per chain) | BSV mainnet/testnet |
| **Keys** | 1 address derived from seed | Hierarchical derivation (BRC-29/42/43) |
| **Signing** | Sign arbitrary messages easily | Transaction-based signing |
| **Gas** | User pays gas in ETH | Miner fees in satoshis (< 1¢) |

### 2.2 Code Comparison

**Ethereum (Web3.js/Ethers.js)**:
```javascript
// Connect to MetaMask
const provider = new ethers.providers.Web3Provider(window.ethereum);
await provider.send("eth_requestAccounts", []);
const signer = provider.getSigner();
const address = await signer.getAddress();

// Send transaction
const tx = await signer.sendTransaction({
    to: recipientAddress,
    value: ethers.utils.parseEther("0.1")
});
```

**BSV (@bsv/sdk)**:
```typescript
// Connect to BSV wallet
const wallet = new WalletClient();  // Connects to local wallet
const { publicKey } = await wallet.getPublicKey({ identityKey: true });

// Create action (transaction)
const action = await wallet.createAction({
    description: 'Payment to recipient',
    outputs: [{
        lockingScript: new P2PKH().lock(recipientAddress).toHex(),
        satoshis: 10000  // 0.0001 BSV
    }]
});
```

### 2.3 Backend Wallet

**Ethereum**: Backend uses private key directly
```javascript
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
```

**BSV**: Backend uses `Wallet` class with persistent storage
```typescript
// Real implementation from bsv-service.ts
const privateKey = PrivateKey.fromHex(privateKeyHex);
const keyDeriver = new KeyDeriver(privateKey);
const storageManager = new WalletStorageManager(keyDeriver.identityKey);
const signer = new WalletSigner(network, keyDeriver, storageManager);
const services = new Services(network);
const wallet = new Wallet(signer, services);

// Setup storage client
const storageUrl = 'https://storage.babbage.systems';
const client = new StorageClient(wallet, storageUrl);
await client.makeAvailable();
await storageManager.addWalletStorageProvider(client);

// Wallet automatically manages:
// - UTXO tracking
// - Key derivation  
// - Transaction building
// - Overlay network sync
```

**Critical**: BSV backend wallet is **stateful** and needs:
1. **Initial funding** (send sats to `wallet.address`)
2. **Storage** (persists UTXO state)
3. **Overlay Services** configuration (for advanced features)

### 2.4 Funding the Backend Wallet

**In Development**:
```typescript
// 1. Get backend wallet address
const { address } = await bsvService.getWalletInfo();
console.log('Backend address:', address);

// 2. Use BSV faucet (testnet) or send from your wallet (mainnet)
// https://faucet.bitcoincloud.net (testnet)

// 3. Backend now has UTXOs to spend for transaction fees
```

**In the app** (if you have a "fund backend" feature):
```typescript
// Frontend creates transaction to backend address
const action = await wallet.createAction({
    outputs: [{
        lockingScript: new P2PKH().lock(backendAddress).toHex(),
        satoshis: 1000  // Initial funds
    }]
});
```

---

## 3. Transaction Model: UTXO vs Account

### 3.1 Account Model (Ethereum)

```
Account 0x123: Balance = 5 ETH
Account 0x456: Balance = 3 ETH

Transfer 1 ETH from 0x123 to 0x456:
→ Account 0x123: Balance = 4 ETH
→ Account 0x456: Balance = 4 ETH
```

**State changes** are recorded. Balances are **aggregated**.

### 3.2 UTXO Model (BSV/Bitcoin)

```
UTXO #1: 3 BSV locked to Alice
UTXO #2: 2 BSV locked to Alice
Alice's balance = 5 BSV (sum of UTXOs)

Alice sends 4 BSV to Bob:
→ INPUT: UTXO #1 (3 BSV) + UTXO #2 (2 BSV) = 5 BSV
→ OUTPUT #1: 4 BSV to Bob
→ OUTPUT #2: 0.999 BSV back to Alice (change)
→ Miner fee: 0.001 BSV

Result:
- UTXO #1 & #2: SPENT ❌
- New UTXO #3: 4 BSV locked to Bob
- New UTXO #4: 0.999 BSV locked to Alice
```

**UTXOs** are discrete objects. You **consume** inputs and **create** outputs.

### 3.3 Code Implications

**Ethereum**: Simple balance check
```javascript
const balance = await provider.getBalance(address);
console.log(ethers.utils.formatEther(balance));
```

**BSV**: Sum UTXOs (wallet does this automatically)
```typescript
// Wallet automatically tracks UTXOs
const balance = await wallet.getBalance();  // Sums all spendable UTXOs

// Manual UTXO listing
const outputs = await wallet.listOutputs({ basket: 'main' });
const totalSats = outputs.outputs.reduce((sum, utxo) => sum + utxo.satoshis, 0);
```

**Mental Model**:
- **Ethereum**: Your wallet holds a **balance** (number)
- **BSV**: Your wallet holds **coins** (discrete UTXOs)

---

## 4. Payment Protocols

### 4.1 Ethereum Payment Flow

```javascript
// Simple: User signs + broadcasts
const tx = await signer.sendTransaction({ to, value });
await tx.wait();  // Wait for mining
```

**One step**: User creates & broadcasts transaction.

### 4.2 BSV Payment Protocol (BRC-96)

**Why?** Backend needs to:
1. Validate transaction **before** broadcasting
2. Derive deterministic key to **receive payment**
3. Track payment to specific **application action**

**The 402 Payment Required Flow**:

```typescript
// STEP 1: Backend returns 402
app.post('/api/invest', (req, res) => {
    res.status(402).set({
        'x-bsv-payment-derivation-prefix': derivationPrefix,
        'x-bsv-payment-required-satoshis': '100'
    });
    return;  // ← Stops here
});

// STEP 2: Frontend creates transaction
const paymentKey = await wallet.getPublicKey({
    counterparty: backendIdentity,
    protocolID: [2, '3241645161d8'],  // BRC-29
    keyID: `${derivationPrefix} ${derivationSuffix}`
});

const action = await wallet.createAction({
    outputs: [{
        lockingScript: new P2PKH().lock(paymentKey).toHex(),
        satoshis: 100
    }]
});

// STEP 3: Frontend retries with payment header
await fetch('/api/invest', {
    headers: {
        'x-bsv-payment': JSON.stringify({
            derivationPrefix,
            derivationSuffix,
            transaction: Utils.toBase64(action.tx),
            senderIdentityKey: userIdentity,
            amount: 100
        })
    }
});

// STEP 4: Backend validates & accepts
// Payment middleware derives SAME key, verifies transaction, broadcasts
```

**Why so complex?**
- **Ethereum**: Backend gives you an address, you send to it
- **BSV**: Backend derives **unique key per payment** for privacy & tracking
- Enables **invoicing**, **refunds**, **atomic swaps**

### 4.3 Implementation Tips

**Backend**:
```typescript
// ALWAYS extract senderIdentityKey manually
const paymentHeader = req.headers['x-bsv-payment'];
if (paymentHeader) {
    const payment = JSON.parse(paymentHeader);
    req.auth = { identityKey: payment.senderIdentityKey };
}

// Then payment middleware
await paymentMiddleware(req, res, next);
```

**Frontend**:
```typescript
// ALWAYS include senderIdentityKey in payment header
const { publicKey } = await wallet.getPublicKey({ identityKey: true });
const header = {
    ...paymentData,
    senderIdentityKey: publicKey  // ← Critical
};
```

---

## 5. Key Derivation & Privacy

### 5.1 Ethereum Addresses

```javascript
// Same address for everything
const address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";
```

**Problem**: All transactions visible, linked to one identity.

### 5.2 BSV Hierarchical Keys (BRC-29/42/43)

**BRC-29**: **Counterparty-based derivation**

```typescript
// Both parties derive SAME key without communicating
// Alice derives key for payment to Bob
const alicePaymentKey = await aliceWallet.getPublicKey({
    counterparty: bobIdentity,  // Bob's root identity
    protocolID: [2, '3241645161d8'],
    keyID: 'invoice-12345',
    forSelf: false  // ← Derive for counterparty
});

// Bob derives SAME key to receive
const bobReceiveKey = await bobWallet.getPublicKey({
    counterparty: aliceIdentity,
    protocolID: [2, '3241645161d8'],
    keyID: 'invoice-12345',
    forSelf: true  // ← Derive for self
});

// alicePaymentKey === bobReceiveKey ✅
```

**Use Cases**:
1. **Payments**: Each invoice gets unique address
2. **Messages**: Encrypt to specific counterparty + topic
3. **Subscriptions**: Derive keys per subscriber per period

**Privacy**: On-chain observer sees different addresses, can't link them.

### 5.3 BRC-42: Encryption

```typescript
// Encrypt data only recipient can decrypt
const { ciphertext } = await wallet.encrypt({
    plaintext: Utils.toArray('Secret message', 'utf8'),
    protocolID: [0, 'messages'],
    keyID: 'chat-session-1',
    counterparty: recipientIdentity  // ← Only they can decrypt
});

// Recipient decrypts
const { plaintext } = await recipientWallet.decrypt({
    ciphertext,
    protocolID: [0, 'messages'],
    keyID: 'chat-session-1',
    counterparty: senderIdentity
});
```

**Critical**: BSV SDK handles **ECDH** key exchange automatically.

---

## 6. Data Storage

### 6.1 Ethereum Storage

```solidity
// On-chain storage (expensive)
contract MyContract {
    mapping(address => string) public data;  // ~20,000 gas per write
    
    function store(string memory value) public {
        data[msg.sender] = value;  // Expensive!
    }
}
```

**Cost**: $1-10 per kilobyte depending on gas price.

### 6.2 BSV Storage (Overlay Services)

**Three Options**:

#### Option 1: Off-Chain Database (This App)
```typescript
// Standard database
const investment = new Investment({ /* ... */ });
await investment.insert();
```

**Pros**: Fast, cheap, familiar  
**Cons**: Centralized, requires trust

#### Option 2: On-Chain Data (OP_RETURN)
```typescript
const action = await wallet.createAction({
    outputs: [{
        satoshis: 1,
        lockingScript: new Script()
            .writeBin(Utils.toArray('Hello BSV', 'utf8'))
            .writeOpCode(OpCode.OP_RETURN)
            .toHex()
    }]
});
```

**Pros**: Immutable, provable  
**Cons**: Public, limited size (100KB practical limit)

#### Option 3: Overlay Services (Storage URL)
```typescript
// Advertise data to overlay network
const uploadResult = await wallet.uploadOutputs([{
    vout: 0,
    satoshis: 1,
    lockingScript: tokenScript,
    tags: ['token', 'crowdfunding'],  // ← Indexed
    beef: transactionBEEF  // ← Full tx + ancestry
}]);
```

**How it works**:
1. Transaction broadcast to blockchain AND overlay
2. Overlay nodes **index** by tags
3. Query: "Give me all `crowdfunding` tokens for identity X"
4. Overlay returns UTXOs matching query

**Storage URL** environment variable:
```bash
STORAGE_URL=https://storage.babbage.systems
```

**Comparison**:

| Method | Privacy | Cost | Query Speed | Use Case |
|--------|---------|------|-------------|----------|
| Database | ❌ | Free | Fast | Internal app state |
| OP_RETURN | ❌ | ~$0.01/KB | Slow (full scan) | Public announcements |
| Overlay | ✅ | ~$0.01/KB | Fast (indexed) | Tokens, messages, files |

---

## 7. Tokens & Smart Contracts

### 7.1 Ethereum Tokens (ERC-20)

```solidity
contract MyToken {
    mapping(address => uint256) balances;
    
    function transfer(address to, uint256 amount) {
        balances[msg.sender] -= amount;
        balances[to] += amount;
    }
}
```

**Model**: Smart contract tracks ownership.

### 7.2 BSV Tokens (PushDrop / SPV Tokens)

```typescript
// Create token UTXO
const pushdrop = new PushDrop(wallet);
const tokenScript = await pushdrop.lock(
    [encryptedData],       // Token payload
    [0, 'my-token-type'],  // Protocol ID
    '1',                   // Key ID
    ownerIdentityKey       // ← Only owner can spend
);

const tx = await wallet.createAction({
    outputs: [{
        satoshis: 1,
        lockingScript: tokenScript.toHex(),
        basket: 'my-tokens'
    }]
});
```

**Model**: UTXO **is** the token. Spending it = transferring ownership.

**Transfer**:
```typescript
// Unlock (prove you own the token)
const tx = await pushdrop.unlock({
    txin: pendingTx.inputs[0],
    fields: [encryptedData],  // Original token data
    protocolID: [0, 'my-token-type'],
    keyID: '1'
});

// Lock to new owner
const newTokenScript = await pushdrop.lock(
    [encryptedData],
    [0, 'my-token-type'],
    '1',
    newOwnerIdentityKey  // ← New owner
);
```

**Advantages over ERC-20**:
1. **No contract gas** - just transaction fee (< 1¢)
2. **Privacy** - different address per token
3. **SPV proof** - verify ownership without full blockchain
4. **Composability** - tokens are UTXOs, work with all UTXO tools

### 7.3 Smart Contracts

**Ethereum**: Turing-complete EVM
```solidity
contract Auction {
    mapping(address => uint256) bids;
    function bid() payable { ... }
    function finalize() { /* complex logic */ }
}
```

**BSV**: Bitcoin Script (limited)
```typescript
// Example: Hash lock
const script = new Script()
    .writeOpCode(OpCode.OP_SHA256)
    .writeBin(hashOfSecret)
    .writeOpCode(OpCode.OP_EQUAL);

// To unlock: provide secret
const unlockScript = new Script()
    .writeBin(secret);
```

**Philosophy**:
- **Ethereum**: "Code is law", everything on-chain
- **BSV**: Use script for **verification**, complex logic **off-chain**

**Example**: Crowdfunding
- **Ethereum**: Contract holds funds, distributes tokens on-chain
- **BSV**: Backend holds state, creates token transactions when conditions met

---

## 8. Development Workflow

### 8.1 Local Development

**Ethereum**:
```bash
# Run local blockchain
npx hardhat node

# Deploy contract
npx hardhat run scripts/deploy.js --network localhost
```

**BSV**:
```bash
# Backend: The wallet is initialized automatically on first run
# Check logs for wallet address on startup

# Fund wallet (testnet)
# Go to https://faucet.bitcoincloud.net  
# Send sats to backend address shown in logs

# Start backend
npm start

# Frontend
npm run dev
```

**No local blockchain needed** - use testnet/mainnet directly.

### 8.2 Testing

**Ethereum**:
```javascript
// Hardhat tests
it("should transfer tokens", async () => {
    await token.transfer(addr1.address, 100);
    expect(await token.balanceOf(addr1.address)).to.equal(100);
});
```

**BSV**:
```typescript
// Test with real wallet (testnet)
it("should create token", async () => {
    const result = await bsvService.completeCrowdfunding();
    expect(result.success).toBe(true);
    
    // Verify on blockchain
    const tx = await fetch(`https://api.whatsonchain.com/v1/bsv/test/tx/${result.txid}`);
    expect(tx.ok).toBe(true);
});
```

**Use testnet liberally** - transactions are real but satoshis are free.

### 8.3 Deployment

**Ethereum**:
```bash
# Deploy to mainnet
npx hardhat run scripts/deploy.js --network mainnet

# Publish contract source
npx hard hat verify --network mainnet 0x...
```

**BSV**:
```bash
# Switch to mainnet
# backend/.env
NETWORK=mainnet
STORAGE_URL=https://storage.babbage.systems

# Fund backend wallet (real BSV)
# Send ~1000 sats to backend address

# Deploy
npm run build
npm start
```

**No contract deployment** - just change network config.

---

## Key Takeaways

### Mental Model Shifts

| Concept | Ethereum | BSV |
|---------|----------|-----|
| **State** | On-chain (contract storage) | Off-chain (database) |
| **Accounts** | Single address per user | Hierarchical derivation |
| **Tokens** | Contract tracks balances | UTXOs are tokens |
| **Gas** | User pays per operation | Flat fee per transaction |
| **Privacy** | Public addresses | Derived keys per interaction |
| **Storage** | Expensive on-chain | Cheap overlay or free database |
| **Smart Contracts** | Turing-complete logic | Verification scripts |

### Development Principles

1. **Embrace UTXOs**: Think in discrete coins, not balances
2. **Use databases**: Application state goes off-chain
3. **Derive keys**: Different key per purpose/counterparty
4. **Minimize on-chain data**: Only what needs to be provable
5. **Leverage overlays**: For searchable, private data
6. **Test on testnet**: It's free and it's real

### Resources

- [BSV SDK Documentation](https://docs.bsvblockchain.org)
- [BRC Standards](https://brc.dev)
- [WhatOnChain Explorer](https://whatsonchain.com)
- [Overlay Services](https://docs.babbage.systems)

---

## Appendix: Quick Reference

### Common Patterns

**Get user identity**:
```typescript
const { publicKey } = await wallet.getPublicKey({ identityKey: true });
```

**Create payment**:
```typescript
const action = await wallet.createAction({
    outputs: [{ lockingScript, satoshis }]
});
```

**Derive key for counterparty**:
```typescript
const key = await wallet.getPublicKey({
    counterparty: theirIdentity,
    protocolID: [2, protocol],
    keyID: uniqueId
});
```

**Encrypt for counterparty**:
```typescript
const { ciphertext } = await wallet.encrypt({
    plaintext,
    protocolID,
    keyID,
    counterparty: theirIdentity
});
```

**List tokens**:
```typescript
const outputs = await wallet.listOutputs({ 
    basket: 'my-tokens',
    include: 'locking scripts'
});
```

**Internalize UTXO**:
```typescript
await wallet.internalizeAction({
    tx: transactionData,
    outputs: [{ outputIndex: 0, protocol: 'basket insertion', insertionRemittance: { basket } }]
});
```

---

**Happy Building! 🚀**
