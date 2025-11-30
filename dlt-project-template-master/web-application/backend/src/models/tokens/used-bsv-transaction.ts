"use strict";
import { DataModel, enforceType, TypedRow, DataSource, DataFinder, DataFilter } from "tsbean-orm";

const DATA_SOURCE = DataSource.DEFAULT;
const TABLE = "used_bsv_transactions";
const PRIMARY_KEY = "id";

/**
 * Model to track BSV transactions that have been used to purchase tokens.
 * Prevents double-spending (same txid used twice).
 */
export class UsedBsvTransaction extends DataModel {
    public static finder = new DataFinder<UsedBsvTransaction>(
        DATA_SOURCE, 
        TABLE, 
        PRIMARY_KEY, 
        (row: TypedRow<UsedBsvTransaction>) => new UsedBsvTransaction(row)
    );

    public id: string;

    /* db-index: txid */
    public txid: string;

    public userAddress: string;

    /* db-type: BIGINT */
    public satoshisReceived: number;

    /* db-type: BIGINT */
    public tokensGranted: number;

    /* db-type: BIGINT */
    public timestamp: number;

    constructor(data: TypedRow<UsedBsvTransaction>) {
        super(DATA_SOURCE, TABLE, PRIMARY_KEY);
        this.id = enforceType(data.id, "string") || "";
        this.txid = enforceType(data.txid, "string") || "";
        this.userAddress = enforceType(data.userAddress, "string") || "";
        this.satoshisReceived = enforceType(data.satoshisReceived, "int") || 0;
        this.tokensGranted = enforceType(data.tokensGranted, "int") || 0;
        this.timestamp = enforceType(data.timestamp, "int") || 0;
        this.init();
    }

    /**
     * Check if a txid has already been used
     */
    public static async isTxidUsed(txid: string): Promise<boolean> {
        const existing = await UsedBsvTransaction.finder.find(DataFilter.equals("txid", txid));
        return existing.length > 0;
    }

    /**
     * Get transaction record by txid
     */
    public static async findByTxid(txid: string): Promise<UsedBsvTransaction | null> {
        const results = await UsedBsvTransaction.finder.find(DataFilter.equals("txid", txid));
        return results.length > 0 ? results[0] : null;
    }
}

