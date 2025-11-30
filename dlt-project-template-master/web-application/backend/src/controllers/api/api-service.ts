// Service API Controller - CRUD operations for Service model

"use strict";

import Express from "express";
import { BAD_REQUEST, ensureObjectBody, INTERNAL_SERVER_ERROR, noCache, NOT_FOUND, sendApiError, sendApiResult, sendUnauthorized } from "../../utils/http-utils";
import { UsersService } from "../../services/users-service";
import { Controller } from "../controller";
import { Service } from "../../models/service";
import { Monitor } from "../../monitor";
import { DataFilter, OrderBy } from "tsbean-orm";

/**
 * Service API Controller
 * CRUD operations for Service model
 * @group service - Service Management API
 */
export class ServiceController extends Controller {

    public registerAPI(prefix: string, application: Express.Express): void {
        application.get(prefix + "/services", noCache(this.listServices.bind(this)));
        application.get(prefix + "/services/:id", noCache(this.getService.bind(this)));
        application.post(prefix + "/services", ensureObjectBody(this.createService.bind(this)));
        application.put(prefix + "/services/:id", ensureObjectBody(this.updateService.bind(this)));
        application.delete(prefix + "/services/:id", noCache(this.deleteService.bind(this)));
    }

    /**
     * @typedef ServiceItem
     * @property {string} id.required - Service ID
     * @property {string} name.required - Service name
     * @property {string} description - Service description
     * @property {string} adminUser - Admin user
     * @property {string} requiredCredentials - Required credentials (comma-separated)
     * @property {string} associatedToken - Associated token
     * @property {number} userCount - User count
     * @property {number} credentialCount - Credential count
     * @property {number} tokensUsed - Tokens used
     */

    /**
     * @typedef ServiceListResponse
     * @property {Array.<ServiceItem>} services.required - List of services
     * @property {number} count.required - Total count
     */

    /**
     * List all services
     * Binding: ListServices
     * @route GET /services
     * @group service
     * @returns {ServiceListResponse.model} 200 - List of services
     * @returns {Error} 500 - Internal server error
     */
    public async listServices(request: Express.Request, response: Express.Response): Promise<void> {
        const auth = await UsersService.getInstance().auth(request);
        if (!auth.isRegisteredUser) {
            sendUnauthorized(request, response);
            return;
        }

        try {
            const services = await Service.finder.find(DataFilter.notEquals("id", ""), OrderBy.asc("name"));

            sendApiResult(request, response, {
                services: services.map(s => s.toObject()),
                count: services.length
            });
        } catch (error) {
            Monitor.exception(error, "ServiceController.listServices");
            sendApiError(request, response, INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", error.message);
        }
    }

    /**
     * Get service by ID
     * Binding: GetService
     * @route GET /services/{id}
     * @group service
     * @param {string} id.path.required - Service ID
     * @returns {ServiceItem.model} 200 - Service details
     * @returns {Error} 404 - Service not found
     */
    public async getService(request: Express.Request, response: Express.Response): Promise<void> {
        const auth = await UsersService.getInstance().auth(request);
        if (!auth.isRegisteredUser) {
            sendUnauthorized(request, response);
            return;
        }

        try {
            const id = request.params.id;
            const service = await Service.finder.findByKey(id);

            if (!service) {
                return sendApiError(request, response, NOT_FOUND, "SERVICE_NOT_FOUND", "Service not found");
            }

            sendApiResult(request, response, service.toObject());
        } catch (error) {
            Monitor.exception(error, "ServiceController.getService");
            sendApiError(request, response, INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", error.message);
        }
    }

    /**
     * @typedef CreateServiceRequest
     * @property {string} name.required - Service name
     * @property {string} description - Service description
     * @property {string} adminUser - Admin user ID
     * @property {Array.<string>} requiredCredentials - Required credentials (comma-separated)
     * @property {string} associatedToken - Associated token
     */

    /**
     * Create a new service
     * Binding: CreateService
     * @route POST /services
     * @group service
     * @param {CreateServiceRequest.model} request.body.required - Service data
     * @returns {ServiceItem.model} 200 - Created service
     * @returns {Error} 400 - Invalid request
     */
    public async createService(request: Express.Request, response: Express.Response): Promise<void> {
        const auth = await UsersService.getInstance().auth(request);
        if (!auth.isRegisteredUser) {
            sendUnauthorized(request, response);
            return;
        }

        try {
            const body = request.body;

            if (!body.name) {
                return sendApiError(request, response, BAD_REQUEST, "MISSING_NAME", "Service name is required");
            }

            const service = await Service.create(
                body.name,
                body.description || "",
                body.adminUser || "",
                body.requiredCredentials || [],
                body.associatedToken || ""
            );

            Monitor.info(`Service created: ${service.id} - ${service.name}`);
            sendApiResult(request, response, service.toObject());
        } catch (error) {
            Monitor.exception(error, "ServiceController.createService");
            sendApiError(request, response, INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", error.message);
        }
    }

    /**
     * @typedef UpdateServiceRequest
     * @property {string} name - Service name
     * @property {string} description - Service description
     * @property {string} adminUser - Admin user ID
     * @property {string} requiredCredentials - Required credentials
     * @property {string} associatedToken - Associated token
     */

    /**
     * Update a service
     * Binding: UpdateService
     * @route PUT /services/{id}
     * @group service
     * @param {string} id.path.required - Service ID
     * @param {UpdateServiceRequest.model} request.body.required - Updated data
     * @returns {ServiceItem.model} 200 - Updated service
     * @returns {Error} 404 - Service not found
     */
    public async updateService(request: Express.Request, response: Express.Response): Promise<void> {
        const auth = await UsersService.getInstance().auth(request);
        if (!auth.isRegisteredUser) {
            sendUnauthorized(request, response);
            return;
        }

        try {
            const id = request.params.id;
            const body = request.body;

            const service = await Service.finder.findByKey(id);
            if (!service) {
                return sendApiError(request, response, NOT_FOUND, "SERVICE_NOT_FOUND", "Service not found");
            }

            if (body.name !== undefined) service.name = body.name;
            if (body.description !== undefined) service.description = body.description;
            if (body.adminUser !== undefined) service.adminUser = body.adminUser;
            if (body.requiredCredentials !== undefined) service.requiredCredentials = body.requiredCredentials;
            if (body.associatedToken !== undefined) service.associatedToken = body.associatedToken;

            await service.save();

            Monitor.info(`Service updated: ${service.id}`);
            sendApiResult(request, response, service.toObject());
        } catch (error) {
            Monitor.exception(error, "ServiceController.updateService");
            sendApiError(request, response, INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", error.message);
        }
    }

    /**
     * Delete a service
     * Binding: DeleteService
     * @route DELETE /services/{id}
     * @group service
     * @param {string} id.path.required - Service ID
     * @returns {object} 200 - Success
     * @returns {Error} 404 - Service not found
     */
    public async deleteService(request: Express.Request, response: Express.Response): Promise<void> {
        const auth = await UsersService.getInstance().auth(request);
        if (!auth.isRegisteredUser) {
            sendUnauthorized(request, response);
            return;
        }

        try {
            const id = request.params.id;

            const service = await Service.finder.findByKey(id);
            if (!service) {
                return sendApiError(request, response, NOT_FOUND, "SERVICE_NOT_FOUND", "Service not found");
            }

            await service.delete();

            Monitor.info(`Service deleted: ${id}`);
            sendApiResult(request, response, { success: true, deletedId: id });
        } catch (error) {
            Monitor.exception(error, "ServiceController.deleteService");
            sendApiError(request, response, INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", error.message);
        }
    }
}
