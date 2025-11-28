"use strict";
import { DataModel, enforceType, TypedRow, DataSource, DataFinder } from "tsbean-orm";

const DATA_SOURCE = DataSource.DEFAULT;
const TABLE = "campaigns";
const PRIMARY_KEY = "id";

export class Campaign extends DataModel {
    public static finder = new DataFinder<Campaign>(DATA_SOURCE, TABLE, PRIMARY_KEY, (row: TypedRow<Campaign>) => new Campaign(row));

    public id: string;

    /* db-type: BIGINT */
    public goal: number;

    /* db-type: BIGINT */
    public raised: number;

    public isComplete: boolean;

    /* db-type: VARCHAR 255 */
    public completionTxid: string;

    constructor(data: TypedRow<Campaign>) {
        super(DATA_SOURCE, TABLE, PRIMARY_KEY);
        this.id = enforceType(data.id, "string") || "";
        this.goal = enforceType(data.goal, "int") || 0;
        this.raised = enforceType(data.raised, "int") || 0;
        this.isComplete = enforceType(data.isComplete, "boolean") || false;
        this.completionTxid = enforceType(data.completionTxid, "string") || "";
        this.init();
    }
}
