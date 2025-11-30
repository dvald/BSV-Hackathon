// Credential - tsbean-orm class (auto generated)

"use strict";

import { DataModel, enforceType, TypedRow, DataSource, DataFinder, DataFilter, OrderBy } from "tsbean-orm";
import { createRandomUID } from "../utils/text-utils";

const DATA_SOURCE = DataSource.DEFAULT;
const TABLE = "credential";
const PRIMARY_KEY = "did";

export enum CredentialStatus {
    LOGGED = "LOGGED",
    ACTIVE = "ACTIVE",
    REVOKED = "REVOKED"
}

export class Credential extends DataModel {

    public static finder = new DataFinder<Credential, string>(DATA_SOURCE, TABLE, PRIMARY_KEY, (data: TypedRow<Credential>) => { return new Credential(data) });

    public static async countActive(): Promise<number> {
        return Credential.finder.count(DataFilter.equals("status", CredentialStatus.ACTIVE));
    }

    public static async findLast(): Promise<Credential> {
        const credentials = await Credential.finder.find(DataFilter.any(), OrderBy.desc("issuedAt"));
        return credentials[0];
    }

    public static async countIssuedLastDay(): Promise<number> {
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
        return Credential.finder.count(DataFilter.greaterThan("issuedAt", oneDayAgo));
    }

    public static async create(did: string, credentialType: string): Promise<Credential> {
        const credential = new Credential({
            id: createRandomUID(),
            did: did,
            credentialType: credentialType,
            issuedAt: Date.now(),
            status: CredentialStatus.ACTIVE
        });
        await credential.insert();
        return credential;
    }

    public id: string;

    /* db-type: VARCHAR */
    public did: string;

    /* db-type: VARCHAR */
    public credentialType: string;

    /* db-type: INT */
    public issuedAt: number;

    /* db-type: VARCHAR */
    public status: string;

    constructor(data: TypedRow<Credential>) {
        // First, we call DataModel constructor 
        super(DATA_SOURCE, TABLE, PRIMARY_KEY);

        // Second, we set the class properties
        // The recommended way is to set one by one to prevent prototype pollution
        // You can also enforce the types if you do not trust the data source
        // In that case you can use the enforceType utility function

        this.id = enforceType(data.id, "string") || '';
        this.did = enforceType(data.did, "string") || '';
        this.credentialType = enforceType(data.credentialType, "string") || '';
        this.issuedAt = enforceType(data.issuedAt, "int") || 0;
        this.status = enforceType(data.status, "string") || '';

        // Finally, we must call init()
        this.init();
    }
}
