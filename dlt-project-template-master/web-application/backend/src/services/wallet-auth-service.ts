// BSV Wallet Authentication Service

"use strict";

import Express from "express";
import { User } from "../models/users/user";
import { Session } from "../models/users/session";
import { Monitor } from "../monitor";
import { createRandomUID } from "../utils/text-utils";
import { DEFAULT_LOCALE } from "./i18n-service";
import { DataFilter, OrderBy } from "tsbean-orm";

/**
 * Service for handling BSV Wallet authentication
 * Uses @bsv/auth-express-middleware for signature verification
 */
export class WalletAuthService {
    /* Singleton */

    public static instance: WalletAuthService = null;

    public static getInstance(): WalletAuthService {
        if (WalletAuthService.instance !== null) {
            return WalletAuthService.instance;
        } else {
            WalletAuthService.instance = new WalletAuthService();
            return WalletAuthService.instance;
        }
    }

    constructor() {
        // No initialization needed
    }

    /**
     * Extracts the wallet identity key from a request authenticated by Auth Express middleware
     * @param request The Express request with auth context
     * @returns The wallet identity key or null if not found
     */
    public extractIdentityKey(request: Express.Request): string | null {
        // The @bsv/auth-express-middleware attaches the identity key to the request
        // Check common patterns for where the middleware stores it
        const authContext = (request as any).authContext || (request as any).bsvAuth;

        if (authContext && authContext.identityKey) {
            return authContext.identityKey;
        }

        // Check if it's in the body (some middleware patterns)
        if (request.body && request.body.identityKey) {
            return request.body.identityKey;
        }

        Monitor.warning("Could not extract identity key from authenticated request");
        return null;
    }

    /**
     * Finds or creates a user based on wallet identity key
     * @param walletIdentityKey The public identity key from the wallet
     * @param locale User locale for new users
     * @returns The user (existing or newly created)
     */
    public async findOrCreateUserByWallet(walletIdentityKey: string, locale?: string): Promise<User> {
        // Try to find existing user - using DataFilter.equals like other User.finder searches
        const existingUsers = await User.finder.find(
            DataFilter.equals("walletIdentityKey", walletIdentityKey),
            OrderBy.nothing()
        );

        if (existingUsers.length > 0) {
            return existingUsers[0];
        }

        // Create new user with wallet authentication
        const userLocale = locale || DEFAULT_LOCALE;
        const userId = createRandomUID();

        // Generate a unique username based on wallet identity key (truncated)
        const usernameBase = "wallet_" + walletIdentityKey.substring(0, 8);
        let username = usernameBase;
        let counter = 1;

        // Ensure username is unique
        while (await User.findUserByUsername(username)) {
            username = usernameBase + "_" + counter;
            counter++;
        }

        const newUser = new User({
            id: userId,
            username: username,
            email: "", // Wallet users don't need email initially
            emailVerified: false,
            emailVerificationCode: "",
            passwordHash: "",
            passwordSalt: "",
            walletProvider: "bsv-metanet",
            walletIdentityKey: walletIdentityKey,
            created: Date.now(),
            locale: userLocale,
        });

        try {
            await newUser.insert();
            Monitor.info(`Created new wallet user: ${username} with identity key ${walletIdentityKey.substring(0, 16)}...`);
            return newUser;
        } catch (ex) {
            Monitor.exception(ex, "Failed to create wallet user");
            throw ex;
        }
    }

    /**
     * Links a wallet identity to an existing user account
     * @param user The existing user to link the wallet to
     * @param walletIdentityKey The wallet identity key to link
     * @returns True if successful, false if identity is already linked to another user
     */
    public async linkWalletToUser(user: User, walletIdentityKey: string): Promise<boolean> {
        // Check if this identity key is already linked to another user
        const existingUsers = await User.finder.find(
            DataFilter.equals("walletIdentityKey", walletIdentityKey),
            OrderBy.nothing()
        );

        if (existingUsers.length > 0) {
            // Check if it's the same user
            if (existingUsers[0].id === user.id) {
                // Already linked to this user
                return true;
            }
            // Linked to a different user
            Monitor.warning(`Wallet identity ${walletIdentityKey.substring(0, 16)}... already linked to user ${existingUsers[0].id}`);
            return false;
        }

        // Link the wallet to this user
        user.walletProvider = "bsv-metanet";
        user.walletIdentityKey = walletIdentityKey;

        try {
            await user.save();
            Monitor.info(`Linked wallet identity to user ${user.id} (${user.username})`);
            return true;
        } catch (ex) {
            Monitor.exception(ex, "Failed to link wallet to user");
            throw ex;
        }
    }

    /**
     * Creates a session for a wallet-authenticated user
     * @param user The user to create a session for
     * @param request The Express request
     * @returns The created session
     */
    public async createWalletSession(user: User, request: Express.Request): Promise<Session> {
        const remoteAddress = request.ip || request.connection?.remoteAddress || "unknown";
        const userAgent = request.headers["user-agent"] || "unknown";

        // Parse user agent for OS and browser (simplified)
        const os = userAgent.includes("Windows") ? "Windows" :
            userAgent.includes("Mac") ? "Mac" :
                userAgent.includes("Linux") ? "Linux" : "Unknown";
        const browser = userAgent.includes("Chrome") ? "Chrome" :
            userAgent.includes("Firefox") ? "Firefox" :
                userAgent.includes("Safari") ? "Safari" : "Unknown";

        try {
            const session = await Session.createSession(user, false, remoteAddress, os, browser);
            return session;
        } catch (ex) {
            Monitor.exception(ex, "Failed to create wallet session");
            throw ex;
        }
    }
}
