// Citizen - tsbean-orm class (auto generated)

"use strict";

import { DataModel, enforceType, TypedRow, DataSource, DataFinder } from "tsbean-orm";

const DATA_SOURCE = DataSource.DEFAULT;
const TABLE = "citizen";
const PRIMARY_KEY = "id";

export class Citizen extends DataModel {

    public static finder = new DataFinder<Citizen, string>(DATA_SOURCE, TABLE, PRIMARY_KEY, (data: TypedRow<Citizen>) => { return new Citizen(data) });

    /* db-type: VARCHAR */
    public id: string;

    /* db-type: VARCHAR */
    public uid: string;

    /* db-type: VARCHAR */
    public status: string;

    /* db-type: INT */
    public createdAt: number;

    /* db-type: INT */
    public updatedAt: number;

    /* db-type: VARCHAR */
    public did: string;

    constructor(data: TypedRow<Citizen>) {
        // First, we call DataModel constructor 
        super(DATA_SOURCE, TABLE, PRIMARY_KEY);

        // Second, we set the class properties
        // The recommended way is to set one by one to prevent prototype pollution
        // You can also enforce the types if you do not trust the data source
        // In that case you can use the enforceType utility function

        this.id = enforceType(data.id, "string") || '';
        this.uid = enforceType(data.uid, "string") || '';
        this.status = enforceType(data.status, "string") || '';
        this.createdAt = enforceType(data.createdAt, "int") || 0;
        this.updatedAt = enforceType(data.updatedAt, "int") || 0;
        this.did = enforceType(data.did, "string") || '';

        // Finally, we must call init()
        this.init();
    }
}
