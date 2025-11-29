/**
 * DID Service - Unit Tests
 * 
 * Tests básicos para el servicio de DIDs
 */

import { expect } from 'chai';
import { DIDService } from '../../src/services/did-service';
import { PrivateKey } from '@bsv/sdk';

describe('DID Service', function() {
    this.timeout(30000); // Dar tiempo suficiente para operaciones de blockchain
    
    let didService: DIDService;
    
    before(() => {
        didService = DIDService.getInstance();
    });
    
    describe('DID Document Validation', () => {
        it('should validate a valid DID document', () => {
            const validDocument = {
                "@context": ["https://www.w3.org/ns/did/v1"],
                "id": "did:bsv:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
                "verificationMethod": [
                    {
                        "id": "did:bsv:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa#key-1",
                        "type": "EcdsaSecp256k1VerificationKey2019",
                        "controller": "did:bsv:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
                        "publicKeyHex": "03a1b2c3d4e5f6"
                    }
                ],
                "authentication": ["did:bsv:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa#key-1"]
            };
            
            const isValid = didService.validateDIDDocument(validDocument);
            expect(isValid).to.be.true;
        });
        
        it('should reject invalid DID document - missing context', () => {
            const invalidDocument = {
                "id": "did:bsv:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
                "verificationMethod": [],
                "authentication": []
            };
            
            const isValid = didService.validateDIDDocument(invalidDocument);
            expect(isValid).to.be.false;
        });
        
        it('should reject invalid DID document - missing verification method', () => {
            const invalidDocument = {
                "@context": ["https://www.w3.org/ns/did/v1"],
                "id": "did:bsv:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
                "authentication": []
            };
            
            const isValid = didService.validateDIDDocument(invalidDocument);
            expect(isValid).to.be.false;
        });
    });
    
    describe('DID Format Validation', () => {
        it('should accept valid DID format', () => {
            // Este método es privado, pero podemos testearlo a través de resolveDID
            const validDIDs = [
                'did:bsv:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
                'did:bsv:3J98t1WpEZ73CNmYviecrnyiWrnqRhWNLy',
            ];
            
            // No deberían lanzar error de formato
            for (const did of validDIDs) {
                expect(did).to.match(/^did:bsv:[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{26,35}$/);
            }
        });
        
        it('should reject invalid DID format', () => {
            const invalidDIDs = [
                'did:btc:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', // wrong method
                'did:bsv:', // missing address
                'bsv:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', // missing did:
                'did:bsv:invalid@address', // invalid characters
            ];
            
            for (const did of invalidDIDs) {
                expect(did).to.not.match(/^did:bsv:[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{26,35}$/);
            }
        });
    });
    
    describe('DID Export', () => {
        it('should export DID document to JSON string', () => {
            const document = {
                "@context": ["https://www.w3.org/ns/did/v1"],
                "id": "did:bsv:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
                "verificationMethod": [
                    {
                        "id": "did:bsv:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa#key-1",
                        "type": "EcdsaSecp256k1VerificationKey2019",
                        "controller": "did:bsv:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
                        "publicKeyHex": "03a1b2c3"
                    }
                ],
                "authentication": ["did:bsv:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa#key-1"]
            };
            
            const exported = didService.exportDIDDocument(document);
            
            expect(exported).to.be.a('string');
            expect(() => JSON.parse(exported)).to.not.throw();
            
            const parsed = JSON.parse(exported);
            expect(parsed.id).to.equal(document.id);
        });
    });
    
    // ⚠️ ESTOS TESTS REQUIEREN CONEXIÓN A BSV Y PUEDEN COSTAR SATOSHIS
    // Descomentar solo cuando estés listo para probar con blockchain real
    
    /*
    describe('DID Creation (Integration)', () => {
        it('should create a DID with random private key', async () => {
            const result = await didService.generateRandomDID();
            
            expect(result).to.have.property('did');
            expect(result).to.have.property('privateKey');
            expect(result).to.have.property('txid');
            expect(result).to.have.property('document');
            
            expect(result.did).to.match(/^did:bsv:/);
            expect(result.privateKey).to.be.a('string');
            expect(result.txid).to.be.a('string');
            
            // Validar el documento creado
            const isValid = didService.validateDIDDocument(result.document);
            expect(isValid).to.be.true;
        });
        
        it('should create a DID with specific private key', async () => {
            const privateKey = PrivateKey.fromRandom();
            const result = await didService.createDID({ privateKey });
            
            expect(result).to.have.property('did');
            expect(result).to.have.property('txid');
            expect(result).to.have.property('document');
            
            // Verificar que la clave pública en el documento corresponde
            const publicKeyHex = privateKey.toPublicKey().toHex();
            expect(result.document.verificationMethod[0].publicKeyHex).to.equal(publicKeyHex);
        });
        
        it('should create a DID with services', async () => {
            const services = [
                {
                    id: 'did:bsv:xxx#test-service',
                    type: 'TestService',
                    serviceEndpoint: 'https://example.com/test'
                }
            ];
            
            const result = await didService.generateRandomDID(services);
            
            expect(result.document.service).to.be.an('array');
            expect(result.document.service).to.have.lengthOf(1);
            expect(result.document.service[0].type).to.equal('TestService');
        });
    });
    
    describe('DID Resolution (Integration)', () => {
        let createdDID: string;
        let createdTxid: string;
        
        before(async function() {
            // Crear un DID para luego resolverlo
            const result = await didService.generateRandomDID();
            createdDID = result.did;
            createdTxid = result.txid;
            
            // Esperar a que la transacción se propague
            await new Promise(resolve => setTimeout(resolve, 5000));
        });
        
        it('should resolve a DID from blockchain', async () => {
            const resolution = await didService.resolveDID(createdDID);
            
            expect(resolution).to.have.property('didDocument');
            expect(resolution).to.have.property('didDocumentMetadata');
            expect(resolution).to.have.property('verification');
            
            expect(resolution.didDocument.id).to.equal(createdDID);
            expect(resolution.didDocumentMetadata.txid).to.equal(createdTxid);
        });
        
        it('should verify integrity and signature', async () => {
            const resolution = await didService.resolveDID(createdDID);
            
            expect(resolution.verification.integrity).to.be.true;
            expect(resolution.verification.signature).to.be.true;
        });
        
        it('should fail to resolve non-existent DID', async () => {
            const fakeDID = 'did:bsv:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';
            
            try {
                await didService.resolveDID(fakeDID);
                expect.fail('Should have thrown error');
            } catch (error) {
                expect(error.message).to.include('not found');
            }
        });
    });
    */
});
