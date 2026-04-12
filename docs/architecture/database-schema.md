# Database Schema - Social Bounty MVP

## Overview

This document defines the complete Prisma schema for the Social Bounty MVP. It covers all 7 entities (User, Brand, BrandMember, Bounty, Submission, AuditLog, FileUpload), their relationships, enums, indexes, and cascade rules.

The schema lives at `packages/prisma/schema.prisma` per the planned project structure.

## Assumptions

1. **Single brand per Business Admin (MVP constraint)**: A Business Admin belongs to exactly one brand. The `BrandMember` model still supports multiple members per org, but application logic enforces one org per Business Admin.
2. **UUID primary keys**: All entities use UUIDs (`@default(uuid())`) for security (non-enumerable) and distributed-system readiness.
3. **Soft references in AuditLog**: `entityType` and `entityId` are strings (not foreign keys) so audit logs survive if the referenced entity is deleted.
4. **proofLinks stored as JSON**: Submission proof links are stored as a JSON array since PostgreSQL handles JSON natively and the data is read-heavy with no need for relational queries on individual links.
5. **Decimal for rewardValue**: Using `Decimal` for monetary values to avoid floating-point precision issues.
6. **File uploads scoped to submissions**: In MVP, files are always attached to a submission. The `FileUpload` model includes `submissionId` as a required field.
7. **Cascade deletes**: Deleting an Brand cascades to its members and bounties. Deleting a Bounty cascades to its submissions. Deleting a Submission cascades to its file uploads. Users are not cascade-deleted to preserve audit trail integrity.

---

## Prisma Schema

```prisma
// ─────────────────────────────────────
// Prisma Configuration
// ─────────────────────────────────────

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─────────────────────────────────────
// Enums
// ─────────────────────────────────────

enum UserRole {
  PARTICIPANT
  BUSINESS_ADMIN
  SUPER_ADMIN
}

enum UserStatus {
  ACTIVE
  SUSPENDED
}

enum BrandStatus {
  ACTIVE
  SUSPENDED
}

enum BrandMemberRole {
  OWNER
  MEMBER
}

enum BountyStatus {
  DRAFT
  LIVE
  PAUSED
  CLOSED
}

enum RewardType {
  CASH
  PRODUCT
  SERVICE
  OTHER
}

enum SubmissionStatus {
  SUBMITTED
  IN_REVIEW
  NEEDS_MORE_INFO
  APPROVED
  REJECTED
}

enum PayoutStatus {
  NOT_PAID
  PENDING
  PAID
}

// ─────────────────────────────────────
// Models
// ─────────────────────────────────────

model User {
  id            String     @id @default(uuid())
  email         String     @unique
  passwordHash  String
  firstName     String
  lastName      String
  role          UserRole   @default(PARTICIPANT)
  status        UserStatus @default(ACTIVE)
  emailVerified Boolean    @default(false)
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  // Relations
  submissions             Submission[]          @relation("UserSubmissions")
  reviewedSubmissions     Submission[]          @relation("ReviewerSubmissions")
  brandMemberships BrandMember[]
  createdBounties         Bounty[]              @relation("BountyCreator")
  auditLogs               AuditLog[]            @relation("AuditActor")
  fileUploads             FileUpload[]          @relation("FileUploader")

  @@index([email])
  @@index([role])
  @@index([status])
  @@map("users")
}

model Brand {
  id           String    @id @default(uuid())
  name         String
  logo         String?
  contactEmail String
  status       BrandStatus @default(ACTIVE)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  // Relations
  members  BrandMember[]
  bounties Bounty[]

  @@index([status])
  @@map("brands")
}

model BrandMember {
  id             String        @id @default(uuid())
  userId         String
  brandId String
  role           BrandMemberRole @default(MEMBER)
  joinedAt       DateTime      @default(now())

  // Relations
  user         User         @relation(fields: [userId], references: [id], onDelete: Restrict)
  brand Brand @relation(fields: [brandId], references: [id], onDelete: Cascade)

  @@unique([userId, brandId])
  @@index([userId])
  @@index([brandId])
  @@map("organisation_members")
}

model Bounty {
  id                String       @id @default(uuid())
  brandId    String
  createdById       String
  title             String
  shortDescription  String
  fullInstructions  String       @db.Text
  category          String
  rewardType        RewardType
  rewardValue       Decimal?     @db.Decimal(12, 2)
  rewardDescription String?
  maxSubmissions    Int?
  startDate         DateTime?
  endDate           DateTime?
  eligibilityRules  String       @db.Text
  proofRequirements String       @db.Text
  status            BountyStatus @default(DRAFT)
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt

  // Relations
  brand Brand @relation(fields: [brandId], references: [id], onDelete: Cascade)
  createdBy    User         @relation("BountyCreator", fields: [createdById], references: [id], onDelete: Restrict)
  submissions  Submission[]

  @@index([brandId])
  @@index([status])
  @@index([category])
  @@index([createdById])
  @@index([startDate, endDate])
  @@map("bounties")
}

model Submission {
  id           String           @id @default(uuid())
  bountyId     String
  userId       String
  proofText    String           @db.Text
  proofLinks   Json?
  status       SubmissionStatus @default(SUBMITTED)
  reviewerNote String?          @db.Text
  reviewedById String?
  payoutStatus PayoutStatus     @default(NOT_PAID)
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt

  // Relations
  bounty      Bounty       @relation(fields: [bountyId], references: [id], onDelete: Cascade)
  user        User         @relation("UserSubmissions", fields: [userId], references: [id], onDelete: Restrict)
  reviewedBy  User?        @relation("ReviewerSubmissions", fields: [reviewedById], references: [id], onDelete: SetNull)
  proofImages FileUpload[]

  @@index([bountyId])
  @@index([userId])
  @@index([status])
  @@index([payoutStatus])
  @@index([reviewedById])
  @@map("submissions")
}

model AuditLog {
  id          String   @id @default(uuid())
  actorId     String
  actorRole   UserRole
  action      String
  entityType  String
  entityId    String
  beforeState Json?
  afterState  Json?
  reason      String?  @db.Text
  ipAddress   String?
  createdAt   DateTime @default(now())

  // Relations
  actor User @relation("AuditActor", fields: [actorId], references: [id], onDelete: Restrict)

  @@index([actorId])
  @@index([entityType, entityId])
  @@index([action])
  @@index([createdAt])
  @@map("audit_logs")
}

model FileUpload {
  id           String   @id @default(uuid())
  submissionId String
  userId       String
  fileName     String
  fileUrl      String
  mimeType     String
  fileSize     Int
  createdAt    DateTime @default(now())

  // Relations
  submission Submission @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  uploadedBy User      @relation("FileUploader", fields: [userId], references: [id], onDelete: Restrict)

  @@index([submissionId])
  @@index([userId])
  @@map("file_uploads")
}
```

---

## Entity Relationship Diagram (Text)

```
User 1──* BrandMember *──1 Brand
User 1──* Submission
User 1──* Bounty (as creator)
User 1──* AuditLog (as actor)
User 1──* FileUpload (as uploader)
User 1──* Submission (as reviewer)

Brand 1──* BrandMember
Brand 1──* Bounty

Bounty 1──* Submission

Submission 1──* FileUpload
```

---

## Enum Reference

| Enum | Values | Used By |
|------|--------|---------|
| `UserRole` | PARTICIPANT, BUSINESS_ADMIN, SUPER_ADMIN | User.role, AuditLog.actorRole |
| `UserStatus` | ACTIVE, SUSPENDED | User.status |
| `BrandStatus` | ACTIVE, SUSPENDED | Brand.status |
| `BrandMemberRole` | OWNER, MEMBER | BrandMember.role |
| `BountyStatus` | DRAFT, LIVE, PAUSED, CLOSED | Bounty.status |
| `RewardType` | CASH, PRODUCT, SERVICE, OTHER | Bounty.rewardType |
| `SubmissionStatus` | SUBMITTED, IN_REVIEW, NEEDS_MORE_INFO, APPROVED, REJECTED | Submission.status |
| `PayoutStatus` | NOT_PAID, PENDING, PAID | Submission.payoutStatus |

---

## Index Strategy

| Model | Index | Purpose |
|-------|-------|---------|
| User | `email` (unique) | Login lookup, duplicate prevention |
| User | `role` | Filter users by role (admin views) |
| User | `status` | Filter active/suspended users |
| BrandMember | `[userId, brandId]` (unique) | Prevent duplicate memberships |
| BrandMember | `userId` | Lookup user's brands |
| BrandMember | `brandId` | List org members |
| Brand | `status` | Filter active/suspended orgs |
| Bounty | `brandId` | List bounties per org |
| Bounty | `status` | Filter bounties by lifecycle status |
| Bounty | `category` | Category-based browsing |
| Bounty | `createdById` | Lookup bounties by creator |
| Bounty | `[startDate, endDate]` | Date range filtering |
| Submission | `bountyId` | List submissions per bounty |
| Submission | `userId` | "My submissions" view |
| Submission | `status` | Filter by review status |
| Submission | `payoutStatus` | Payout tracking queries |
| Submission | `reviewedById` | Reviewer workload queries |
| AuditLog | `actorId` | Audit trail per user |
| AuditLog | `[entityType, entityId]` | Audit trail per entity |
| AuditLog | `action` | Filter by action type |
| AuditLog | `createdAt` | Time-range queries, chronological ordering |
| FileUpload | `submissionId` | List files per submission |
| FileUpload | `userId` | List uploads per user |

---

## Cascade / Delete Rules

| Relation | On Delete | Rationale |
|----------|-----------|-----------|
| BrandMember -> User | **Restrict** | Cannot delete a user who is an org member; must remove membership first |
| BrandMember -> Brand | **Cascade** | Deleting an org removes all memberships |
| Bounty -> Brand | **Cascade** | Deleting an org removes all its bounties |
| Bounty -> User (creator) | **Restrict** | Cannot delete a user who created bounties |
| Submission -> Bounty | **Cascade** | Deleting a bounty removes all submissions |
| Submission -> User (submitter) | **Restrict** | Cannot delete a user who has submissions |
| Submission -> User (reviewer) | **SetNull** | If reviewer is removed, submission retains status but clears reviewer reference |
| AuditLog -> User (actor) | **Restrict** | Audit logs must be preserved; cannot delete a user with audit entries |
| FileUpload -> Submission | **Cascade** | Deleting a submission removes associated files |
| FileUpload -> User (uploader) | **Restrict** | Cannot delete a user who has uploaded files |

**Note on User deletion**: Users are never cascade-deleted. The `Restrict` rules on multiple relations ensure that a user cannot be deleted while they have any associated records (submissions, bounties, audit logs, etc.). In practice, the application should use the `SUSPENDED` status instead of deleting users.

---

## Table Mapping

All models use `@@map` to follow PostgreSQL naming conventions (snake_case, plural):

| Prisma Model | DB Table Name |
|--------------|---------------|
| User | `users` |
| Brand | `brands` |
| BrandMember | `organisation_members` |
| Bounty | `bounties` |
| Submission | `submissions` |
| AuditLog | `audit_logs` |
| FileUpload | `file_uploads` |

---

## Migration Notes

1. **Initial migration**: Run `npx prisma migrate dev --name init` to create all tables.
2. **Seed data**: Create a seed script to provision at least one Super Admin account for initial platform setup.
3. **Environment**: Ensure `DATABASE_URL` is set in `.env` for each environment (local, staging, production).
