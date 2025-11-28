// Text utils

"use strict";

/**
 * Turns contract name into typescript file name
 * @param contractName The contract name
 * @returns The typescript file name
 */
export function toTypescriptFileName(contractName: string) {
    let res = "";
    let s = 0;

    for (let i = 0; i < contractName.length; i++) {
        const c = contractName.charAt(i);

        if (c === "_") {
            if (res) {
                res += "-";
            }
            s = 1;
        } else {
            const isBreaker = c.toLowerCase() !== c;

            if (isBreaker) {
                if (s === 0) {
                    if (res) {
                        res += "-";
                    }
                }

                s = 1;
            } else {
                s = 0;
            }

            res += c.toLowerCase();
        }
    }

    return res;
}

/**
 * Splits a big text into multiple lines of max size
 * @param txt The text to split
 * @param lineMaxSize The max size of lines
 * @returns The splitted lines
 */
export function splitBigTextInLines(txt: string, lineMaxSize: number): string[] {
    const result: string[] = [];

    while (txt.length > lineMaxSize) {
        result.push(txt.substring(0, lineMaxSize));
        txt = txt.substring(lineMaxSize);
    }

    if (txt) {
        result.push(txt);
    }

    return result;
}
