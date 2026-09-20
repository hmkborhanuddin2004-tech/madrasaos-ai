# MadrasaOS AI - Security, Governance & Audit Model

## 1. Zero Trust Architecture
1. **Never Trust Client Claims**:
   - Organization ID, branch ID, and role memberships are extracted solely from verified JWT server-side sessions, never from request query parameters or client body attributes.
2. **Strict Tenant & Branch Isolation**:
   - Multi-tenant boundary checks are executed at the data access gateway. A database query attempting to read or update records where `tenant_id != req.user.tenantId` automatically triggers a security exception and terminates the request.
3. **Password & Credential Security**:
   - Passwords hashed using salted bcrypt (cost factor 12) or Argon2id.
   - Automation third-party API credentials (bKash app keys, SMS gateway tokens) encrypted at rest using AES-256-GCM with environment-managed master keys.
4. **Rate Limiting & Anti-Brute Force**:
   - Authentication endpoints limited to 5 attempts per IP per minute.
   - General API rate limit set at 120 requests per minute per IP.
5. **Sanitization & Input Validation**:
   - All inbound payloads validated against strict TypeScript/Zod schemas to prevent parameter tampering and injection.

---

## 2. Immutable Financial & Academic Ledger
1. **Financial Immutability**:
   - When a fee payment is recorded or an invoice is generated, the record is immutable.
   - Any financial adjustments, discounts, or reversals require an explicit `adjustment_entry` with a mandatory reason, recorded by an authorized user.
2. **Academic Mark Tamper Resistance**:
   - Once examination marks are published by the Principal/Madrasa Admin, marks cannot be silently modified.
   - Post-publication corrections require an administrative override request and log an entry in `audit_logs`.

---

## 3. Comprehensive Audit Trail
Every critical mutation logs:
- `user_id` & `role`
- `action` (`CREATE`, `UPDATE`, `DELETE`, `PUBLISH_MARKS`, `COLLECT_FEE`, `APPROVE_WORKFLOW`)
- `entity_name` and `entity_id`
- `old_values_json` and `new_values_json`
- `ip_address` & `user_agent`
- `timestamp` (UTC ISO 8601)

Audit logs are append-only. Standard administrative users have no ability to edit or purge audit logs.
