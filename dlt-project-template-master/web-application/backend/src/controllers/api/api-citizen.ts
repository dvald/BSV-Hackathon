// Citizen API Controller - CRUD operations for Citizen model

"use strict";

import Express from "express";
import { BAD_REQUEST, ensureObjectBody, INTERNAL_SERVER_ERROR, noCache, NOT_FOUND, sendApiError, sendApiResult, sendUnauthorized } from "../../utils/http-utils";
import { UsersService } from "../../services/users-service";
import { Controller } from "../controller";
import { Citizen } from "../../models/citizen";
import { Monitor } from "../../monitor";
import { DataFilter, OrderBy } from "tsbean-orm";
import { createRandomUID } from "../../utils/text-utils";

/**
 * Citizen API Controller
 * CRUD operations for Citizen model
 * @group citizen - Citizen Management API
 */
export class CitizenController extends Controller {

    public registerAPI(prefix: string, application: Express.Express): void {
        application.get(prefix + "/citizens", noCache(this.listCitizens.bind(this)));
        application.get(prefix + "/citizens/:id", noCache(this.getCitizen.bind(this)));
        application.post(prefix + "/citizens", ensureObjectBody(this.createCitizen.bind(this)));
        application.put(prefix + "/citizens/:id", ensureObjectBody(this.updateCitizen.bind(this)));
        application.delete(prefix + "/citizens/:id", noCache(this.deleteCitizen.bind(this)));
    }

    /**
     * @typedef CitizenItem
     * @property {string} id.required - Citizen ID
     * @property {string} uid.required - User ID
     * @property {string} status.required - Citizen status
     * @property {number} createdAt.required - Creation timestamp
     * @property {number} updatedAt.required - Last update timestamp
     * @property {string} did - Decentralized identifier
     */

    /**
     * @typedef CitizenListResponse
     * @property {Array.<CitizenItem>} citizens.required - List of citizens
     * @property {number} count.required - Total count
     */

    /**
     * List all citizens
     * Binding: ListCitizens
     * @route GET /citizens
     * @group citizen
     * @returns {CitizenListResponse.model} 200 - List of citizens
     * @security AuthToken
     */
    public async listCitizens(request: Express.Request, response: Express.Response): Promise<void> {
        const auth = await UsersService.getInstance().auth(request);
        if (!auth.isRegisteredUser) {
            sendUnauthorized(request, response);
            return;
        }

        try {
            const citizens = await Citizen.finder.find(DataFilter.notEquals("id", ""), OrderBy.desc("createdAt"));

            sendApiResult(request, response, {
                citizens: citizens.map(c => ({
                    id: c.id,
                    uid: c.uid,
                    status: c.status,
                    createdAt: c.createdAt,
                    updatedAt: c.updatedAt,
                })),
                count: citizens.length
            });
        } catch (error) {
            Monitor.exception(error, "CitizenController.listCitizens");
            sendApiError(request, response, INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", error.message);
        }
    }

    /**
     * Get citizen by ID
     * Binding: GetCitizen
     * @route GET /citizens/{id}
     * @group citizen
     * @param {string} id.path.required - Citizen ID
     * @returns {CitizenItem.model} 200 - Citizen details
     * @returns {void} 404 - Citizen not found
     * @security AuthToken
     */
    public async getCitizen(request: Express.Request, response: Express.Response): Promise<void> {
        const auth = await UsersService.getInstance().auth(request);
        if (!auth.isRegisteredUser) {
            sendUnauthorized(request, response);
            return;
        }

        try {
            const id = request.params.id;
            const citizen = await Citizen.finder.findByKey(id);

            if (!citizen) {
                return sendApiError(request, response, NOT_FOUND, "NOT_FOUND", "Citizen not found");
            }

            sendApiResult(request, response, {
                id: citizen.id,
                uid: citizen.uid,
                status: citizen.status,
                createdAt: citizen.createdAt,
                updatedAt: citizen.updatedAt,
            });
        } catch (error) {
            Monitor.exception(error, "CitizenController.getCitizen");
            sendApiError(request, response, INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", error.message);
        }
    }

    /**
     * @typedef CreateCitizenRequest
     * @property {string} uid.required - User ID
     * @property {string} status - Citizen status (default: active)
     * @property {string} did - Decentralized identifier
     */

    /**
     * @typedef CreateCitizenBadRequest
     * @property {string} code.required - Error code:
     * - MISSING_UID
     * - CITIZEN_ALREADY_EXISTS
     */

    /**
     * Create a new citizen
     * Binding: CreateCitizen
     * @route POST /citizens
     * @group citizen
     * @param {CreateCitizenRequest.model} request.body.required - Citizen data
     * @returns {CitizenItem.model} 200 - Created citizen
     * @returns {CreateCitizenBadRequest.model} 400 - Bad request
     * @security AuthToken
     */
    public async createCitizen(request: Express.Request, response: Express.Response): Promise<void> {
        const auth = await UsersService.getInstance().auth(request);
        if (!auth.isRegisteredUser) {
            sendUnauthorized(request, response);
            return;
        }

        try {
            const body = request.body;

            if (!body.uid) {
                return sendApiError(request, response, BAD_REQUEST, "MISSING_UID", "User ID is required");
            }

            // Check for duplicate uid
            const existing = await Citizen.finder.find(DataFilter.equals("uid", body.uid));
            if (existing.length > 0) {
                return sendApiError(request, response, BAD_REQUEST, "CITIZEN_ALREADY_EXISTS", "Citizen with this UID already exists");
            }

            const now = Date.now();
            const citizen = new Citizen({
                id: createRandomUID(),
                uid: body.uid,
                status: body.status || "active",
                createdAt: now,
                updatedAt: now,
            });

            await citizen.insert();

            Monitor.info(`Citizen created: ${citizen.id} for UID ${citizen.uid}`);
            sendApiResult(request, response, {
                id: citizen.id,
                uid: citizen.uid,
                status: citizen.status,
                createdAt: citizen.createdAt,
                updatedAt: citizen.updatedAt,
            });
        } catch (error) {
            Monitor.exception(error, "CitizenController.createCitizen");
            sendApiError(request, response, INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", error.message);
        }
    }

    /**
     * @typedef UpdateCitizenRequest
     * @property {string} status - Citizen status
     * @property {string} did - Decentralized identifier
     */

    /**
     * @typedef UpdateCitizenBadRequest
     * @property {string} code.required - Error code:
     * - NOT_FOUND
     */

    /**
     * Update a citizen
     * Binding: UpdateCitizen
     * @route PUT /citizens/{id}
     * @group citizen
     * @param {string} id.path.required - Citizen ID
     * @param {UpdateCitizenRequest.model} request.body.required - Updated citizen data
     * @returns {CitizenItem.model} 200 - Updated citizen
     * @returns {UpdateCitizenBadRequest.model} 404 - Citizen not found
     * @security AuthToken
     */
    public async updateCitizen(request: Express.Request, response: Express.Response): Promise<void> {
        const auth = await UsersService.getInstance().auth(request);
        if (!auth.isRegisteredUser) {
            sendUnauthorized(request, response);
            return;
        }

        try {
            const id = request.params.id;
            const body = request.body;

            const citizen = await Citizen.finder.findByKey(id);
            if (!citizen) {
                return sendApiError(request, response, NOT_FOUND, "NOT_FOUND", "Citizen not found");
            }

            // Update fields if provided
            if (body.status !== undefined) {
                citizen.status = body.status;
            }

            citizen.updatedAt = Date.now();

            await citizen.save();

            Monitor.info(`Citizen updated: ${citizen.id}`);
            sendApiResult(request, response, {
                id: citizen.id,
                uid: citizen.uid,
                status: citizen.status,
                createdAt: citizen.createdAt,
                updatedAt: citizen.updatedAt,
            });
        } catch (error) {
            Monitor.exception(error, "CitizenController.updateCitizen");
            sendApiError(request, response, INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", error.message);
        }
    }

    /**
     * @typedef DeleteCitizenBadRequest
     * @property {string} code.required - Error code:
     * - NOT_FOUND
     */

    /**
     * Delete a citizen
     * Binding: DeleteCitizen
     * @route DELETE /citizens/{id}
     * @group citizen
     * @param {string} id.path.required - Citizen ID
     * @returns {void} 200 - Citizen deleted
     * @returns {DeleteCitizenBadRequest.model} 404 - Citizen not found
     * @security AuthToken
     */
    public async deleteCitizen(request: Express.Request, response: Express.Response): Promise<void> {
        const auth = await UsersService.getInstance().auth(request);
        if (!auth.isRegisteredUser) {
            sendUnauthorized(request, response);
            return;
        }

        try {
            const id = request.params.id;

            const citizen = await Citizen.finder.findByKey(id);
            if (!citizen) {
                return sendApiError(request, response, NOT_FOUND, "NOT_FOUND", "Citizen not found");
            }

            await citizen.delete();

            Monitor.info(`Citizen deleted: ${id}`);
            sendApiResult(request, response, { success: true });
        } catch (error) {
            Monitor.exception(error, "CitizenController.deleteCitizen");
            sendApiError(request, response, INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", error.message);
        }
    }
}
