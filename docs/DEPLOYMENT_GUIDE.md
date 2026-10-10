# MadrasaOS AI v3.0 — Deployment & Operations Guide

This guide details the production deployment, container orchestration, environment variable configuration, backup lifecycle, and disaster recovery procedures for **MadrasaOS AI v3.0**.

---

## 1. System Architecture Overview

```
                      [ Internet / Cloudflare CDN ]
                                   │
                      [ Reverse Proxy / Nginx / Caddy ]
                                   │ (Port 443 -> 5000)
                                   ▼
             ┌──────────────────────────────────────────────┐
             │       MadrasaOS AI Node.js / Express         │
             │       Container (Port 5000)                  │
             │                                              │
             │   ┌──────────────────────────────────────┐   │
             │   │ Static Frontend Assets (Vite Dist)   │   │
             │   │ REST API & WebSockets (/api/v1)      │   │
             │   │ Automation Engine & Cron Workers     │   │
             │   └──────────────────────────────────────┘   │
             └──────────────┬──────────────────┬────────────┘
                            │                  │
                            ▼                  ▼
             ┌──────────────────────┐   ┌───────────────────┐
             │   PostgreSQL 16+     │   │   Redis 7+        │
             │   Relational & JSONB │   │   Cache, Sessions,│
             │   Multi-tenant Data  │   │   Rate Limiting   │
             └──────────────────────┘   └───────────────────┘
```

---

## 2. Docker & Container Deployment

### 2.1 Multi-Stage Dockerfile
The repository contains a production-grade multi-stage Dockerfile that builds frontend assets in Stage 1, compiles TypeScript server sources in Stage 2, and runs as an unprivileged system user (`madrasaos`) on Alpine Linux in Stage 3.

```bash
# Build the production container image
docker build -t madrasaos/ai-platform:3.0.0 .
```

### 2.2 Orchestration via Docker Compose
To launch the full production stack including PostgreSQL and Redis:

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Start services in background
docker compose up -d

# 3. View service logs
docker compose logs -f app

# 4. Check container health status
docker compose ps
```

---

## 3. Environment Variables Specification

| Variable Name | Required | Default / Recommended | Purpose & Security Context |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | **Yes** | `production` | Enables production optimizations and disables stack-trace leaks. |
| `PORT` | No | `5000` | Port on which the HTTP server listens. |
| `DATABASE_URL` | **Yes** | `postgresql://user:pass@host:5432/db` | Connection string for PostgreSQL 14+ database cluster. |
| `REDIS_URL` | **Yes** | `redis://:pass@host:6379` | Redis instance for session state, token blacklisting, and rate limiting. |
| `JWT_SECRET` | **Yes** | `[min 64 hex characters]` | Symmetric secret for signing access & refresh tokens. Rotate bi-annually. |
| `JWT_REFRESH_SECRET`| **Yes** | `[min 64 hex characters]` | Dedicated secret for long-lived refresh tokens. |
| `ENCRYPTION_KEY` | **Yes** | `[32-byte hex]` | AES-256-GCM key for encrypting stored guardian NID and biometric files. |
| `SUPER_ADMIN_KEY` | No | `[high-entropy string]` | Key for system initialization and break-glass bootstrap. |
| `LOG_LEVEL` | No | `info` | Logging verbosity (`fatal`, `error`, `warn`, `info`, `debug`, `trace`). |
| `STORAGE_PROVIDER` | No | `local` / `s3` | File storage provider for student records, voice memos, and photos. |
| `AWS_S3_BUCKET` | Cond. | `madrasaos-records-bd` | S3 / MinIO bucket if `STORAGE_PROVIDER=s3`. |
| `AWS_S3_REGION` | Cond. | `ap-southeast-1` | S3 region (Singapore recommended for Bangladesh low latency). |
| `CORS_ORIGIN` | No | `https://app.madrasaos.ai` | Allowed CORS origins (comma-separated). |

---

## 4. Continuous Integration & Deployment (CI/CD)

The GitHub Actions workflow (`.github/workflows/deploy.yml`) enforces strict code quality gates:

```yaml
name: MadrasaOS Production Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test_and_audit:
    name: Verify Tests & Security Audits
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Build Verification (Client & Server)
        run: |
          npm run build:server
          npm run build:client

      - name: Run Test Suite (15 Suites / 230 Tests)
        run: npm test

      - name: Vulnerability Audit
        run: npm audit --audit-level=high

  docker_publish:
    name: Build & Push Docker Image
    needs: test_and_audit
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}
      - uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: madrasaos/ai-platform:3.0.0,madrasaos/ai-platform:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

---

## 5. Backup & Recovery Strategy

To ensure institutional continuity for Bangladeshi madrasas, the backup architecture is engineered for:
- **Recovery Point Objective (RPO)**: **≤ 1 Hour**
- **Recovery Time Objective (RTO)**: **≤ 4 Hours**

### 5.1 Backup Cadence
1. **Daily Full Backup (02:00 BST)**:
   - Complete `pg_dump` snapshot of the PostgreSQL database cluster with compression.
   - Encrypted with AES-256 and replicated to off-site object storage (Wasabi / AWS S3 Singapore).
2. **Continuous WAL Archiving (Hourly Increments)**:
   - PostgreSQL Write-Ahead Logs (`pg_wal`) are continuously archived to persistent block storage and synced hourly to cold storage.
3. **Uploads & Artifacts Snapshot (Daily 03:00 BST)**:
   - Incremental rsync / S3 bucket versioning for student photos, scanned birth certificates, voice notes, and Madrasa seal images.

### 5.2 Automated Backup Script (`scripts/backup_production.sh`)
```bash
#!/usr/bin/env bash
set -euo pipefail

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/var/backups/madrasaos"
DB_NAME="madrasaos_prod"
DB_USER="madrasa_admin"

mkdir -p "${BACKUP_DIR}"

echo "[${TIMESTAMP}] Starting daily full database dump..."
pg_dump -U "${DB_USER}" -F c -b -v -f "${BACKUP_DIR}/madrasaos_full_${TIMESTAMP}.dump" "${DB_NAME}"

echo "[${TIMESTAMP}] Encrypting backup file..."
gpg --batch --yes --passphrase-file /etc/madrasaos/backup.key -c "${BACKUP_DIR}/madrasaos_full_${TIMESTAMP}.dump"
rm "${BACKUP_DIR}/madrasaos_full_${TIMESTAMP}.dump"

echo "[${TIMESTAMP}] Syncing to remote off-site repository..."
aws s3 cp "${BACKUP_DIR}/madrasaos_full_${TIMESTAMP}.dump.gpg" "s3://madrasaos-backups-sg/daily/"

# Keep local retention to 7 days
find "${BACKUP_DIR}" -type f -mtime +7 -delete
echo "[${TIMESTAMP}] Backup completed successfully."
```

---

## 6. Disaster Recovery (DR) Runbook

### 6.1 Catastrophic Failure Scenarios
- **Scenario A: Primary Database Corruption or Storage Failure**
- **Scenario B: Host System Compromise or Datacenter Outage**

### 6.2 Restoration Procedure (Target: RTO ≤ 4h)

#### Step 1: Provision Clean Standby Infrastructure
1. Boot a fresh Ubuntu 24.04 LTS instance with minimum 4 vCPU, 16GB RAM, 100GB NVMe.
2. Install Docker, Docker Compose, and PostgreSQL client utilities.
3. Clone deployment configurations and restore `/etc/madrasaos/` keys.

#### Step 2: Fetch and Decrypt the Latest Backup
```bash
# Download latest daily dump and hourly WAL increments
aws s3 cp s3://madrasaos-backups-sg/daily/latest.dump.gpg ./latest.dump.gpg
gpg --batch --yes --passphrase-file /etc/madrasaos/backup.key -d ./latest.dump.gpg > ./latest.dump
```

#### Step 3: Restore Database Schema & Data
```bash
# Create target database and restore
createdb -U madrasa_admin -h localhost madrasaos_prod
pg_restore -U madrasa_admin -h localhost -d madrasaos_prod -v ./latest.dump
```

#### Step 4: Apply Point-in-Time Recovery (PITR) with WAL Logs
If WAL logs exist up to 45 minutes prior to failure:
```bash
# Configure recovery.signal and restore_command in postgresql.conf
restore_command = 'aws s3 cp s3://madrasaos-backups-sg/wal/%f %p'
recovery_target_time = '2026-09-23 18:30:00+06'
```

#### Step 5: Data Integrity & Verification Smoke Test
Before opening DNS traffic to madrasas:
```bash
# 1. Verify tenant count and latest student count
psql -U madrasa_admin -d madrasaos_prod -c "SELECT COUNT(*) FROM institutions; SELECT COUNT(*) FROM students;"

# 2. Run automated sanity check
npm run test:sanity

# 3. Verify break-glass logs and audit integrity
psql -U madrasa_admin -d madrasaos_prod -c "SELECT id, action, timestamp FROM audit_logs ORDER BY timestamp DESC LIMIT 5;"
```

#### Step 6: Traffic Cutover
1. Update DNS record (`A` record or Cloudflare origin) to the new server IP.
2. Check `/api/v1/health` endpoint returning `HTTP 200 { status: "ok" }`.
3. Notify Madrasa principals via SMS gateway of recovery completion.
