"use strict";
import { DataModel, enforceType, TypedRow, DataSource, DataFinder } from "tsbean-orm";

const DATA_SOURCE = DataSource.DEFAULT;
const TABLE = "token_transactions";
const PRIMARY_KEY = "id";

export class TokenTransaction extends DataModel {
    public static finder = new DataFinder<TokenTransaction>(DATA_SOURCE, TABLE, PRIMARY_KEY, (row: TypedRow<TokenTransaction>) => new TokenTransaction(row));

    public id: string; // Auto-generated

    /* db-index: tokenId */
    public tokenId: string;

    public type: 'genesis' | 'mint' | 'burn' | 'transfer';

    public fromIdentityKey: string; // null for genesis/mint
    public toIdentityKey: string; // null for burn

    /* db-type: BIGINT */
    public amount: number;

    /* db-index: txid */
    public txid: string;

    public vout: number;

    /* db-type: BIGINT */
    public timestamp: number;

    /* db-type: TEXT */
    public notes: string;

    /* db-index: spentBy */
    public spentBy: string; // txid that spent this output

    constructor(data: TypedRow<TokenTransaction>) {
        super(DATA_SOURCE, TABLE, PRIMARY_KEY);
        this.id = enforceType(data.id, "string") || "";
        this.tokenId = enforceType(data.tokenId, "string") || "";
        this.type = enforceType(data.type, "string") as any || 'transfer';
        this.fromIdentityKey = enforceType(data.fromIdentityKey, "string") || "";
        this.toIdentityKey = enforceType(data.toIdentityKey, "string") || "";
        this.amount = enforceType(data.amount, "int") || 0;
        this.txid = enforceType(data.txid, "string") || "";
        this.vout = enforceType(data.vout, "int") || 0;
        this.timestamp = enforceType(data.timestamp, "int") || 0;
        this.notes = enforceType(data.notes, "string") || "";
        this.spentBy = enforceType(data.spentBy, "string") || "";
        this.init();
    }
}
