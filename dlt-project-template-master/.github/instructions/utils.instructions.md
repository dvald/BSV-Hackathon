---
applyTo: "backend/src/utils/**/*.ts,backend/src/utils/**/**/*.ts,utils/**/*.ts"
---

# Copilot Instructions — Utility Modules

Goal: enforce consistent, safe, and testable utilities. Utilities must be stateless, pure (where possible), and framework‑agnostic.

Quick checklist

- [ ] No side effects at import time (no timers, network, FS, or global mutation)
- [ ] Named exports only (no default exports)
- [ ] Precise TypeScript types on all public functions (no public `any`)
- [ ] Pure / deterministic functions where practical; I/O helpers explicit and promise‑based
- [ ] Mandatory JSDoc for exported functions

## 1) General rules

* No side effects on import. Do not start timers, touch network/FS, or mutate globals during module load.
* Named exports only. Avoid default exports to improve tree‑shaking and refactors.
* Type first. Use explicit parameter and return types. Avoid public `any`.
* Determinism. Functions should be pure unless they explicitly perform I/O.
* Input validation. Validate arguments early and throw or return predictable errors.
* Begin files with `"use strict"` and a brief header comment.

## 2) File structure (recommended)

1. Strict mode + header comment
2. Imports (stdlib → external → local)
3. Constants (UPPER_SNAKE with units, e.g., `TIMEOUT_MS`)
4. Types / interfaces
5. Functions ordered: validators → normalizers → formatters → higher‑level helpers
6. Re‑exports (if needed)

## 3) Validation & normalization patterns

* Hex/address helpers: reuse local helpers like `hexWithPrefix` / `hexNoPrefix`.
* Address (20 bytes): `/^0x[0-9a-f]{40}$/i`.
* bytes32: `/^0x[0-9a-f]{64}$/i`.
* BigInt parse: `try { BigInt(x) } catch { ... }` — never cast via `Number`.
* URLs: use `new URL(str)` in a try/catch and whitelist schemes.
* Case normalization: lowercase hex; preserve case for other identifiers.

## 4) Numbers, BigInt and decimals

* Prefer `bigint` for integers. Use a decimal library (Decimal.js) for decimal/math money values.
* Converters should round‑trip where feasible.

## 5) Buffers & strings

* Accept `string | Buffer` where reasonable and normalize early.
* When returning hex, include `0x` prefix. When accepting hex, accept both and normalize to canonical form.
* Trim trailing `\0` bytes when decoding fixed‑size byte strings.

## 6) Error handling

* Throw `Error` with concise messages that name the invalid argument and expected form.
* I/O helpers should propagate errors and avoid logging themselves; callers decide handling.
* Pure utilities must not log. I/O utilities may log via the project `Monitor` but never via `console.*`.

## 7) Security

* Never log secrets, tokens or PII.
* For crypto helpers: generate fresh IVs/nonces and prefer authenticated encryption (AEAD) when possible.
* Wrap low‑level exceptions with stable, actionable messages and keep the original as `cause` where supported.

## 8) I/O helpers

* Accept configuration via parameters or typed config singletons; do not read `process.env` directly.
* Stream large files; avoid buffering large payloads.
* Expose promise‑based APIs.

## 9) Examples

Validation + formatting module

```ts
"use strict";
import { hexWithPrefix } from "../hex";

/** Returns true if `addr` is a 20-byte hex string */
export function isAddress(addr: string): boolean {
  return /^0x[0-9a-f]{40}$/i.test(addr);
}

/** Lowercases and ensures 0x prefix; throws on invalid input */
export function normalizeAddress(addr: string): string {
  const h = hexWithPrefix(addr);
  if (!isAddress(h)) throw new Error("Invalid address: expected 0x-prefixed 20-byte hex");
  return h.toLowerCase();
}

/** Constant-time compare isn't needed for public values; use strict equality */
export function equalAddress(a: string, b: string): boolean {
  return normalizeAddress(a) === normalizeAddress(b);
}
```

BigInt helpers

```ts
"use strict";
export function isBigIntString(s: string): boolean { try { BigInt(s); return true; } catch { return false; } }
export function parseBigInt(s: string, fallback = 0n): bigint { try { return BigInt(s); } catch { return fallback; } }
export function uintToId(n: bigint, hexLen: number): string { let h = n.toString(16); while (h.length < hexLen) h = "0" + h; return h; }
```

AES helper (Node `crypto`)

```ts
"use strict";
import Crypto from "crypto";

export function aes256ctrEncrypt(data: string|Buffer, password: string): string {
  const iv = Crypto.randomBytes(16);
  const key = Crypto.createHash("sha256").update(password).digest();
  const cipher = Crypto.createCipheriv("aes-256-ctr", key, iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("base64");
}

export function aes256ctrDecrypt(serialized: string, password: string): Buffer {
  const i = serialized.indexOf(":"); if (i <= 0) throw new Error("Invalid payload");
  const iv = Buffer.from(serialized.slice(0, i), "hex");
  const body = Buffer.from(serialized.slice(i+1), "base64");
  const key = Crypto.createHash("sha256").update(password).digest();
  const decipher = Crypto.createDecipheriv("aes-256-ctr", key, iv);
  return Buffer.concat([decipher.update(body), decipher.final()]);
}
```

S3 helper (promise‑based)

```ts
"use strict";
import AWS from "aws-sdk";

export async function putTextS3(s3: AWS.S3, bucket: string, key: string, body: string, contentType = "text/plain", cacheControl = "max-age=31536000"): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    s3.upload({ Bucket: bucket, Key: key, Body: body, ContentType: contentType, CacheControl: cacheControl }, err => err ? reject(err) : resolve());
  });
}
```

## 10) Naming & files

* Files: kebab-case (e.g., `text-utils.ts`, `aws-utils.ts`).
* Functions: verbNoun or nounVerb (e.g., `normalizeAddress`, `quantityToDecimalString`).
* Constants: UPPER_SNAKE with units where relevant.

## 11) Testing & determinism

* Inject sources of randomness/time (e.g., `now()` or RNG) to make tests deterministic.
* Keep formatters pure and locale‑independent unless parameterized.

## 12) Documentation

* Every exported function must have a JSDoc block with `@param` and `@returns`.
* Update this file when adding new utilities.

## 13) PR checklist

- [ ] No side effects on import
- [ ] Named exports and explicit types
- [ ] JSDoc for every exported function
- [ ] No dependency on services/models/controllers
- [ ] Error messages actionable and consistent

## 14) Copilot prompt (for this folder)

When editing utility modules:

* Keep functions small, pure, and stateless; no top‑level side effects.
* Use strict typing; validate inputs early; normalize outputs (hex prefix, case, units).
* For hex/bytes, reuse local helpers; for integers prefer `bigint`, and for decimals use a decimal library.
* Avoid `console.*`; expose promise‑based I/O and take config/clients as parameters.
* Apply the file structure and naming rules above and include examples when generating new modules.

---

Notes: This instruction file merges the project's existing `utils` best practices and the provided examples. Follow these rules to keep utilities testable, secure and reusable across services and controllers.