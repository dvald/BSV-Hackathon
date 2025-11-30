// Credential Type API Controller - CRUD operations for CredentialType model

"use strict";

import Express from "express";
import { BAD_REQUEST, ensureObjectBody, INTERNAL_SERVER_ERROR, noCache, NOT_FOUND, sendApiError, sendApiResult, sendUnauthorized } from "../../utils/http-utils";
import { UsersService } from "../../services/users-service";
import { Controller } from "../controller";
import { Service } from "../../models/service";
import { CredentialType } from "../../models/credential-type";
import { Monitor } from "../../monitor";
import { DataFilter, OrderBy } from "tsbean-orm";
import { createRandomUID } from "../../utils/text-utils";

/**
 * Credential Type API Controller
 * CRUD operations for CredentialType model
 * @group credential-type - Credential Type Management API
 */
export class CredentialTypeController extends Controller {

    public registerAPI(prefix: string, application: Express.Express): void {
        application.get(prefix + "/credential-types", noCache(this.listCredentialTypes.bind(this)));
        application.get(prefix + "/credential-types/:id", noCache(this.getCredentialType.bind(this)));
        application.post(prefix + "/credential-types", ensureObjectBody(this.createCredentialType.bind(this)));
        application.put(prefix + "/credential-types/:id", ensureObjectBody(this.updateCredentialType.bind(this)));
        application.delete(prefix + "/credential-types/:id", noCache(this.deleteCredentialType.bind(this)));
    }

    /**W
     * @typedef CredentialTypeItem
     * @property {string} id.required - Credential type ID
     * @property {string} name.required - Credential type name
     * @property {string} description - Description
     */

    /**
     * @typedef CredentialTypeListResponse
     * @property {Array.<CredentialTypeItem>} credentialTypes.required - List of credential types
     * @property {number} count.required - Total count
     */

    /**
     * List all credential types
     * Binding: ListCredentialTypes
     * @route GET /credential-types
     * @group credential-type
     * @returns {CredentialTypeListResponse.model} 200 - List of credential types
     */
    public async listCredentialTypes(request: Express.Request, response: Express.Response): Promise<void> {
        const auth = await UsersService.getInstance().auth(request);
        if (!auth.isRegisteredUser) {
            sendUnauthorized(request, response);
            return;
        }

        try {
            const types = await CredentialType.finder.find(DataFilter.notEquals("id", ""), OrderBy.asc("name"));

            sendApiResult(request, response, {
                credentialTypes: types.map(t => t.toObject()),
                count: types.length
            });
        } catch (error) {
            Monitor.exception(error, "CredentialTypeController.listCredentialTypes");
            sendApiError(request, response, INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", error.message);
        }
    }

    /**
     * Get credential type by ID
     * Binding: GetCredentialType
     * @route GET /credential-types/{id}
     * @group credential-type
     * @param {string} id.path.required - Credential type ID
     * @returns {CredentialTypeItem.model} 200 - Credential type details
     * @returns {Error} 404 - Not found
     */
    public async getCredentialType(request: Express.Request, response: Express.Response): Promise<void> {
        const auth = await UsersService.getInstance().auth(request);
        if (!auth.isRegisteredUser) {
            sendUnauthorized(request, response);
            return;
        }

        try {
            const id = request.params.id;
            const type = await CredentialType.finder.findByKey(id);

            if (!type) {
                return sendApiError(request, response, NOT_FOUND, "NOT_FOUND", "Credential type not found");
            }

            sendApiResult(request, response, type.toObject());
        } catch (error) {
            Monitor.exception(error, "CredentialTypeController.getCredentialType");
            sendApiError(request, response, INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", error.message);
        }
    }

    /**
     * @typedef CreateCredentialTypeRequest
     * @property {string} name.required - Credential type name
     * @property {string} description - Description
     */

    /**
     * Create a credential type
     * Binding: CreateCredentialType
     * @route POST /credential-types
     * @group credential-type
     * @param {CreateCredentialTypeRequest.model} request.body.required - Credential type data
     * @returns {CredentialTypeItem.model} 200 - Created credential type
     * @returns {Error} 400 - Invalid request
     */
    public async createCredentialType(request: Express.Request, response: Express.Response): Promise<void> {
        const auth = await UsersService.getInstance().auth(request);
        if (!auth.isRegisteredUser) {
            sendUnauthorized(request, response);
            return;
        }

        try {
            const body = request.body;

            if (!body.name) {
                return sendApiError(request, response, BAD_REQUEST, "MISSING_NAME", "Credential type name is required");
            }

            // Check for duplicate name
            const existing = await CredentialType.finder.find(DataFilter.equals("name", body.name));
            if (existing.length > 0) {
                return sendApiError(request, response, BAD_REQUEST, "NAME_ALREADY_EXISTS", "Credential type with this name already exists");
            }

            const type = new CredentialType({
                id: createRandomUID(),
                name: body.name,
                description: body.description || "",
            });

            await type.insert();

            Monitor.info(`Credential type created: ${type.id} - ${type.name}`);
            sendApiResult(request, response, type.toObject());
        } catch (error) {
            Monitor.exception(error, "CredentialTypeController.createCredentialType");
            sendApiError(request, response, INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", error.message);
        }
    }

    /**
     * @typedef UpdateCredentialTypeRequest
     * @property {string} name - Credential type name
     * @property {string} description - Description
     */

    /**
     * Update a credential type
     * Binding: UpdateCredentialType
     * @route PUT /credential-types/{id}
     * @group credential-type
     * @param {string} id.path.required - Credential type ID
     * @param {UpdateCredentialTypeRequest.model} request.body.required - Updated data
     * @returns {CredentialTypeItem.model} 200 - Updated credential type
     * @returns {Error} 404 - Not found
     */
    public async updateCredentialType(request: Express.Request, response: Express.Response): Promise<void> {
        const auth = await UsersService.getInstance().auth(request);
        if (!auth.isRegisteredUser) {
            sendUnauthorized(request, response);
            return;
        }

        try {
            const id = request.params.id;
            const body = request.body;

            const type = await CredentialType.finder.findByKey(id);
            if (!type) {
                return sendApiError(request, response, NOT_FOUND, "NOT_FOUND", "Credential type not found");
            }

            // Check for duplicate name if name is being changed
            if (body.name !== undefined && body.name !== type.name) {
                const existing = await CredentialType.finder.find(DataFilter.equals("name", body.name));
                if (existing.length > 0) {
                    return sendApiError(request, response, BAD_REQUEST, "NAME_ALREADY_EXISTS", "Credential type with this name already exists");
                }
            }

            if (body.name !== undefined) type.name = body.name;
            if (body.description !== undefined) type.description = body.description;

            await type.save();

            Monitor.info(`Credential type updated: ${type.id}`);
            sendApiResult(request, response, type.toObject());
        } catch (error) {
            Monitor.exception(error, "CredentialTypeController.updateCredentialType");
            sendApiError(request, response, INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", error.message);
        }
    }

    /**
     * Delete a credential type
     * Binding: DeleteCredentialType
     * @route DELETE /credential-types/{id}
     * @group credential-type
     * @param {string} id.path.required - Credential type ID
     * @returns {object} 200 - Success
     * @returns {Error} 404 - Not found
     */
    public async deleteCredentialType(request: Express.Request, response: Express.Response): Promise<void> {
        const auth = await UsersService.getInstance().auth(request);
        if (!auth.isRegisteredUser) {
            sendUnauthorized(request, response);
            return;
        }

        try {
            const id = request.params.id;

            const type = await CredentialType.finder.findByKey(id);
            if (!type) {
                return sendApiError(request, response, NOT_FOUND, "NOT_FOUND", "Credential type not found");
            }

            await type.delete();

            Monitor.info(`Credential type deleted: ${id}`);
            sendApiResult(request, response, { success: true, deletedId: id });
        } catch (error) {
            Monitor.exception(error, "CredentialTypeController.deleteCredentialType");
            sendApiError(request, response, INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", error.message);
        }
    }
}
