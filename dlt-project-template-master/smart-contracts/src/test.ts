// Run contract tests

"use strict";

require('dotenv').config();

import { runContractTests } from "./tests/index";

async function main() {
    runContractTests();
}

main().catch(function (ex) {
    console.error(ex);
    process.exit(1);
});
