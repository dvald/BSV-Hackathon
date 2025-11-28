"use strict";

import { Monitor } from "../monitor";

/**
 * BSV configuration.
 */
export class BsvConfig {

    /**
     * Gets the configuration instance.
     */
    public static getInstance(): BsvConfig {
        if (BsvConfig.instance) {
            return BsvConfig.instance;
        }

        const config: BsvConfig = new BsvConfig();

        Monitor.debug("Initializing BsvConfig...");
        Monitor.debug(`BSV_PRIVATE_KEY length: ${process.env.BSV_PRIVATE_KEY ? process.env.BSV_PRIVATE_KEY.length : "undefined"}`);
        Monitor.debug(`BSV_NETWORK: ${process.env.BSV_NETWORK}`);
        config.privateKey = process.env.BSV_PRIVATE_KEY || "";
        config.network = process.env.BSV_NETWORK || "main";

        BsvConfig.instance = config;

        return config;
    }
    private static instance: BsvConfig = null;

    public privateKey: string;
    public network: string;

    constructor() {
        this.privateKey = "";
        this.network = "main";
    }
}
