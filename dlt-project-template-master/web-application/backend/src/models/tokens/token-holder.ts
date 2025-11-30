"use strict";
import { DataModel, enforceType, TypedRow, DataSource, DataFinder, DataFilter } from "tsbean-orm";
import { createRandomUID } from "../../utils/text-utils";

const DATA_SOURCE = DataSource.DEFAULT;
const TABLE = "token_holders";
const PRIMARY_KEY = "id";

export class TokenHolder extends DataModel {
    public static finder = new DataFinder<TokenHolder>(DATA_SOURCE, TABLE, PRIMARY_KEY, (row: TypedRow<TokenHolder>) => new TokenHolder(row));

    /**
     * Find holder by token and identity key
     */
    public static async findByTokenAndHolder(tokenId: string, holderIdentityKey: string): Promise<TokenHolder | null> {
        const holders = await TokenHolder.finder.find(
            DataFilter.and(
                DataFilter.equals("tokenId", tokenId),
                DataFilter.equals("holderIdentityKey", holderIdentityKey)
            )
        );
        return holders.length > 0 ? holders[0] : null;
    }

    /**
     * Add balance to holder (creates if not exists)
     */
    public static async addBalance(tokenId: string, holderIdentityKey: string, amount: number): Promise<TokenHolder> {
        let holder = await TokenHolder.findByTokenAndHolder(tokenId, holderIdentityKey);
        
        if (holder) {
            holder.balance += amount;
            holder.lastUpdated = Date.now();
            await holder.save();
        } else {
            holder = new TokenHolder({
                id: createRandomUID(),
                tokenId: tokenId,
                holderIdentityKey: holderIdentityKey,
                balance: amount,
                lastUpdated: Date.now(),
            });
            await holder.insert();
        }
        
        return holder;
    }

    /**
     * Get all holders for a token
     */
    public static async findByToken(tokenId: string): Promise<TokenHolder[]> {
        return TokenHolder.finder.find(DataFilter.equals("tokenId", tokenId));
    }

    /**
     * Get all tokens held by an identity
     */
    public static async findByHolder(holderIdentityKey: string): Promise<TokenHolder[]> {
        return TokenHolder.finder.find(DataFilter.equals("holderIdentityKey", holderIdentityKey));
    }

    public id: string; // Auto-generated

    /* db-index: tokenId */
    public tokenId: string;

    /* db-index: holderIdentityKey */
    public holderIdentityKey: string;

    /* db-type: BIGINT */
    public balance: number;

    /* db-type: BIGINT */
    public lastUpdated: number;

    constructor(data: TypedRow<TokenHolder>) {
        super(DATA_SOURCE, TABLE, PRIMARY_KEY);
        this.id = enforceType(data.id, "string") || "";
        this.tokenId = enforceType(data.tokenId, "string") || "";
        this.holderIdentityKey = enforceType(data.holderIdentityKey, "string") || "";
        this.balance = enforceType(data.balance, "int") || 0;
        this.lastUpdated = enforceType(data.lastUpdated, "int") || 0;
        this.init();
    }
}
