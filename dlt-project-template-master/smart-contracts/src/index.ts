// Script to deploy smart contracts

"use strict";

require('dotenv').config();

import { deploySmartContracts } from "./contract-deployment";

async function main() {
    deploySmartContracts();
}

main().catch(function (ex) {
    console.error(ex);
    process.exit(1);
});
