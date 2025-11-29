# Guía Rápida - Sistema de DIDs BSV

## 🚀 Inicio Rápido

### 1. Configuración

El servicio DID ya está integrado en el proyecto. Solo necesitas configurar las variables de entorno:

```bash
# Editar .env
BSV_PRIVATE_KEY=tu_clave_privada_hex
BSV_NETWORK=main  # o 'test' para testnet
```

### 2. El servicio se registra automáticamente

El controlador `api-did.ts` se carga automáticamente al iniciar el servidor.

### 3. Probar la API

#### Generar un DID de prueba

```bash
curl -X POST http://localhost:3000/api/v1/did/generate \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Respuesta:**
```json
{
  "did": "did:bsv:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
  "privateKey": "0a1b2c3d4e5f...",
  "txid": "abc123...",
  "document": { ... }
}
```

⚠️ **IMPORTANTE**: Guarda la `privateKey` de forma segura!

#### Resolver un DID

```bash
curl http://localhost:3000/api/v1/did/resolve/did:bsv:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa
```

## 📂 Archivos Creados

```
backend/
├── src/
│   ├── services/
│   │   └── did-service.ts          # Servicio principal (540 líneas)
│   └── controllers/
│       └── api/
│           └── api-did.ts           # API REST (310 líneas)
├── examples/
│   └── did-examples.ts              # Ejemplos de uso
├── test/
│   └── services/
│       └── did-service.test.ts      # Tests unitarios
├── README_DID_SERVICE.md            # Documentación completa
├── IMPLEMENTATION_SUMMARY.md        # Resumen de implementación
└── QUICK_START.md                   # Este archivo
```

## 🔧 Uso Programático

### Desde el Backend (TypeScript)

```typescript
import { DIDService } from './services/did-service';

const didService = DIDService.getInstance();

// Crear DID
const result = await didService.createDID({
  services: [{
    id: 'did:bsv:xxx#my-service',
    type: 'MyService',
    serviceEndpoint: 'https://example.com/service'
  }]
});

console.log('DID:', result.did);
console.log('TXID:', result.txid);

// Resolver DID
const resolution = await didService.resolveDID(result.did);
console.log('Verified:', resolution.verification.signature);
```

### Desde el Frontend (JavaScript/Fetch)

```javascript
// Crear DID
const response = await fetch('/api/v1/did/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    services: [{
      id: 'did:bsv:xxx#service',
      type: 'UserService',
      serviceEndpoint: 'https://app.com/user'
    }]
  })
});

const data = await response.json();
console.log('Created DID:', data.did);
```

## ⚠️ Consideraciones Importantes

### 1. Costos
- Cada creación de DID cuesta satoshis en BSV
- Usar testnet para desarrollo: `BSV_NETWORK=test`

### 2. Claves Privadas
- **NUNCA** commitear claves al repositorio
- Usar HSM o vault para producción
- Guardar backups seguros

### 3. Limitaciones Actuales

#### Resolución de DIDs
La implementación actual busca en el historial del wallet local. Para producción, integrar un indexador BSV:

**Opciones recomendadas:**
- [WhatsOnChain API](https://developers.whatsonchain.com/)
- [JungleBus](https://junglebus.gorillapool.io/)
- [Taal API](https://docs.taal.com/)

#### Ejemplo de integración con WhatsOnChain:

```typescript
// En did-service.ts, método findDIDTransaction
async findDIDTransactionFromIndexer(did: string): Promise<any> {
  const address = this.extractAddressFromDID(did);
  const response = await fetch(
    `https://api.whatsonchain.com/v1/bsv/main/address/${address}/history`
  );
  const txs = await response.json();
  
  // Buscar transacción con OP_RETURN que contenga el DID
  for (const tx of txs) {
    const txData = await fetch(
      `https://api.whatsonchain.com/v1/bsv/main/tx/${tx.tx_hash}`
    ).then(r => r.json());
    
    // Parsear OP_RETURN y buscar BSVDID
    // ... lógica de extracción ...
  }
}
```

### 4. Tests

```bash
# Ejecutar tests unitarios
npm run unit-tests

# Ejecutar tests de integración (requiere BSV testnet configurado)
# Descomentar tests en test/services/did-service.test.ts
npm run unit-tests
```

## 🐛 Solución de Problemas

### Error: "BSV wallet not initialized"
**Solución**: Verificar que `BSV_PRIVATE_KEY` esté configurado en `.env`

### Error: "DID not found"
**Posibles causas**:
1. El DID no existe en blockchain
2. La transacción aún no se ha confirmado (esperar ~10 segundos)
3. Limitación del indexador local (ver sección de limitaciones)

### Error de compilación TypeScript
```bash
# Limpiar y recompilar
rm -rf dist/
npm run build
```

## 📚 Próximos Pasos

1. **Integrar Indexador**
   - Implementar WhatsOnChain o JungleBus
   - Mejorar velocidad de resolución
   - Añadir cache de documentos

2. **Añadir Operaciones**
   - UPDATE: Actualizar DIDs
   - REVOKE: Revocar DIDs
   - ROTATE: Rotar claves

3. **Mejoras de Seguridad**
   - Multi-signature DIDs
   - Threshold signatures
   - Key rotation automática

4. **Monitoreo**
   - Dashboard de métricas
   - Alertas de errores
   - Logs de auditoría

## 📖 Documentación Completa

Ver `README_DID_SERVICE.md` para documentación detallada.

## 🆘 Soporte

Para issues o preguntas:
1. Revisar `README_DID_SERVICE.md`
2. Ver ejemplos en `examples/did-examples.ts`
3. Consultar tests en `test/services/did-service.test.ts`

---

**¡Listo para crear DIDs en BSV!** 🚀
