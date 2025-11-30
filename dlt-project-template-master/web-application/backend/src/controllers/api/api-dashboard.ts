"use strict";

import { Controller } from "../controller";
import Express from "express";
import { Citizen } from "../../models/citizen";
import { Credential } from "../../models/credential";
import { Service } from "../../models/service";
import { Transaction } from "../../models/transaction";
import { sendApiResult } from "../../utils/http-utils";

/**
 * Dashboard API Controller
 * Provides statistics for the dashboard
 * @group dashboard - Dashboard API
 */
export class DashboardController extends Controller {

    public registerAPI(prefix: string, application: Express.Express): void {
        application.get(prefix + "/dashboard/stats", this.getDashboardStats.bind(this));
    }

    /**
     * * @typedef DashboardStats
     * @property {number} citizenCount.required - Total number of citizens
     * @property {number} activeCredentials.required - Number of active credentials
     * @property {number} tokensIssued.required - Number of tokens issued
     * @property {number} activeServices.required - Number of active services
     * @property {number} transactionsCount.required - Total number of transactions
     * @property {number} credentialsIssuedLastDay.required - Number of credentials issued in the last day
     */

    /**
     * Get dashboard statistics
     * Binding: GetDashboardStats
     * @route GET /dashboard/stats
     * @group dashboard
     * @returns {DashboardStats.model} 200 - Dashboard statistics
     */

    public async getDashboardStats(request: Express.Request, response: Express.Response){

        const citizenCount = await Citizen.countAll();
        const activeCredentials = await Credential.countActive();
        const tokensIssued = 0; // TODO: Implement token issuance tracking
        const activeServices = await Service.countAll();
        const transactionsCount = await Transaction.countAll();
        const credentialsIssuedLastDay = await Credential.countIssuedLastDay();

        sendApiResult(request, response, {
            citizenCount: citizenCount,
            activeCredentials: activeCredentials,
            tokensIssued: tokensIssued,
            activeServices: activeServices,
            transactionsCount: transactionsCount,
            credentialsIssuedLastDay: credentialsIssuedLastDay
        });

    }
}