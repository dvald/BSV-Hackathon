// WebSocket Connection Manager Service

"use strict";

import { WebsocketController } from "../controllers/websocket/websocket";
import { Monitor } from "../monitor";

/**
 * WebSocket Connection Manager
 * Manages WebSocket connections by user DID
 */
export class WebSocketManager {
    private static instance: WebSocketManager | null = null;

    // Map of user DID to array of WebSocket controllers
    private connectionsByDID: Map<string, Set<WebsocketController>> = new Map();

    // Map of WebSocket controller to user DID
    private didByConnection: Map<WebsocketController, string> = new Map();

    public static getInstance(): WebSocketManager {
        if (WebSocketManager.instance === null) {
            WebSocketManager.instance = new WebSocketManager();
        }
        return WebSocketManager.instance;
    }

    /**
     * Register a WebSocket connection for a user DID
     * @param did User DID
     * @param controller WebSocket controller
     */
    public registerConnection(did: string, controller: WebsocketController): void {
        if (!did) {
            Monitor.debug("WebSocketManager: Attempted to register connection without DID");
            return;
        }

        if (!this.connectionsByDID.has(did)) {
            this.connectionsByDID.set(did, new Set());
        }

        this.connectionsByDID.get(did)!.add(controller);
        this.didByConnection.set(controller, did);

        Monitor.debug(`WebSocketManager: Registered connection for DID ${did.substring(0, 20)}... (Total: ${this.connectionsByDID.get(did)!.size})`);
    }

    /**
     * Unregister a WebSocket connection
     * @param controller WebSocket controller
     */
    public unregisterConnection(controller: WebsocketController): void {
        const did = this.didByConnection.get(controller);
        if (!did) {
            return;
        }

        const connections = this.connectionsByDID.get(did);
        if (connections) {
            connections.delete(controller);
            if (connections.size === 0) {
                this.connectionsByDID.delete(did);
            }
        }

        this.didByConnection.delete(controller);

        Monitor.debug(`WebSocketManager: Unregistered connection for DID ${did.substring(0, 20)}...`);
    }

    /**
     * Send a message to all connections for a specific user DID
     * @param did User DID
     * @param message Message to send
     */
    public sendToUser(did: string, message: any): void {
        if (!did) {
            Monitor.debug("WebSocketManager: Attempted to send message without DID");
            return;
        }

        const connections = this.connectionsByDID.get(did);
        if (!connections || connections.size === 0) {
            Monitor.debug(`WebSocketManager: No connections found for DID ${did.substring(0, 20)}...`);
            return;
        }

        let sentCount = 0;
        connections.forEach(controller => {
            try {
                controller.send(message);
                sentCount++;
            } catch (error) {
                Monitor.error(`WebSocketManager: Error sending message to connection: ${error.message}`);
                // Remove broken connection
                this.unregisterConnection(controller);
            }
        });

        Monitor.debug(`WebSocketManager: Sent message to ${sentCount} connection(s) for DID ${did.substring(0, 20)}...`);
    }

    /**
     * Get the number of active connections for a user DID
     * @param did User DID
     * @returns Number of active connections
     */
    public getConnectionCount(did: string): number {
        const connections = this.connectionsByDID.get(did);
        return connections ? connections.size : 0;
    }

    /**
     * Get total number of connected users
     * @returns Number of unique users with active connections
     */
    public getTotalUsers(): number {
        return this.connectionsByDID.size;
    }
}

