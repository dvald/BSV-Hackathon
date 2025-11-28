"use strict";

import { IdentityClient } from "@bsv/sdk";

/**
 * Resolves a BSV identity by username/handle
 * @param userName The username or handle to resolve
 * @returns The resolved identity or null if not found
 */
export async function resolveIdentityByHandle(userName: string) {
    const identityClient = new IdentityClient();

    try {
        const response = await identityClient.resolveByAttributes({
            attributes: { userName },
        });

        return response[0] ?? null;
    } catch (err) {
        return null;
    }
}

/**
 * Resolves a BSV identity by identity key (public key)
 * @param identityKey The identity key (public key) to resolve
 * @returns The resolved identity or null if not found
 */
export async function resolveIdentityByKey(identityKey: string) {
    const identityClient = new IdentityClient();

    try {
        const response = await identityClient.resolveByAttributes({
            attributes: { identityKey },
        });

        return response[0] ?? null;
    } catch (err) {
        return null;
    }
}
