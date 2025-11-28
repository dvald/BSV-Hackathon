// UserDoc generation

"use strict";

require('dotenv').config();

import Solc from "solc";
import Path from "path";
import FS from "fs";
import OS from "os";

function withUnixPathSeparators(filePath) {
    // On UNIX-like systems forward slashes in paths are just a part of the file name.
    if (OS.platform() !== 'win32') {
        return filePath;
    }

    return filePath.replace(/\\/g, '/');
}

async function main() {
    // Find smart contracts to compile

    const contractFiles = FS.readdirSync(Path.resolve(__dirname, "..", "contracts")).filter(f => f.endsWith(".sol"));

    if (FS.existsSync(Path.resolve(__dirname, "..", "contracts", "test"))) {
        const testContractFiles = FS.readdirSync(Path.resolve(__dirname, "..", "contracts", "test")).filter(f => f.endsWith(".sol"));

        for (const contractFile of testContractFiles) {
            contractFiles.push("test/" + contractFile);
        }
    }

    const basePath = Path.resolve(__dirname, "..", "contracts");
    const includePath = Path.resolve(__dirname, "..", "node_modules");

    function readFileCallback(sourcePath: string) {
        const prefixes = [basePath, includePath];
        for (const prefix of prefixes) {
            const prefixedSourcePath = (prefix ? prefix + '/' : '') + sourcePath;

            if (FS.existsSync(prefixedSourcePath)) {
                try {
                    return { contents: FS.readFileSync(prefixedSourcePath).toString('utf8') };
                } catch (e) {
                    return { error: 'Error reading ' + prefixedSourcePath + ': ' + e };
                }
            }
        }
        return { error: 'File not found inside the base path or any of the include paths.' };
    }

    function makeSourcePathRelativeIfPossible(sourcePath: string): string {
        const absoluteBasePath = basePath;
        const absoluteIncludePaths = [includePath];

        // Compared to base path stripping logic in solc this is much simpler because path.resolve()
        // handles symlinks correctly (does not resolve them except in work dir) and strips .. segments
        // from paths going beyond root (e.g. `/../../a/b/c` -> `/a/b/c/`). It's simpler also because it
        // ignores less important corner cases: drive letters are not stripped from absolute paths on
        // Windows and UNC paths are not handled in a special way (at least on Linux). Finally, it has
        // very little test coverage so there might be more differences that we are just not aware of.
        const absoluteSourcePath = Path.resolve(sourcePath);

        for (const absolutePrefix of [absoluteBasePath].concat(absoluteIncludePaths)) {
            const relativeSourcePath = Path.relative(absolutePrefix, absoluteSourcePath);

            if (!relativeSourcePath.startsWith('../')) { return withUnixPathSeparators(relativeSourcePath); }
        }

        // File is not located inside base path or include paths so use its absolute path.
        return withUnixPathSeparators(absoluteSourcePath);
    }

    const buildPath = Path.resolve(__dirname, "..", "build");

    const callbacks = {
        "import": readFileCallback
    };

    const sources = Object.create(null);

    for (const file of contractFiles) {
        const fileAbs = Path.resolve(basePath, file);
        sources[makeSourcePathRelativeIfPossible(fileAbs)] = {
            content: FS.readFileSync(fileAbs).toString()
        };
    }

    const cliInput = {
        language: 'Solidity',
        settings: {
            optimizer: {
                enabled: true,
                runs: 1,
            },
            outputSelection: {
                '*': {
                    '*': ['userdoc', 'devdoc']
                }
            }
        },
        sources: sources,
    };

    console.log("Parsing Solidity user documentation...");

    let hasError = false;
    const output = JSON.parse(Solc.compile(JSON.stringify(cliInput), callbacks));

    if (!output) {
        console.error('No output from compiler');
        process.exit(1);
    } else if (output.errors) {
        for (const error in output.errors) {
            const message = output.errors[error];
            if (message.severity === 'warning') {
                console.log(message.formattedMessage);
            } else {
                console.error(message.formattedMessage);
                hasError = true;
            }
        }
    }

    for (const fileName in output.contracts) {
        for (const contractName in output.contracts[fileName]) {
            let contractFileName = fileName + ':' + contractName;
            contractFileName = contractFileName.replace(/[:./\\]/g, '_');

            const userDocFile = Path.resolve(buildPath, contractFileName + '.userdoc.json');

            FS.writeFileSync(userDocFile, JSON.stringify(output.contracts[fileName][contractName].userdoc || {}, null, 4));

            const devDocFile = Path.resolve(buildPath, contractFileName + '.devdoc.json');

            FS.writeFileSync(devDocFile, JSON.stringify(output.contracts[fileName][contractName].devdoc || {}, null, 4));
        }
    }

    if (hasError) {
        process.exit(1);
    }
}

main().catch(function (ex) {
    console.error(ex);
    process.exit(1);
});
