// Document - tsbean-orm class (auto generated)

"use strict";

import { DataModel, enforceType, TypedRow, DataSource, DataFinder, DataFilter } from "tsbean-orm";
import { createRandomUID } from "../utils/text-utils";
import { FileStorageService } from "../services/file-storage";
import { Monitor } from "../monitor";

const DATA_SOURCE = DataSource.DEFAULT;
const TABLE = "document";
const PRIMARY_KEY = "id";

export class Document extends DataModel {

    public static finder = new DataFinder<Document, string>(DATA_SOURCE, TABLE, PRIMARY_KEY, (data: TypedRow<Document>) => { 
        return new Document(data); 
    });

    public static async findAll(): Promise<Document[]> {
        const documents = await Document.finder.find(DataFilter.any());
        return documents;
    }

    public static async findByFileName(fileName: string): Promise<Document[]> {
        const details = await Document.finder.find(DataFilter.equals("fileName", fileName));
        return details;
    }

    public static async findByStoragePath(storagePath: string): Promise<Document[]> {
        const details = await Document.finder.find(DataFilter.equals("storagePath", storagePath));
        return details;
    }

    public static async findByMimeType(mimeType: string): Promise<Document[]> {
        const details = await Document.finder.find(DataFilter.equals("mimeType", mimeType));
        return details;
    }

    public static async findByFileSize(fileSize: number): Promise<Document[]> {
        const details = await Document.finder.find(DataFilter.equals("fileSize", fileSize));
        return details;
    }

    public static async create(fileName: string, storagePath: string, mimeType: string, fileSize: number): Promise<Document> {
        const details = new Document({
            id: createRandomUID(),
            fileName,
            storagePath,
            mimeType,
            fileSize,
            uploadedAt: Date.now(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
        await details.insert();
        return details;
    }
    
    public static async getDocumentBuffer(storagePath: string): Promise<Buffer | null> {
        try {
            return await FileStorageService.getInstance().getObjectContents(storagePath);
        } catch (error) {
            Monitor.exception(error);
            return null;
        }
    }

    /* db-type: VARCHAR 36 */
    public id: string;

    /* db-type: VARCHAR 255 */
    public fileName: string;

    /* db-type: VARCHAR 512 */
    public storagePath: string;

    /* db-type: VARCHAR 100 */
    public mimeType: string;

    /* db-type: INT */
    public fileSize: number;

    /* db-type: DATETIME */
    public uploadedAt: number;

    /* db-type: DATETIME */
    public createdAt: number;

    /* db-type: DATETIME */
    public updatedAt: number;


    constructor(data: TypedRow<Document>) {
        // First, we call DataModel constructor 
        super(DATA_SOURCE, TABLE, PRIMARY_KEY);

        // Second, we set the class properties
        // The recommended way is to set one by one to prevent prototype pollution
        // You can also enforce the types if you do not trust the data source
        // In that case you can use the enforceType utility function
        this.id = enforceType(data.id, "string") || '';
        this.fileName = enforceType(data.fileName, "string") || '';
        this.storagePath = enforceType(data.storagePath, "string") || '';
        this.mimeType = enforceType(data.mimeType, "string") || '';
        this.fileSize = enforceType(data.fileSize, "int") || 0;
        this.uploadedAt = enforceType(data.uploadedAt, "number") || Date.now();
        this.createdAt = enforceType(data.createdAt, "number") || Date.now();
        this.updatedAt = enforceType(data.updatedAt, "number") || Date.now();

        // Finally, we must call init()
        this.init();
    }
}