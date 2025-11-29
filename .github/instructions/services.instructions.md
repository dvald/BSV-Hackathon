---
applyTo: "src/services/**/*.ts,services/**/*.ts,**/*-service.ts,**/*-service-*.ts"
---

# Copilot Instructions — Services (domain & background layer)

Purpose: enforce a consistent, framework‑agnostic service layer used by controllers, scheduled tasks, and workers.

Quick checklist

- [ ] Singleton pattern implemented (`getInstance()` + private static `instance`).
- [ ] No I/O or side effects at import time; background work started in `start()` guarded by config flags.
- [ ] Public async methods for I/O, returning `Promise<>`.
- [ ] Uses models' finders and model instance methods for persistence; no raw SQL or DB drivers.
- [ ] Errors include stable `code` values and are rethrown for controllers to map.
- [ ] Logging via `Monitor.*`; no `console.*` in production paths.

## 1. Core architecture — Singleton pattern

- Mandatory Singleton Pattern: every service must expose `public static getInstance()` and a private static `instance` property to ensure a single instance.
- Stateless logic: services should not store session-specific state as instance fields. Pass state through method arguments. Small caches are allowed but document and clean them up.

## 2. Responsibilities

- Business orchestration: services contain domain workflows and integrations; controllers handle HTTP.
- Data access: services are the only layer that interacts with models. Use model `finder` utilities and model instance methods (`insert()`, `save()`, `delete()`).
- Service composition: services may call other services via their `getInstance()`.

## 3. Code style and conventions

- Class-based: service classes must be PascalCase and end with `Service` (e.g., `UserService`).
- Async I/O: all public methods that perform I/O must be `async` and return a `Promise`.
- Error handling: throw errors (attach a stable `code` property); only catch when adding context and rethrow.
- Dependency imports: import models, configs and other services directly; read config via typed config singletons, not `process.env`.

## 4. Anti‑patterns (avoid)

- NO HTTP awareness: do not import `express` or handle `Request`/`Response`.
- NO raw DB queries or driver usage: always use `tsbean-orm` models and their finder APIs.
- NO generic `any` on public surfaces.

## 5. Canonical skeleton

```ts
// foo-service.ts
"use strict";
import { Monitor } from "../monitor";
import { Config } from "../config/config";

export class FooService {
  public static instance: FooService = null;
  public static getInstance(): FooService {
    if (FooService.instance) return FooService.instance;
    FooService.instance = new FooService();
    return FooService.instance;
  }

  constructor() { /* no I/O here */ }

  /** Starts background work (idempotent) */
  public start() {
    // guard with Config.getInstance().isTaskRunner
  }

  public async doWork(input: any): Promise<any> {
    try {
      // validate → use models/services → return DTOs
    } catch (err) {
      Monitor.exception(err, "FooService.doWork failed");
      throw err;
    }
  }
}
```

## 6. Background jobs

- Use cooperative schedulers (e.g., `AsyncInterval`) rather than raw `setInterval` when possible.
- Keep a per‑job descriptor `{ id, period, interval, runOnStartup }` and provide an idempotent `start()` that attaches handlers.
- Guard job startup with a runner flag from config (e.g., `isTaskRunner`).

## 7. Pub/Sub & cache invalidation

- Encapsulate subscription setup in `start()` and keep handlers small and defensive.
- Use named channels and simple, serializable messages. Validate message shape before processing.

## 8. Data access and idempotency

- Always use model `finder` APIs and model instance methods for persistence.
- Implement idempotency guards when processing events (dedupe by `eventId`, last processed marker, etc.).
- Prefer `bigint` or string-encoded bigints for large numeric domains to avoid precision loss.

## 9. Errors & contracts

- Throw typed errors or attach a stable `code` property (e.g., `Object.assign(err, { code: 'NOT_FOUND' })`).
- Wrap third‑party errors; provide concise, actionable messages and keep the original as `cause` where useful.

## 10. Logging

- Use `Monitor.info` for lifecycle events, `Monitor.debug` for traces, `Monitor.warning` for recoverable anomalies, and `Monitor.exception` for caught exceptions.
- Avoid logging secrets or PII; prefer IDs, counts and sanitized metadata.

## 11. Concurrency & resource management

- Long‑lived resources must expose explicit `stop()`/`dispose()` methods and be released in service `stop()`.
- Track per‑user/session resources in maps and ensure cleanup on completion or error.

## 12. Validation & defensive coding

- Validate and normalize external inputs at service boundaries. Fail fast with helpful messages.
- Document normalization rules for URLs, numbers, enums, and defaults.

## 13. Examples

Periodic task service (pattern):

```ts
import { AsyncInterval } from "@asanrom/async-tools";
import { Monitor } from "../monitor";
import { Config } from "../config/config";

interface Task { id: string; period: number; interval: AsyncInterval; runOnStartup?: boolean }

export class TaskService {
  public static instance: TaskService = null;
  public static getInstance(): TaskService { return this.instance ?? (this.instance = new TaskService()); }

  private tasks: Task[] = [];

  private createTask(id: string, period: number, handler: () => Promise<any>, runOnStartup = false) {
    const interval = new AsyncInterval(handler, period);
    interval.on("error", err => Monitor.exception(err));
    this.tasks.push({ id, period, interval, runOnStartup });
  }

  public start() {
    if (!Config.getInstance().isTaskRunner) return;
    Monitor.status("Task service starting...");
    for (const t of this.tasks) t.interval.start(t.runOnStartup);
  }
}
```

Simple pub/sub consumer example:

```ts
export class CacheInvalidationService {
  public static instance: CacheInvalidationService = null;
  public static getInstance(): CacheInvalidationService { return this.instance ?? (this.instance = new CacheInvalidationService()); }

  private started = false;
  public start() {
    if (this.started) return; this.started = true;
    RedisService.getInstance().subscribe("events", msg => this.onMessage(msg));
  }

  private onMessage(raw: string) {
    const [type, ...rest] = (raw || "").split(":");
    const arg = rest.join(":");
    if (type === "invalidate-cached-name") {
      // drop from local caches
    } else {
      Monitor.debug(`Ignored message: ${raw}`);
    }
  }
}
```

## 14. PR checklist

- [ ] Singleton pattern with `getInstance()` and no top‑level I/O
- [ ] Background jobs behind `start()` and guarded by runner flags
- [ ] Logging via `Monitor.*`; no `console.*` in code paths
- [ ] Data access via model finders and instance methods; no raw SQL/driver code
- [ ] Errors expose stable `code` values for controller mapping
- [ ] External inputs validated; no secrets/PII in logs
- [ ] Long‑lived resources have cleanup paths

## 15. Copilot prompt (for this folder)

When editing files under `src/services/`:

* Keep services framework‑agnostic; expose a singleton with `getInstance()` and optionally `start()` for background work.
* Never run I/O at import time; register timers/subscriptions in `start()` and guard with config runner flags.
* Orchestrate via models and other services; avoid persistence/HTTP details here.
* Log with `Monitor` (info/debug/warning/exception) and rethrow errors with a stable `code` for controllers to map.
* Prefer cooperative schedulers (`AsyncInterval`) over raw intervals; clean up resources explicitly.
* Validate inputs at the boundary; normalize types; enforce idempotency for event processing.
