"use strict";
import { DataModel, enforceType, TypedRow, DataSource, DataFinder } from "tsbean-orm";

const DATA_SOURCE = DataSource.DEFAULT;
const TABLE = "token_holders";
const PRIMARY_KEY = "id";

export class TokenHolder extends DataModel {
    public static finder = new DataFinder<TokenHolder>(DATA_SOURCE, TABLE, PRIMARY_KEY, (row: TypedRow<TokenHolder>) => new TokenHolder(row));

    public id: string; // Auto-generated

    /* db-index: tokenId */
    public tokenId: string;

    /* db-index: holderIdentityKey */
    public holderIdentityKey: string;

    /* db-type: BIGINT */
    public balance: number;

    /* db-type: BIGINT */
    public lastUpdated: number;

    constructor(data: TypedRow<TokenHolder>) {
        super(DATA_SOURCE, TABLE, PRIMARY_KEY);
        this.id = enforceType(data.id, "string") || "";
        this.tokenId = enforceType(data.tokenId, "string") || "";
        this.holderIdentityKey = enforceType(data.holderIdentityKey, "string") || "";
        this.balance = enforceType(data.balance, "int") || 0;
        this.lastUpdated = enforceType(data.lastUpdated, "int") || 0;
        this.init();
    }
}
