// DID Storage Model

"use strict";

import { DataModel, enforceType, TypedRow, DataSource, DataFinder } from "tsbean-orm";

const DATA_SOURCE = DataSource.DEFAULT;
const TABLE = "did_storage";
const PRIMARY_KEY = "did";

/**
 * DID Document Storage
 * Stores DID documents for quick retrieval
 */
export class DIDStorage extends DataModel {
    public static finder = new DataFinder<DIDStorage>(DATA_SOURCE, TABLE, PRIMARY_KEY, (row: TypedRow<DIDStorage>) => new DIDStorage(row));

    /**
     * DID identifier (e.g., did:bsv:1A1zP1...)
     */
    public did: string;

    /**
     * Full DID document (JSON string)
     * db-type: TEXT
     */
    public document: string;

    /**
     * SHA-256 digest of the document
     * db-type: VARCHAR 64
     */
    public digest: string;

    /**
     * BSV Transaction ID
     * db-type: VARCHAR 64
     */
    public txid: string;

    /**
     * Block number (if confirmed)
     * db-type: BIGINT
     */
    public block: number;

    /**
     * Timestamp of creation
     * db-type: BIGINT
     */
    public timestamp: number;

    /**
     * Raw data stored in blockchain
     * db-type: TEXT
     */
    public rawData: string;

    constructor(data: TypedRow<DIDStorage>) {
        super(DATA_SOURCE, TABLE, PRIMARY_KEY);
        this.did = enforceType(data.did, "string") || "";
        this.document = enforceType(data.document, "string") || "";
        this.digest = enforceType(data.digest, "string") || "";
        this.txid = enforceType(data.txid, "string") || "";
        this.block = enforceType(data.block, "int") || 0;
        this.timestamp = enforceType(data.timestamp, "int") || 0;
        this.rawData = enforceType(data.rawData, "string") || "";
        this.init();
    }
}

