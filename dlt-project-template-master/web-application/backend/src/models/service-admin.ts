// ServiceAdmin - tsbean-orm class (auto generated)

"use strict";

import { DataModel, enforceType, TypedRow, DataSource, DataFinder } from "tsbean-orm";

const DATA_SOURCE = DataSource.DEFAULT;
const TABLE = "service_admin";
const PRIMARY_KEY = "id";

export class ServiceAdmin extends DataModel {

    public static finder = new DataFinder<ServiceAdmin, string>(DATA_SOURCE, TABLE, PRIMARY_KEY, (data: TypedRow<ServiceAdmin>) => { return new ServiceAdmin(data) });

    /* db-type: VARCHAR */
    public id: string;

    /* db-type: VARCHAR */
    public adminUID: string;

    /* db-type: VARCHAR */
    public serviceId: string;

    constructor(data: TypedRow<ServiceAdmin>) {
        // First, we call DataModel constructor 
        super(DATA_SOURCE, TABLE, PRIMARY_KEY);

        // Second, we set the class properties
        // The recommended way is to set one by one to prevent prototype pollution
        // You can also enforce the types if you do not trust the data source
        // In that case you can use the enforceType utility function

        this.id = enforceType(data.id, "string") || '';
        this.adminUID = enforceType(data.adminUID, "string") || '';
        this.serviceId = enforceType(data.serviceId, "string") || '';

        // Finally, we must call init()
        this.init();
    }
}
