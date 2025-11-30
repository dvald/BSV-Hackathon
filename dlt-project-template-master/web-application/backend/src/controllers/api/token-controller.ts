"use strict";

import Express from "express";
import { Controller } from "../controller";
import { TokenService } from "../../services/token-service";
import { Token } from "../../models/tokens/token";
import { DataFilter } from "tsbean-orm";
import { BsvService } from "../../services/bsv-service";

export class TokenController extends Controller {
    private tokenService: TokenService;

    constructor() {
        super();
        this.tokenService = TokenService.getInstance();
    }

    public registerAPI(baseUrl: string, app: Express.Application) {
        const router = Express.Router();

        router.post('/create', this.createToken.bind(this));
        router.post('/confirm-genesis', this.confirmGenesis.bind(this));

        // NEW: Create service token (backend creates and owns the token)
        router.post('/create-service-token', this.createServiceToken.bind(this));

        router.post('/:tokenId/mint', this.mintToken.bind(this));
        router.post('/confirm-mint', this.confirmMint.bind(this));

        router.post('/:tokenId/transfer', this.transferToken.bind(this));
        router.post('/:tokenId/execute-transfer', this.executeTransfer.bind(this));
        router.post('/confirm-transfer', this.confirmTransfer.bind(this));

        router.get('/my-tokens', this.getMyTokens.bind(this)); // Tokens I created
        router.get('/my-balances', this.getMyBalances.bind(this)); // Tokens I hold
        router.get('/service-tokens', this.getServiceTokens.bind(this)); // Tokens created by backend
        router.get('/all', this.getAllTokens.bind(this));
        router.get('/:tokenId', this.getToken.bind(this));

        app.use(baseUrl + '/tokens', router);
    }

    /**
     * Create a service token - Backend wallet creates and owns the token
     * This is used for municipal services where the backend manages tokens
     */
    private async createServiceToken(req: Express.Request, res: Express.Response) {
        try {
            const { name, symbol, decimals, maxSupply, metadata } = req.body;

            if (!name || !symbol) {
                res.status(400).json({ error: 'Name and symbol are required' });
                return;
            }

            // Use backend's BSV wallet to create the token
            const bsvService = BsvService.getInstance();
            await bsvService.ready();

            const backendIdentityKey = bsvService.getIdentityKey();

            // Create the token using the new createServiceToken method
            const result = await this.tokenService.createServiceToken(
                name,
                symbol,
                decimals || 2,
                maxSupply || 1000000000,
                metadata || {},
                backendIdentityKey
            );

            console.log('[createServiceToken] Token created:', result.tokenId);

            res.json({
                success: true,
                tokenId: result.tokenId,
                txid: result.txid,
                name,
                symbol,
                decimals: decimals || 2,
                maxSupply: maxSupply || 1000000000,
                creatorIdentityKey: backendIdentityKey
            });
        } catch (e: any) {
            console.error('[createServiceToken] Error:', e);
            res.status(500).json({ error: e.message });
        }
    }

    private async createToken(req: Express.Request, res: Express.Response) {
        try {
            const { name, symbol, decimals, maxSupply, metadata } = req.body;
            const creatorIdentityKey = req.headers['x-bsv-identity-key'] as string;

            if (!creatorIdentityKey) {
                res.status(400).json({ error: 'Missing identity key' });
                return;
            }

            const result = await this.tokenService.createToken(creatorIdentityKey, name, symbol, decimals, maxSupply, metadata);

            // Generate a temporary tokenId that will be replaced with the actual genesis txid.vout
            const tempTokenId = `temp_${Date.now()}`;

            res.json({
                action: result.action,
                tokenId: tempTokenId,
                name,
                symbol,
                decimals,
                maxSupply
            });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    private async confirmGenesis(req: Express.Request, res: Express.Response) {
        try {
            const { txid, vout, name, symbol, decimals, maxSupply, metadata } = req.body;
            const creatorIdentityKey = req.headers['x-bsv-identity-key'] as string;

            console.log('[confirmGenesis] Saving token with creatorIdentityKey:', creatorIdentityKey);
            console.log('[confirmGenesis] Token details:', { name, symbol, txid, vout });

            const token = await this.tokenService.confirmGenesis(txid, vout, creatorIdentityKey, name, symbol, decimals, maxSupply, metadata);
            console.log('[confirmGenesis] Token saved with ID:', token.id);
            res.json({ tokenId: token.id });
        } catch (e: any) {
            console.error('[confirmGenesis] Error:', e);
            res.status(500).json({ error: e.message });
        }
    }

    private async mintToken(req: Express.Request, res: Express.Response) {
        try {
            const { tokenId } = req.params;
            const { recipientIdentityKey, amount } = req.body;
            const creatorIdentityKey = req.headers['x-bsv-identity-key'] as string;

            const result = await this.tokenService.prepareMintAction(tokenId, creatorIdentityKey, recipientIdentityKey, amount);
            res.json(result);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    private async confirmMint(req: Express.Request, res: Express.Response) {
        try {
            const { tokenId, txid, vout, recipientIdentityKey, amount } = req.body;

            await this.tokenService.confirmMint(tokenId, txid, vout, recipientIdentityKey, amount);
            res.json({ success: true });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    private async transferToken(req: Express.Request, res: Express.Response) {
        try {
            const { tokenId } = req.params;
            const { recipientIdentityKey, amount } = req.body;
            const senderIdentityKey = req.headers['x-bsv-identity-key'] as string;

            const result = await this.tokenService.prepareTransferAction(tokenId, senderIdentityKey, recipientIdentityKey, amount);
            res.json(result);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    private async executeTransfer(req: Express.Request, res: Express.Response) {
        try {
            const { tokenId } = req.params;
            const { recipientIdentityKey, amount } = req.body;
            const senderIdentityKey = req.headers['x-bsv-identity-key'] as string;

            if (!senderIdentityKey) {
                res.status(400).json({ error: 'Missing identity key' });
                return;
            }

            const result = await this.tokenService.executeTransfer(tokenId, senderIdentityKey, recipientIdentityKey, amount);
            res.json(result);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    private async confirmTransfer(req: Express.Request, res: Express.Response) {
        try {
            const { tokenId, txid, inputs, outputs } = req.body;
            // inputs: { txid, vout }[]
            // outputs: { vout, amount, recipient }[]

            await this.tokenService.confirmTransfer(tokenId, txid, inputs, outputs);
            res.json({ success: true });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    private async getMyTokens(req: Express.Request, res: Express.Response) {
        try {
            const identityKey = req.headers['x-bsv-identity-key'] as string;
            console.log('[getMyTokens] Identity key from header:', identityKey);
            if (!identityKey) {
                res.status(400).json({ error: 'Missing identity key' });
                return;
            }
            const tokens = await this.tokenService.getTokensByCreator(identityKey);
            console.log('[getMyTokens] Found tokens:', tokens.length, tokens);
            res.json(tokens);
        } catch (e: any) {
            console.error('[getMyTokens] Error:', e);
            res.status(500).json({ error: e.message });
        }
    }

    private async getMyBalances(req: Express.Request, res: Express.Response) {
        try {
            const identityKey = req.headers['x-bsv-identity-key'] as string;
            console.log('[getMyBalances] Identity key from header:', identityKey);
            if (!identityKey) {
                res.status(400).json({ error: 'Missing identity key' });
                return;
            }
            const tokens = await this.tokenService.getTokensByHolder(identityKey);
            console.log('[getMyBalances] Found tokens:', tokens.length, tokens);
            res.json(tokens);
        } catch (e: any) {
            console.error('[getMyBalances] Error:', e);
            res.status(500).json({ error: e.message });
        }
    }

    /**
     * Get service tokens - tokens created by the backend wallet
     * These are tokens for municipal services that the admin can manage
     */
    private async getServiceTokens(req: Express.Request, res: Express.Response) {
        try {
            const bsvService = BsvService.getInstance();
            await bsvService.ready();
            const backendIdentityKey = bsvService.getIdentityKey();
            
            console.log('[getServiceTokens] Backend identity key:', backendIdentityKey);
            const tokens = await this.tokenService.getTokensByCreator(backendIdentityKey);
            console.log('[getServiceTokens] Found service tokens:', tokens.length);
            res.json(tokens);
        } catch (e: any) {
            console.error('[getServiceTokens] Error:', e);
            res.status(500).json({ error: e.message });
        }
    }

    private async getAllTokens(req: Express.Request, res: Express.Response) {
        try {
            const tokensRaw = await Token.finder.find(DataFilter.any());
            // Convert to plain objects
            const tokens = tokensRaw.map(token => ({
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
            res.json({
                tokens,
                disclaimer: "This list only includes tokens indexed by this application overlay."
            });
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }

    private async getToken(req: Express.Request, res: Express.Response) {
        try {
            const { tokenId } = req.params;
            const token = await Token.finder.findByKey(tokenId);
            if (!token) {
                res.status(404).json({ error: "Token not found" });
                return;
            }
            res.json(token);
        } catch (e: any) {
            res.status(500).json({ error: e.message });
        }
    }
}
