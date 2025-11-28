// Reserved for license

"use strict";

/**
 * Smart contracts configuration.
 */
export class SmartContractsConfig {
    /**
     * Gets the configuration instance.
     */
    public static getInstance(): SmartContractsConfig {
        if (SmartContractsConfig.instance) {
            return SmartContractsConfig.instance;
        }

        const config: SmartContractsConfig = new SmartContractsConfig();

        SmartContractsConfig.instance = config;

        return config;
    }

    private static instance: SmartContractsConfig = null;
}
