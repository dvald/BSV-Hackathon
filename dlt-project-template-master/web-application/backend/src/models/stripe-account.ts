// StripeAccount - tsbean-orm class (auto generated)

"use strict";

import { DataModel, enforceType, TypedRow, DataSource, DataFinder, DataFilter } from "tsbean-orm";
import { Monitor } from "../monitor";

const DATA_SOURCE = DataSource.DEFAULT;
const TABLE = "stripe_account";
const PRIMARY_KEY = "id";

export class StripeAccount extends DataModel {

    public static finder = new DataFinder<StripeAccount, string>(DATA_SOURCE, TABLE, PRIMARY_KEY, (data: TypedRow<StripeAccount>) => { return new StripeAccount(data); });

    public static async findByUser(uid: string): Promise<StripeAccount> {
        const accounts = await StripeAccount.finder.find(DataFilter.equals("uid", uid));
        return accounts.length ? accounts[0] : null;
    }

    public static async findByConnectedAccount(id: string): Promise<StripeAccount> {
        const accounts = await StripeAccount.finder.find(DataFilter.equals("id", id));
        return accounts.length ? accounts[0] : null;
    }

    public id: string;
    public uid: string;
    public date: number;

    /**
     * Creates new stripe account
     * @param id The id
     * @param uid The user id
     * @param email The creator email
     * @returns The new stripe account
     */
    public static async createAccount(id: string, uid: string): Promise<StripeAccount> {
        Monitor.debug("Creating stripe account");
        const account: StripeAccount = new StripeAccount({
            id: id,
            uid: uid,
            date: Date.now(),
        });
        try {
            await account.insert();
        } catch (ex) {
            return Promise.reject(ex);
        }
        return Promise.resolve(account);
    }

    constructor(data: TypedRow<StripeAccount>) {
        // First, we call DataModel constructor 
        super(DATA_SOURCE, TABLE, PRIMARY_KEY);

        // Second, we set the class properties
        // The recommended way is to set one by one to prevent prototype pollution
        // You can also enforce the types if you do not trust the data source
        // In that case you can use the enforceType utility function

        this.id = enforceType(data.id, "string") || '';
        this.uid = enforceType(data.uid, "string") || '';
        this.date = enforceType(data.date, "number") || Date.now();

        // Finally, we must call init()
        this.init();
    }
}