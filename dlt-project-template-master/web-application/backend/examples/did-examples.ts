/**
 * BSV DID Service - Ejemplos de Uso
 * 
 * Este archivo contiene ejemplos de cómo usar el servicio DID
 * tanto desde el backend como desde aplicaciones cliente.
 */

// ============================================================================
// EJEMPLO 1: Crear un DID desde el Backend (TypeScript/Node.js)
// ============================================================================

import { DIDService } from './services/did-service';
import { PrivateKey } from '@bsv/sdk';

async function example1_CreateDID() {
    const didService = DIDService.getInstance();
    
    // Opción A: Crear DID con clave privada específica
    const privateKey = PrivateKey.fromHex('your-private-key-hex');
    const result = await didService.createDID({
        privateKey,
        services: [
            {
                id: 'did:bsv:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa#citizen-card',
                type: 'CitizenCardService',
                serviceEndpoint: 'https://gov.example/cards/api'
            }
        ]
    });
    
    console.log('DID Created:', result.did);
    console.log('Transaction ID:', result.txid);
    console.log('Document:', JSON.stringify(result.document, null, 2));
    
    // Opción B: Crear DID con clave aleatoria
    const randomResult = await didService.generateRandomDID([
        {
            id: 'did:bsv:xxx#service-1',
            type: 'MyService',
            serviceEndpoint: 'https://example.com/service'
        }
    ]);
    
    console.log('Random DID:', randomResult.did);
    console.log('Private Key (SAVE THIS!):', randomResult.privateKey);
}

// ============================================================================
// EJEMPLO 2: Resolver un DID desde el Backend
// ============================================================================

async function example2_ResolveDID() {
    const didService = DIDService.getInstance();
    
    const did = 'did:bsv:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';
    const result = await didService.resolveDID(did);
    
    console.log('DID Document:', result.didDocument);
    console.log('Metadata:', result.didDocumentMetadata);
    console.log('Verification:');
    console.log('  - Integrity:', result.verification.integrity);
    console.log('  - Signature:', result.verification.signature);
    
    // Verificar si el DID es válido
    if (result.verification.integrity && result.verification.signature) {
        console.log('✅ DID is valid and verified!');
    } else {
        console.log('❌ DID verification failed!');
    }
}

// ============================================================================
// EJEMPLO 3: Validar un DID Document
// ============================================================================

async function example3_ValidateDIDDocument() {
    const didService = DIDService.getInstance();
    
    const document = {
        "@context": ["https://www.w3.org/ns/did/v1"],
        "id": "did:bsv:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
        "verificationMethod": [
            {
                "id": "did:bsv:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa#key-1",
                "type": "EcdsaSecp256k1VerificationKey2019",
                "controller": "did:bsv:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
                "publicKeyHex": "03a1b2c3..."
            }
        ],
        "authentication": ["did:bsv:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa#key-1"]
    };
    
    const isValid = didService.validateDIDDocument(document);
    console.log('Document is valid:', isValid);
}

// ============================================================================
// EJEMPLO 4: Usar la API REST desde JavaScript (Cliente)
// ============================================================================

async function example4_UseRESTAPI() {
    const API_BASE = 'http://localhost:3000/api/v1';
    
    // Crear un DID
    const createResponse = await fetch(`${API_BASE}/did/create`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            services: [
                {
                    id: 'did:bsv:xxx#my-service',
                    type: 'MyServiceType',
                    serviceEndpoint: 'https://example.com/service'
                }
            ]
        })
    });
    
    const createData = await createResponse.json();
    console.log('Created DID:', createData);
    
    // Resolver el DID
    const did = createData.did;
    const resolveResponse = await fetch(`${API_BASE}/did/resolve/${encodeURIComponent(did)}`);
    const resolveData = await resolveResponse.json();
    console.log('Resolved DID:', resolveData);
}

// ============================================================================
// EJEMPLO 5: Integración con Sistema de Tarjeta Ciudadana
// ============================================================================

interface CitizenData {
    nationalId: string;
    name: string;
    dateOfBirth: string;
    email: string;
}

async function example5_CitizenCardIntegration(citizenData: CitizenData) {
    const didService = DIDService.getInstance();
    
    // 1. Crear DID para el ciudadano
    const result = await didService.generateRandomDID([
        {
            id: `did:bsv:xxx#national-card`,
            type: 'NationalIdentityCardService',
            serviceEndpoint: 'https://gov.example/citizens/api/card'
        },
        {
            id: `did:bsv:xxx#verification`,
            type: 'IdentityVerificationService',
            serviceEndpoint: 'https://gov.example/verify'
        }
    ]);
    
    // 2. Guardar la clave privada de forma segura (HSM, Vault, etc.)
    console.log('⚠️ STORE SECURELY:', result.privateKey);
    
    // 3. Asociar el DID con los datos del ciudadano en la base de datos
    // await database.storeCitizenDID({
    //     nationalId: citizenData.nationalId,
    //     did: result.did,
    //     txid: result.txid,
    //     createdAt: new Date()
    // });
    
    // 4. Retornar información al ciudadano
    return {
        did: result.did,
        txid: result.txid,
        explorerUrl: `https://whatsonchain.com/tx/${result.txid}`,
        message: 'Your decentralized identity has been created on BSV blockchain'
    };
}

// ============================================================================
// EJEMPLO 6: Verificar Credenciales usando DID
// ============================================================================

async function example6_VerifyCredentials(did: string) {
    const didService = DIDService.getInstance();
    
    try {
        // 1. Resolver el DID
        const resolution = await didService.resolveDID(did);
        
        // 2. Verificar integridad y firma
        if (!resolution.verification.integrity || !resolution.verification.signature) {
            throw new Error('DID verification failed');
        }
        
        // 3. Obtener servicios del DID
        const services = resolution.didDocument.service || [];
        
        // 4. Buscar servicio de tarjeta nacional
        const cardService = services.find(s => s.type === 'NationalIdentityCardService');
        
        if (!cardService) {
            throw new Error('No national identity card service found');
        }
        
        // 5. Llamar al endpoint del servicio para obtener datos
        const response = await fetch(cardService.serviceEndpoint, {
            headers: {
                'X-DID': did
            }
        });
        
        const cardData = await response.json();
        
        return {
            verified: true,
            did,
            cardData,
            blockchain: {
                txid: resolution.didDocumentMetadata.txid,
                block: resolution.didDocumentMetadata.block,
                timestamp: resolution.didDocumentMetadata.timestamp
            }
        };
    } catch (error) {
        console.error('Verification failed:', error);
        return {
            verified: false,
            error: error.message
        };
    }
}

// ============================================================================
// EJEMPLO 7: Batch Creation de DIDs
// ============================================================================

async function example7_BatchCreateDIDs(count: number) {
    const didService = DIDService.getInstance();
    const results = [];
    
    for (let i = 0; i < count; i++) {
        try {
            const result = await didService.generateRandomDID([
                {
                    id: `did:bsv:xxx#service-${i}`,
                    type: 'BatchService',
                    serviceEndpoint: `https://example.com/service/${i}`
                }
            ]);
            
            results.push({
                index: i,
                did: result.did,
                privateKey: result.privateKey,
                txid: result.txid,
                status: 'success'
            });
            
            console.log(`Created DID ${i + 1}/${count}: ${result.did}`);
            
            // Esperar un poco entre creaciones para no saturar la blockchain
            await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
            results.push({
                index: i,
                status: 'failed',
                error: error.message
            });
        }
    }
    
    return results;
}

// ============================================================================
// EJEMPLO 8: Uso con Express Middleware
// ============================================================================

import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para verificar DID en requests
 */
async function didAuthMiddleware(req: Request, res: Response, next: NextFunction) {
    const did = req.headers['x-did'] as string;
    
    if (!did) {
        return res.status(401).json({
            error: 'Missing DID in headers'
        });
    }
    
    try {
        const didService = DIDService.getInstance();
        const resolution = await didService.resolveDID(did);
        
        if (!resolution.verification.integrity || !resolution.verification.signature) {
            return res.status(401).json({
                error: 'Invalid DID verification'
            });
        }
        
        // Adjuntar información del DID al request
        (req as any).didInfo = {
            did,
            document: resolution.didDocument,
            metadata: resolution.didDocumentMetadata
        };
        
        next();
    } catch (error) {
        return res.status(401).json({
            error: 'DID resolution failed',
            message: error.message
        });
    }
}

// Uso del middleware
// app.get('/protected-resource', didAuthMiddleware, (req, res) => {
//     const didInfo = (req as any).didInfo;
//     res.json({
//         message: 'Access granted',
//         did: didInfo.did
//     });
// });

// ============================================================================
// EJEMPLO 9: Integración con Frontend (React/Vue/Angular)
// ============================================================================

/**
 * Ejemplo de componente React para crear DIDs
 */
/*
import React, { useState } from 'react';

function DIDCreator() {
    const [did, setDid] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const createDID = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await fetch('/api/v1/did/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    services: [
                        {
                            id: 'did:bsv:xxx#my-service',
                            type: 'UserService',
                            serviceEndpoint: 'https://example.com/user/service'
                        }
                    ]
                })
            });
            
            const data = await response.json();
            setDid(data);
            
            // ⚠️ IMPORTANTE: Guardar la clave privada de forma segura
            console.warn('SAVE THIS PRIVATE KEY:', data.privateKey);
            
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div>
            <h2>Create Your DID</h2>
            <button onClick={createDID} disabled={loading}>
                {loading ? 'Creating...' : 'Create DID'}
            </button>
            
            {error && <div className="error">{error}</div>}
            
            {did && (
                <div className="success">
                    <h3>DID Created Successfully!</h3>
                    <p><strong>DID:</strong> {did.did}</p>
                    <p><strong>Transaction:</strong> {did.txid}</p>
                    <p><strong>Private Key:</strong> {did.privateKey}</p>
                    <p className="warning">
                        ⚠️ Save your private key securely! You'll need it to prove ownership.
                    </p>
                </div>
            )}
        </div>
    );
}
*/

// ============================================================================
// EJECUTAR EJEMPLOS
// ============================================================================

export async function runExamples() {
    console.log('=== BSV DID Service Examples ===\n');
    
    // Descomentar los ejemplos que quieras ejecutar
    
    // await example1_CreateDID();
    // await example2_ResolveDID();
    // await example3_ValidateDIDDocument();
    // await example4_UseRESTAPI();
    
    console.log('\n=== Examples completed ===');
}

// Para ejecutar: 
// import { runExamples } from './did-examples';
// runExamples();
