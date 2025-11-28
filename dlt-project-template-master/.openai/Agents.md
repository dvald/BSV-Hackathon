# Agents.md — Repository Guide for OpenAI Codex / Agents (Revised)

> Single source of truth for how an AI coding agent should understand, navigate, and modify this repository. Keep it in sync with the codebase.

---

## 1) Mission & Scope

**Goal:** Enable the agent to implement features, fix bugs, and maintain quality across backend, frontend, and smart contracts following the project’s conventions.

**Non‑Goals:** Experimental code without tests, changing public APIs without docs, bypassing CI, or committing secrets.

**Authoritative sources (read first):**

* `copilot-instructions.md` (global rules)
* `controllers.instructions.md` (REST + JSDoc/Swagger + bindings)
* `models.instructions.md` (tsbean‑orm patterns)
* `services.instructions.md` (service layer)
* `utils.instructions.md` (utilities)
* `config.instructions.md` (config singleton + env parsing)
* `CONFIG.md` (env reference, server/DB/Redis/Mail/Blockchain)
* `DEV_GUIDE.md` (index to deeper docs)
* Smart contracts: `CONTRACTS_DOC.md`, `smart-contracts/README.md`
* Web app: `web-application/README.md`, backend `web-application/backend/README.md`, frontend `web-application/frontend/README.md`

**Style baseline:** TypeScript (backend/frontend); Solidity (contracts); Vue 3 + Vite (frontend); Express (backend).

---

## 2) Repository Map (high level)

```
.
├─ web-application/
│  ├─ backend/        # Express + TS (API + Swagger)
│  │  ├─ src/{controllers,models,services,utils,config,...}
│  │  └─ test/mocha   # API + unit tests
│  └─ frontend/       # Vue 3 + Vite + TS
├─ smart-contracts/   # Solidity + build/deploy/tests + wrappers
└─ deployment-scripts/# CI/CD + ops (if present)
```

**Boundaries:** Clients talk to backend via REST only. No direct DB access from clients. Contract interaction is through generated wrappers.

---

## 3) Canonical Commands

### Backend (web-application/backend)

* Install: `npm install`
* Build: `npm run build`
* Dev: `npm run dev`
* Start: `npm start`
* Test: `npm test`
* Update translations: `npm run update-translations`
* Swagger: served at `/api-docs` when enabled
* Generate API bindings (backend → clients/tests): `npm run update-api-bindings` (from project scripts)

### Frontend (web-application/frontend)

* Install: `npm install`
* Dev: `npm run serve`
* Lint/format: `npm run prettier`
* Test: `npm test`
* Build: `npm run build`

**Frontend env:** Use `.env` with `VITE__*` variables (e.g., `VITE__API_SERVER_HOST`, `VITE__RECAPTCHA_SITE_KEY`).

### Smart contracts (smart-contracts)

* Install: `npm install`
* Build: `npm run build`
* Deploy: `npm run deploy`
* Upgrade: `npm run deploy:upgrade`
* Test: `npm test`

**Wrappers:** Generated in `src/contract-wrappers/`; copy to backend when required.

### Docker (web-application)

* Build image: `docker build --tag web-application-name .`
* Compose up: `docker compose up --build`

---

## 4) Editing Rules (hard constraints)

### Logging & errors

* **Backend:** No `console.*`. Use `Monitor` abstraction. Error responses through helpers with stable `code` values.

### Controllers (REST)

* Thin: routing + validation + call services.
* Mandatory JSDoc per handler: `Binding:`, `@route`, `@group`, `@param` (`.path|.query|.body|.formData|.header`), `@returns` referencing `@typedef ... .model` types.
* Never access DB directly; call services.
* After JSDoc changes run **`npm run update-api-bindings`**.

### Services

* Singleton `getInstance()`; no I/O at import time.
* Orchestrate domain logic; use models’ finders and instance methods only.
* Throw errors with stable `code`; log via `Monitor`.

### Models (tsbean‑orm)

* One `DataModel` per file; call `this.init()` in constructor.
* Assign fields with `enforceType(...)`; add indexes/annotations explicitly.
* Provide a static `finder` factory.

### Utilities

* Stateless/pure; named exports; no side effects on import.

### Config

* Singleton. Parse only from `process.env`, validate, freeze. No dynamic reads spread across code.

### Generated/external code

* Do **not** edit generated API bindings or contract wrappers. Update sources + regenerate.

### Security & privacy

* No secrets in code or logs; avoid PII. Prefer IDs/metadata.

---

## 5) Configuration Surfaces (reference)

See `CONFIG.md` for exhaustive list. Key groups:

* **General/Server:** ports, HTTPS, proxy, upload size, ACME challenge.
* **Logs:** toggles for request/info/debug/trace; optional ElasticSearch sink.
* **DB:** `DB_TYPE` ∈ {Mongo, MySQL, Postgres} and per‑driver settings.
* **Users/Auth:** initial admin, optional Google login.
* **Mail:** SMTP settings; disabled → logs emails as debug.
* **Captcha:** optional reCAPTCHA v3.
* **Redis:** optional cache and RT messaging.
* **FFmpeg:** paths for `ffmpeg/ffprobe`.
* **Blockchain:** node RPC URL/protocol, admin PK, contract addresses, event sync settings.
* **Tests:** separate DB URL for API tests.

---

## 6) Smart Contracts (build/deploy/use)

* Contracts are in `smart-contracts/contracts` (Solidity).
* Build artifacts/wrappers generated by `npm run build`.
* Deployment flows support upgradeable proxies (ERC1967) and custom deploy/initialize/upgrade hooks (see `src/contracts.ts`).
* Use `CONTRACTS_DOC.md` for ABI‑level docs; prefer wrappers for app code.
* Required env for deployment: node RPC URLs/keys as per `smart-contracts/README.md`.

---

## 7) Testing Strategy

* **Backend:** Mocha + Chai under `test/mocha/` (API + unit). Name tests `tests-api-*.ts` / `test-*.ts` per conventions.
* **Frontend:** `npm test`; keep component tests focused and deterministic.
* **Contracts:** tests in `smart-contracts/tests/`; use provided helpers (`runTest`, `assertEvent`, …). Ensure local/test network is running.

---

## 8) API Documentation Contract

* `@typedef` blocks define request/response/error models.
* Endpoint block includes: summary, `Binding`, `@route`, `@group`, parameters, `@returns`, optional `@security`.
* Body parameters reference typedefs via `.model` (e.g., `{LoginRequest.model} request.body.required`).
* Error model exposes string `code` with enumerated values in description.

---

## 9) CI/CD & Branching

* `main`: production‑ready.
* `develop`: integration for next release.
* CI runs build + lint + tests on PRs and pushes.
* Keep PRs small and focused; do not bypass checks.

---

## 10) Conventional Commits

`<type>(<scope>): <description>` where type ∈ {feat, fix, docs, style, refactor, test, chore}.

Examples:

* `feat(auth): add username change endpoint`
* `fix(api): return USERNAME_IN_USE error code`

---

## 11) Safety Rails for the Agent

* Work **inside** the repo; never touch OS‑global locations.
* No destructive actions (DB drops, data resets) unless explicitly required.
* Don’t modify licensing/legal docs.
* **Flag** changes that affect public API, data migrations, auth, or security posture.

---

## 12) Minimal Change Workflow (how the agent should work)

1. Read this file + `*.instructions.md` + relevant READMEs/CONFIG.
2. Identify entry point(s) (controller/service/model or frontend component/composable).
3. Propose a minimal plan: files to touch, API impact, tests.
4. Implement:

   * Controllers → typedefs first → handler JSDoc → route wiring → call service.
   * Services → validate → use models→ DTOs → throw typed errors.
   * Models → fields/indexes/`init()` → serialization helpers.
   * Frontend → use generated API bindings + `request-browser` wrapper.
   * Contracts → adjust `src/contracts.ts` entries → (re)generate wrappers.
5. Regenerate & build (`update-api-bindings`, wrappers, app build).
6. Run tests; self‑review with checklist; open PR.

---

## 13) Example Flow: Add an endpoint

1. Add/extend `@typedef` models near the controller.
2. Implement handler with full JSDoc (`Binding`, `@route`, params, `@returns`).
3. Service logic, input validation, typed errors, DTO out.
4. Update tests; `npm run update-api-bindings`; lint/tests; open PR.

---

## 14) Maintenance

* Keep this file synchronized with `*.instructions.md`, READMEs, and `CONFIG.md`.
* When architecture changes (new service, driver, CI step), update **Commands**, **Rules**, and **Checklist**.
* Treat this file as an interface contract for AI tools and new contributors.
