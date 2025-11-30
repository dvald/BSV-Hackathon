// CitizenService - tsbean-orm class (auto generated)

"use strict";

import { DataModel, enforceType, TypedRow, DataSource, DataFinder } from "tsbean-orm";

const DATA_SOURCE = DataSource.DEFAULT;
const TABLE = "citizen_service";
const PRIMARY_KEY = "id";

export class CitizenService extends DataModel {

    public static finder = new DataFinder<CitizenService, string>(DATA_SOURCE, TABLE, PRIMARY_KEY, (data: TypedRow<CitizenService>) => { return new CitizenService(data) });

    /* db-type: VARCHAR */
    public id: string;

    /* db-type: VARCHAR */
    public citizenId: string;

    /* db-type: VARCHAR */
    public serviceId: string;

    constructor(data: TypedRow<CitizenService>) {
        // First, we call DataModel constructor 
        super(DATA_SOURCE, TABLE, PRIMARY_KEY);

        // Second, we set the class properties
        // The recommended way is to set one by one to prevent prototype pollution
        // You can also enforce the types if you do not trust the data source
        // In that case you can use the enforceType utility function

        this.id = enforceType(data.id, "string") || '';
        this.citizenId = enforceType(data.citizenId, "string") || '';
        this.serviceId = enforceType(data.serviceId, "string") || '';

        // Finally, we must call init()
        this.init();
    }
}
