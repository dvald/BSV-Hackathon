// DID Controller

"use strict";

import Express from "express";
import { BAD_REQUEST, ensureObjectBody, INTERNAL_SERVER_ERROR, noCache, sendApiError, sendApiResult } from "../../utils/http-utils";
import { Controller } from "../controller";
import { DIDService, ServiceEndpoint } from "../../services/did-service";
import { Monitor } from "../../monitor";
import { PrivateKey } from "@bsv/sdk";

/**
 * DID API Controller
 * Provides endpoints for creating and resolving DIDs on BSV blockchain
 * @group did - DID Management API
 */
export class DIDController extends Controller {
    private didService: DIDService;

    constructor() {
        super();
        this.didService = DIDService.getInstance();
    }

    public registerAPI(prefix: string, application: Express.Express): void {
        // Create a new DID
        application.post(prefix + "/did/create", ensureObjectBody(this.createDID.bind(this)));

        // Resolve a DID
        application.get(prefix + "/did/resolve/:did", noCache(this.resolveDID.bind(this)));

        // Generate a random DID for testing
        application.post(prefix + "/did/generate", ensureObjectBody(this.generateRandomDID.bind(this)));

        // Validate a DID document
        application.post(prefix + "/did/validate", ensureObjectBody(this.validateDID.bind(this)));

        // Export a DID document
        application.post(prefix + "/did/export", ensureObjectBody(this.exportDID.bind(this)));
    }

    /**
     * @typedef ServiceEndpoint
     * @property {string} id.required - Service ID - eg: did:bsv:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa#service-1
     * @property {string} type.required - Service type - eg: CitizenCardService
     * @property {string} serviceEndpoint.required - Service endpoint URL - eg: https://cards.example.gov/endpoint
     */

    /**
     * @typedef CreateDIDRequest
     * @property {string} privateKey - Private key in hex format (optional, will generate random if not provided)
     * @property {Array.<ServiceEndpoint>} services - Array of service endpoints
     */

    /**
     * @typedef CreateDIDResponse
     * @property {string} did.required - The created DID identifier - eg: did:bsv:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa
     * @property {string} txid.required - Transaction ID on BSV blockchain
     * @property {object} document.required - The complete DID document
     */

    /**
     * Create a new DID
     * Creates a new DID identifier and publishes it to the BSV blockchain
     * @route POST /did/create
     * @group did
     * @param {CreateDIDRequest.model} request.body.required - DID creation parameters
     * @returns {CreateDIDResponse.model} 200 - Successfully created DID
     * @returns {Error} 400 - Invalid request parameters
     * @returns {Error} 500 - Internal server error
     */
    public async createDID(request: Express.Request, response: Express.Response): Promise<void> {
        try {
            const body = request.body;

            // Parse optional private key
            let privateKey: PrivateKey | undefined;
            if (body.privateKey) {
                try {
                    privateKey = PrivateKey.fromHex(body.privateKey);
                } catch (error) {
                    return sendApiError(request, response, BAD_REQUEST, "INVALID_PRIVATE_KEY", "Invalid private key format");
                }
            }

            // Parse optional services
            const services: ServiceEndpoint[] = [];
            if (body.services && Array.isArray(body.services)) {
                for (const service of body.services) {
                    if (!service.id || !service.type || !service.serviceEndpoint) {
                        return sendApiError(request, response, BAD_REQUEST, "INVALID_SERVICE", "Each service must have id, type, and serviceEndpoint");
                    }
                    services.push({
                        id: service.id,
                        type: service.type,
                        serviceEndpoint: service.serviceEndpoint
                    });
                }
            }

            // Create DID
            const result = await this.didService.createDID({
                privateKey,
                services: services.length > 0 ? services : undefined
            });

            Monitor.info(`DID created successfully: ${result.did}`);

            return sendApiResult(request, response, {
                did: result.did,
                txid: result.txid,
                document: result.document
            });
        } catch (error) {
            Monitor.error(`Error creating DID: ${error.message}`);
            return sendApiError(request, response, INTERNAL_SERVER_ERROR, "DID_CREATION_FAILED", error.message);
        }
    }

    /**
     * @typedef ResolveDIDResponse
     * @property {object} didDocument.required - The resolved DID document
     * @property {object} didDocumentMetadata.required - Metadata about the DID document
     * @property {object} verification.required - Verification results
     */

    /**
     * Resolve a DID
     * Retrieves and verifies a DID document from the BSV blockchain
     * @route GET /did/resolve/{did}
     * @group did
     * @param {string} did.path.required - The DID to resolve - eg: did:bsv:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa
     * @returns {ResolveDIDResponse.model} 200 - Successfully resolved DID
     * @returns {Error} 400 - Invalid DID format
     * @returns {Error} 404 - DID not found
     * @returns {Error} 500 - Internal server error
     */
    public async resolveDID(request: Express.Request, response: Express.Response): Promise<void> {
        try {
            const did = request.params.did;

            if (!did) {
                return sendApiError(request, response, BAD_REQUEST, "MISSING_DID", "DID parameter is required");
            }

            // Validate DID format
            if (!did.startsWith('did:bsv:')) {
                return sendApiError(request, response, BAD_REQUEST, "INVALID_DID_FORMAT", "DID must start with 'did:bsv:'");
            }

            // Resolve DID
            const result = await this.didService.resolveDID(did);

            Monitor.info(`DID resolved successfully: ${did}`);

            return sendApiResult(request, response, {
                didDocument: result.didDocument,
                didDocumentMetadata: result.didDocumentMetadata,
                verification: result.verification
            });
        } catch (error) {
            Monitor.error(`Error resolving DID: ${error.message}`);
            
            if (error.message.includes("not found")) {
                return sendApiError(request, response, 404, "DID_NOT_FOUND", error.message);
            }
            
            return sendApiError(request, response, INTERNAL_SERVER_ERROR, "DID_RESOLUTION_FAILED", error.message);
        }
    }

    /**
     * @typedef GenerateRandomDIDRequest
     * @property {Array.<ServiceEndpoint>} services - Array of service endpoints
     */

    /**
     * @typedef GenerateRandomDIDResponse
     * @property {string} did.required - The generated DID identifier
     * @property {string} privateKey.required - The generated private key (KEEP SECURE!)
     * @property {string} txid.required - Transaction ID on BSV blockchain
     * @property {object} document.required - The complete DID document
     */

    /**
     * Generate a random DID
     * Creates a new DID with a randomly generated private key (for testing)
     * @route POST /did/generate
     * @group did
     * @param {GenerateRandomDIDRequest.model} request.body - Generation parameters
     * @returns {GenerateRandomDIDResponse.model} 200 - Successfully generated DID
     * @returns {Error} 500 - Internal server error
     */
    public async generateRandomDID(request: Express.Request, response: Express.Response): Promise<void> {
        try {
            const body = request.body;

            // Parse optional services
            const services: ServiceEndpoint[] = [];
            if (body.services && Array.isArray(body.services)) {
                for (const service of body.services) {
                    if (!service.id || !service.type || !service.serviceEndpoint) {
                        return sendApiError(request, response, BAD_REQUEST, "INVALID_SERVICE", "Each service must have id, type, and serviceEndpoint");
                    }
                    services.push({
                        id: service.id,
                        type: service.type,
                        serviceEndpoint: service.serviceEndpoint
                    });
                }
            }

            // Generate random DID
            const result = await this.didService.generateRandomDID(
                services.length > 0 ? services : undefined
            );

            Monitor.info(`Random DID generated: ${result.did}`);

            return sendApiResult(request, response, {
                did: result.did,
                privateKey: result.privateKey,
                txid: result.txid,
                document: result.document
            });
        } catch (error) {
            Monitor.error(`Error generating random DID: ${error.message}`);
            return sendApiError(request, response, INTERNAL_SERVER_ERROR, "DID_GENERATION_FAILED", error.message);
        }
    }

    /**
     * @typedef ValidateDIDRequest
     * @property {object} document.required - The DID document to validate
     */

    /**
     * @typedef ValidateDIDResponse
     * @property {boolean} valid.required - Whether the document is valid
     * @property {Array.<string>} errors - Validation errors if any
     */

    /**
     * Validate a DID document
     * Validates the structure and format of a DID document
     * @route POST /did/validate
     * @group did
     * @param {ValidateDIDRequest.model} request.body.required - DID document to validate
     * @returns {ValidateDIDResponse.model} 200 - Validation result
     * @returns {Error} 400 - Invalid request
     */
    public async validateDID(request: Express.Request, response: Express.Response): Promise<void> {
        try {
            const body = request.body;

            if (!body.document) {
                return sendApiError(request, response, BAD_REQUEST, "MISSING_DOCUMENT", "Document is required");
            }

            const valid = this.didService.validateDIDDocument(body.document);

            return sendApiResult(request, response, {
                valid,
                errors: valid ? [] : ["Document structure is invalid"]
            });
        } catch (error) {
            Monitor.error(`Error validating DID document: ${error.message}`);
            return sendApiError(request, response, INTERNAL_SERVER_ERROR, "VALIDATION_FAILED", error.message);
        }
    }

    /**
     * @typedef ExportDIDRequest
     * @property {object} document.required - The DID document to export
     */

    /**
     * @typedef ExportDIDResponse
     * @property {string} json.required - The DID document as formatted JSON string
     */

    /**
     * Export a DID document
     * Exports a DID document to formatted JSON
     * @route POST /did/export
     * @group did
     * @param {ExportDIDRequest.model} request.body.required - DID document to export
     * @returns {ExportDIDResponse.model} 200 - Exported JSON
     * @returns {Error} 400 - Invalid request
     */
    public async exportDID(request: Express.Request, response: Express.Response): Promise<void> {
        try {
            const body = request.body;

            if (!body.document) {
                return sendApiError(request, response, BAD_REQUEST, "MISSING_DOCUMENT", "Document is required");
            }

            const json = this.didService.exportDIDDocument(body.document);

            return sendApiResult(request, response, {
                json
            });
        } catch (error) {
            Monitor.error(`Error exporting DID document: ${error.message}`);
            return sendApiError(request, response, INTERNAL_SERVER_ERROR, "EXPORT_FAILED", error.message);
        }
    }
}
