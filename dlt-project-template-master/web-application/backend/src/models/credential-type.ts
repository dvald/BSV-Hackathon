// CredentialType - tsbean-orm class (auto generated)

"use strict";

import { DataModel, enforceType, TypedRow, DataSource, DataFinder, DataFilter } from "tsbean-orm";

const DATA_SOURCE = DataSource.DEFAULT;
const TABLE = "credential_type";
const PRIMARY_KEY = "id";

export class CredentialType extends DataModel {

    public static finder = new DataFinder<CredentialType, string>(DATA_SOURCE, TABLE, PRIMARY_KEY, (data: TypedRow<CredentialType>) => { return new CredentialType(data) });


    public static async findAll(): Promise<CredentialType[]> {
        const credentialTypes = await CredentialType.finder.find(DataFilter.any());
        return credentialTypes;
    }

    /* db-type: VARCHAR */
    public id: string;

    /* db-type: VARCHAR */
    public name: string;

    /* db-type: VARCHAR */
    public description: string;

    constructor(data: TypedRow<CredentialType>) {
        // First, we call DataModel constructor 
        super(DATA_SOURCE, TABLE, PRIMARY_KEY);

        // Second, we set the class properties
        // The recommended way is to set one by one to prevent prototype pollution
        // You can also enforce the types if you do not trust the data source
        // In that case you can use the enforceType utility function

        this.id = enforceType(data.id, "string") || '';
        this.name = enforceType(data.name, "string") || '';
        this.description = enforceType(data.description, "string") || '';

        // Finally, we must call init()
        this.init();
    }
}
