// Transaction - tsbean-orm class (auto generated)

"use strict";

import { DataModel, enforceType, TypedRow, DataSource, DataFinder, DataFilter } from "tsbean-orm";

const DATA_SOURCE = DataSource.DEFAULT;
const TABLE = "transaction";
const PRIMARY_KEY = "txHash";

export class Transaction extends DataModel {

    public static finder = new DataFinder<Transaction, string>(DATA_SOURCE, TABLE, PRIMARY_KEY, (data: TypedRow<Transaction>) => { return new Transaction(data) });

    public static async countAll(): Promise<number> {
        return Transaction.finder.count(DataFilter.any());
    }

    /* db-type: VARCHAR */
    public txHash: string;

    /* db-type: VARCHAR */
    public type: string;

    /* db-type: VARCHAR */
    public description: string;

    /* db-type: VARCHAR */
    public actor: string;

    /* db-type: VARCHAR */
    public service: string;

    /* db-type: INT */
    public timestamp: number;

    /* db-type: VARCHAR */
    public subject: string;

    constructor(data: TypedRow<Transaction>) {
        // First, we call DataModel constructor 
        super(DATA_SOURCE, TABLE, PRIMARY_KEY);

        // Second, we set the class properties
        // The recommended way is to set one by one to prevent prototype pollution
        // You can also enforce the types if you do not trust the data source
        // In that case you can use the enforceType utility function

        this.txHash = enforceType(data.txHash, "string") || '';
        this.type = enforceType(data.type, "string") || '';
        this.description = enforceType(data.description, "string") || '';
        this.actor = enforceType(data.actor, "string") || '';
        this.service = enforceType(data.service, "string") || '';
        this.timestamp = enforceType(data.timestamp, "int") || 0;
        this.subject = enforceType(data.subject, "string") || '';

        // Finally, we must call init()
        this.init();
    }
}
