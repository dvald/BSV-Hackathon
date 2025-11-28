// Log debug function

"use strict";

import { BlockchainConfig } from "../config/config-blockchain";

/**
 * Logs a debug message
 * @param msg The message
 */
export function logDebug(msg: string) {
    if (!BlockchainConfig.getInstance().logDebug) {
        return;
    }

    console.log("[DEBUG] " + msg);
}
