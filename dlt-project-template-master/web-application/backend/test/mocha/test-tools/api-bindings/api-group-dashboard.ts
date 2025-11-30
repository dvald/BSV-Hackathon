// API bindings: dashboard (Auto generated)

"use strict";

import { RequestErrorHandler, RequestParams, CommonErrorHandler } from "@asanrom/request-axios";
import { getApiUrl } from "./utils";
import { DashboardStats } from "./definitions";

export class ApiDashboard {
    /**
     * Method: GET
     * Path: /dashboard/stats
     * Get dashboard statistics
     * @returns The request parameters
     */
    public static GetDashboardStats(): RequestParams<DashboardStats, CommonErrorHandler> {
        return {
            method: "GET",
            url: getApiUrl(`/dashboard/stats`),
            handleError: (err, handler) => {
                new RequestErrorHandler()
                    .add(500, "*", "serverError" in handler ? handler.serverError : handler.temporalError)
                    .add("*", "*", "networkError" in handler ? handler.networkError : handler.temporalError)
                    .handle(err);
            },
        };
    }
}

