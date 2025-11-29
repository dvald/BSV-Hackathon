# BSV DID Service

Sistema de creación y resolución de Identidades Descentralizadas (DIDs) en la blockchain de BSV.

## 📋 Descripción

Este servicio implementa el método DID `did:bsv` basado en direcciones BSV (Bitcoin SV). Permite crear, publicar y resolver DIDs siguiendo la especificación W3C DID Core.

## 🏗️ Arquitectura

### Componentes Principales

1. **DIDService** (`src/services/did-service.ts`)
   - Servicio principal para gestión de DIDs
   - Creación de DIDs con claves privadas
   - Resolución de DIDs desde la blockchain
   - Validación y verificación de documentos DID

2. **DIDController** (`src/controllers/api/api-did.ts`)
   - API REST para exposición de funcionalidades
   - Endpoints para CRUD de DIDs
   - Validación de entrada y manejo de errores

## 🔑 Formato del DID

```
did:bsv:<BSV-address>
```

**Ejemplo:**
```
did:bsv:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa
```

La dirección BSV se deriva de la clave pública del usuario (Everyday Identity Key) usando el estándar P2PKH.

## 📄 Estructura del DID Document

```json
{
  "@context": ["https://www.w3.org/ns/did/v1"],
  "id": "did:bsv:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
  "verificationMethod": [
    {
      "id": "did:bsv:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa#key-1",
      "type": "EcdsaSecp256k1VerificationKey2019",
      "controller": "did:bsv:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
      "publicKeyHex": "03a1b2c3d4e5f6..."
    }
  ],
  "authentication": ["did:bsv:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa#key-1"],
  "service": [
    {
      "id": "did:bsv:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa#national-card-service",
      "type": "CitizenCardService",
      "serviceEndpoint": "https://cards.example.gov/endpoint"
    }
  ],
  "proof": {
    "type": "EcdsaSecp256k1Signature2019",
    "created": "2025-11-29T12:34:56Z",
    "proofPurpose": "assertionMethod",
    "verificationMethod": "did:bsv:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa#key-1",
    "jws": "<firma_base64url>"
  }
}
```

## 🚀 API Endpoints

### 1. Crear DID

**POST** `/api/v1/did/create`

Crea un nuevo DID y lo publica en la blockchain de BSV.

**Request Body:**
```json
{
  "privateKey": "0a1b2c3d...", // Opcional: clave privada en hex (se genera aleatoria si no se provee)
  "services": [ // Opcional: servicios asociados
    {
      "id": "did:bsv:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa#service-1",
      "type": "CitizenCardService",
      "serviceEndpoint": "https://example.gov/service"
    }
  ]
}
```

**Response:**
```json
{
  "did": "did:bsv:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
  "txid": "abcd1234...",
  "document": { /* DID Document completo */ }
}
```

### 2. Resolver DID

**GET** `/api/v1/did/resolve/:did`

Recupera y verifica un DID desde la blockchain.

**Parámetros:**
- `did`: El identificador DID a resolver (ej: `did:bsv:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa`)

**Response:**
```json
{
  "didDocument": { /* DID Document */ },
  "didDocumentMetadata": {
    "txid": "abcd1234...",
    "block": 123456,
    "timestamp": "2025-11-29T12:34:56Z"
  },
  "verification": {
    "integrity": true,
    "signature": true
  }
}
```

### 3. Generar DID Aleatorio

**POST** `/api/v1/did/generate`

Genera un DID con una clave privada aleatoria (útil para pruebas).

**Request Body:**
```json
{
  "services": [ /* Opcional: servicios */ ]
}
```

**Response:**
```json
{
  "did": "did:bsv:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
  "privateKey": "0a1b2c3d...", // ⚠️ GUARDAR DE FORMA SEGURA
  "txid": "abcd1234...",
  "document": { /* DID Document */ }
}
```

### 4. Validar DID Document

**POST** `/api/v1/did/validate`

Valida la estructura de un DID Document.

**Request Body:**
```json
{
  "document": { /* DID Document a validar */ }
}
```

**Response:**
```json
{
  "valid": true,
  "errors": []
}
```

### 5. Exportar DID Document

**POST** `/api/v1/did/export`

Exporta un DID Document a JSON formateado.

**Request Body:**
```json
{
  "document": { /* DID Document */ }
}
```

**Response:**
```json
{
  "json": "{ ... }" // JSON formateado
}
```

## 🔐 Seguridad

### Gestión de Claves Privadas

- **NUNCA** compartir la clave privada
- Almacenar en HSM (Hardware Security Module) o entorno seguro
- Usar encriptación en reposo
- Implementar control de acceso estricto

### Verificación

El servicio verifica automáticamente:

1. **Integridad**: Hash SHA-256 del documento coincide con el almacenado en blockchain
2. **Autenticidad**: Firma ECDSA verificada con la clave pública del DID

## 🔄 Flujo de Creación

1. Generar/usar clave privada `sk`
2. Derivar clave pública `pk` → Everyday Identity Key
3. Calcular dirección BSV desde `pk`
4. Formar DID: `did:bsv:<address>`
5. Construir DID Document
6. Canonicalizar JSON y calcular SHA-256
7. Firmar con `sk` usando ECDSA
8. Comprimir documento (GZIP)
9. Codificar en base64
10. Publicar en BSV usando OP_RETURN:
    ```
    BSVDID|v1|did:bsv:<address>|sha256:<hash>|<base64(GZIP(document))>
    ```

## 🔍 Flujo de Resolución

1. Solicitud con `did:bsv:<address>`
2. Buscar transacciones en blockchain con el DID
3. Extraer datos del OP_RETURN
4. Descomprimir y decodificar documento
5. Verificar:
   - Hash SHA-256 coincide
   - Firma ECDSA es válida
6. Retornar documento y metadata

## 📦 Dependencias

- `@bsv/sdk`: SDK de BSV para manejo de claves y transacciones
- `@bsv/wallet-toolbox`: Herramientas para wallet BSV
- `crypto`: Hashing SHA-256
- `zlib`: Compresión GZIP

## ⚙️ Configuración

El servicio usa la configuración de BSV existente:

```env
BSV_PRIVATE_KEY=<clave_privada_backend>
BSV_NETWORK=main # o 'test' para testnet
```

## 🧪 Ejemplo de Uso

### Crear un DID

```bash
curl -X POST http://localhost:3000/api/v1/did/create \
  -H "Content-Type: application/json" \
  -d '{
    "services": [{
      "id": "did:bsv:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa#card-service",
      "type": "CitizenCardService",
      "serviceEndpoint": "https://gov.example/cards"
    }]
  }'
```

### Resolver un DID

```bash
curl http://localhost:3000/api/v1/did/resolve/did:bsv:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa
```

## 📝 Notas de Implementación

### Limitaciones Actuales

1. **Indexación**: La resolución actual busca en el historial del wallet. Para producción, se recomienda integrar un indexador BSV (WhatsOnChain, JungleBus, etc.)

2. **OP_RETURN**: Tamaño limitado a ~100KB. Documentos grandes deben ser comprimidos o almacenados off-chain con hash on-chain.

3. **Operaciones**: Solo implementa CREATE y RESOLVE. No hay UPDATE ni REVOKE inicialmente.

### Mejoras Futuras

- [ ] Integración con indexador BSV profesional
- [ ] Soporte para actualización de DIDs
- [ ] Mecanismo de revocación
- [ ] Cache de documentos resueltos
- [ ] Soporte para DIDs delegados
- [ ] Batch creation de múltiples DIDs
- [ ] Webhooks para notificaciones de eventos

## 🔗 Referencias

- [W3C DID Core Specification](https://www.w3.org/TR/did-core/)
- [BSV SDK Documentation](https://docs.bsvblockchain.org/)
- [DID Method Registry](https://www.w3.org/TR/did-spec-registries/)

## 📄 Licencia

Ver LICENSE en el proyecto principal.

## 👥 Contribuciones

Para contribuir al desarrollo del servicio DID:

1. Fork el proyecto
2. Crear feature branch
3. Commit cambios
4. Push a la branch
5. Abrir Pull Request

---

**⚠️ Advertencia**: Este es un sistema en desarrollo. No usar en producción sin auditoría de seguridad completa.
