"use strict";

import { WalletInterface, P2PKH, PublicKey } from "@bsv/sdk";
import { Token } from "../models/tokens/token";
import { TokenHolder } from "../models/tokens/token-holder";
import { TokenTransaction } from "../models/tokens/token-transaction";
import { DataFilter } from "tsbean-orm";
import { createRandomUID } from "../utils/text-utils";

export class TokenService {
    private static instance: TokenService | null = null;
    private wallet: WalletInterface | null = null;

    public static getInstance(): TokenService {
        if (TokenService.instance !== null) {
            return TokenService.instance;
        } else {
            TokenService.instance = new TokenService();
            return TokenService.instance;
        }
    }

    constructor() {
        // Wallet will be set via setWallet
    }

    public setWallet(wallet: WalletInterface) {
        this.wallet = wallet;
    }

    private getWallet(): WalletInterface {
        if (!this.wallet) {
            throw new Error("Wallet not initialized");
        }
        return this.wallet;
    }

    // Helper: Encode UInt32 Little Endian
    private encodeUInt32LE(value: number): number[] {
        const bytes = [];
        bytes.push(value & 0xff);
        bytes.push((value >> 8) & 0xff);
        bytes.push((value >> 16) & 0xff);
        bytes.push((value >> 24) & 0xff);
        return bytes;
    }

    // Helper: Encode ScriptNum
    private encodeScriptNum(value: number): number[] {
        if (value === 0) return [];
        const bytes = [];
        const negative = value < 0;
        let abs = Math.abs(value);
        while (abs > 0) {
            bytes.push(abs & 0xff);
            abs >>= 8;
        }
        if (bytes[bytes.length - 1] & 0x80) {
            bytes.push(negative ? 0x80 : 0x00);
        } else if (negative) {
            bytes[bytes.length - 1] |= 0x80;
        }
        return bytes;
    }

    public async createToken(creatorIdentityKey: string, name: string, symbol: string, decimals: number, maxSupply: number, metadata: any): Promise<any> {
        // For genesis, we need a simple output that marks the creation of the token
        // We'll use a simple P2PKH to the creator
        const wallet = this.getWallet();

        // Derive a public key for the genesis output
        const { publicKey } = await wallet.getPublicKey({
            protocolID: [0, 'token genesis'],
            keyID: `${name} ${symbol} ${Date.now()}`,
            counterparty: creatorIdentityKey
        });

        // Create P2PKH locking script
        const address = PublicKey.fromString(publicKey).toAddress();
        const lockingScript = new P2PKH().lock(address).toHex();

        return {
            action: {
                description: `Genesis for ${name} (${symbol})`,
                outputs: [{
                    lockingScript,
                    satoshis: 1,
                    basket: 'mandala-genesis',
                    outputDescription: `Genesis for ${name}`
                }]
            }
        };
    }

    public async confirmGenesis(txid: string, vout: number, creatorIdentityKey: string, name: string, symbol: string, decimals: number, maxSupply: number, metadata: any): Promise<Token> {
        const assetId = `${txid}.${vout}`;

        // Check if already exists
        const existing = await Token.finder.findByKey(assetId);
        if (existing) return existing;

        const token = new Token({
            id: assetId,
            name,
            symbol,
            decimals,
            totalSupply: 0,
            maxSupply,
            creatorIdentityKey,
            createdAt: Date.now(),
            metadataJson: JSON.stringify(metadata),
            genesisTxid: txid,
            genesisVout: vout
        } as any);

        await token.insert(); // Use insert() for new records

        // Log genesis transaction
        const tx = new TokenTransaction({
            id: createRandomUID(),
            tokenId: assetId,
            type: 'genesis',
            fromIdentityKey: null,
            toIdentityKey: creatorIdentityKey,
            amount: 0,
            txid,
            vout,
            timestamp: Date.now(),
            notes: "Genesis",
            spentBy: null
        } as any);
        await tx.insert(); // Use insert() for new records

        return token;
    }

    public async prepareMintAction(tokenId: string, creatorIdentityKey: string, recipientIdentityKey: string, amount: number): Promise<any> {
        const token = await Token.finder.findByKey(tokenId);
        if (!token) throw new Error("Token not found");

        if (token.creatorIdentityKey !== creatorIdentityKey) {
            throw new Error("Only creator can mint");
        }

        if (token.maxSupply > 0 && (token.totalSupply + amount) > token.maxSupply) {
            throw new Error(`Exceeds max supply. Current: ${token.totalSupply}, Max: ${token.maxSupply}`);
        }

        // Return data needed by frontend to construct the mint transaction
        // The frontend wallet will create the locking script
        return {
            mintData: {
                tokenId,
                token: {
                    name: token.name,
                    symbol: token.symbol,
                    genesisTxid: token.genesisTxid,
                    genesisVout: token.genesisVout
                },
                creatorIdentityKey,
                recipientIdentityKey,
                amount
            }
        };
    }

    public async confirmMint(tokenId: string, txid: string, vout: number, recipientIdentityKey: string, amount: number): Promise<void> {
        console.log('[confirmMint] Confirming mint:', { tokenId, txid, vout, recipientIdentityKey, amount });
        const token = await Token.finder.findByKey(tokenId);
        if (!token) throw new Error("Token not found");

        console.log('[confirmMint] Before mint - totalSupply:', token.totalSupply);
        // Update supply
        token.totalSupply += amount;
        await token.save(); // Use save() for existing record
        console.log('[confirmMint] After mint - totalSupply:', token.totalSupply);

        // Update holder balance
        await this.updateHolderBalance(tokenId, recipientIdentityKey, amount);

        // Log transaction
        const tx = new TokenTransaction({
            id: createRandomUID(),
            tokenId,
            type: 'mint',
            fromIdentityKey: null,
            toIdentityKey: recipientIdentityKey,
            amount,
            txid,
            vout,
            timestamp: Date.now(),
            notes: "Mint",
            spentBy: null
        } as any);
        await tx.insert(); // Use insert() for new record
        console.log('[confirmMint] Mint confirmed successfully');
    }

    public async prepareTransferAction(tokenId: string, senderIdentityKey: string, recipientIdentityKey: string, amount: number): Promise<any> {
        console.log('[prepareTransferAction] Preparing transfer:', { tokenId, senderIdentityKey, recipientIdentityKey, amount });

        // Find unspent outputs for sender
        const allTx = await TokenTransaction.finder.find(DataFilter.and(
            DataFilter.equals("tokenId", tokenId),
            DataFilter.equals("toIdentityKey", senderIdentityKey)
        ));

        // Filter for unspent UTXOs (spentBy is null or empty string)
        const utxos = allTx.filter(tx => !tx.spentBy || tx.spentBy === "");
        console.log('[prepareTransferAction] Unspent UTXOs found (filtered):', utxos.length);

        const selectedUtxos: TokenTransaction[] = [];
        let inputAmount = 0;
        for (const utxo of utxos) {
            selectedUtxos.push(utxo);
            inputAmount += utxo.amount;
            if (inputAmount >= amount) break;
        }

        if (inputAmount < amount) {
            throw new Error(`Insufficient balance. Available: ${inputAmount}, Required: ${amount}`);
        }

        const token = await Token.finder.findByKey(tokenId);
        if (!token) {
            throw new Error("Token not found");
        }

        const changeAmount = inputAmount - amount;

        // Return data needed by frontend to construct the transaction
        // The frontend wallet will create the locking/unlocking scripts
        return {
            transferData: {
                tokenId,
                token: {
                    name: token.name,
                    symbol: token.symbol,
                    genesisTxid: token.genesisTxid,
                    genesisVout: token.genesisVout
                },
                senderIdentityKey,
                recipientIdentityKey,
                amount,
                changeAmount,
                // UTXOs to spend - frontend needs these to construct inputs
                utxosToSpend: selectedUtxos.map(utxo => ({
                    txid: utxo.txid,
                    vout: utxo.vout,
                    amount: utxo.amount,
                    satoshis: 1 // PushDrop tokens use 1 satoshi
                }))
            }
        };
    }

    public async confirmTransfer(tokenId: string, txid: string, inputs: any[], outputs: any[]): Promise<void> {
        console.log('[confirmTransfer] Confirming transfer:', { tokenId, txid, inputs, outputs });

        // Mark inputs as spent
        for (const input of inputs) {
            console.log('[confirmTransfer] Processing input:', input);
            const utxo = await TokenTransaction.finder.find(DataFilter.and(
                DataFilter.equals("txid", input.txid),
                DataFilter.equals("vout", input.vout)
            ));
            if (utxo.length > 0) {
                console.log('[confirmTransfer] Marking UTXO as spent:', utxo[0].id);
                utxo[0].spentBy = txid;
                await utxo[0].save(); // Use save() for existing record

                // Update sender balance
                console.log('[confirmTransfer] Updating sender balance:', utxo[0].toIdentityKey, 'delta:', -utxo[0].amount);
                await this.updateHolderBalance(tokenId, utxo[0].toIdentityKey, -utxo[0].amount);
            } else {
                console.warn('[confirmTransfer] UTXO not found for input:', input);
            }
        }

        // Create new outputs
        for (const output of outputs) {
            console.log('[confirmTransfer] Creating new output:', output);
            const tx = new TokenTransaction({
                id: createRandomUID(),
                tokenId,
                type: 'transfer',
                fromIdentityKey: null,
                toIdentityKey: output.recipient,
                amount: output.amount,
                txid,
                vout: output.vout,
                timestamp: Date.now(),
                notes: "Transfer",
                spentBy: null
            } as any);
            await tx.insert(); // Use insert() for new record
            console.log('[confirmTransfer] New transaction created:', tx.id);

            // Update recipient balance
            console.log('[confirmTransfer] Updating recipient balance:', output.recipient, 'delta:', output.amount);
            await this.updateHolderBalance(tokenId, output.recipient, output.amount);
        }

        console.log('[confirmTransfer] Transfer confirmed successfully');
    }

    private async updateHolderBalance(tokenId: string, identityKey: string, delta: number): Promise<void> {
        console.log('[updateHolderBalance] Updating balance:', { tokenId, identityKey, delta });

        let holder = (await TokenHolder.finder.find(DataFilter.and(
            DataFilter.equals("tokenId", tokenId),
            DataFilter.equals("holderIdentityKey", identityKey)
        )))[0];

        const isNewHolder = !holder;

        if (!holder) {
            console.log('[updateHolderBalance] Creating new holder record');
            holder = new TokenHolder({
                id: createRandomUID(),
                tokenId,
                holderIdentityKey: identityKey,
                balance: 0,
                lastUpdated: Date.now()
            } as any);
        }

        console.log('[updateHolderBalance] Before update - balance:', holder.balance);
        holder.balance += delta;
        holder.lastUpdated = Date.now();
        console.log('[updateHolderBalance] After update - balance:', holder.balance);

        if (isNewHolder) {
            await holder.insert(); // Use insert() for new record
            console.log('[updateHolderBalance] New holder inserted');
        } else {
            await holder.save(); // Use save() for existing record
            console.log('[updateHolderBalance] Existing holder updated');
        }
    }

    public async getTokensByHolder(identityKey: string): Promise<any[]> {
        const holders = await TokenHolder.finder.find(DataFilter.equals("holderIdentityKey", identityKey));
        const result = [];
        for (const h of holders) {
            if (h.balance > 0) {
                const token = await Token.finder.findByKey(h.tokenId);
                if (token) {
                    result.push({
                        id: token.id,
                        name: token.name,
                        symbol: token.symbol,
                        decimals: token.decimals,
                        totalSupply: token.totalSupply,
                        maxSupply: token.maxSupply,
                        creatorIdentityKey: token.creatorIdentityKey,
                        createdAt: token.createdAt,
                        metadataJson: token.metadataJson,
                        genesisTxid: token.genesisTxid,
                        genesisVout: token.genesisVout,
                        balance: h.balance
                    });
                }
            }
        }
        return result;
    }

    public async getTokensByCreator(creatorIdentityKey: string): Promise<any[]> {
        console.log('[getTokensByCreator] Searching for tokens with creatorIdentityKey:', creatorIdentityKey);
        const tokens = await Token.finder.find(DataFilter.equals("creatorIdentityKey", creatorIdentityKey));
        console.log('[getTokensByCreator] Found tokens:', tokens.length);

        // Convert to plain objects
        return tokens.map(token => ({
            id: token.id,
            name: token.name,
            symbol: token.symbol,
            decimals: token.decimals,
            totalSupply: token.totalSupply,
            maxSupply: token.maxSupply,
            creatorIdentityKey: token.creatorIdentityKey,
            createdAt: token.createdAt,
            metadataJson: token.metadataJson,
            genesisTxid: token.genesisTxid,
            genesisVout: token.genesisVout
        }));
    }

    /**
     * Execute a token transfer (off-chain approach for hackathon demo)
     * This updates the database directly without creating on-chain transactions
     */
    public async executeTransfer(tokenId: string, senderIdentityKey: string, recipientIdentityKey: string, amount: number): Promise<{ success: boolean; txid: string }> {
        console.log('[executeTransfer] Executing transfer:', { tokenId, senderIdentityKey, recipientIdentityKey, amount });

        // Validate token exists
        const token = await Token.finder.findByKey(tokenId);
        if (!token) {
            throw new Error("Token not found");
        }

        // Check sender balance
        const senderHolder = (await TokenHolder.finder.find(DataFilter.and(
            DataFilter.equals("tokenId", tokenId),
            DataFilter.equals("holderIdentityKey", senderIdentityKey)
        )))[0];

        if (!senderHolder || senderHolder.balance < amount) {
            const available = senderHolder?.balance || 0;
            throw new Error(`Insufficient balance. Available: ${available}, Required: ${amount}`);
        }

        // Generate a pseudo-txid for tracking (in a real implementation, this would be an actual transaction)
        const pseudoTxid = `transfer_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

        // Update sender balance
        senderHolder.balance -= amount;
        senderHolder.lastUpdated = Date.now();
        await senderHolder.save();
        console.log('[executeTransfer] Updated sender balance:', senderHolder.balance);

        // Update recipient balance
        await this.updateHolderBalance(tokenId, recipientIdentityKey, amount);
        console.log('[executeTransfer] Updated recipient balance');

        // Log the transfer transaction
        const tx = new TokenTransaction({
            id: createRandomUID(),
            tokenId,
            type: 'transfer',
            fromIdentityKey: senderIdentityKey,
            toIdentityKey: recipientIdentityKey,
            amount,
            txid: pseudoTxid,
            vout: 0,
            timestamp: Date.now(),
            notes: `Transfer from ${senderIdentityKey.substring(0, 8)}... to ${recipientIdentityKey.substring(0, 8)}...`,
            spentBy: null
        } as any);
        await tx.insert();
        console.log('[executeTransfer] Transfer logged with txid:', pseudoTxid);

        return { success: true, txid: pseudoTxid };
    }
}
