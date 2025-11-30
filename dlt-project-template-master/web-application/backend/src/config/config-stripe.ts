// Reserved for license

"use strict";

/**
 * Stripe configuration.
 */
export class StripeConfig {

    /**
     * Gets the configuration instance.
     */
    public static getInstance(): StripeConfig {
        if (StripeConfig.instance) {
            return StripeConfig.instance;
        }

        const config: StripeConfig = new StripeConfig();

        config.clientId = process.env.STRIPE_CLIENT_ID || "pk_test_51Ot8NbCcLTQnomPKRIFCf7w1Iwc5fWludm6Jl5l1jdGgQjiRHJTH1vwJSDqW8h9cTfhVevbYE5uua5OyFTv9ITht00PbVpAYx5";
        config.clientSecret = process.env.STRIPE_CLIENT_SECRET || "sk_test_51Ot8NbCcLTQnomPKhEe78jcUgUe5S4zOaTu8A7hMWSUWBzDPxjcYl3vIq1Iv0JXNA1BQixXRkvloFzfu5nmpmnzn00AhsYRckO";
        config.webhookId = process.env.STRIPE_WEBHOOK_SECRET || "";
        config.fee = Number(process.env.STRIPE_FEE) || 0;

        StripeConfig.instance = config;

        return config;
    }
    private static instance: StripeConfig = null;

    public clientId: string;
    public clientSecret: string;
    public webhookId: string;
    public fee: number;

    constructor() {
        this.clientId = "pk_test_51Ot8NbCcLTQnomPKRIFCf7w1Iwc5fWludm6Jl5l1jdGgQjiRHJTH1vwJSDqW8h9cTfhVevbYE5uua5OyFTv9ITht00PbVpAYx5";
        this.clientSecret = "sk_test_51Ot8NbCcLTQnomPKhEe78jcUgUe5S4zOaTu8A7hMWSUWBzDPxjcYl3vIq1Iv0JXNA1BQixXRkvloFzfu5nmpmnzn00AhsYRckO";
        this.webhookId = "";
        this.fee = 0;
    }
}
