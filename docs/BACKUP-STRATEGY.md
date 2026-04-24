# Backup and Disaster Recovery Strategy — Social Bounty

**Version:** 1.0
**Owner:** DevOps / Infrastructure Lead
**Last Updated:** 2026-03-27
**Review Cycle:** Quarterly

---

## Table of Contents

1. [Overview and Objectives](#1-overview-and-objectives)
2. [Recovery Targets](#2-recovery-targets)
3. [PostgreSQL Backup Strategy](#3-postgresql-backup-strategy)
4. [Redis Backup Strategy](#4-redis-backup-strategy)
5. [File Upload Backup Strategy](#5-file-upload-backup-strategy)
6. [Recovery Procedures](#6-recovery-procedures)
7. [Backup Monitoring and Alerting](#7-backup-monitoring-and-alerting)
8. [Testing Schedule](#8-testing-schedule)
9. [Retention Policy Summary](#9-retention-policy-summary)
10. [Runbook Quick Reference](#10-runbook-quick-reference)

---

## 1. Overview and Objectives

This document defines the backup strategy and disaster recovery plan for Social Bounty's production and staging data stores. All procedures apply to production unless explicitly noted otherwise.

### Guiding Principles

- **Every backup is worthless until it has been restored successfully.** Monthly restore tests are mandatory.
- **Backups must be geographically separated** from the primary data store.
- **Encryption in transit and at rest** is required for all backups.
- **Access to backup infrastructure is restricted** to a minimum set of authorized personnel.

### In Scope

| System | Technology | Backup Required |
|---|---|---|
| Application database | PostgreSQL (via Prisma) | Yes |
| Cache / session store | Redis | Yes |
| User file uploads | Local disk (pre-migration) / Object storage (post-migration) | Yes |
| Application configuration | Environment variables / secrets manager | Yes |
| Source code | Git (GitHub) | Mirrored by GitHub; no additional backup required |

---

## 2. Recovery Targets

| System | RTO (Recovery Time Objective) | RPO (Recovery Point Objective) |
|---|---|---|
| PostgreSQL (full restore) | 4 hours | 1 hour (with PITR enabled) |
| PostgreSQL (PITR to specific point) | 2 hours | Near-zero (to last WAL segment) |
| Redis | 30 minutes | 1 hour (last RDB snapshot) or ~1 second (with AOF) |
| File uploads | 8 hours | 24 hours (last daily sync) |
| Full platform restore | 12 hours | 1 hour |

**RTO** = maximum acceptable time from disaster declaration to service restoration.
**RPO** = maximum acceptable data loss window.

---

## 3. PostgreSQL Backup Strategy

### 3.1 Daily Full Backups (pg_dump)

**Tool:** `pg_dump` (plain SQL or custom format)
**Schedule:** Daily at 02:00 UTC
**Format:** PostgreSQL custom format (`-Fc`) — supports parallel restore and selective table restore
**Compression:** pg_dump native compression (level 6)
**Encryption:** AES-256 via GPG before upload to cloud storage

#### Backup Script

```bash
#!/bin/bash
# /opt/scripts/pg_backup_daily.sh
# Run as: postgres user or dedicated backup user with CONNECT + SELECT privileges

set -euo pipefail

DB_NAME="${POSTGRES_DB}"
DB_HOST="${POSTGRES_HOST}"
DB_USER="${POSTGRES_BACKUP_USER}"
BACKUP_DIR="/var/backups/postgres"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="${BACKUP_DIR}/social_bounty_${DATE}.pgdump"
ENCRYPTED_FILE="${BACKUP_FILE}.gpg"
S3_BUCKET="${BACKUP_S3_BUCKET}"
S3_PATH="postgres/daily/${DATE}/"

# Create backup
pg_dump \
  -h "${DB_HOST}" \
  -U "${DB_USER}" \
  -Fc \
  -Z 6 \
  -f "${BACKUP_FILE}" \
  "${DB_NAME}"

# Encrypt
gpg --recipient "${GPG_BACKUP_KEY_ID}" \
    --encrypt \
    --trust-model always \
    -o "${ENCRYPTED_FILE}" \
    "${BACKUP_FILE}"

# Upload to cloud storage
aws s3 cp "${ENCRYPTED_FILE}" "s3://${S3_BUCKET}/${S3_PATH}" \
  --storage-class STANDARD_IA \
  --sse aws:kms

# Verify upload
aws s3 ls "s3://${S3_BUCKET}/${S3_PATH}"

# Remove local unencrypted copy
rm -f "${BACKUP_FILE}"
rm -f "${ENCRYPTED_FILE}"

echo "Backup completed: ${DATE}"
```

**Verify the backup size after upload.** A backup that is significantly smaller than yesterday's is a signal of a failed or truncated dump.

### 3.2 Point-in-Time Recovery (PITR)

**Tool:** PostgreSQL WAL archiving + `pg_basebackup`
**How it works:** PostgreSQL continuously ships Write-Ahead Log (WAL) segments to cloud storage. Combined with a base backup, this enables restoration to any point in time within the retention window.

#### Configuration (postgresql.conf)

```ini
wal_level = replica
archive_mode = on
archive_command = 'aws s3 cp %p s3://${BACKUP_S3_BUCKET}/postgres/wal/%f'
archive_timeout = 60  # Archive incomplete WAL segments every 60 seconds
```

#### Base Backup (Weekly, Sunday 01:00 UTC)

```bash
pg_basebackup \
  -h "${DB_HOST}" \
  -U "${POSTGRES_REPLICATION_USER}" \
  -D /var/backups/postgres/base_$(date +%Y-%m-%d) \
  -Ft \
  -z \
  -P \
  --wal-method=stream
```

Base backups are encrypted and uploaded to the same S3 bucket under `postgres/base/`.

### 3.3 Retention Policy

| Backup Type | Retention | Storage Class |
|---|---|---|
| Daily pg_dump | 30 days | S3 Standard-IA |
| Weekly base backup | 90 days | S3 Standard-IA |
| WAL segments | 7 days (or back to oldest retained base backup) | S3 Standard-IA |
| Monthly snapshot (1st of month) | 1 year | S3 Glacier |
| Annual snapshot | 7 years (compliance) | S3 Glacier Deep Archive |

#### S3 Lifecycle Policy (Infrastructure as Code)

```json
{
  "Rules": [
    {
      "Id": "pg-daily-expire",
      "Prefix": "postgres/daily/",
      "Status": "Enabled",
      "Expiration": { "Days": 30 }
    },
    {
      "Id": "pg-weekly-to-glacier",
      "Prefix": "postgres/base/",
      "Status": "Enabled",
      "Transitions": [{ "Days": 90, "StorageClass": "GLACIER" }],
      "Expiration": { "Days": 365 }
    },
    {
      "Id": "wal-expire",
      "Prefix": "postgres/wal/",
      "Status": "Enabled",
      "Expiration": { "Days": 7 }
    }
  ]
}
```

---

## 4. Redis Backup Strategy

Redis stores session data (refresh tokens), rate limit counters, and password reset / email verification tokens. All of this data is transient by design — loss of Redis data does not cause data corruption; it requires all users to re-authenticate.

### 4.1 AOF (Append-Only File) for Near-Zero RPO

**Configuration (`redis.conf`):**

```ini
appendonly yes
appendfsync everysec          # fsync once per second — balance of durability and performance
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
aof-use-rdb-preamble yes      # Hybrid: RDB snapshot at start of AOF for fast restart
```

### 4.2 RDB Snapshots for Point-in-Time Restore

**Configuration (`redis.conf`):**

```ini
save 3600 1    # Save if at least 1 key changed in 1 hour
save 300 100   # Save if at least 100 keys changed in 5 minutes
save 60 10000  # Save if at least 10000 keys changed in 1 minute

dir /var/lib/redis
dbfilename dump.rdb
```

### 4.3 Backup Upload Script

```bash
#!/bin/bash
# /opt/scripts/redis_backup.sh
# Schedule: Every hour via cron

set -euo pipefail

REDIS_DIR="/var/lib/redis"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="/var/backups/redis/dump_${DATE}.rdb"
S3_BUCKET="${BACKUP_S3_BUCKET}"

# Trigger a BGSAVE and wait for completion
redis-cli BGSAVE
sleep 5
while [ "$(redis-cli LASTSAVE)" == "$(redis-cli LASTSAVE)" ]; do
  redis-cli INFO persistence | grep -q "rdb_bgsave_in_progress:0" && break
  sleep 2
done

# Copy and upload
cp "${REDIS_DIR}/dump.rdb" "${BACKUP_FILE}"

aws s3 cp "${BACKUP_FILE}" \
  "s3://${S3_BUCKET}/redis/hourly/${DATE}.rdb" \
  --sse aws:kms

rm -f "${BACKUP_FILE}"
echo "Redis backup uploaded: ${DATE}"
```

### 4.4 Retention Policy

| Backup Type | Retention |
|---|---|
| Hourly RDB snapshot | 24 hours |
| Daily RDB snapshot (00:00 UTC) | 7 days |

Redis data is transient. Longer retention adds cost without meaningful benefit given the short token TTLs.

---

## 5. File Upload Backup Strategy

**Current state:** Files are stored on local disk (`/uploads` on the API server). This is a known critical issue (see md-files/archive/AUDIT-REPORT-2026-03-27.md §2.4). Migration to object storage is required before production.

### 5.1 Pre-Migration (Local Disk) — Interim Backup

Until object storage migration is complete, use rsync to sync the uploads directory to a backup server daily.

```bash
#!/bin/bash
# Interim: daily rsync to backup server

rsync -avz \
  --delete \
  /app/uploads/ \
  backup-server:/backups/social-bounty-uploads/$(date +%Y-%m-%d)/

# Also upload to S3 as secondary backup
aws s3 sync /app/uploads/ \
  "s3://${BACKUP_S3_BUCKET}/uploads/$(date +%Y-%m-%d)/" \
  --sse aws:kms
```

**Retention:** 30 daily snapshots (S3 lifecycle rule on `uploads/` prefix).

### 5.2 Post-Migration (Object Storage — Target State)

Once files are migrated to S3 (or equivalent), the backup strategy uses native cloud replication.

#### S3 Cross-Region Replication

```json
{
  "ReplicationConfiguration": {
    "Role": "arn:aws:iam::ACCOUNT:role/s3-replication-role",
    "Rules": [
      {
        "Status": "Enabled",
        "Filter": { "Prefix": "" },
        "Destination": {
          "Bucket": "arn:aws:s3:::social-bounty-uploads-backup",
          "StorageClass": "STANDARD_IA"
        }
      }
    ]
  }
}
```

#### Versioning

Enable S3 versioning on the primary uploads bucket. This provides:
- Protection against accidental deletion (files are soft-deleted, not removed immediately)
- Ability to restore a previous version of an overwritten file
- 30-day non-current version expiration to control costs

#### Retention Policy (Post-Migration)

| Object Type | Primary Bucket | Replication Bucket |
|---|---|---|
| Current versions | Indefinite (until user deletes) | Indefinite |
| Non-current versions | 30 days | 30 days |
| Deleted markers | 90 days | 90 days |

---

## 6. Recovery Procedures

### 6.1 PostgreSQL Full Restore

**Estimated RTO: 4 hours** (for a large database; Social Bounty MVP data volume should be significantly faster)

```bash
# 1. Identify the backup to restore
aws s3 ls s3://${BACKUP_S3_BUCKET}/postgres/daily/ --recursive | sort | tail -10

# 2. Download and decrypt the backup
aws s3 cp "s3://${BACKUP_S3_BUCKET}/postgres/daily/${BACKUP_FILE}.gpg" /tmp/
gpg --output /tmp/restore.pgdump --decrypt /tmp/${BACKUP_FILE}.gpg

# 3. Create a new empty database
createdb social_bounty_restore -U postgres

# 4. Restore
pg_restore \
  -h "${DB_HOST}" \
  -U postgres \
  -d social_bounty_restore \
  -j 4 \                    # 4 parallel workers
  --no-owner \
  /tmp/restore.pgdump

# 5. Verify row counts against expectations
psql -h "${DB_HOST}" -U postgres -d social_bounty_restore -c "
  SELECT schemaname, tablename, n_live_tup
  FROM pg_stat_user_tables
  ORDER BY n_live_tup DESC;
"

# 6. If verified, swap database references (maintenance window required)
# Update DATABASE_URL in application config to point to restored database
```

### 6.2 PostgreSQL Point-in-Time Recovery (PITR)

**Estimated RTO: 2 hours**

```bash
# 1. Determine the target recovery time
# Example: restore to 2026-03-27 14:30:00 UTC

TARGET_TIME="2026-03-27 14:30:00 UTC"

# 2. Find the nearest base backup before the target time
aws s3 ls s3://${BACKUP_S3_BUCKET}/postgres/base/ | sort

# 3. Download and extract the base backup
aws s3 cp "s3://${BACKUP_S3_BUCKET}/postgres/base/${BASE_BACKUP}" /var/lib/postgresql/restore/
tar -xzf /var/lib/postgresql/restore/${BASE_BACKUP}

# 4. Create recovery.conf (PostgreSQL 12+: recovery settings go in postgresql.conf or recovery.signal)
cat > /var/lib/postgresql/restore/postgresql.conf << EOF
restore_command = 'aws s3 cp s3://${BACKUP_S3_BUCKET}/postgres/wal/%f %p'
recovery_target_time = '${TARGET_TIME}'
recovery_target_action = 'promote'
EOF

touch /var/lib/postgresql/restore/recovery.signal

# 5. Start PostgreSQL against the restore directory
# 6. Monitor logs until recovery completes and PostgreSQL promotes to primary
```

### 6.3 Redis Recovery

**Estimated RTO: 30 minutes**

```bash
# 1. Stop Redis
systemctl stop redis

# 2. Download the most recent RDB backup
aws s3 ls s3://${BACKUP_S3_BUCKET}/redis/hourly/ | sort | tail -5
aws s3 cp "s3://${BACKUP_S3_BUCKET}/redis/hourly/${RDB_FILE}" /var/lib/redis/dump.rdb

# 3. Set correct permissions
chown redis:redis /var/lib/redis/dump.rdb

# 4. Start Redis — it will load from the RDB file
systemctl start redis

# 5. Verify
redis-cli DBSIZE
redis-cli INFO keyspace
```

**Note:** After Redis recovery, all active user sessions will be invalidated. Users will need to re-authenticate. This is expected and safe.

### 6.4 File Upload Recovery (Pre-Migration)

**Estimated RTO: 8 hours** (depends on total upload volume)

```bash
# Restore from S3 daily sync
aws s3 sync \
  "s3://${BACKUP_S3_BUCKET}/uploads/${RESTORE_DATE}/" \
  /app/uploads/ \
  --delete
```

### 6.5 Full Platform Disaster Recovery

**Estimated RTO: 12 hours**

1. Provision new infrastructure (IaC scripts or manual provisioning) — 1-2 hours
2. Restore PostgreSQL from latest daily backup (pg_restore) — 2-4 hours
3. Restore Redis from latest hourly RDB — 30 minutes
4. Restore file uploads from S3 sync — 1-4 hours (volume-dependent)
5. Deploy application — 30 minutes (CI/CD pipeline or manual deploy from last successful build)
6. Smoke test all critical paths:
   - [ ] Login and token issuance
   - [ ] Bounty listing
   - [ ] Submission creation
   - [ ] File upload
   - [ ] Payment flow
7. Update DNS if recovering to new infrastructure — 30 minutes (+ TTL propagation)
8. Declare recovery complete — remove maintenance mode

---

## 7. Backup Monitoring and Alerting

### Monitoring Checks

| Check | Frequency | Alert If |
|---|---|---|
| Daily pg_dump completed | Daily | No backup uploaded in last 26 hours |
| Backup file size | Daily | File size <80% of prior day's backup |
| WAL archiving lag | Every 5 minutes | WAL archive older than 5 minutes |
| Redis RDB age | Every 30 minutes | Last save older than 90 minutes |
| S3 bucket replication status | Daily | Replication errors in last 24 hours |
| Backup decrypt test | Weekly | Decryption or integrity check fails |

### Alert Routing

- Backup failure alerts route to `#alerts-infrastructure` and page the on-call engineer.
- A missed backup is treated as a **SEV-2** incident until the root cause is identified and a valid backup is confirmed.

---

## 8. Testing Schedule

### Monthly Restore Test (Full)

**Frequency:** First Sunday of each month, 09:00 UTC
**Performed by:** On-call engineer + DevOps lead
**Duration:** Allow 4 hours

**Procedure:**

1. Provision a temporary isolated environment (separate VPC or namespace, no internet access to prevent accidental production queries).
2. Restore the most recent PostgreSQL daily backup to the test environment.
3. Run the application against the restored database.
4. Execute the smoke test suite against the test environment.
5. Verify row counts in key tables against expected values from the production monitoring dashboard.
6. Document the restore duration and any issues encountered.
7. Tear down the temporary environment.
8. File a restore test report in the runbook log.

**Pass criteria:**
- [ ] Database restored without errors
- [ ] Row counts match expectations (within 24-hour drift tolerance)
- [ ] Application starts and passes smoke tests
- [ ] Restore completed within RTO target (4 hours)

### Quarterly PITR Test

**Frequency:** Quarterly (January, April, July, October)
**Purpose:** Verify WAL archiving is intact and PITR to a specific timestamp works correctly.

**Procedure:**

1. Select a target time from 48 hours ago.
2. Perform a PITR restore to that time in an isolated environment.
3. Verify that records created after the target time are absent from the restored database.
4. Verify that records created before the target time are present.

### Annual Disaster Recovery Drill

**Frequency:** Annually
**Scope:** Full platform restore from scratch — simulate complete loss of primary infrastructure.
**Duration:** Allow 12 hours.
**Participants:** Engineering Lead, DevOps Lead, On-Call Engineer.

**Outcome:** Updated RTO/RPO estimates based on actual drill results. Revise this document if targets were not met.

---

## 9. Retention Policy Summary

| Data Store | Backup Frequency | Retention | Storage |
|---|---|---|---|
| PostgreSQL daily dump | Daily (02:00 UTC) | 30 days | S3 Standard-IA |
| PostgreSQL base backup | Weekly (Sunday 01:00 UTC) | 90 days | S3 Standard-IA |
| PostgreSQL WAL | Continuous (60s archive timeout) | 7 days | S3 Standard-IA |
| PostgreSQL monthly snapshot | Monthly (1st of month) | 1 year | S3 Glacier |
| PostgreSQL annual snapshot | Annually (1 Jan) | 7 years | S3 Glacier Deep Archive |
| Redis hourly RDB | Every hour | 24 hours | S3 Standard |
| Redis daily RDB | Daily (00:00 UTC) | 7 days | S3 Standard-IA |
| File uploads (pre-migration) | Daily rsync | 30 days | S3 Standard-IA |
| File uploads (post-migration) | Continuous replication | Versioned (30-day non-current) | S3 Cross-Region |

---

## 10. Runbook Quick Reference

| Scenario | Section | Estimated RTO |
|---|---|---|
| Restore database from last daily backup | 6.1 | 4 hours |
| Restore database to a specific point in time | 6.2 | 2 hours |
| Restore Redis session store | 6.3 | 30 minutes |
| Restore file uploads | 6.4 | 8 hours |
| Full platform disaster recovery | 6.5 | 12 hours |

**Emergency Contacts:** See `docs/INCIDENT-RESPONSE.md §3`

---

*Document Owner: DevOps / Infrastructure Lead. Review this document after every disaster recovery drill or any change to backup tooling.*

---

## Ledger-specific backup guidance (2026-04-15)

The ledger is the platform's source of financial truth. Losing or corrupting ledger history is categorically different from losing session data or file uploads — it breaks the double-entry invariant, voids reconciliation, and creates unrecoverable accounting drift. This section adds hard constraints that sit on top of the general PostgreSQL strategy in §3 and the PITR targets in §2.

Cross-references:
- `md-files/payment-gateway.md` — canonical Stitch Express spec. <!-- historical -->
- `md-files/financial-architecture.md` — ledger mechanics, accounts, idempotency.
- `docs/STITCH-IMPLEMENTATION-STATUS.md` — what is live, what is gated. <!-- historical -->
- `docs/adr/0005-ledger-idempotency-via-header-table.md` — idempotency guarantees that backups must preserve.
- `docs/adr/0006-compensating-entries-bypass-kill-switch.md` — why corrections are always new INSERTs, never UPDATEs.

### Append-only invariant (non-negotiable)

`ledger_entries` and `ledger_transaction_groups` are **append-only** in production. They MUST NEVER be:

- `TRUNCATE`d
- `DROP`ped and recreated
- bulk-`DELETE`d
- reset via `prisma migrate reset`
- edited in-place to "correct" a wrong amount

Mistakes are corrected by inserting new compensating entries (new rows with opposite DEBIT/CREDIT polarity) — never by mutating or removing history. This is enforced at the application layer by `LedgerService`, but backup and restore procedures must not undo that guarantee. Any restore workflow that would re-introduce prior (corrected) rows is a regression.

### PITR / WAL archiving is non-negotiable for financial tables

The RPO targets in §2 are minima. For the financial tables specifically:

- WAL archiving (see §3.2) MUST be running at all times. A gap in the WAL archive over the financial tables is a **SEV-1** incident.
- Base backups (§3.2) MUST succeed weekly. A failed base backup halts the 72-hour payout clearance cron until the next successful backup, because we cannot safely roll forward without a restorable anchor.
- PITR to any timestamp within the WAL retention window (7 days) must be demonstrable for these tables specifically — not just "the database as a whole".

### Nightly logical backups scoped to financial tables

Independent of the database-wide daily `pg_dump` in §3.1, take a **second, narrower** nightly backup scoped to the financial surface. This protects against schema-level incidents (e.g. a bad migration) without needing to restore the entire database.

Scoped tables:

- `ledger_entries`
- `ledger_transaction_groups`
- `stitch_payment_links` <!-- historical -->
- `stitch_payouts` <!-- historical -->
- `stitch_beneficiaries` <!-- historical -->
- `refunds`
- `audit_logs`
- `webhook_events`
- `job_runs`
- `recurring_issues`

Example scoped dump:

```bash
pg_dump \
  -h "${DB_HOST}" -U "${DB_USER}" -Fc -Z 6 \
  -t ledger_entries -t ledger_transaction_groups \
  -t stitch_payment_links -t stitch_payouts -t stitch_beneficiaries \ <!-- historical -->
  -t refunds -t audit_logs -t webhook_events \
  -t job_runs -t recurring_issues \
  -f /var/backups/postgres/social_bounty_financial_$(date +%Y-%m-%d).pgdump \
  "${DB_NAME}"
```

Retention: 90 days on S3 Standard-IA, encrypted as per §3.1. Size-baseline alerting applies — today's financial dump must be ≥ yesterday's size (ledger is append-only, so shrinkage is a signal of corruption or a bad script).

### Quarterly restore drill for the ledger

In addition to the monthly restore test in §8.1, run a **quarterly ledger-specific restore drill**:

1. Restore the nightly scoped backup (above) into a staging Postgres instance.
2. Run the full `ReconciliationService.run()` end-to-end against the restored data.
3. Compare the restored balances and Stitch external references against the Stitch **sandbox** ledger for the same window (using `STITCH_CLIENT_ID` / `STITCH_CLIENT_SECRET` sandbox creds). <!-- historical -->
4. Record the drift (expected: zero). Any non-zero drift halts the drill and opens a KB entry under the "reconciliation mismatch" trigger (`claude.md` §9).

This drill doubles as a reconciliation-engine health check.

### `prisma migrate reset` is BANNED in production

`npm run prisma:reset` / `prisma migrate reset` drops and recreates the database. In production, running this command against the financial tables would be a catastrophic, irreversible loss of ledger history.

- In dev and CI: allowed, because the ledger is synthetic.
- In staging: allowed only during scheduled destructive-test windows, with a prior scoped backup.
- In production: **banned**. No engineer has the production DB role necessary to run this command. DevOps enforces this via IAM on the production database user.

A future CI check (tentatively R20 in the backlog) will scan for `prisma migrate reset` invocations in deploy scripts and CI jobs to prevent accidental introduction. Not built here — flagged as future work.

### Draft migrations are not auto-applied

`packages/prisma/drafts/` holds draft migration scripts used during ADR exploration and Phase planning. These are explicitly **NOT** picked up by `prisma migrate deploy` — the directory is outside the canonical `migrations/` folder Prisma reads.

Any draft that graduates to a real migration is moved into `packages/prisma/migrations/<timestamp>_<name>/` and goes through the normal migration review + PR + CI cycle. Drafts themselves never run against production.

### Summary: what changes relative to the general §3 strategy

| Aspect | General strategy | Ledger-specific override |
|---|---|---|
| Backup target tables | Full database | Full DB + scoped financial-tables dump |
| WAL archiving | Required | Required, with SEV-1 incident on gaps |
| Destructive commands in production | Operational discretion | `prisma migrate reset` banned; ledger table truncate/delete banned |
| Restore drill cadence | Monthly full restore, quarterly PITR | Additional quarterly ledger restore + reconciliation replay |
| Corrections | UPDATE acceptable per data semantics | INSERT-only compensating entries |

*This section updated 2026-04-15. Review alongside any change to `md-files/financial-architecture.md` or the scoped table list above.*
