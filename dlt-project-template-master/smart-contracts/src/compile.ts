// Compilation script

"use strict";

require('dotenv').config();

import ChildProcess from "child_process";
import Path from "path";
import FS from "fs";

async function main() {
    // Find smart contracts to compile

    const contractFiles = FS.readdirSync(Path.resolve(__dirname, "..", "contracts")).filter(f => f.endsWith(".sol"));

    if (FS.existsSync(Path.resolve(__dirname, "..", "contracts", "test"))) {
        const testContractFiles = FS.readdirSync(Path.resolve(__dirname, "..", "contracts", "test")).filter(f => f.endsWith(".sol"));

        for (const contractFile of testContractFiles) {
            contractFiles.push("test/" + contractFile);
        }
    }

    // Prepare and run solc command

    await new Promise<void> ((resolve, reject) => {
        const task = ChildProcess.spawn(JSON.stringify(Path.resolve(__dirname, "..", "node_modules", ".bin", "solcjs" + (process.platform === "win32" ? ".cmd" : ""))), [
            "--bin", "--abi",
            "--optimize",
            "--optimize-runs", "1",
            "--base-path", JSON.stringify(Path.resolve(__dirname, "..", "contracts")),
            "--include-path", JSON.stringify(Path.resolve(__dirname, "..", "node_modules")),
            "--output-dir", JSON.stringify(Path.resolve(__dirname, "..", "build")),
            "--pretty-json",
            "--verbose",
        ].concat(contractFiles.map(c => JSON.stringify(c))), {
            stdio: "pipe",
            env: process.env,
            cwd: Path.resolve(__dirname, "..", "contracts"),
            shell: true,
        });

        task.on("message", msg => {
            console.log(msg);
        });

        task.stderr.on("data", chunk => {
            console.log(chunk.toString());
        });

        task.stdout.on("data", chunk => {
            console.log(chunk.toString());
        });

        task.on("error", err => {
            reject(err);
        });

        task.on("exit", (code) => {
            if (code) {
                return reject("Compilation failed (" + code + ")");
            }
            resolve();
        });
    });
}

main().catch(function (ex) {
    console.error(ex);
    process.exit(1);
});
