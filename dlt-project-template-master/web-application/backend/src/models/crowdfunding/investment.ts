"use strict";
import { DataModel, enforceType, TypedRow, DataSource, DataFinder } from "tsbean-orm";

const DATA_SOURCE = DataSource.DEFAULT;
const TABLE = "investments";
const PRIMARY_KEY = "id";

export class Investment extends DataModel {
    public static finder = new DataFinder<Investment>(DATA_SOURCE, TABLE, PRIMARY_KEY, (row: TypedRow<Investment>) => new Investment(row));

    public id: string;

    /* db-index: campaignId ASC */
    public campaignId: string;

    /* db-index: identityKey ASC */
    public identityKey: string;

    /* db-type: BIGINT */
    public amount: number;

    /* db-type: BIGINT */
    public timestamp: number;

    public redeemed: boolean;

    constructor(data: TypedRow<Investment>) {
        super(DATA_SOURCE, TABLE, PRIMARY_KEY);
        this.id = enforceType(data.id, "string") || "";
        this.campaignId = enforceType(data.campaignId, "string") || "";
        this.identityKey = enforceType(data.identityKey, "string") || "";
        this.amount = enforceType(data.amount, "int") || 0;
        this.timestamp = enforceType(data.timestamp, "int") || 0;
        this.redeemed = enforceType(data.redeemed, "boolean") || false;
        this.init();
    }
}
