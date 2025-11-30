// Reserved for license

"use strict";

import { MainWebApplication } from "./app";
import { BsvService } from "./services/bsv-service";
import { TokenService } from "./services/token-service";

/**
 * Worker process behaviour.
 */
export class WorkerProcess {
    public async run() {
        await BsvService.getInstance().ready();

        // Initialize TokenService with wallet
        const wallet = BsvService.getInstance().getWallet();
        TokenService.getInstance().setWallet(wallet);

        const app = new MainWebApplication();
        app.start();
    }
}
