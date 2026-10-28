# Inkloom AI — Production Operations & Incident Response Runbook

This document defines standard operational procedures, recovery playbooks, security incident response runbooks, and quality control guidelines for **Inkloom AI** production deployments.

---

## 1. Architecture Overview & Core Dependencies

Inkloom AI operates as a multi-tenant brand governance platform:
- **Backend Service:** FastAPI REST API (Python 3.11/3.14) with multi-layered governance engine (deterministic rules, grounded semantic retrieval, legal statutory checks).
- **Database:** PostgreSQL 15 (relational multi-tenant isolation with foreign keys and cascade rules). SQLite supported for local development.
- **Frontend Service:** Next.js (Node.js 18/20) with standalone multi-stage container build and responsive role-based dashboards.
- **AI Integrations:** Bounded Gemini / external LLM provider adapter with automatic fallback to deterministic offline rule engine. Zero network egress required for baseline governance checks.
- **Observability:** Distributed correlation tracing via `X-Request-ID`, latency measurement via `X-Process-Time-Ms`, and separated container probes (`/health/live` and `/health/ready`).

---

## 2. Health Probes & Monitoring

### 2.1 Kubernetes & Container Health Endpoints

| Endpoint | Purpose | Checks Performed | HTTP Success | HTTP Failure |
| :--- | :--- | :--- | :--- | :--- |
| `GET /health/live` | Liveness Probe | Process responsiveness | `200 OK` | `500 Internal Error` |
| `GET /health/ready` | Readiness Probe | Database connectivity (`SELECT 1`) | `200 OK` | `503 Service Unavailable` |
| `GET /health` | Operational Status | DB connectivity, AI engine mode, media service | `200 OK` | `503 Service Unavailable` |

### 2.2 Request Tracing & Structured Logging
- Every HTTP response includes `X-Request-ID`. If not provided by the ingress proxy or client, a UUIDv4 is automatically generated.
- `X-Process-Time-Ms` reports backend execution latency in milliseconds.
- Access logs output sanitized connection lines omitting credentials, JWT tokens, and confidential copy payloads:
  ```
  INFO: POST /api/v1/legal/review - status=200 duration=4.12ms ip=10.0.0.1 req_id=9876-uuid
  ```

---

## 3. Database Backup & Restoration

### 3.1 Production PostgreSQL Backup
Execute scheduled daily backups using `pg_dump` with custom compressed archive format:
```bash
# Set timestamp and backup target
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/inkloom"
mkdir -p "${BACKUP_DIR}"

# Execute compressed database dump
docker exec -t inkloom_db pg_dump \
  -U ${POSTGRES_USER} \
  -F c \
  -b \
  -v \
  -f "/var/lib/postgresql/data/backup_${TIMESTAMP}.dump" \
  ${POSTGRES_DB}

# Move to secure, encrypted cold storage (e.g. S3 / GCS bucket with CMEK)
mv /var/lib/docker/volumes/inkloom_postgres_data/_data/backup_${TIMESTAMP}.dump "${BACKUP_DIR}/"
```

### 3.2 Database Restoration Procedure
To restore from a verified backup:
```bash
# 1. Scale down backend services to prevent concurrent writes
docker compose stop backend

# 2. Terminate existing database connections
docker exec -i inkloom_db psql -U ${POSTGRES_USER} -d postgres -c \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='${POSTGRES_DB}' AND pid <> pg_backend_pid();"

# 3. Drop and recreate clean database target
docker exec -i inkloom_db psql -U ${POSTGRES_USER} -d postgres -c "DROP DATABASE IF EXISTS ${POSTGRES_DB};"
docker exec -i inkloom_db psql -U ${POSTGRES_USER} -d postgres -c "CREATE DATABASE ${POSTGRES_DB} OWNER ${POSTGRES_USER};"

# 4. Restore dump archive
docker exec -i inkloom_db pg_restore \
  -U ${POSTGRES_USER} \
  -d ${POSTGRES_DB} \
  -v \
  "/var/lib/postgresql/data/backup_TARGET_TIMESTAMP.dump"

# 5. Restart backend and verify readiness
docker compose start backend
curl -f http://localhost:8000/health/ready
```

---

## 4. Rollback & Deployment Procedures

### 4.1 Zero-Downtime Deployment
1. Build and test release candidate in CI (`python -m pytest tests/`, `npm run build`).
2. Run database migrations:
   ```bash
   docker exec -t inkloom_backend python -m app.database.migrations
   ```
3. Update containers with rolling replacement (`docker compose up -d --no-deps --build backend`).
4. Validate `/health/ready` probe returns `200 OK` before routing ingress traffic.

### 4.2 Emergency Rollback Playbook
If a newly deployed release triggers unhandled exceptions, latency spikes, or failed approvals:
1. Revert container image tag to previous stable commit:
   ```bash
   git checkout <PREVIOUS_STABLE_COMMIT>
   docker compose up -d --build
   ```
2. Verify database backward compatibility. If database schema was altered incompatibly, restore the pre-migration snapshot taken immediately prior to deployment.
3. Check health and audit logs:
   ```bash
   curl http://localhost:8000/health
   docker logs --tail 100 inkloom_backend
   ```

---

## 5. Security Incident Response Runbooks

### 5.1 Compromised Credentials (JWT Secret or Database Password)
If `SECRET_KEY` or database credentials are leaked or committed accidentally:
1. **Immediate Invalidation:** Change `SECRET_KEY` in production environment variables immediately. Changing `SECRET_KEY` cryptographically invalidates all outstanding active user tokens, forcing re-authentication.
2. **Rotate Database Password:**
   ```sql
   ALTER USER inkloom_user WITH PASSWORD 'NEW_STRONG_GENERATED_PASSWORD';
   ```
3. Update `DATABASE_URL` in `.env` and restart containers:
   ```bash
   docker compose up -d --force-recreate backend
   ```
4. **Audit Session Logs:** Review access logs for unauthorized access originating from suspicious IP addresses during the exposure window using correlation IDs.

### 5.2 Cross-Tenant Data Exposure Containment
If a customer reports seeing content or reviews belonging to another organization:
1. **Quarantine Tenant Access:** Set `is_active=False` on the suspect tenant membership or rotate API access keys.
2. **Isolate Audit Logs:** Query `audit_events` table filtered by the affected `organization_id`:
   ```sql
   SELECT * FROM audit_events 
   WHERE organization_id = 'AFFECTED_ORG_ID' 
   ORDER BY timestamp DESC LIMIT 500;
   ```
3. **Inspect Application Code:** Verify tenant isolation middleware and verify that every database query enforces `organization_id == auth_context.organization_id`.
4. **Notify Affected Tenants:** Execute customer disclosure runbook in compliance with GDPR Art. 33/34 or contractual SLA commitments.

---

## 6. AI Provider Malfunction & Failover Runbook

### 6.1 Disabling a Malfunctioning AI Provider
If Google Gemini or external LLM API encounters rate limits, regional outages, or degraded latency:
1. Update environment configuration to enforce offline deterministic mode:
   ```bash
   # In .env or container environment
   AI_ENGINE_MODE=deterministic
   LLM_PROVIDER=offline_rule_engine
   ```
2. Restart backend:
   ```bash
   docker compose restart backend
   ```
3. **Verify Failover:**
   `AIAuditEngine` and `LegalCopilotService` will immediately utilize `OfflineRuleAdapter` and deterministic rule-matching engines. All brand checks, contrast audits, and statutory evaluations continue operating with 0% downtime and zero network egress.

### 6.2 Provider Cost & Token Usage Monitoring
- `LLMUsageTracker` monitors request count, estimated token consumption, average latency, and estimated cost.
- Configurable cost rates default to Flash-tier rates ($0.000125 / 1k input tokens, $0.000375 / 1k output tokens).
- Cost metrics can be retrieved programmatically via `global_usage_tracker.get_metrics()`.

---

## 7. Approval Workflow Integrity & Audit Trail Preservation

### 7.1 Segregation of Duties Enforcement
- **Prohibited Self-Approval:** A campaign or guideline creator can never approve their own submission (`creator_id != approver_id`).
- **Required Review Track Gating:** If a campaign requires Legal or Design sign-off, it cannot transition to `approved` until all assigned reviewers have submitted an explicit positive sign-off.
- **Unresolved Critical Findings Blocker:** A campaign containing unresolved critical findings is hard-blocked from approval.

### 7.2 Post-Approval Content Mutation Invalidation
- Campaign approvals are immutably tied to exact content revisions (`revision_id` and hash).
- If draft content is modified post-approval, the campaign approval is invalidated, requiring a fresh audit pass and re-review.
- Audit records in `audit_events` are append-only.
