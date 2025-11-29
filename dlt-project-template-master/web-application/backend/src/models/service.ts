// Service - tsbean-orm class (auto generated)

"use strict";

import { DataModel, enforceType, TypedRow, DataSource, DataFinder } from "tsbean-orm";

const DATA_SOURCE = DataSource.DEFAULT;
const TABLE = "service";
const PRIMARY_KEY = "id";

export class Service extends DataModel {

    public static finder = new DataFinder<Service, string>(DATA_SOURCE, TABLE, PRIMARY_KEY, (data: TypedRow<Service>) => { return new Service(data) });

    /* db-type: VARCHAR */
    public id: string;

    /* db-type: VARCHAR */
    public adminUser: string;

    /* db-type: VARCHAR */
    public requiredCredentials: string;

    /* db-type: VARCHAR */
    public associatedToken: string;

    /* db-type: INT */
    public userCount: number;

    /* db-type: INT */
    public credentialCount: number;

    /* db-type: INT */
    public tokensUsed: number;

    /* db-type: VARCHAR */
    public name: string;

    /* db-type: VARCHAR */
    public description: string;

    constructor(data: TypedRow<Service>) {
        // First, we call DataModel constructor 
        super(DATA_SOURCE, TABLE, PRIMARY_KEY);

        // Second, we set the class properties
        // The recommended way is to set one by one to prevent prototype pollution
        // You can also enforce the types if you do not trust the data source
        // In that case you can use the enforceType utility function

        this.id = enforceType(data.id, "string") || '';
        this.adminUser = enforceType(data.adminUser, "string") || '';
        this.requiredCredentials = enforceType(data.requiredCredentials, "string") || '';
        this.associatedToken = enforceType(data.associatedToken, "string") || '';
        this.userCount = enforceType(data.userCount, "int") || 0;
        this.credentialCount = enforceType(data.credentialCount, "int") || 0;
        this.tokensUsed = enforceType(data.tokensUsed, "int") || 0;
        this.name = enforceType(data.name, "string") || '';
        this.description = enforceType(data.description, "string") || '';

        // Finally, we must call init()
        this.init();
    }
}
