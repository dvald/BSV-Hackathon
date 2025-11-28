# Crowdfunding Application Flow - Complete Guide

This document explains the complete flow of the BSV crowdfunding application, from wallet initialization to token distribution.

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Wallet Setup](#wallet-setup)
3. [Investment Flow](#investment-flow)
4. [Token Distribution](#token-distribution)
5. [Token Claiming](#token-claiming)
6. [Key Components](#key-components)

---

## Architecture Overview

```
┌─────────────┐         ┌─────────────┐         ┌──────────────┐
│   Frontend  │ ◄─────► │   Backend   │ ◄─────► │  BSV Wallet  │
│   (Vue 3)   │  HTTP   │  (Express)  │         │   (SDK)      │
└─────────────┘         └─────────────┘         └──────────────┘
       │                       │                        │
       │                       │                        │
       ▼                       ▼                        ▼
┌─────────────┐         ┌─────────────┐         ┌──────────────┐
│BSV Desktop  │         │  Database   │         │  Blockchain  │
│   Wallet    │         │  (SQLite)   │         │     (BSV)    │
└─────────────┘         └─────────────┘         └──────────────┘
```

---

## 1. Wallet Setup

### 1.1 Backend Wallet Initialization

**Location**: `backend/src/services/bsv-service.ts`

```typescript
// The backend creates/loads a persistent wallet
const storage = new StorageClient('data/storage.json');
const wallet = new Wallet(storage, {
    network: 'mainnet',
    autoCreateWalletConfig: true
});
```

**Key Points**:
- Backend wallet is **persistent** (stored in `data/storage.json`)
- Needs **initial funding** to pay transaction fees
- Uses **BRC-29** for key derivation with investors
- Stores wallet state **off-chain** via Storage URL

### 1.2 Frontend Wallet Connection

**Location**: `frontend/src/composables/useWallet.ts`

```typescript
// Connects to user's BSV Desktop wallet
const wallet = new WalletClient();
const { publicKey } = await wallet.getPublicKey({ identityKey: true });
```

**Key Points**:
- Connects to **external wallet** (BSV Desktop, Panda Wallet, etc.)
- User's identity key is **never exposed** to backend
- Wallet manages **baskets** for organizing UTXOs
- Uses **BRC protocols** for encryption and derivation

---

## 2. Investment Flow

### Step-by-Step Process

#### Step 1: Initial Request (Frontend → Backend)

**File**: `frontend/src/components/routes/crowdfunding/CrowdfundingPage.vue`

```typescript
// 1. User clicks "Invest"
const response = await fetch('/api/v1/bsv/invest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: investmentAmount.value })
});

// 2. Backend returns 402 Payment Required
if (response.status === 402) {
    const derivationPrefix = response.headers.get('x-bsv-payment-derivation-prefix');
    // ... continue to Step 2
}
```

**Critical**: Backend **always returns 402** first to initiate payment protocol.

#### Step 2: Key Derivation (Frontend)

```typescript
// 3. Frontend derives a unique payment key using BRC-29
const brc29ProtocolID: WalletProtocol = [2, '3241645161d8'];
const derivationSuffix = Utils.toBase64(
    Utils.toArray('investment' + Date.now(), 'utf8')
);

const { publicKey: derivedPublicKey } = await wallet.getPublicKey({
    counterparty: backendIdentityKey, // Backend's identity
    protocolID: brc29ProtocolID,
    keyID: `${derivationPrefix} ${derivationSuffix}`,
    forSelf: false
});
```

**Why BRC-29?**
- Creates **deterministic** keys for both parties
- Backend can derive the **same key** to receive payment
- Enables **privacy** (different key per transaction)

#### Step 3: Transaction Creation (Frontend)

```typescript
// 4. Create P2PKH output to derived public key
const lockingScript = new P2PKH()
    .lock(PublicKey.fromString(derivedPublicKey).toAddress())
    .toHex();

// 5. Create action (transaction)
const action = await wallet.createAction({
    outputs: [{
        lockingScript,
        satoshis: investmentAmount,
        outputDescription: 'Crowdfunding investment'
    }],
    description: 'Investment in crowdfunding',
    options: { randomizeOutputs: false }
});
```

**Key Insight**: User's wallet **creates the transaction** but backend **validates and accepts** it.

#### Step 4: Payment Submission (Frontend → Backend)

```typescript
// 6. Get user's identity key
const { publicKey: investorKey } = await wallet.getPublicKey({ 
    identityKey: true 
});

// 7. Create payment header
const paymentHeader = JSON.stringify({
    derivationPrefix,
    derivationSuffix,
    transaction: Utils.toBase64(action.tx),
    senderIdentityKey: investorKey,
    amount: investmentAmount
});

// 8. Retry request with payment
await fetch('/api/v1/bsv/invest', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'x-bsv-payment': paymentHeader  // ← Payment included
    },
    body: JSON.stringify({ amount: investmentAmount })
});
```

#### Step 5: Payment Processing (Backend)

**File**: `backend/src/controllers/api/crowdfunding-controller.ts`

```typescript
// Backend middleware validates and accepts payment
app.post('/api/v1/bsv/invest', async (req, res) => {
    // 1. Auth middleware extracts senderIdentityKey
    await authMiddleware(req, res, next);
    
    // 2. Payment middleware validates transaction
    await paymentMiddleware(req, res, next);
    
    // 3. If payment accepted, record investment
    if (req.payment && req.payment.accepted) {
        const identityKey = req.payment.senderIdentityKey;
        const amount = req.payment.satoshisPaid;
        
        await bsvService.recordInvestment(identityKey, amount);
        res.json({ success: true, amount, totalRaised });
    }
});
```

**File**: `backend/src/services/bsv-service.ts`

```typescript
public async recordInvestment(identityKey: string, amount: number) {
    // Store investment in database
    const investment = new Investment({
        id: Date.now().toString(),
        campaignId: campaign.id,
        identityKey: identityKey,  // ← User's identity
        amount: amount,
        timestamp: Date.now(),
        redeemed: false  // ← Will be true after token distribution
    });
    
    await investment.insert();
    
    // Update campaign stats
    campaign.raised += amount;
    await campaign.save();
}
```

---

## 3. Token Distribution

### When Campaign Goal is Reached

**File**: `backend/src/services/bsv-service.ts`

#### Step 1: Create PushDrop Token

```typescript
public async completeCrowdfunding() {
    // Get all unredeemed investments
    const investments = await Investment.finder.find(
        DataFilter.equals("redeemed", false)
    );
    
    for (const investment of investments) {
        // 1. Create token description
        const tokenDescription = `Crowdfunding token for ${investment.amount} sats`;
        
        // 2. Encrypt token data (only investor can decrypt)
        const { ciphertext } = await this.wallet.encrypt({
            plaintext: Utils.toArray(tokenDescription, 'utf8'),
            protocolID: [0, 'token list'],
            keyID: '1',
            counterparty: 'anyone'
        });
        
        // 3. Create PushDrop locking script
        const pushdrop = new PushDrop(this.wallet);
        const lockingScript = await pushdrop.lock(
            [ciphertext],           // Encrypted data
            [0, 'token list'],      // Protocol ID
            '1',                    // Key ID
            investment.identityKey  // ← Investor's identity
        );
        
        // 4. Create token transaction
        const result = await this.wallet.createAction({
            description: `Create token for ${investment.identityKey}`,
            outputs: [{
                lockingScript: lockingScript.toHex(),
                satoshis: 1,  // Minimum value
                basket: 'crowdfunding',  // ← Backend's basket
                outputDescription: 'Crowdfunding token'
            }],
            options: { randomizeOutputs: false }
        });
        
        // 5. Mark as redeemed and store TXID
        investment.redeemed = true;
        await investment.save();
        
        lastTxid = result.txid;
        lastTx = result.tx;  // ← Full transaction for frontend
    }
    
    return {
        success: true,
        lastTxid: lastTxid,
        tx: lastTx  // ← Frontend needs this to claim token
    };
}
```

**Critical Points**:
- Token is created **by backend wallet**
- Locked to **investor's identity key**
- Stored in backend's `'crowdfunding'` basket
- Returns **full transaction** to frontend

---

## 4. Token Claiming

### The Missing Piece: `internalizeAction`

**File**: `frontend/src/components/routes/crowdfunding/CrowdfundingPage.vue`

```typescript
const completeCampaign = async () => {
    // 1. Call backend to distribute tokens
    const response = await fetch('/api/v1/bsv/complete', {
        method: 'POST'
    });
    const result = await response.json();
    
    // 2. CRITICAL: Internalize the token to user's wallet
    if (result.tx && wallet.value) {
        await wallet.value.internalizeAction({
            tx: result.tx,  // ← Transaction from backend
            outputs: [{
                outputIndex: 0,
                protocol: 'basket insertion',
                insertionRemittance: { 
                    basket: 'crowdfunding'  // ← User's basket
                }
            }],
            description: 'Internalize crowdfunding token'
        });
        
        // Token now appears in user's wallet!
    }
}
```

**Why is this necessary?**

1. **Backend creates** the token transaction → Token exists on blockchain
2. **But user's wallet doesn't know** about it yet → Needs to scan blockchain
3. **`internalizeAction` tells wallet**: "This UTXO belongs to you, add it to your `'crowdfunding'` basket"
4. **Now token appears** when calling `wallet.listOutputs({ basket: 'crowdfunding' })`

**Without `internalizeAction`**:
- Token exists on blockchain ✅
- Token is locked to user's identity ✅
- **But wallet doesn't show it** ❌

---

## 5. Viewing Tokens

**File**: `frontend/src/components/routes/crowdfunding/MyTokensPage.vue`

```typescript
const loadTokens = async () => {
    // List outputs from 'crowdfunding' basket
    const outputs = await wallet.value.listOutputs({
        basket: 'crowdfunding',
        include: 'locking scripts'
    });
    
    for (const output of outputs.outputs) {
        // Decode PushDrop token
        const script = LockingScript.fromHex(output.lockingScript);
        const decodedToken = PushDrop.decode(script);
        
        // Decrypt token data (if possible)
        if (decodedToken.fields && decodedToken.fields.length > 0) {
            const description = new TextDecoder().decode(
                decodedToken.fields[0]
            );
        }
        
        tokens.push({
            txid: output.outpoint.split('.')[0],
            satoshis: output.satoshis,
            description: description
        });
    }
}
```

---

## 6. Key Components Reference

### Backend Components

| File | Purpose |
|------|---------|
| `bsv-service.ts` | Core BSV wallet logic, token creation |
| `crowdfunding-controller.ts` | HTTP endpoints, middleware setup |
| `campaign.ts` | Campaign data model |
| `investment.ts` | Investment tracking |

### Frontend Components

| File | Purpose |
|------|---------|
| `useWallet.ts` | Wallet connection composable |
| `CrowdfundingPage.vue` | Investment UI, token claiming |
| `MyTokensPage.vue` | Token display |

### Critical Middleware

| Middleware | Purpose |
|------------|---------|
| `AuthMiddleware` | Validates `x-bsv-auth` header, extracts identity |
| `PaymentMiddleware` | Validates `x-bsv-payment`, accepts transactions |

---

## Common Pitfalls

### 1. ❌ Token created but not visible
**Cause**: Forgot to call `wallet.internalizeAction()`  
**Fix**: Always internalize after backend creates token

### 2. ❌ Payment not accepted
**Cause**: Missing `senderIdentityKey` in payment header  
**Fix**: Extract identity key manually before payment middleware

### 3. ❌ Basket is empty
**Cause**: Tokens in different basket than expected  
**Fix**: Use same basket name in backend creation and frontend query

### 4. ❌ "Basket 'default' is admin-only"
**Cause**: Trying to list UTXOs without specifying basket  
**Fix**: Always provide a basket parameter to `listOutputs()`

---

## Flow Diagram

```
USER                    FRONTEND                    BACKEND                    BLOCKCHAIN
 │                         │                           │                           │
 │  1. Click "Invest"      │                           │                           │
 ├────────────────────────►│                           │                           │
 │                         │  2. POST /invest          │                           │
 │                         ├──────────────────────────►│                           │
 │                         │  3. 402 + derivation      │                           │
 │                         │◄──────────────────────────┤                           │
 │                         │  4. Derive key (BRC-29)   │                           │
 │                         │  5. Create transaction    │                           │
 │  6. Sign transaction    │                           │                           │
 │◄────────────────────────┤                           │                           │
 │  7. Approve             │                           │                           │
 ├────────────────────────►│                           │                           │
 │                         │  8. POST /invest + tx     │                           │
 │                         ├──────────────────────────►│                           │
 │                         │                           │  9. Broadcast tx          │
 │                         │                           ├──────────────────────────►│
 │                         │                           │ 10. Confirmed             │
 │                         │                           │◄──────────────────────────┤
 │                         │ 11. Success               │                           │
 │                         │◄──────────────────────────┤                           │
 │                         │                           │                           │
 │  (Later: Goal Reached)  │                           │                           │
 │                         │                           │                           │
 │ 12. Click "Complete"    │                           │                           │
 ├────────────────────────►│                           │                           │
 │                         │ 13. POST /complete        │                           │
 │                         ├──────────────────────────►│                           │
 │                         │                           │ 14. Create token tx       │
 │                         │                           ├──────────────────────────►│
 │                         │                           │ 15. Token confirmed       │
 │                         │                           │◄──────────────────────────┤
 │                         │ 16. Return tx             │                           │
 │                         │◄──────────────────────────┤                           │
 │                         │ 17. internalizeAction     │                           │
 │                         │    (add to wallet)        │                           │
 │ 18. Token in wallet! ✅  │                           │                           │
 │◄────────────────────────┤                           │                           │
```

---

## Next Steps

- Read `README_BSV_DEVELOPMENT.md` for BSV vs Ethereum comparison
- Review actual code in referenced files
- Experiment with the running application
- Check blockchain transactions on [WhatsOnChain](https://whatsonchain.com)
