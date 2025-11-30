"use strict";
import { DataModel, enforceType, TypedRow, DataSource, DataFinder } from "tsbean-orm";

const DATA_SOURCE = DataSource.DEFAULT;
const TABLE = "tokens";
const PRIMARY_KEY = "id";

export class Token extends DataModel {
    public static finder = new DataFinder<Token>(DATA_SOURCE, TABLE, PRIMARY_KEY, (row: TypedRow<Token>) => new Token(row));

    public id: string; // assetId = "{genesisTxid}.{vout}"
    public name: string;
    public symbol: string;
    public decimals: number;

    /* db-type: BIGINT */
    public totalSupply: number;

    /* db-type: BIGINT */
    public maxSupply: number;

    public creatorIdentityKey: string;

    /* db-type: BIGINT */
    public createdAt: number;

    /* db-type: TEXT */
    public metadataJson: string;

    public genesisTxid: string;
    public genesisVout: number;

    constructor(data: TypedRow<Token>) {
        super(DATA_SOURCE, TABLE, PRIMARY_KEY);
        this.id = enforceType(data.id, "string") || "";
        this.name = enforceType(data.name, "string") || "";
        this.symbol = enforceType(data.symbol, "string") || "";
        this.decimals = enforceType(data.decimals, "int") || 0;
        this.totalSupply = enforceType(data.totalSupply, "int") || 0;
        this.maxSupply = enforceType(data.maxSupply, "int") || 0;
        this.creatorIdentityKey = enforceType(data.creatorIdentityKey, "string") || "";
        this.createdAt = enforceType(data.createdAt, "int") || 0;
        this.metadataJson = enforceType(data.metadataJson, "string") || "";
        this.genesisTxid = enforceType(data.genesisTxid, "string") || "";
        this.genesisVout = enforceType(data.genesisVout, "int") || 0;
        this.init();
    }
}
