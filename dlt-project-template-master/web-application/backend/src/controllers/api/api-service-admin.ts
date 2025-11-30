// Service Admin API Controller - CRUD operations for ServiceAdmin model

"use strict";

import Express from "express";
import { BAD_REQUEST, ensureObjectBody, INTERNAL_SERVER_ERROR, noCache, NOT_FOUND, sendApiError, sendApiResult, sendUnauthorized } from "../../utils/http-utils";
import { Controller } from "../controller";
import { Service } from "../../models/service";
import { ServiceAdmin } from "../../models/service-admin";
import { Monitor } from "../../monitor";
import { DataFilter } from "tsbean-orm";
import { createRandomUID } from "../../utils/text-utils";
import { UsersService } from "../../services/users-service";

/**
 * Service Admin API Controller
 * CRUD operations for ServiceAdmin model
 * @group service-admin - Service Admin Management API
 */
export class ServiceAdminController extends Controller {

    public registerAPI(prefix: string, application: Express.Express): void {
        application.get(prefix + "/service-admins", noCache(this.listServiceAdmins.bind(this)));
        application.get(prefix + "/service-admins/:id", noCache(this.getServiceAdmin.bind(this)));
        application.get(prefix + "/services/:serviceId/admins", noCache(this.getAdminsByService.bind(this)));
        application.post(prefix + "/service-admins", ensureObjectBody(this.createServiceAdmin.bind(this)));
        application.delete(prefix + "/service-admins/:id", noCache(this.deleteServiceAdmin.bind(this)));
    }

    /**
     * @typedef ServiceAdminItem
     * @property {string} id.required - Record ID
     * @property {string} adminUID.required - Admin user ID
     * @property {string} serviceId.required - Service ID
     */

    /**
     * @typedef ServiceAdminListResponse
     * @property {Array.<ServiceAdminItem>} admins.required - List of service admins
     * @property {number} count.required - Total count
     */

    /**
     * List all service admins
     * Binding: ListServiceAdmins
     * @route GET /service-admins
     * @group service-admin
     * @returns {ServiceAdminListResponse.model} 200 - List of service admins
     */
    public async listServiceAdmins(request: Express.Request, response: Express.Response): Promise<void> {
        const auth = await UsersService.getInstance().auth(request);
        if(!auth.isRegisteredUser){
            sendUnauthorized(request, response);
            return;
        }
        
        try {
            const admins = await ServiceAdmin.finder.find(DataFilter.notEquals("id", ""));

            sendApiResult(request, response, {
                admins: admins.map(a => a.toObject()),
                count: admins.length
            });
        } catch (error) {
            Monitor.exception(error, "ServiceAdminController.listServiceAdmins");
            sendApiError(request, response, INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", error.message);
        }
    }

    /**
     * Get service admin by ID
     * Binding: GetServiceAdmin
     * @route GET /service-admins/{id}
     * @group service-admin
     * @param {string} id.path.required - Record ID
     * @returns {ServiceAdminItem.model} 200 - Service admin details
     * @returns {Error} 404 - Not found
     */
    public async getServiceAdmin(request: Express.Request, response: Express.Response): Promise<void> {
        const auth = await UsersService.getInstance().auth(request);
        if (!auth.isRegisteredUser) {
            sendUnauthorized(request, response);
            return;
        }

        try {
            const id = request.params.id;
            const admin = await ServiceAdmin.finder.findByKey(id);

            if (!admin) {
                return sendApiError(request, response, NOT_FOUND, "NOT_FOUND", "Service admin not found");
            }

            sendApiResult(request, response, admin.toObject());
        } catch (error) {
            Monitor.exception(error, "ServiceAdminController.getServiceAdmin");
            sendApiError(request, response, INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", error.message);
        }
    }

    /**
     * Get admins by service
     * Binding: GetAdminsByService
     * @route GET /services/{serviceId}/admins
     * @group service-admin
     * @param {string} serviceId.path.required - Service ID
     * @returns {ServiceAdminListResponse.model} 200 - List of admins for this service
     */
    public async getAdminsByService(request: Express.Request, response: Express.Response): Promise<void> {
        const auth = await UsersService.getInstance().auth(request);
        if (!auth.isRegisteredUser) {
            sendUnauthorized(request, response);
            return;
        }

        try {
            const serviceId = request.params.serviceId;
            const admins = await ServiceAdmin.finder.find(DataFilter.equals("serviceId", serviceId));

            sendApiResult(request, response, {
                admins: admins.map(a => a.toObject()),
                count: admins.length
            });
        } catch (error) {
            Monitor.exception(error, "ServiceAdminController.getAdminsByService");
            sendApiError(request, response, INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", error.message);
        }
    }

    /**
     * @typedef CreateServiceAdminRequest
     * @property {string} adminUID.required - Admin user ID
     * @property {string} serviceId.required - Service ID
     */

    /**
     * Create a service admin
     * Binding: CreateServiceAdmin
     * @route POST /service-admins
     * @group service-admin
     * @param {CreateServiceAdminRequest.model} request.body.required - Admin data
     * @returns {ServiceAdminItem.model} 200 - Created admin
     * @returns {Error} 400 - Invalid request
     */
    public async createServiceAdmin(request: Express.Request, response: Express.Response): Promise<void> {
        const auth = await UsersService.getInstance().auth(request);
        if (!auth.isRegisteredUser) {
            sendUnauthorized(request, response);
            return;
        }

        try {
            const body = request.body;

            if (!body.adminUID) {
                return sendApiError(request, response, BAD_REQUEST, "MISSING_ADMIN_UID", "Admin UID is required");
            }
            if (!body.serviceId) {
                return sendApiError(request, response, BAD_REQUEST, "MISSING_SERVICE_ID", "Service ID is required");
            }

            // Check if service exists
            const service = await Service.finder.findByKey(body.serviceId);
            if (!service) {
                return sendApiError(request, response, BAD_REQUEST, "SERVICE_NOT_FOUND", "Service not found");
            }

            // Check if admin already exists for this service
            const existingAdmins = await ServiceAdmin.finder.find(
                DataFilter.and(
                    DataFilter.equals("adminUID", body.adminUID),
                    DataFilter.equals("serviceId", body.serviceId)
                )
            );
            if (existingAdmins.length > 0) {
                return sendApiError(request, response, BAD_REQUEST, "ADMIN_ALREADY_EXISTS", "Admin already exists for this service");
            }

            const admin = new ServiceAdmin({
                id: createRandomUID(),
                adminUID: body.adminUID,
                serviceId: body.serviceId
            });

            await admin.insert();

            Monitor.info(`Service admin created: ${admin.id}`);
            sendApiResult(request, response, admin.toObject());
        } catch (error) {
            Monitor.exception(error, "ServiceAdminController.createServiceAdmin");
            sendApiError(request, response, INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", error.message);
        }
    }

    /**
     * Delete a service admin
     * Binding: DeleteServiceAdmin
     * @route DELETE /service-admins/{id}
     * @group service-admin
     * @param {string} id.path.required - Record ID
     * @returns {object} 200 - Success
     * @returns {Error} 404 - Not found
     */
    public async deleteServiceAdmin(request: Express.Request, response: Express.Response): Promise<void> {
        const auth = await UsersService.getInstance().auth(request);
        if (!auth.isRegisteredUser) {
            sendUnauthorized(request, response);
            return;
        }

        try {
            const id = request.params.id;

            const admin = await ServiceAdmin.finder.findByKey(id);
            if (!admin) {
                return sendApiError(request, response, NOT_FOUND, "NOT_FOUND", "Service admin not found");
            }

            await admin.delete();

            Monitor.info(`Service admin deleted: ${id}`);
            sendApiResult(request, response, { success: true, deletedId: id });
        } catch (error) {
            Monitor.exception(error, "ServiceAdminController.deleteServiceAdmin");
            sendApiError(request, response, INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", error.message);
        }
    }
}
