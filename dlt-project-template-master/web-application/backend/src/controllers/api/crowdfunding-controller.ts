"use strict";

import Express from "express";
import { Controller } from "../controller";
import { BsvService } from "../../services/bsv-service";
import { Monitor } from "../../monitor";
import { INTERNAL_SERVER_ERROR } from "../../utils/http-utils";

// Import middleware factory
import { createPaymentMiddleware } from '@bsv/payment-express-middleware';
import { createAuthMiddleware } from '@bsv/auth-express-middleware';

export class CrowdfundingController extends Controller {

    /**
     * @typedef WalletInfo
     * @property {string} identityKey.required - The identity key of the backend wallet
     * @property {string} address.required - The address of the backend wallet
     */

    /**
     * @typedef CrowdfundingStatus
     * @property {integer} goal.required - Goal in satoshis
     * @property {integer} raised.required - Amount raised in satoshis
     * @property {integer} investorCount.required - Number of unique investors
     * @property {boolean} isComplete.required - Whether the campaign is complete
     * @property {integer} percentFunded.required - Percentage funded
     * @property {Array.<Investor>} investors.required - List of investors
     */

    /**
     * @typedef Investor
     * @property {string} identityKey.required - Investor identity key
     * @property {integer} amount.required - Amount invested
     * @property {integer} timestamp.required - Investment timestamp
     */

    /**
     * @typedef InvestmentResponse
     * @property {boolean} success.required - Success status
     * @property {integer} amount.required - Amount invested
     * @property {integer} totalRaised.required - Total raised so far
     * @property {string} message.required - Success message
     */

    /**
     * @typedef ErrorResponse
     * @property {string} code.required - Error code
     * @property {string} message.required - Error message
     */

    public registerAPI(prefix: string, app: Express.Express) {
        const bsvPrefix = prefix + "/bsv";

        app.get(bsvPrefix + "/wallet-info", this.getWalletInfo.bind(this));
        app.get(bsvPrefix + "/status", this.getStatus.bind(this));

        // Wrapper for the payment middleware to handle the async/promise nature if needed
        // and to inject the service logic.
        app.post(bsvPrefix + "/invest", this.handleInvest.bind(this));
        app.post(bsvPrefix + "/complete", this.handleComplete.bind(this));
        app.post(bsvPrefix + "/reset", this.handleReset.bind(this));
    }



    /**
     * Completes the crowdfunding campaign
     * Binding: CompleteCrowdfunding
     * @route POST /api/v1/bsv/complete
     * @group crowdfunding
     * @returns {object} 200 - Success
     */
    public async handleComplete(request: Express.Request, response: Express.Response) {
        try {
            const result = await BsvService.getInstance().completeCrowdfunding();
            response.json(result);
        } catch (error) {
            Monitor.exception(error);
            response.status(INTERNAL_SERVER_ERROR).json({ code: "INTERNAL_ERROR", message: error.message });
        }
    }

    /**
     * Returns backend wallet's identity key
     * Binding: GetWalletInfo
     * @route GET /api/v1/bsv/wallet-info
     * @group crowdfunding
     * @returns {WalletInfo.model} 200 - OK
     */
    public async getWalletInfo(request: Express.Request, response: Express.Response) {
        try {
            const identityKey = BsvService.getInstance().getIdentityKey();
            const address = BsvService.getInstance().getAddress();
            response.json({ identityKey, address });
        } catch (error) {
            Monitor.exception(error);
            response.status(INTERNAL_SERVER_ERROR).json({ code: "INTERNAL_ERROR", message: error.message });
        }
    }

    /**
     * Returns current crowdfunding status
     * Binding: GetCrowdfundingStatus
     * @route GET /api/v1/bsv/status
     * @group crowdfunding
     * @returns {CrowdfundingStatus.model} 200 - OK
     */
    public async getStatus(request: Express.Request, response: Express.Response) {
        try {
            const status = await BsvService.getInstance().getStatus();
            response.json(status);
        } catch (error) {
            Monitor.exception(error);
            response.status(INTERNAL_SERVER_ERROR).json({ code: "INTERNAL_ERROR", message: error.message });
        }
    }

    /**
     * Accepts an investment payment
     * Binding: Invest
     * @route POST /api/v1/bsv/invest
     * @group crowdfunding
     * @returns {InvestmentResponse.model} 200 - Investment received
     * @returns {ErrorResponse.model} 402 - Payment Required
     * @returns {ErrorResponse.model} 400 - Bad Request
     */
    public async handleInvest(request: Express.Request, response: Express.Response, next: Express.NextFunction) {
        Monitor.debug("HandleInvest - Start");

        const bsvService = BsvService.getInstance();
        const wallet = bsvService.getWallet();

        if (!wallet) {
            return response.status(INTERNAL_SERVER_ERROR).json({ code: "CONFIG_ERROR", message: "BSV Wallet not initialized" });
        }

        const authMiddleware = createAuthMiddleware({
            wallet: wallet,
            allowUnauthenticated: true,
            logger: console,
            logLevel: 'info'
        });

        const paymentMiddleware = createPaymentMiddleware({
            wallet: wallet
        });

        try {
            // 1. Run Auth Middleware
            await new Promise<void>((resolve, reject) => {
                authMiddleware(request, response, (err: any) => {
                    if (err) reject(err);
                    else resolve();
                });
            });

            // MANUAL IDENTITY EXTRACTION
            const req = request as any;
            const paymentHeaderRaw = req.headers['x-bsv-payment'];
            if (paymentHeaderRaw && typeof paymentHeaderRaw === 'string') {
                try {
                    const paymentData = JSON.parse(paymentHeaderRaw);
                    if (paymentData.senderIdentityKey) {
                        if (!req.auth) req.auth = {};
                        req.auth.identityKey = paymentData.senderIdentityKey;
                    }
                } catch (e) {
                    Monitor.error(`Failed to parse payment header: ${e}`);
                }
            }

            // 2. Run Payment Middleware
            await new Promise<void>((resolve, reject) => {
                paymentMiddleware(request, response, (err: any) => {
                    if (err) reject(err);
                    else resolve();
                });
            });

            // 3. Business Logic
            if (req.payment && req.payment.accepted) {
                try {
                    const identityKey = req.payment.senderIdentityKey || req.payment.identityKey || (req.auth && req.auth.identityKey) || "unknown";
                    const result = await bsvService.recordInvestment(identityKey, req.payment.satoshisPaid);
                    response.json(result);
                } catch (error) {
                    Monitor.exception(error);
                    response.status(INTERNAL_SERVER_ERROR).json({ code: "INTERNAL_ERROR", message: error.message });
                }
            } else {
                if (!response.headersSent) {
                    response.status(400).json({ code: "PAYMENT_REQUIRED", message: "Payment not accepted" });
                }
            }
        } catch (error) {
            Monitor.exception(error);
            if (!response.headersSent) {
                response.status(INTERNAL_SERVER_ERROR).json({ code: "INTERNAL_ERROR", message: error.message });
            }
        }
    }

    /**
     * Resets the crowdfunding campaign
     * Binding: ResetCrowdfunding
     * @route POST /api/v1/bsv/reset
     * @group crowdfunding
     * @returns {object} 200 - Success
     */
    public async handleReset(request: Express.Request, response: Express.Response) {
        try {
            const result = await BsvService.getInstance().resetCrowdfunding();
            response.json(result);
        } catch (error) {
            Monitor.exception(error);
            response.status(INTERNAL_SERVER_ERROR).json({ code: "INTERNAL_ERROR", message: error.message });
        }
    }
}
