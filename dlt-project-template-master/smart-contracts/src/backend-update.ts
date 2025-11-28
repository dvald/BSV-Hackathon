// Script to update the wrappers in the backend project

"use strict";

import Path from "path";
import FS from "fs";
import { getContractByteCode } from "./utils/bytecode";
import { splitBigTextInLines, toTypescriptFileName } from "./utils/text";
import { SMART_CONTRACTS } from "./contracts";

/**
 * Copies the wrappers into the backend project
 */
function copyWrappersToBackend() {
    const wrappersPath = Path.resolve(__dirname, "contract-wrappers");
    const backendWrappersPath = Path.resolve(__dirname, "..", "..", "web-application", "backend", "src", "contracts");

    if (!FS.existsSync(backendWrappersPath)) {
        FS.mkdirSync(backendWrappersPath);
    }

    const oldWrappers = FS.readdirSync(backendWrappersPath).filter(f => f.endsWith(".ts"));

    for (const oldWrapper of oldWrappers) {
        FS.unlinkSync(Path.resolve(backendWrappersPath, oldWrapper));
    }

    const files = FS.readdirSync(wrappersPath).filter(file => file.endsWith(".ts"));

    for (const file of files) {
        const filePath = Path.resolve(wrappersPath, file);
        const destPath = Path.resolve(backendWrappersPath, file);

        FS.writeFileSync(destPath, FS.readFileSync(filePath).toString());
    }

    for (const contract of Object.values(SMART_CONTRACTS)) {
        if (!contract.generateBytecodeFile) {
            continue;
        }

        const bytecodeFile = Path.resolve(backendWrappersPath, toTypescriptFileName(contract.contractName + "-bytecode.ts"));
        const bytecode = getContractByteCode(contract.contractName);

        const bytecodeSplitted = splitBigTextInLines(bytecode.toString("base64"), 64);

        let generatedText = "// Bytecode for " + contract.contractName + "\n\n" + '"use strict";' + "\n\n";

        generatedText += `// Bytecode for ${contract.contractName}\n`;
        generatedText += `export const ${contract.contractName}Bytecode = Buffer.from(${JSON.stringify(bytecodeSplitted, null, 4)}.join(""), "base64");\n`;

        FS.writeFileSync(bytecodeFile, generatedText);
    }
}

copyWrappersToBackend();
