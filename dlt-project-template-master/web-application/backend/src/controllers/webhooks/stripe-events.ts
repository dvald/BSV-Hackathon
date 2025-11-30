// Reserved for license

"use strict";

import Express from "express";
import Stripe from "stripe";
import { Monitor } from "../../monitor";
import { Controller } from "../controller";
import { StripeService } from "../../services/stripe-service";
import { StripeConfig } from "../../config/config-stripe";
import { TokenService } from "../../services/token-service";

/**
 * Endpoints called by external services
 * for events and third party login
 */
export class StripeEventsController extends Controller {
    public register(application: Express.Express): any {
        // Stripe webhook endpoint
        application.post("/stripe/webhook", Express.raw({ type: "application/json" }), this.stripeEventHandler.bind(this));
    }

    public async stripeEventHandler(request: Express.Request, response: Express.Response) {
        const sig = request.headers["stripe-signature"];
        let event: Stripe.Event;
        
        Monitor.info("[STRIPE] Webhook received");
        Monitor.debug("[STRIPE/SIG] " + sig);
        Monitor.debug("[STRIPE/BODY-TYPE] " + typeof request.body);

        if (!sig) {
            Monitor.warning("[STRIPE] No stripe-signature header found");
            return response.status(400).send("Missing stripe-signature header");
        }

        const stripe = StripeService.getInstance().client;

        if (!stripe) {
            Monitor.warning("Received event, but stripe is misconfigured, cannot handle it.");
            response.status(503).send("Stripe service unavailable");    
            return;
        }

        // Ensure body is Buffer for signature verification
        const body = Buffer.isBuffer(request.body) ? request.body : Buffer.from(JSON.stringify(request.body));
        Monitor.debug("[STRIPE/BODY-IS-BUFFER] " + Buffer.isBuffer(request.body));

        // Retrieve event from request
        try {
            event = stripe.webhooks.constructEvent(body, sig, StripeConfig.getInstance().webhookId);
        } catch (err) {
            Monitor.warning("[STRIPE] Signature verification error: " + err.message);
            Monitor.debug("[STRIPE] Webhook secret configured: " + (StripeConfig.getInstance().webhookId ? "Yes" : "No"));
            return response.status(400).send(`Webhook Error: ${err.message}`);
        }

        Monitor.debug(`[STRIPE] Received event of type ${event.type} with data: ${JSON.stringify(event.data)}`);
        // Handle event
        switch (event.type) {
            case "checkout.session.completed":
                {
                    const session: Stripe.Checkout.Session = event.data.object as Stripe.Checkout.Session;
                    
                    Monitor.info(`[STRIPE] checkout.session.completed - metadata: ${JSON.stringify(session.metadata)}`);
                    
                    if (session.metadata && session.metadata.kind === "token_purchase") {
                        Monitor.info(`[STRIPE] Processing token_purchase...`);
                        await this.handleTokenPurchase(session);
                    } else {
                        Monitor.warning(`[STRIPE] Session metadata.kind is not 'token_purchase': ${session.metadata?.kind}`);
                    }
                }
                break;
            default:
                Monitor.debug(`[STRIPE] Unhandled event type: ${event.type}`);
        }

        // Return a response to acknowledge receipt of the event
        response.json({ received: true });
    }

    /**
     * Handle token purchase after successful payment
     * Supports two modes:
     * 1. Parking payment (token_id=SERVICE): grants LOYALTY_TOKEN + 1 SERVICE_TOKEN
     * 2. Buy Credits (token_id=SERVICE_TOKEN): grants SERVICE_TOKEN based on price
     */
    private async handleTokenPurchase(session: Stripe.Checkout.Session): Promise<void> {
        const { token_id, amount, holder_identity_key, uid } = session.metadata;

        Monitor.info(`[STRIPE] Processing payment: token_id=${token_id}, holder=${holder_identity_key}, amount=${amount} cents, uid=${uid}`);

        try {
            if (!holder_identity_key) {
                Monitor.error(`[STRIPE] Missing holder_identity_key in metadata`);
                return;
            }

            const amountCents = parseInt(amount, 10) || 0;

            // Check if this is a "Buy Credits" purchase (SERVICE_TOKEN)
            if (token_id === 'SERVICE_TOKEN') {
                // Buy Credits flow: 1 token = 5 cents (0.05 EUR)
                const tokensToMint = Math.floor(amountCents / 5);
                
                if (tokensToMint <= 0) {
                    Monitor.error(`[STRIPE] Invalid amount for SERVICE_TOKEN purchase: ${amountCents} cents`);
                    return;
                }

                Monitor.info(`[STRIPE] Buy Credits: Minting ${tokensToMint} SERVICE_TOKEN to ${holder_identity_key}`);

                let serviceResult;
                try {
                    serviceResult = await TokenService.getInstance().addBalance(
                        holder_identity_key,
                        'SERVICE_TOKEN',
                        tokensToMint
                    );
                    Monitor.info(`[STRIPE] SERVICE_TOKEN minted successfully: ${serviceResult.balance}`);
                } catch (serviceErr: any) {
                    Monitor.error(`[STRIPE] Failed to mint SERVICE_TOKEN: ${serviceErr.message}`);
                    return;
                }

                // Also give bonus LOYALTY_TOKEN (10% of tokens purchased)
                const loyaltyBonus = Math.max(1, Math.floor(tokensToMint / 10));
                
                let loyaltyResult;
                try {
                    loyaltyResult = await TokenService.getInstance().addBalance(
                        holder_identity_key,
                        'LOYALTY_TOKEN',
                        loyaltyBonus
                    );
                    Monitor.info(`[STRIPE] LOYALTY_TOKEN minted successfully: ${loyaltyResult.balance}`);
                } catch (loyaltyErr: any) {
                    Monitor.error(`[STRIPE] Failed to mint LOYALTY_TOKEN: ${loyaltyErr.message}`);
                }

                Monitor.info(`[STRIPE] Buy Credits completed: ${tokensToMint} SERVICE_TOKEN + ${loyaltyBonus} LOYALTY_TOKEN to ${holder_identity_key}`);

            } else {
                // Parking/Service payment flow (original behavior)
                const LOYALTY_REWARD = 10;
                const SERVICE_TOKENS_GRANTED = 1;
                
                Monitor.info(`[STRIPE] Service payment: Granting ${LOYALTY_REWARD} LOYALTY_TOKEN + ${SERVICE_TOKENS_GRANTED} SERVICE_TOKEN`);

                const loyaltyResult = await TokenService.getInstance().addBalance(
                    holder_identity_key,
                    'LOYALTY_TOKEN',
                    LOYALTY_REWARD
                );

                const serviceResult = await TokenService.getInstance().addBalance(
                    holder_identity_key,
                    'SERVICE_TOKEN',
                    SERVICE_TOKENS_GRANTED
                );

                Monitor.info(`[STRIPE] Service payment completed. LOYALTY: ${loyaltyResult.balance}, SERVICE: ${serviceResult.balance}`);
            }

        } catch (err) {
            Monitor.error(`[STRIPE] Error processing payment: ${err.message}`);
        }
    }
}