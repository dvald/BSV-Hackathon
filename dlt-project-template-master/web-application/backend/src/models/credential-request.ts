// Credential Request Model

"use strict";

import { DataModel, enforceType, TypedRow, DataSource, DataFinder, DataFilter, OrderBy } from "tsbean-orm";

const DATA_SOURCE = DataSource.DEFAULT;
const TABLE = "credential_requests";
const PRIMARY_KEY = "id";

/**
 * Credential Request
 * Stores requests for verifiable credentials from users
 */
export class CredentialRequest extends DataModel {
    public static finder = new DataFinder<CredentialRequest, string>(
        DATA_SOURCE, 
        TABLE, 
        PRIMARY_KEY, 
        (row: TypedRow<CredentialRequest>) => new CredentialRequest(row)
    );

    /**
     * Static helper: Find request by ID
     */
    public static async findById(id: string): Promise<CredentialRequest> {
        return CredentialRequest.finder.findByKey(id);
    }

    /**
     * Static helper: Find requests by user DID
     */
    public static async findByUserDID(userDID: string): Promise<CredentialRequest[]> {
        return CredentialRequest.finder.find(
            DataFilter.equals("userDID", userDID),
            OrderBy.desc("requestedAt")
        );
    }

    /**
     * Static helper: Find pending requests
     */
    public static async findPending(credentialType?: string): Promise<CredentialRequest[]> {
        let filter: any = DataFilter.equals("status", "PENDING");
        
        if (credentialType) {
            filter = DataFilter.and(
                filter,
                DataFilter.equals("credentialType", credentialType)
            );
        }

        return CredentialRequest.finder.find(filter, OrderBy.asc("requestedAt"));
    }

    /* db-type: VARCHAR 255 */
    public id: string;

    /* db-index: userDID ASC */
    /* db-type: VARCHAR 255 */
    public userDID: string;

    /* db-index: credentialType ASC */
    /* db-type: VARCHAR 100 */
    public credentialType: string;

    /* db-type: TEXT */
    public requestData: string;

    /* db-index: status ASC */
    /* db-type: VARCHAR 20 */
    public status: string;

    /* db-type: BIGINT */
    public requestedAt: number;

    /* db-type: BIGINT */
    public reviewedAt: number;

    /* db-type: VARCHAR 255 */
    public reviewedBy: string;

    /* db-type: TEXT */
    public rejectionReason: string;

    /* db-type: VARCHAR 255 */
    public credentialId: string;

    constructor(row: TypedRow<CredentialRequest>) {
        // First, call DataModel constructor
        super(DATA_SOURCE, TABLE, PRIMARY_KEY);

        // Second, set class properties with type enforcement and defaults
        this.id = enforceType(row.id, "string") || "";
        this.userDID = enforceType(row.userDID, "string") || "";
        this.credentialType = enforceType(row.credentialType, "string") || "";
        this.requestData = enforceType(row.requestData, "string") || "";
        this.status = enforceType(row.status, "string") || "PENDING";
        this.requestedAt = enforceType(row.requestedAt, "int") || 0;
        this.reviewedAt = enforceType(row.reviewedAt, "int") || 0;
        this.reviewedBy = enforceType(row.reviewedBy, "string") || "";
        this.rejectionReason = enforceType(row.rejectionReason, "string") || "";
        this.credentialId = enforceType(row.credentialId, "string") || "";

        // Finally, call init()
        this.init();
    }
}
