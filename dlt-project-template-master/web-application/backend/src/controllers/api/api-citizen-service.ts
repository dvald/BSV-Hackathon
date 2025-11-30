// Citizen Service API Controller - CRUD operations for CitizenService model

"use strict";

import Express from "express";
import { BAD_REQUEST, ensureObjectBody, INTERNAL_SERVER_ERROR, noCache, NOT_FOUND, sendApiError, sendApiResult, sendUnauthorized } from "../../utils/http-utils";
import { UsersService } from "../../services/users-service";
import { Controller } from "../controller";
import { Service } from "../../models/service";
import { CitizenService } from "../../models/service-citizen";
import { Monitor } from "../../monitor";
import { DataFilter } from "tsbean-orm";
import { createRandomUID } from "../../utils/text-utils";

/**
 * Citizen Service API Controller
 * CRUD operations for CitizenService model
 * @group citizen-service - Citizen Service Management API
 */
export class CitizenServiceController extends Controller {

    public registerAPI(prefix: string, application: Express.Express): void {
        application.get(prefix + "/citizen-services", noCache(this.listCitizenServices.bind(this)));
        application.get(prefix + "/citizen-services/:id", noCache(this.getCitizenService.bind(this)));
        application.get(prefix + "/services/:serviceId/citizens", noCache(this.getCitizensByService.bind(this)));
        application.get(prefix + "/citizens/:citizenId/services", noCache(this.getServicesByCitizen.bind(this)));
        application.post(prefix + "/citizen-services", ensureObjectBody(this.createCitizenService.bind(this)));
        application.delete(prefix + "/citizen-services/:id", noCache(this.deleteCitizenService.bind(this)));
    }

    /**
     * @typedef CitizenServiceItem
     * @property {string} id.required - Record ID
     * @property {string} citizenId.required - Citizen ID
     * @property {string} serviceId.required - Service ID
     */

    /**
     * @typedef CitizenServiceListResponse
     * @property {Array.<CitizenServiceItem>} citizenServices.required - List of citizen-service relations
     * @property {number} count.required - Total count
     */

    /**
     * List all citizen-service relations
     * Binding: ListCitizenServices
     * @route GET /citizen-services
     * @group citizen-service
     * @returns {CitizenServiceListResponse.model} 200 - List of citizen-service relations
     */
    public async listCitizenServices(request: Express.Request, response: Express.Response): Promise<void> {
        const auth = await UsersService.getInstance().auth(request);
        if (!auth.isRegisteredUser) {
            sendUnauthorized(request, response);
            return;
        }

        try {
            const citizenServices = await CitizenService.finder.find(DataFilter.notEquals("id", ""));

            sendApiResult(request, response, {
                citizenServices: citizenServices.map(cs => cs.toObject()),
                count: citizenServices.length
            });
        } catch (error) {
            Monitor.exception(error, "CitizenServiceController.listCitizenServices");
            sendApiError(request, response, INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", error.message);
        }
    }

    /**
     * Get citizen-service relation by ID
     * Binding: GetCitizenService
     * @route GET /citizen-services/{id}
     * @group citizen-service
     * @param {string} id.path.required - Record ID
     * @returns {CitizenServiceItem.model} 200 - Citizen-service details
     * @returns {Error} 404 - Not found
     */
    public async getCitizenService(request: Express.Request, response: Express.Response): Promise<void> {
        const auth = await UsersService.getInstance().auth(request);
        if (!auth.isRegisteredUser) {
            sendUnauthorized(request, response);
            return;
        }

        try {
            const id = request.params.id;
            const citizenService = await CitizenService.finder.findByKey(id);

            if (!citizenService) {
                return sendApiError(request, response, NOT_FOUND, "NOT_FOUND", "Citizen-service relation not found");
            }

            sendApiResult(request, response, citizenService.toObject());
        } catch (error) {
            Monitor.exception(error, "CitizenServiceController.getCitizenService");
            sendApiError(request, response, INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", error.message);
        }
    }

    /**
     * Get citizens by service
     * Binding: GetCitizensByService
     * @route GET /services/{serviceId}/citizens
     * @group citizen-service
     * @param {string} serviceId.path.required - Service ID
     * @returns {CitizenServiceListResponse.model} 200 - List of citizens for this service
     */
    public async getCitizensByService(request: Express.Request, response: Express.Response): Promise<void> {
        const auth = await UsersService.getInstance().auth(request);
        if (!auth.isRegisteredUser) {
            sendUnauthorized(request, response);
            return;
        }

        try {
            const serviceId = request.params.serviceId;
            const citizenServices = await CitizenService.finder.find(DataFilter.equals("serviceId", serviceId));

            sendApiResult(request, response, {
                citizenServices: citizenServices.map(cs => cs.toObject()),
                count: citizenServices.length
            });
        } catch (error) {
            Monitor.exception(error, "CitizenServiceController.getCitizensByService");
            sendApiError(request, response, INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", error.message);
        }
    }

    /**
     * Get services by citizen
     * Binding: GetServicesByCitizen
     * @route GET /citizens/{citizenId}/services
     * @group citizen-service
     * @param {string} citizenId.path.required - Citizen ID
     * @returns {CitizenServiceListResponse.model} 200 - List of services for this citizen
     */
    public async getServicesByCitizen(request: Express.Request, response: Express.Response): Promise<void> {
        const auth = await UsersService.getInstance().auth(request);
        if (!auth.isRegisteredUser) {
            sendUnauthorized(request, response);
            return;
        }

        try {
            const citizenId = request.params.citizenId;
            const citizenServices = await CitizenService.finder.find(DataFilter.equals("citizenId", citizenId));

            sendApiResult(request, response, {
                citizenServices: citizenServices.map(cs => cs.toObject()),
                count: citizenServices.length
            });
        } catch (error) {
            Monitor.exception(error, "CitizenServiceController.getServicesByCitizen");
            sendApiError(request, response, INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", error.message);
        }
    }

    /**
     * @typedef CreateCitizenServiceRequest
     * @property {string} citizenId.required - Citizen ID
     * @property {string} serviceId.required - Service ID
     */

    /**
     * Create a citizen-service relation
     * Binding: CreateCitizenService
     * @route POST /citizen-services
     * @group citizen-service
     * @param {CreateCitizenServiceRequest.model} request.body.required - Relation data
     * @returns {CitizenServiceItem.model} 200 - Created relation
     * @returns {Error} 400 - Invalid request
     */
    public async createCitizenService(request: Express.Request, response: Express.Response): Promise<void> {
        const auth = await UsersService.getInstance().auth(request);
        if (!auth.isRegisteredUser) {
            sendUnauthorized(request, response);
            return;
        }

        try {
            const body = request.body;

            if (!body.citizenId) {
                return sendApiError(request, response, BAD_REQUEST, "MISSING_CITIZEN_ID", "Citizen ID is required");
            }
            if (!body.serviceId) {
                return sendApiError(request, response, BAD_REQUEST, "MISSING_SERVICE_ID", "Service ID is required");
            }

            // Check if service exists
            const service = await Service.finder.findByKey(body.serviceId);
            if (!service) {
                return sendApiError(request, response, BAD_REQUEST, "SERVICE_NOT_FOUND", "Service not found");
            }

            // Check if relation already exists
            const existingRelations = await CitizenService.finder.find(
                DataFilter.and(
                    DataFilter.equals("citizenId", body.citizenId),
                    DataFilter.equals("serviceId", body.serviceId)
                )
            );
            if (existingRelations.length > 0) {
                return sendApiError(request, response, BAD_REQUEST, "RELATION_ALREADY_EXISTS", "Citizen already enrolled in this service");
            }

            const citizenService = new CitizenService({
                id: createRandomUID(),
                citizenId: body.citizenId,
                serviceId: body.serviceId
            });

            await citizenService.insert();

            // Update service user count
            service.userCount = service.userCount + 1;
            await service.save();

            Monitor.info(`Citizen-service created: ${citizenService.id}`);
            sendApiResult(request, response, citizenService.toObject());
        } catch (error) {
            Monitor.exception(error, "CitizenServiceController.createCitizenService");
            sendApiError(request, response, INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", error.message);
        }
    }

    /**
     * Delete a citizen-service relation
     * Binding: DeleteCitizenService
     * @route DELETE /citizen-services/{id}
     * @group citizen-service
     * @param {string} id.path.required - Record ID
     * @returns {object} 200 - Success
     * @returns {Error} 404 - Not found
     */
    public async deleteCitizenService(request: Express.Request, response: Express.Response): Promise<void> {
        const auth = await UsersService.getInstance().auth(request);
        if (!auth.isRegisteredUser) {
            sendUnauthorized(request, response);
            return;
        }

        try {
            const id = request.params.id;

            const citizenService = await CitizenService.finder.findByKey(id);
            if (!citizenService) {
                return sendApiError(request, response, NOT_FOUND, "NOT_FOUND", "Citizen-service relation not found");
            }

            // Update service user count
            const service = await Service.finder.findByKey(citizenService.serviceId);
            if (service && service.userCount > 0) {
                service.userCount = service.userCount - 1;
                await service.save();
            }

            await citizenService.delete();

            Monitor.info(`Citizen-service deleted: ${id}`);
            sendApiResult(request, response, { success: true, deletedId: id });
        } catch (error) {
            Monitor.exception(error, "CitizenServiceController.deleteCitizenService");
            sendApiError(request, response, INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", error.message);
        }
    }
}
