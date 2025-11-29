// Verifiable Credential Storage Model

"use strict";

import { DataModel, enforceType, TypedRow, DataSource, DataFinder } from "tsbean-orm";

const DATA_SOURCE = DataSource.DEFAULT;
const TABLE = "verifiable_credentials";
const PRIMARY_KEY = "id";

/**
 * Verifiable Credential Storage
 * Stores credentials issued by the government/services
 */
export class VerifiableCredential extends DataModel {
    public static finder = new DataFinder<VerifiableCredential>(
        DATA_SOURCE, 
        TABLE, 
        PRIMARY_KEY, 
        (row: TypedRow<VerifiableCredential>) => new VerifiableCredential(row)
    );

    /**
     * Credential ID (unique identifier)
     * db-type: VARCHAR 255
     */
    public id: string;

    /**
     * DID of the credential holder (citizen)
     * db-type: VARCHAR 255
     */
    public holderDID: string;

    /**
     * DID of the credential issuer (government/service)
     * db-type: VARCHAR 255
     */
    public issuerDID: string;

    /**
     * Type of credential (e.g., "CitizenCard", "YouthCard", "SeniorCard")
     * db-type: VARCHAR 100
     */
    public type: string;

    /**
     * Full credential document (JSON string)
     * db-type: TEXT
     */
    public credentialJSON: string;

    /**
     * SHA-256 hash of the credential (for verification)
     * db-type: VARCHAR 64
     */
    public credentialHash: string;

    /**
     * BSV Transaction ID where hash is anchored
     * db-type: VARCHAR 64
     */
    public anchorTxid: string;

    /**
     * Issuance timestamp
     * db-type: BIGINT
     */
    public issuedAt: number;

    /**
     * Expiration timestamp (0 = no expiration)
     * db-type: BIGINT
     */
    public expiresAt: number;

    /**
     * Revocation status
     * db-type: BOOLEAN
     */
    public isRevoked: boolean;

    /**
     * Revocation timestamp (if revoked)
     * db-type: BIGINT
     */
    public revokedAt: number;

    /**
     * Revocation reason
     * db-type: TEXT
     */
    public revocationReason: string;

    /**
     * Revocation transaction ID (if revoked on blockchain)
     * db-type: VARCHAR 64
     */
    public revocationTxid: string;

    constructor(data: TypedRow<VerifiableCredential>) {
        super(DATA_SOURCE, TABLE, PRIMARY_KEY);
        this.id = enforceType(data.id, "string") || "";
        this.holderDID = enforceType(data.holderDID, "string") || "";
        this.issuerDID = enforceType(data.issuerDID, "string") || "";
        this.type = enforceType(data.type, "string") || "";
        this.credentialJSON = enforceType(data.credentialJSON, "string") || "";
        this.credentialHash = enforceType(data.credentialHash, "string") || "";
        this.anchorTxid = enforceType(data.anchorTxid, "string") || "";
        this.issuedAt = enforceType(data.issuedAt, "int") || 0;
        this.expiresAt = enforceType(data.expiresAt, "int") || 0;
        this.isRevoked = enforceType(data.isRevoked, "boolean") || false;
        this.revokedAt = enforceType(data.revokedAt, "int") || 0;
        this.revocationReason = enforceType(data.revocationReason, "string") || "";
        this.revocationTxid = enforceType(data.revocationTxid, "string") || "";
        this.init();
    }
}
