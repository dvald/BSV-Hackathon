// Script to update the .env file in the backend project

"use strict";

import Path from "path";
import FS from "fs";
import { compareAddresses } from "./utils/blockchain";

/**
 * Entry of the .env file
 */
export type BackendEnvFileEntry = {
    // Variable name
    name: string;
    // Value
    value: string;
};

interface BackendEnvFileEntryStatus {
    value: string;
    found: boolean;
}

export function updateBackendEnvFile(entries: BackendEnvFileEntry[]) {
    const backendEnvFile = Path.resolve(__dirname, "..", "..", "web-application", "backend", ".env");

    if (!FS.existsSync(backendEnvFile)) {
        const exampleEnvFile = Path.resolve(__dirname, "..", "..", "web-application", "backend", ".env.example");

        FS.writeFileSync(backendEnvFile, FS.readFileSync(exampleEnvFile).toString());

        console.log("Backend .env file not found, created new one with the contents of .env.example");
    }

    const entriesMap = new Map<string, BackendEnvFileEntryStatus>();

    for (const entry of entries) {
        entriesMap.set(entry.name, {
            value: entry.value,
            found: false,
        });
    }

    const dotEnvLines = FS.readFileSync(backendEnvFile).toString().split("\n");

    for (let i = 0; i < dotEnvLines.length; i++) {
        const line = dotEnvLines[i].trim();

        if (!line || !line.includes("=")) {
            continue;
        }

        const parts = line.split("=");
        const varName = parts[0];
        const varValue = parts.slice(1).join("=").trim();

        const entry = entriesMap.get(varName);

        if (!entry) {
            continue;
        }

        entry.found = true;

        if (compareAddresses(varValue, entry.value)) {
            continue; // Same value
        }

        console.log(`[BACKEND ENV] Replacing value of ${varName} from '${varValue}' to '${entry.value}'`);

        dotEnvLines[i] = `${varName}=${entry.value}`;
    }

    for (const entry of entries) {
        if (entriesMap.get(entry.name).found) {
            continue;
        }

        console.log(`${entry.name} variable not found in .env file, adding it at the end of the file`);
        dotEnvLines.push(`${entry.name}=${entry.value}`);
    }

    FS.writeFileSync(backendEnvFile, dotEnvLines.join("\n"));

    console.log("Updated file: " + backendEnvFile);
}
