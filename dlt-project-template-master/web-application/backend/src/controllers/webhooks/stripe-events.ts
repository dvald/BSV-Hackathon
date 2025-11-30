// Reserved for license

"use strict";

import Express from "express";
import Stripe from "stripe";
import { Monitor } from "../../monitor";
import { Controller } from "../controller";
import { StripeService } from "../../services/stripe-service";
import { StripeConfig } from "../../config/config-stripe";
import { TokenHolder } from "../../models/tokens/token-holder";
import { Token } from "../../models/tokens/token";

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
        Monitor.debug("[STRIPE/SIG] " + sig);

        const stripe = StripeService.getInstance().client;

        if (!stripe) {
            Monitor.warning("Received event, but stripe is misconfigured, cannot handle it.");
            response.status(503).send("Stripe service unavailable");    
            return;
        }
        // Retrieve event from request
        try {
            event = stripe.webhooks.constructEvent(request.body, sig, StripeConfig.getInstance().webhookId);
        } catch (err) {
            Monitor.warning("[STRIPE] Error: " + err.message);
            return response.status(400).send(`Webhook Error: ${err.message}`);
        }

        Monitor.debug(`[STRIPE] Received event of type ${event.type} with data: ${JSON.stringify(event.data)}`);
        // Handle event
        switch (event.type) {
            case "checkout.session.completed":
                {
                    const session: Stripe.Checkout.Session = event.data.object as Stripe.Checkout.Session;
                    
                    if (session.metadata.kind === "token_purchase") {
                        await this.handleTokenPurchase(session);
                    }
                }
                break;
        }

        // Return a response to acknowledge receipt of the event
        response.json({ received: true });
    }

    /**
     * Handle token purchase after successful payment
     */
    private async handleTokenPurchase(session: Stripe.Checkout.Session): Promise<void> {
        const { token_id, amount, holder_identity_key, uid } = session.metadata;

        Monitor.info(`[STRIPE] Processing token purchase: tokenId=${token_id}, amount=${amount}, holder=${holder_identity_key}, uid=${uid}`);

        try {
            // Validate token exists
            const token = await Token.finder.findByKey(token_id);
            if (!token) {
                Monitor.error(`[STRIPE] Token not found: ${token_id}`);
                return;
            }

            // Parse amount
            const tokenAmount = parseInt(amount, 10);
            if (isNaN(tokenAmount) || tokenAmount <= 0) {
                Monitor.error(`[STRIPE] Invalid amount: ${amount}`);
                return;
            }

            // Add balance to holder
            const holder = await TokenHolder.addBalance(token_id, holder_identity_key, tokenAmount);

            Monitor.info(`[STRIPE] Token purchase completed: ${tokenAmount} ${token.symbol} added to ${holder_identity_key}. New balance: ${holder.balance}`);
        } catch (err) {
            Monitor.error(`[STRIPE] Error processing token purchase: ${err.message}`);
        }
    }
}