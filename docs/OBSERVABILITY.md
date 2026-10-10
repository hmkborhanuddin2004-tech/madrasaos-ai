# MadrasaOS AI v3.0 — Observability & Telemetry Architecture

This document outlines the observability, structured logging, distributed tracing, and metric collection standards implemented in **MadrasaOS AI v3.0**.

---

## 1. Observability Pillars

```
                               ┌───────────────────────────────────────────────┐
                               │             MadrasaOS Observability           │
                               └───────┬──────────────┬──────────────┬─────────┘
                                       │              │              │
                    ┌──────────────────┘              │              └──────────────────┐
                    ▼                                 ▼                                 ▼
         [ Structured JSON Logs ]           [ Prometheus Metrics ]           [ OpenTelemetry Tracing ]
         - Level, Timestamp, ISO            - Latency histograms             - End-to-end request trace
         - `reqId`, `tenantId`, `userId`    - Error counters                 - DB & Cache span timings
         - RFC 7807 error attachments       - Hifz multi-teacher conflict    - Cross-service correlation
         - Sanitized PII & Passwords        - Active WebSocket connections   - Root span in `X-Request-Id`
```

---

## 2. Structured JSON Logging (Pino Standards)

All logging in MadrasaOS AI strictly emits single-line structured JSON to `stdout` in production, enabling ingestion by FluentBit, Vector, Loki, or Datadog.

### 2.1 Log Event Schema
Each log entry contains the following mandatory keys:
```json
{
  "level": "info",
  "time": "2026-09-23T20:15:30.124+06:00",
  "pid": 1042,
  "hostname": "madrasaos-prod-app-01",
  "reqId": "req_8f192b0c",
  "tenantId": "inst_darul_uloom",
  "userId": "usr_99812",
  "userRole": "hifz_teacher",
  "module": "hifz",
  "action": "RECORD_PROGRESS",
  "msg": "Recorded daily Sabak and Sabki for student std_004",
  "durationMs": 14.2,
  "http": {
    "method": "POST",
    "url": "/api/v1/hifz/progress",
    "status": 200,
    "ip": "103.114.98.22"
  }
}
```

### 2.2 Error Logging & RFC 7807 Context
When an error or conflict occurs, the logger records the `code`, `problemDetails`, and redacted parameters:
```json
{
  "level": "warn",
  "time": "2026-09-23T20:16:01.402+06:00",
  "reqId": "req_c137890b",
  "tenantId": "inst_darul_uloom",
  "userId": "usr_tariq",
  "code": "HIFZ_TEACHER_CONFLICT",
  "msg": "Multi-teacher conflict detected on student std_004 for date 2026-10-22",
  "conflict": {
    "existingTeacherId": "usr_zubair",
    "conflictRecordId": "cnfl_6ea77cb8"
  },
  "http": {
    "method": "POST",
    "url": "/api/v1/hifz/progress",
    "status": 409
  }
}
```

### 2.3 PII & Security Redaction
The logger automatically redacts sensitive keys matching:
`password`, `token`, `secret`, `nid`, `credit_card`, `pin`, `otp`, `bKash_pin`, `nagad_pin`.

---

## 3. Correlation & Request Tracking (`X-Request-Id`)

Every inbound HTTP request receives or inherits an `X-Request-Id`:
1. If the client or upstream proxy supplies `X-Request-Id`, it is validated and preserved.
2. If omitted, the server generates a unique UUID prefixed with `req_` (e.g. `req_432d8e52`).
3. The `X-Request-Id` is injected into:
   - Response headers: `X-Request-Id: req_432d8e52`
   - Express AsyncLocalStorage context
   - Pino logger child context
   - Database `audit_logs` entries
   - RFC 7807 error problem detail responses (`instance: "urn:request:req_432d8e52"`)

---

## 4. Prometheus Metrics Specification (`/api/v1/metrics`)

MadrasaOS exposes Prometheus-compatible metrics on `/api/v1/metrics` (protected by bearer token or internal VPC scraping):

### 4.1 Core HTTP Metrics
- `madrasaos_http_requests_total{method, path, status, tenant_id}`: Total HTTP request counter.
- `madrasaos_http_request_duration_seconds{method, path, status}`: Request latency histogram (buckets: `0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10`).

### 4.2 Madrasa Business & Operational Metrics
- `madrasaos_hifz_entries_total{tenant_id, status}`: Total daily Hifz progress records committed.
- `madrasaos_hifz_conflicts_total{tenant_id}`: Multi-teacher collision events triggering HTTP 409.
- `madrasaos_routine_conflicts_detected_total{tenant_id, conflict_vector}`: Timetable conflicts caught (`teacher`, `room`, `class`, `bounds`).
- `madrasaos_break_glass_events_total{tenant_id}`: High-severity Super Admin emergency access operations.
- `madrasaos_exam_status_gauge{exam_id, tenant_id, status}`: Current lifecycle state of examinations.
- `madrasaos_unpublish_blocks_total{tenant_id}`: Blocked unpublish operations due to pending re-evaluations.

---

## 5. Distributed Tracing with OpenTelemetry

OpenTelemetry SDK is initialized in `server/src/tracing.ts` prior to Express startup:

```typescript
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

const sdk = new NodeSDK({
  serviceName: 'madrasaos-ai',
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://collector:4318/v1/traces',
  }),
  instrumentations: [getNodeAutoInstrumentations({
    '@opentelemetry/instrumentation-fs': { enabled: false }, // Reduce noise
  })],
});

sdk.start();
```

Traced database operations:
- PostgreSQL query spans (`pg.query`) with tenant identifier tagging.
- Redis cache hits/misses (`redis.get`, `redis.set`).
- Background cron worker execution spans (`automation.dispatch`).

---

## 6. Health & Readiness Probes

| Endpoint | Target Check | Success HTTP Status | Failure Recovery Action |
| :--- | :--- | :---: | :--- |
| `GET /api/v1/health` | Lightweight HTTP responsiveness | `200 { status: "ok" }` | Restart container if unresponsive for 3 consecutive probes. |
| `GET /api/v1/ready` | PostgreSQL pool connectivity + Redis ping | `200 { ready: true }` | Remove container from load-balancer pool until dependencies recover. |
| `GET /api/v1/live` | Process event loop lag (< 500ms) | `200 { live: true }` | Container termination if event loop is deadlocked. |
