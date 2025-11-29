# 🎫 Sistema de Credenciales Verificables BSV - Flujo de Solicitud y Aprobación

## 📋 Nuevo Flujo de Trabajo

Este sistema implementa un flujo de **solicitud → aprobación → emisión** de credenciales verificables en la blockchain BSV.

```
┌─────────────┐                  ┌──────────────┐                 ┌────────────┐
│   USUARIO   │                  │    ISSUER    │                 │ BLOCKCHAIN │
│  (Citizen)  │                  │ (Government) │                 │    BSV     │
└──────┬──────┘                  └───────┬──────┘                 └──────┬─────┘
       │                                 │                                │
       │ 1. Request Credential           │                                │
       ├────────────────────────────────>│                                │
       │    userDID, type, data          │                                │
       │                                 │                                │
       │ 2. PENDING (requestId)          │                                │
       │<────────────────────────────────┤                                │
       │                                 │                                │
       │                                 │ 3. Review Pending              │
       │                                 │    Requests                    │
       │                                 │                                │
       │                                 │ 4. APPROVE                     │
       │                                 ├───────────────────────────────>│
       │                                 │    Sign + Anchor Hash          │
       │                                 │                                │
       │                                 │<───────────────────────────────┤
       │                                 │    TXID                        │
       │                                 │                                │
       │ 5. Check My Credentials         │                                │
       ├────────────────────────────────>│                                │
       │                                 │                                │
       │ 6. Credentials List             │                                │
       │<────────────────────────────────┤                                │
       │    [{credential, txid, ...}]    │                                │
       │                                 │                                │
```

---

## 🚀 API Endpoints

### Base URL
```
http://localhost:3000/api/v1
```

---

### 1. **Solicitar Credencial** (Usuario)

**Endpoint**: `POST /api/v1/credentials/request`

**Descripción**: El usuario solicita una credencial de un tipo específico, enviando los datos requeridos.

**Request Body**:
```json
{
  "userDID": "did:bsv:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
  "credentialType": "DriversLicense",
  "requestData": {
    "fullName": "Juan Pérez",
    "nationalId": "12345678A",
    "licenseNumber": "B-123456",
    "dateOfBirth": "1990-01-15",
    "address": "Calle Mayor 123, Madrid"
  }
}
```

**Response**:
```json
{
  "result": "success",
  "data": {
    "requestId": "req-123e4567-e89b-12d3-a456-426614174000",
    "status": "PENDING"
  }
}
```

**Tipos de Credenciales Soportados** (dinámico):
- `DriversLicense` - Licencia de conducir
- `MedicalCertificate` - Certificado médico
- `StudentID` - Tarjeta de estudiante
- `EmploymentCertificate` - Certificado laboral
- `VaccinationRecord` - Registro de vacunación
- ... (cualquier tipo personalizado)

---

### 2. **Ver Solicitudes Pendientes** (Issuer)

**Endpoint**: `GET /api/v1/credentials/requests/pending`

**Query Parameters**:
- `credentialType` (opcional): Filtrar por tipo de credencial

**Descripción**: El emisor (gobierno/organización) revisa todas las solicitudes pendientes.

**Request**:
```
GET /api/v1/credentials/requests/pending?credentialType=DriversLicense
```

**Response**:
```json
{
  "result": "success",
  "data": {
    "requests": [
      {
        "requestId": "req-123e4567-e89b-12d3-a456-426614174000",
        "userDID": "did:bsv:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
        "credentialType": "DriversLicense",
        "requestData": {
          "fullName": "Juan Pérez",
          "nationalId": "12345678A",
          "licenseNumber": "B-123456",
          "dateOfBirth": "1990-01-15",
          "address": "Calle Mayor 123, Madrid"
        },
        "requestedAt": 1732890000000
      }
    ],
    "count": 1
  }
}
```

---

### 3. **Aprobar Solicitud** (Issuer)

**Endpoint**: `POST /api/v1/credentials/approve`

**Descripción**: El emisor aprueba la solicitud, firma la credencial y la ancla en BSV blockchain.

**Request Body**:
```json
{
  "requestId": "req-123e4567-e89b-12d3-a456-426614174000",
  "issuerPrivateKey": "5K2n5Y...",
  "expirationDate": "2030-12-31T23:59:59Z"
}
```

**Response**:
```json
{
  "result": "success",
  "data": {
    "credentialId": "urn:uuid:456e7890-a12b-34c5-d678-901234567890",
    "txid": "abc123def456789...",
    "credential": {
      "@context": ["https://www.w3.org/2018/credentials/v1"],
      "id": "urn:uuid:456e7890-a12b-34c5-d678-901234567890",
      "type": ["VerifiableCredential", "DriversLicense"],
      "issuer": "did:bsv:issuer-address",
      "issuanceDate": "2024-11-29T10:30:00Z",
      "expirationDate": "2030-12-31T23:59:59Z",
      "credentialSubject": {
        "id": "did:bsv:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
        "fullName": "Juan Pérez",
        "nationalId": "12345678A",
        "licenseNumber": "B-123456",
        "dateOfBirth": "1990-01-15",
        "address": "Calle Mayor 123, Madrid"
      },
      "proof": {
        "type": "EcdsaSecp256k1Signature2019",
        "created": "2024-11-29T10:30:00Z",
        "proofPurpose": "assertionMethod",
        "verificationMethod": "did:bsv:issuer-address#key-1",
        "jws": "eyJhbGciOiJFUzI1NksifQ..."
      }
    }
  }
}
```

---

### 4. **Rechazar Solicitud** (Issuer)

**Endpoint**: `POST /api/v1/credentials/reject`

**Request Body**:
```json
{
  "requestId": "req-123e4567-e89b-12d3-a456-426614174000",
  "issuerDID": "did:bsv:issuer-address",
  "reason": "Documentación incompleta"
}
```

**Response**:
```json
{
  "result": "success",
  "data": {
    "success": true
  }
}
```

---

### 5. **Obtener Mis Credenciales** (Usuario)

**Endpoint**: `GET /api/v1/credentials/my/:userDID`

**Descripción**: El usuario consulta todas sus credenciales aprobadas.

**Request**:
```
GET /api/v1/credentials/my/did:bsv:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa
```

**Response**:
```json
{
  "result": "success",
  "data": {
    "credentials": [
      {
        "credentialId": "urn:uuid:456e7890-a12b-34c5-d678-901234567890",
        "credentialType": "DriversLicense",
        "credential": {
          "@context": ["https://www.w3.org/2018/credentials/v1"],
          "id": "urn:uuid:456e7890-a12b-34c5-d678-901234567890",
          "type": ["VerifiableCredential", "DriversLicense"],
          "issuer": "did:bsv:issuer-address",
          "issuanceDate": "2024-11-29T10:30:00Z",
          "credentialSubject": { ... },
          "proof": { ... }
        },
        "issuerDID": "did:bsv:issuer-address",
        "issuedAt": 1732890000000,
        "expiresAt": 1924991999000,
        "anchorTxid": "abc123def456789..."
      }
    ],
    "count": 1
  }
}
```

---

### 6. **Ver Estado de Solicitud** (Usuario/Issuer)

**Endpoint**: `GET /api/v1/credentials/request/:requestId`

**Request**:
```
GET /api/v1/credentials/request/req-123e4567-e89b-12d3-a456-426614174000
```

**Response (PENDING)**:
```json
{
  "result": "success",
  "data": {
    "requestId": "req-123e4567-e89b-12d3-a456-426614174000",
    "userDID": "did:bsv:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    "credentialType": "DriversLicense",
    "requestData": { ... },
    "status": "PENDING",
    "requestedAt": 1732890000000
  }
}
```

**Response (APPROVED)**:
```json
{
  "result": "success",
  "data": {
    "requestId": "req-123e4567-e89b-12d3-a456-426614174000",
    "userDID": "did:bsv:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    "credentialType": "DriversLicense",
    "requestData": { ... },
    "status": "APPROVED",
    "requestedAt": 1732890000000,
    "credentialId": "urn:uuid:456e7890-a12b-34c5-d678-901234567890",
    "reviewedBy": "did:bsv:issuer-address",
    "reviewedAt": 1732893600000
  }
}
```

**Response (REJECTED)**:
```json
{
  "result": "success",
  "data": {
    "requestId": "req-123e4567-e89b-12d3-a456-426614174000",
    "userDID": "did:bsv:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    "credentialType": "DriversLicense",
    "requestData": { ... },
    "status": "REJECTED",
    "requestedAt": 1732890000000,
    "rejectionReason": "Documentación incompleta",
    "reviewedBy": "did:bsv:issuer-address",
    "reviewedAt": 1732893600000
  }
}
```

---

### 7. **Verificar Credencial**

**Endpoint**: `POST /api/v1/credentials/verify`

**Request Body**:
```json
{
  "credential": {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    "id": "urn:uuid:456e7890-a12b-34c5-d678-901234567890",
    "type": ["VerifiableCredential", "DriversLicense"],
    "issuer": "did:bsv:issuer-address",
    "issuanceDate": "2024-11-29T10:30:00Z",
    "credentialSubject": { ... },
    "proof": { ... }
  }
}
```

**Response**:
```json
{
  "result": "success",
  "data": {
    "valid": true,
    "errors": [],
    "checks": {
      "structureValid": true,
      "signatureValid": true,
      "notExpired": true,
      "notRevoked": true
    }
  }
}
```

---

## 💾 Base de Datos (MongoDB)

### Colección: `credential_requests`

```javascript
{
  id: "req-123e4567-e89b-12d3-a456-426614174000",
  userDID: "did:bsv:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
  credentialType: "DriversLicense",
  requestData: "{\"fullName\":\"Juan Pérez\",...}",
  status: "PENDING" | "APPROVED" | "REJECTED",
  requestedAt: 1732890000000,
  reviewedAt: 0,
  reviewedBy: "",
  rejectionReason: "",
  credentialId: ""
}
```

**Índices**:
```javascript
db.credential_requests.createIndex({ "id": 1 }, { unique: true });
db.credential_requests.createIndex({ "userDID": 1 });
db.credential_requests.createIndex({ "status": 1 });
db.credential_requests.createIndex({ "credentialType": 1 });
```

### Colección: `verifiable_credentials`

```javascript
{
  id: "urn:uuid:456e7890-a12b-34c5-d678-901234567890",
  holderDID: "did:bsv:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
  issuerDID: "did:bsv:issuer-address",
  type: "DriversLicense",
  credentialJSON: "{...}",
  credentialHash: "abc123...",
  anchorTxid: "def456...",
  issuedAt: 1732890000000,
  expiresAt: 1924991999000,
  isRevoked: false,
  revokedAt: 0,
  revocationReason: "",
  revocationTxid: ""
}
```

---

## 📝 Ejemplos de Uso

### Ejemplo Completo: Licencia de Conducir

```javascript
// 1. Usuario solicita licencia de conducir
const requestResponse = await fetch('http://localhost:3000/api/v1/credentials/request', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userDID: "did:bsv:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    credentialType: "DriversLicense",
    requestData: {
      fullName: "Juan Pérez",
      nationalId: "12345678A",
      licenseNumber: "B-123456",
      dateOfBirth: "1990-01-15",
      address: "Calle Mayor 123, Madrid",
      licenseClass: "B",
      issueDate: "2024-01-15",
      expiryDate: "2034-01-15"
    }
  })
});

const { requestId } = (await requestResponse.json()).data;
console.log("Request ID:", requestId);

// 2. Issuer (DGT) revisa solicitudes pendientes
const pendingResponse = await fetch('http://localhost:3000/api/v1/credentials/requests/pending?credentialType=DriversLicense');
const { requests } = (await pendingResponse.json()).data;
console.log("Pending requests:", requests.length);

// 3. Issuer aprueba la solicitud
const approveResponse = await fetch('http://localhost:3000/api/v1/credentials/approve', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    requestId: requestId,
    issuerPrivateKey: "ISSUER_PRIVATE_KEY_HEX",
    expirationDate: "2034-01-15T00:00:00Z"
  })
});

const { credential, txid } = (await approveResponse.json()).data;
console.log("Credential issued! TXID:", txid);

// 4. Usuario consulta sus credenciales
const myCredsResponse = await fetch(`http://localhost:3000/api/v1/credentials/my/did:bsv:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa`);
const { credentials } = (await myCredsResponse.json()).data;
console.log("My credentials:", credentials);

// 5. Verificador verifica la credencial
const verifyResponse = await fetch('http://localhost:3000/api/v1/credentials/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ credential })
});

const verification = (await verifyResponse.json()).data;
console.log("Is valid:", verification.valid);
```

---

## 🏗️ Arquitectura del Sistema

```
┌────────────────────────────────────────────────────────────┐
│                      API REST Layer                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  CredentialsController                               │  │
│  │  - requestCredential()                               │  │
│  │  - getPendingRequests()                              │  │
│  │  - approveRequest()                                  │  │
│  │  - rejectRequest()                                   │  │
│  │  - getUserCredentials()                              │  │
│  │  - getRequestStatus()                                │  │
│  │  - verifyCredential()                                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────┬──────────────────────────────────┘
                          │
┌─────────────────────────┴──────────────────────────────────┐
│                   Service Layer                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  VerifiableCredentialsService                        │  │
│  │  - requestCredential()                               │  │
│  │  - getPendingRequests()                              │  │
│  │  - approveRequest()  → Signs + Anchors to BSV       │  │
│  │  - rejectRequest()                                   │  │
│  │  - getUserCredentials()                              │  │
│  │  - getRequestStatus()                                │  │
│  │  - verifyCredential()                                │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────┬──────────────────┬──────────────────────┘
                   │                  │
         ┌─────────┴─────────┐  ┌────┴──────────┐
         │   MongoDB         │  │  BSV Service  │
         │  - requests       │  │  - wallet     │
         │  - credentials    │  │  - anchor     │
         └───────────────────┘  └───────┬───────┘
                                        │
                              ┌─────────┴──────────┐
                              │  BSV Blockchain    │
                              │  OP_RETURN Data    │
                              └────────────────────┘
```

---

## 🔐 Seguridad

### Datos On-Chain vs Off-Chain

- **On-Chain (BSV Blockchain)**:
  - Solo el **hash** de la credencial
  - Tipo de credencial
  - ID de la credencial
  - Protocolo: `VCANCHOR|v1|credId|type|sha256:hash`

- **Off-Chain (MongoDB)**:
  - Credencial completa (con datos personales)
  - Estado de la solicitud
  - Metadata

### Privacidad

✅ Los datos personales **NO** se publican en blockchain
✅ Solo el hash se ancla para verificación de integridad
✅ El usuario controla sus credenciales

---

## 🚀 Quick Start

```bash
# 1. Iniciar MongoDB
# Asegurar que está corriendo en localhost:27017

# 2. Iniciar backend
cd web-application/backend
npm install
npm run dev

# 3. Probar el sistema
# Usar Postman, cURL o el demo HTML
```

---

## 📊 Estado del Proyecto

✅ **Modelo de datos**: `credential-request.ts`, `verifiable-credential.ts`
✅ **Servicio**: `verifiable-credentials-service.ts` (flujo completo)
✅ **API REST**: 7 endpoints implementados
✅ **Compilación**: Sin errores
✅ **Listo para**: Testing y producción

---

## 🎯 Próximos Pasos

1. Crear tests automatizados para el nuevo flujo
2. Crear demo HTML interactivo
3. Implementar notificaciones (usuario sabe cuándo se aprueba su solicitud)
4. Integrar con wallet mobile
5. Dashboard de administración para issuers

---

¡Sistema completo de solicitud y aprobación de credenciales! 🎉
