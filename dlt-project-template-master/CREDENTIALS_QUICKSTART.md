# 🔐 BSV Verifiable Credentials - Quick Start Guide

## 📋 Índice

1. [Introducción](#introducción)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Instalación](#instalación)
4. [Ejecución del Backend](#ejecución-del-backend)
5. [Demo Interactivo](#demo-interactivo)
6. [Pruebas Automatizadas](#pruebas-automatizadas)
7. [Uso de las APIs](#uso-de-las-apis)
8. [Ejemplos Prácticos](#ejemplos-prácticos)
9. [Tipos de Credenciales](#tipos-de-credenciales)
10. [Troubleshooting](#troubleshooting)

---

## Introducción

El sistema de **Credenciales Verificables sobre BSV** implementa un flujo completo de **solicitud-aprobación-emisión** donde:

1. **Usuario** solicita una credencial de un tipo específico
2. **Issuer** revisa y aprueba/rechaza la solicitud
3. **Sistema** firma y ancla la credencial en la blockchain BSV
4. **Cualquiera** puede verificar la autenticidad de las credenciales emitidas

### Características Principales

- ✅ **Dinámico**: Los datos requeridos por cada tipo de credencial son completamente configurables
- 🔒 **Seguro**: Firma criptográfica y anclaje en blockchain BSV
- 📊 **Trazable**: Cada credencial está registrada en la blockchain
- 🔍 **Verificable**: Cualquiera puede verificar la autenticidad
- 🎯 **RESTful**: APIs REST estándar para fácil integración

---

## Arquitectura del Sistema

```
┌─────────────┐
│   Usuario   │ ──────┐
└─────────────┘       │
                      ▼
              ┌───────────────┐
              │   Solicitud   │ (PENDING)
              │  Credential   │
              └───────────────┘
                      │
                      ▼
              ┌───────────────┐
              │    Issuer     │ ──┐ Rechaza
              │   Revisa      │   │
              └───────────────┘   │
                      │           │
                  Aprueba         ▼
                      │     ┌──────────┐
                      │     │ REJECTED │
                      │     └──────────┘
                      ▼
              ┌───────────────┐
              │  Firma + BSV  │
              │   Blockchain  │
              └───────────────┘
                      │
                      ▼
              ┌───────────────┐
              │   APPROVED    │
              │  Credential   │
              │   Emitida     │
              └───────────────┘
```

### Componentes

1. **CredentialRequest** (Modelo): Almacena solicitudes con estado (PENDING/APPROVED/REJECTED)
2. **VerifiableCredential** (Modelo): Almacena credenciales emitidas
3. **VerifiableCredentialsService** (Servicio): Lógica de negocio del flujo
4. **CredentialsController** (API): Endpoints REST
5. **DIDService**: Gestión de identidades descentralizadas
6. **BsvService**: Integración con blockchain BSV

---

## Instalación

### Requisitos Previos

- Node.js >= 16
- TypeScript
- MongoDB (para almacenamiento)
- BSV Wallet configurado

### Pasos de Instalación

```bash
# 1. Navegar al directorio del backend
cd web-application/backend

# 2. Instalar dependencias
npm install

# 3. Compilar TypeScript
npm run build

# 4. Configurar variables de entorno (crear .env)
# Ver sección de Configuración abajo
```

### Configuración (.env)

```env
# API Configuration
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/bsv-credentials

# BSV Configuration
BSV_NETWORK=testnet
BSV_WALLET_SEED=<your-seed-here>

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8080
```

---

## Ejecución del Backend

```bash
# Modo desarrollo (con hot reload)
npm run dev

# Modo producción
npm start

# El servidor estará disponible en:
# http://localhost:3000
```

### Verificar que el servidor está funcionando

```bash
curl http://localhost:3000/api/v1/
```

Deberías ser redirigido a la documentación Swagger en `/api-docs`.

---

## Demo Interactivo

### Acceder al Demo HTML

Una vez el backend esté ejecutándose:

1. Abrir el navegador en: `http://localhost:3000/credentials-demo.html`
2. El demo incluye 4 pestañas:
   - **👤 User View**: Solicitar credenciales, ver estado, consultar credenciales propias
   - **✅ Issuer View**: Ver solicitudes pendientes, aprobar/rechazar
   - **🔍 Verify**: Verificar credenciales
   - **⚙️ Configuration**: Configurar URL de API y ver plantillas

### Flujo de Ejemplo en el Demo

#### 1. Como Usuario - Solicitar una Credencial

1. Ve a la pestaña **User View**
2. En "Your DID" ingresa: `did:bsv:test-user-123`
3. Selecciona "Driver's License" como tipo
4. Los datos de ejemplo se cargarán automáticamente
5. Haz clic en "📝 Request Credential"
6. Copia el `requestId` devuelto

#### 2. Como Issuer - Aprobar la Solicitud

1. Ve a la pestaña **Issuer View**
2. Haz clic en "🔄 Refresh Pending Requests"
3. Verás tu solicitud en estado PENDING
4. Haz clic en "✅ Approve This" en la tarjeta
5. Ingresa tu clave privada (hex)
6. Haz clic en "✅ Approve & Issue"
7. La credencial se firmará y anclará en BSV

#### 3. Como Usuario - Ver Credenciales

1. Vuelve a **User View**
2. En "My Credentials", ingresa tu DID
3. Haz clic en "📜 Get My Credentials"
4. Verás todas tus credenciales emitidas

---

## Pruebas Automatizadas

### Ejecutar Tests

```bash
# Ejecutar todos los tests
npm test

# Ejecutar solo tests de credenciales
npm test -- --grep "Verifiable Credentials"

# Ejecutar con cobertura
npm run test:coverage
```

### Suite de Tests Incluida

El archivo `verifiable-credentials.test.ts` incluye:

1. ✅ **Credential Request Flow**: Tests de creación y estado de solicitudes
2. ✅ **Issuer Approval Flow**: Tests de aprobación y emisión
3. ✅ **Issuer Rejection Flow**: Tests de rechazo
4. ✅ **Credential Verification**: Tests de verificación
5. ✅ **Dynamic Request Data**: Tests con datos dinámicos
6. ✅ **Error Handling**: Tests de manejo de errores
7. ✅ **Multi-Credential Management**: Tests con múltiples credenciales

### Ejemplo de Salida de Tests

```
  Verifiable Credentials System
    1. Credential Request Flow
      ✓ should allow a user to request a credential (120ms)
      ✓ should retrieve the request status (45ms)
      ✓ should list pending requests (38ms)
      ✓ should filter pending requests by type (42ms)
    2. Issuer Approval Flow
      ✓ should approve a request and issue credential (2450ms)
      ✓ should update request status to APPROVED (52ms)
      ✓ should include credential in user credentials list (48ms)
      ✓ should verify the issued credential (156ms)
    ...
  
  28 passing (8.5s)
```

---

## Uso de las APIs

### Base URL

```
http://localhost:3000/api/v1
```

### Endpoints Disponibles

#### 1. Solicitar Credencial

**POST** `/credentials/request`

```bash
curl -X POST http://localhost:3000/api/v1/credentials/request \
  -H "Content-Type: application/json" \
  -d '{
    "userDID": "did:bsv:0x1234...",
    "credentialType": "DriversLicense",
    "requestData": {
      "name": "John Doe",
      "dateOfBirth": "1990-01-01",
      "licenseNumber": "DL123456"
    }
  }'
```

**Respuesta:**
```json
{
  "requestId": "req_abc123...",
  "status": "PENDING"
}
```

#### 2. Obtener Solicitudes Pendientes

**GET** `/credentials/requests/pending?credentialType=DriversLicense`

```bash
curl http://localhost:3000/api/v1/credentials/requests/pending
```

**Respuesta:**
```json
{
  "requests": [
    {
      "requestId": "req_abc123...",
      "userDID": "did:bsv:0x1234...",
      "credentialType": "DriversLicense",
      "requestData": { ... },
      "status": "PENDING",
      "requestedAt": 1234567890000
    }
  ],
  "count": 1
}
```

#### 3. Aprobar Solicitud

**POST** `/credentials/approve`

```bash
curl -X POST http://localhost:3000/api/v1/credentials/approve \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "req_abc123...",
    "issuerPrivateKey": "0x...",
    "expirationDate": "2025-12-31T23:59:59Z"
  }'
```

**Respuesta:**
```json
{
  "credentialId": "vc_xyz789...",
  "txid": "abc123...",
  "credential": {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    "id": "vc_xyz789...",
    "type": ["VerifiableCredential", "DriversLicense"],
    "issuer": "did:bsv:0x5678...",
    "issuanceDate": "2024-01-15T10:30:00Z",
    "credentialSubject": {
      "id": "did:bsv:0x1234...",
      "name": "John Doe",
      ...
    },
    "proof": { ... }
  }
}
```

#### 4. Rechazar Solicitud

**POST** `/credentials/reject`

```bash
curl -X POST http://localhost:3000/api/v1/credentials/reject \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "req_abc123...",
    "issuerDID": "did:bsv:0x5678...",
    "reason": "Insufficient documentation"
  }'
```

#### 5. Obtener Credenciales de Usuario

**GET** `/credentials/my/:userDID`

```bash
curl http://localhost:3000/api/v1/credentials/my/did:bsv:0x1234...
```

#### 6. Consultar Estado de Solicitud

**GET** `/credentials/request/:requestId`

```bash
curl http://localhost:3000/api/v1/credentials/request/req_abc123...
```

#### 7. Verificar Credencial

**POST** `/credentials/verify`

```bash
curl -X POST http://localhost:3000/api/v1/credentials/verify \
  -H "Content-Type: application/json" \
  -d '{
    "credential": {
      "@context": [...],
      "id": "vc_xyz789...",
      ...
    }
  }'
```

**Respuesta:**
```json
{
  "valid": true,
  "checks": {
    "structureValid": true,
    "signatureValid": true,
    "notExpired": true,
    "notRevoked": true
  },
  "errors": []
}
```

---

## Ejemplos Prácticos

### Ejemplo 1: Licencia de Conducir

```javascript
// 1. Usuario solicita licencia
const request = await fetch('http://localhost:3000/api/v1/credentials/request', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userDID: 'did:bsv:user123',
    credentialType: 'DriversLicense',
    requestData: {
      name: 'John Doe',
      dateOfBirth: '1990-01-01',
      licenseNumber: 'DL123456',
      class: 'C',
      issueDate: '2020-01-01',
      expiryDate: '2025-01-01'
    }
  })
});
const { requestId } = await request.json();

// 2. Issuer aprueba (después de revisar)
const approval = await fetch('http://localhost:3000/api/v1/credentials/approve', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    requestId,
    issuerPrivateKey: '0x...',
    expirationDate: '2025-01-01T00:00:00Z'
  })
});
const { credentialId, txid, credential } = await approval.json();

// 3. Usuario consulta sus credenciales
const myCredentials = await fetch('http://localhost:3000/api/v1/credentials/my/did:bsv:user123');
const { credentials } = await myCredentials.json();
```

### Ejemplo 2: Certificado Médico

```javascript
const response = await fetch('http://localhost:3000/api/v1/credentials/request', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userDID: 'did:bsv:patient456',
    credentialType: 'MedicalCertificate',
    requestData: {
      patientName: 'Jane Smith',
      diagnosis: 'Healthy',
      physician: 'Dr. Smith',
      hospitalName: 'City Hospital',
      date: '2024-01-15',
      validUntil: '2024-07-15'
    }
  })
});
```

---

## Tipos de Credenciales

El sistema soporta cualquier tipo de credencial con datos dinámicos. Algunos ejemplos:

### 1. DriversLicense

```json
{
  "credentialType": "DriversLicense",
  "requestData": {
    "name": "string",
    "dateOfBirth": "YYYY-MM-DD",
    "licenseNumber": "string",
    "class": "string",
    "issueDate": "YYYY-MM-DD",
    "expiryDate": "YYYY-MM-DD"
  }
}
```

### 2. MedicalCertificate

```json
{
  "credentialType": "MedicalCertificate",
  "requestData": {
    "patientName": "string",
    "diagnosis": "string",
    "physician": "string",
    "date": "YYYY-MM-DD",
    "validUntil": "YYYY-MM-DD"
  }
}
```

### 3. EducationDegree

```json
{
  "credentialType": "EducationDegree",
  "requestData": {
    "studentName": "string",
    "degree": "string",
    "major": "string",
    "university": "string",
    "graduationDate": "YYYY-MM-DD",
    "gpa": "string"
  }
}
```

### 4. Custom (Personalizado)

Puedes crear cualquier tipo de credencial con los campos que necesites:

```json
{
  "credentialType": "MyCustomCredential",
  "requestData": {
    "field1": "value1",
    "field2": 123,
    "nested": {
      "data": "value"
    }
  }
}
```

---

## Troubleshooting

### Error: "Cannot connect to MongoDB"

**Solución:**
```bash
# Verificar que MongoDB esté ejecutándose
sudo systemctl status mongodb

# O iniciar MongoDB
sudo systemctl start mongodb
```

### Error: "BSV Service not available"

**Solución:**
- Verificar que `BSV_WALLET_SEED` esté configurado en `.env`
- Verificar conectividad de red con la blockchain BSV
- Los tests funcionan con DIDs mock si BSV no está disponible

### Error: "DID must start with 'did:bsv:'"

**Solución:**
- Asegurarte de usar el formato correcto: `did:bsv:<identifier>`
- Ejemplo válido: `did:bsv:0x1234abcd...`

### Error: "Request not found"

**Solución:**
- Verificar que el `requestId` sea correcto
- Verificar que la base de datos esté funcionando
- Revisar logs del servidor

### Demo HTML no carga

**Solución:**
```bash
# Verificar que el archivo existe
ls web-application/backend/public/credentials-demo.html

# Verificar que el servidor sirva archivos estáticos
# En app.ts debe haber:
# application.use(Express.static(...))
```

---

## 📚 Documentación Adicional

- [CREDENTIALS_SYSTEM_README.md](./CREDENTIALS_SYSTEM_README.md) - Documentación completa del sistema
- [API Documentation (Swagger)](http://localhost:3000/api-docs) - Documentación interactiva de APIs
- [BSV SDK Documentation](https://docs.bsvblockchain.org/) - Documentación del SDK de BSV

---

## 🤝 Soporte

Para reportar bugs o solicitar features, crear un issue en el repositorio del proyecto.

---

## 📝 Licencia

Este proyecto está bajo la licencia especificada en el archivo LICENSE del repositorio principal.

---

## ✨ Próximos Pasos

1. ✅ Implementar notificaciones en tiempo real (WebSocket)
2. ✅ Dashboard web para issuers
3. ✅ Soporte para revocación de credenciales
4. ✅ Integración con wallets BSV
5. ✅ Templates de credenciales predefinidos
6. ✅ Audit trail completo de todas las acciones

---

**¡Listo para empezar! 🚀**

Ejecuta `npm run dev` y abre `http://localhost:3000/credentials-demo.html` para comenzar a usar el sistema.
