// User doc for smart contracts

"use strict";

export  type ContractUserDoc = {
    events?: {
        [sig: string]: {
            notice: string,
        }
    },
    methods?: {
        [sig: string]: {
            notice: string,
        }
    },
    notice?: string,
}

export type ContractDevDoc = {
    events?: {
        [sig: string]: {
            details?: string;
            params?: { [name: string]: string },
        }
    },
    methods?: {
        [sig: string]: {
            details?: string;
            params?: { [name: string]: string },
            returns?: { [name: string]: string },
        }
    },
}

export type ContractDoc = { user: ContractUserDoc, dev: ContractDevDoc };