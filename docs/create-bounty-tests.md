# Create Bounty - Validation Rules & Test Cases

## 1. Validation Rule Matrix

### 1.1 Core Bounty Fields

| Field | Client-Side Rule | Server-Side Rule | Error Message | Edge Cases |
|-------|-----------------|-----------------|---------------|------------|
| `title` | Required, max 200 chars | `@IsNotEmpty()`, `@MaxLength(200)` | "Title is required" / "Title must be at most 200 characters" | Empty string, whitespace-only, exactly 200 chars, 201 chars, XSS payload |
| `shortDescription` | Required, max 500 chars | `@IsNotEmpty()`, `@MaxLength(500)` | "Short description is required" | Empty string, exactly 500 chars, HTML injection |
| `fullInstructions` | Required, max 10000 chars | `@IsNotEmpty()`, `@MaxLength(10000)` | "Full instructions are required" | Whitespace-only, multiline, Unicode, very long content |
| `category` | Required, max 100 chars | `@IsNotEmpty()`, `@MaxLength(100)` | "Category is required" | Empty string, 101 chars |
| `proofRequirements` | Required, max 5000 chars | `@IsNotEmpty()`, `@MaxLength(5000)` | "Proof requirements are required" | Empty string, exactly 5000 chars |
| `maxSubmissions` | Optional, positive integer | `@IsOptional()`, `@IsInt()`, `@IsPositive()` | "Max submissions must be a positive integer" | 0, -1, 1, float (1.5), null, very large number (MAX_SAFE_INTEGER) |
| `startDate` | Optional, ISO 8601 | `@IsOptional()`, `@IsDateString()` | "Start date must be a valid ISO 8601 date" | Invalid date string, non-ISO format, null |
| `endDate` | Optional, ISO 8601, after startDate | `@IsOptional()`, `@IsDateString()`, service-level check | "End date must be after start date" | Equal to startDate, before startDate, null with startDate set |

### 1.2 Channel Selection

| Field | Client-Side Rule | Server-Side Rule | Error Message | Edge Cases |
|-------|-----------------|-----------------|---------------|------------|
| `channels` | Required object, >= 1 channel | Non-empty object, valid keys | "At least one channel must be selected" | Empty object `{}`, null, unknown channel name |
| `channels[channel]` | >= 1 format per channel | Non-empty array, valid formats | "Channel {channel} must have at least one format selected" | Empty array `[]`, unknown format values |
| Channel-format mapping | Only allowed formats per `CHANNEL_POST_FORMATS` | Validate against mapping constant | "Format {format} is not valid for channel {channel}" | TIKTOK with STORY, INSTAGRAM with VIDEO_POST |

### 1.3 Rewards

| Field | Client-Side Rule | Server-Side Rule | Error Message | Edge Cases |
|-------|-----------------|-----------------|---------------|------------|
| `rewards` | Required array, 1-10 lines | Non-empty, max 10 items | "At least one reward is required" / "Maximum 10 reward lines allowed" | Empty array, 0 items, 11 items, exactly 10 |
| `rewards[].rewardType` | Required, valid enum | `@IsEnum(RewardType)` | "Reward type must be CASH, PRODUCT, SERVICE, or OTHER" | Invalid enum string, empty, number |
| `rewards[].name` | Required, 1-200 chars | `@IsNotEmpty()`, `@MaxLength(200)` | "Reward name is required" / "Reward name must be at most 200 characters" | Empty string, 201 chars, XSS payload |
| `rewards[].monetaryValue` | Required, > 0, max 2 decimals | `@IsPositive()`, max 2 decimal places | "Monetary value must be a positive number" | 0, -1, 0.001 (3 decimals), very large (overflow), NaN |

### 1.4 Post Visibility

| Field | Client-Side Rule | Server-Side Rule | Error Message | Edge Cases |
|-------|-----------------|-----------------|---------------|------------|
| `postVisibility.rule` | Required enum | `@IsEnum(PostVisibilityRule)` | "Post visibility rule must be MUST_NOT_REMOVE or MINIMUM_DURATION" | Invalid string, null |
| `postVisibility.minDurationValue` | Required if MINIMUM_DURATION | Positive integer, range check | "Duration value is required for MINIMUM_DURATION" | 0, -1, null when MINIMUM_DURATION, 169 hours, 91 days, 13 weeks |
| `postVisibility.minDurationUnit` | Required if MINIMUM_DURATION | Valid DurationUnit enum | "Duration unit is required for MINIMUM_DURATION" | Invalid enum, null when MINIMUM_DURATION |
| MUST_NOT_REMOVE + duration fields | Duration fields hidden | Duration fields must be null/omitted | "Duration fields must not be set for MUST_NOT_REMOVE" | MUST_NOT_REMOVE with minDurationValue = 7 |

**Duration Range Constraints:**

| Unit | Min | Max | Error Message |
|------|-----|-----|---------------|
| HOURS | 1 | 168 | "Hours must be between 1 and 168" |
| DAYS | 1 | 90 | "Days must be between 1 and 90" |
| WEEKS | 1 | 12 | "Weeks must be between 1 and 12" |

### 1.5 Structured Eligibility

| Field | Client-Side Rule | Server-Side Rule | Error Message | Edge Cases |
|-------|-----------------|-----------------|---------------|------------|
| `structuredEligibility` | Required object | Must be present | "Structured eligibility is required" | null, undefined |
| `.minFollowers` | Optional, positive int | `@IsOptional()`, positive integer | "Minimum followers must be a positive integer" | 0, -1, float, very large number |
| `.publicProfile` | Optional, boolean | `@IsOptional()`, boolean | "Public profile must be a boolean" | String "true", number 1 |
| `.minAccountAgeDays` | Optional, positive int | `@IsOptional()`, positive integer | "Minimum account age must be a positive integer" | 0, -1, float |
| `.locationRestriction` | Optional, max 200 chars | `@IsOptional()`, `@MaxLength(200)` | "Location restriction must be at most 200 characters" | 201 chars, empty string, XSS payload |
| `.noCompetingBrandDays` | Optional, positive int | `@IsOptional()`, positive integer | "Competing brand days must be a positive integer" | 0, -1 |
| `.customRules` | Optional array, max 5 items | Max 5 items, each max 500 chars | "Maximum 5 custom eligibility rules" / "Custom rule must be at most 500 characters" | 6 items, one item at 501 chars, empty strings in array |

### 1.6 Engagement Requirements

| Field | Client-Side Rule | Server-Side Rule | Error Message | Edge Cases |
|-------|-----------------|-----------------|---------------|------------|
| `engagementRequirements` | Required object | Must be present | "Engagement requirements are required" | null, undefined |
| `.tagAccount` | Optional, starts with @, 2-100 chars | Regex: `^@[a-zA-Z0-9_.]{1,99}$` | "Tag account must start with @ and contain only alphanumeric, underscores, and dots" | Missing @, special chars, empty, 101 chars, just "@" |
| `.mention` | Optional, boolean | Defaults to false | "Mention must be a boolean" | String "true" |
| `.comment` | Optional, boolean | Defaults to false | "Comment must be a boolean" | String "false" |

### 1.7 Other Fields

| Field | Client-Side Rule | Server-Side Rule | Error Message | Edge Cases |
|-------|-----------------|-----------------|---------------|------------|
| `currency` | Required enum | `@IsEnum(Currency)` | "Currency must be ZAR, USD, GBP, or EUR" | Invalid string, empty |
| `aiContentPermitted` | Optional boolean | Defaults to false | "AI content permitted must be a boolean" | String "true", null |

### 1.8 State Transition Rules

| Transition | Preconditions | Error Message | Edge Cases |
|------------|--------------|---------------|------------|
| DRAFT -> LIVE | All required fields populated (visibilityAcknowledged no longer required — DEPRECATED 2026-04-17) | "Cannot publish bounty. Missing required fields." with details array | Missing one field |
| LIVE -> PAUSED | None | n/a | |
| PAUSED -> LIVE | No acknowledgment gate (DEPRECATED 2026-04-17) | All standard required fields | Missing required field |
| LIVE -> CLOSED | None (terminal) | n/a | |
| PAUSED -> CLOSED | None (terminal) | n/a | |
| CLOSED -> any | Rejected | "Cannot transition from CLOSED to {status}" | CLOSED -> LIVE, CLOSED -> DRAFT |
| DRAFT -> PAUSED | Rejected | "Cannot transition from DRAFT to PAUSED" | |
| DRAFT -> CLOSED | Rejected | "Cannot transition from DRAFT to CLOSED" | |

---

## 2. Test Cases

### 2.1 Happy Path Tests

| # | Test Case | Preconditions | Steps | Expected Result |
|---|-----------|---------------|-------|-----------------|
| HP-01 | Create bounty with single channel, single reward | BA with org | POST /bounties with INSTAGRAM + 1 CASH reward | 201, status=DRAFT, reward in response |
| HP-02 | Create bounty with multiple channels and formats | BA with org | POST /bounties with INSTAGRAM [STORY,REEL] + TIKTOK [VIDEO_POST] | 201, channels object matches input |
| HP-03 | Create bounty with 3 reward lines (Cash + Product + Service) | BA with org | POST /bounties with 3 rewards | 201, rewards array has 3 items, totalRewardValue = sum |
| HP-04 | Create bounty with all eligibility rules enabled | BA with org | POST with minFollowers, publicProfile, minAccountAgeDays, locationRestriction, noCompetingBrandDays, 2 customRules | 201, structuredEligibility matches, eligibilityRules text generated |
| HP-05 | Create bounty with MINIMUM_DURATION visibility rule | BA with org | POST with rule=MINIMUM_DURATION, value=7, unit=DAYS | 201, postVisibility in response (visibilityAcknowledged field is stored but no longer enforced) |
| HP-06 | Create bounty with MUST_NOT_REMOVE visibility rule | BA with org | POST with rule=MUST_NOT_REMOVE, no duration fields | 201, postVisibility.rule=MUST_NOT_REMOVE |
| HP-07 | Save as draft with minimal fields | BA with org | POST /bounties with only required fields, minimal values | 201, status=DRAFT |
| HP-08 | DRAFT to LIVE | BA, draft bounty with all required fields | PATCH /bounties/:id/status { status: LIVE } | 200, status=LIVE (visibilityAcknowledged no longer required — DEPRECATED 2026-04-17) |
| HP-09 | ~~Acknowledge visibility~~ | — | — | **DEPRECATED 2026-04-17** — endpoint is a no-op for backward compat |
| HP-10 | Update rewards on DRAFT bounty (full replacement) | Draft bounty with 2 rewards | PATCH /bounties/:id with new rewards array | 200, old rewards replaced, new rewards match |
| HP-11 | Create bounty with all engagement requirements | BA with org | POST with tagAccount, mention=true, comment=true | 201, engagementRequirements matches |
| HP-12 | Create bounty with AI content permitted | BA with org | POST with aiContentPermitted=true | 201, aiContentPermitted=true |
| HP-13 | Legacy field population | BA with org | POST with structured data | 201, rewardType=first reward type, rewardValue=total, rewardDescription=comma-separated names, eligibilityRules=generated text |

### 2.2 Validation Edge Cases

| # | Test Case | Input | Expected Result |
|---|-----------|-------|-----------------|
| VE-01 | Empty rewards array | `rewards: []` | 400, "At least one reward is required" |
| VE-02 | Reward with monetaryValue = 0 | `rewards: [{ ..., monetaryValue: 0 }]` | 400, "Monetary value must be a positive number" |
| VE-03 | Reward with monetaryValue < 0 | `rewards: [{ ..., monetaryValue: -10 }]` | 400, "Monetary value must be a positive number" |
| VE-04 | 11 reward lines (exceeds max 10) | `rewards: [... 11 items]` | 400, "Maximum 10 reward lines allowed" |
| VE-05 | Reward name > 200 chars | `rewards: [{ name: 'a'.repeat(201), ... }]` | 400, "Reward name must be at most 200 characters" |
| VE-06 | Channel selected with no formats | `channels: { INSTAGRAM: [] }` | 400, "Channel INSTAGRAM must have at least one format selected" |
| VE-07 | Empty channels object | `channels: {}` | 400, "At least one channel must be selected" |
| VE-08 | Invalid format for channel | `channels: { TIKTOK: ['STORY'] }` | 400, "Format STORY is not valid for channel TIKTOK" |
| VE-09 | MINIMUM_DURATION with no duration value | `postVisibility: { rule: 'MINIMUM_DURATION' }` | 400, "Duration value is required for MINIMUM_DURATION" |
| VE-10 | MINIMUM_DURATION with duration value = 0 | `postVisibility: { rule: 'MINIMUM_DURATION', minDurationValue: 0, minDurationUnit: 'DAYS' }` | 400, "Duration value must be a positive integer" |
| VE-11 | MINIMUM_DURATION with HOURS = 169 (exceeds max 168) | `postVisibility: { rule: 'MINIMUM_DURATION', minDurationValue: 169, minDurationUnit: 'HOURS' }` | 400, "Hours must be between 1 and 168" |
| VE-12 | MINIMUM_DURATION with DAYS = 91 (exceeds max 90) | `postVisibility: { ..., minDurationValue: 91, minDurationUnit: 'DAYS' }` | 400, "Days must be between 1 and 90" |
| VE-13 | MINIMUM_DURATION with WEEKS = 13 (exceeds max 12) | `postVisibility: { ..., minDurationValue: 13, minDurationUnit: 'WEEKS' }` | 400, "Weeks must be between 1 and 12" |
| VE-14 | MUST_NOT_REMOVE with duration fields set | `postVisibility: { rule: 'MUST_NOT_REMOVE', minDurationValue: 7, minDurationUnit: 'DAYS' }` | 400, "Duration fields must not be set for MUST_NOT_REMOVE" |
| VE-15 | Custom eligibility rule > 500 chars | `structuredEligibility: { customRules: ['a'.repeat(501)] }` | 400, "Custom rule must be at most 500 characters" |
| VE-16 | 6 custom eligibility rules (exceeds max 5) | `structuredEligibility: { customRules: [...6 strings] }` | 400, "Maximum 5 custom eligibility rules" |
| VE-17 | endDate before startDate | `startDate: '2026-03-01', endDate: '2026-02-01'` | 400, "End date must be after start date" |
| VE-18 | Tag account without @ prefix | `engagementRequirements: { tagAccount: 'acmecorp' }` | 400, "Tag account must start with @" |
| VE-19 | Tag account with just "@" | `engagementRequirements: { tagAccount: '@' }` | 400, regex mismatch |
| VE-20 | Tag account with special chars | `engagementRequirements: { tagAccount: '@acme corp!' }` | 400, regex mismatch |
| VE-21 | ~~DRAFT to LIVE without visibilityAcknowledged~~ | — | **REMOVED 2026-04-17** — the acknowledgment gate is deprecated; the field is no longer checked at publish time |
| VE-22 | DRAFT to LIVE with missing rewards | Draft bounty, no BountyReward rows | 400, "At least one reward line is required" |
| VE-23 | DRAFT to LIVE with missing channels | Draft bounty, channels=null | 400, "Missing required fields" with details |
| VE-24 | minFollowers = 0 | `structuredEligibility: { minFollowers: 0 }` | 400, "Minimum followers must be a positive integer" |
| VE-25 | minFollowers negative | `structuredEligibility: { minFollowers: -5 }` | 400, "Minimum followers must be a positive integer" |
| VE-26 | locationRestriction > 200 chars | `structuredEligibility: { locationRestriction: 'a'.repeat(201) }` | 400, max length error |
| VE-27 | Reward with 3 decimal places | `rewards: [{ monetaryValue: 10.123, ... }]` | 400, "Monetary value must have at most 2 decimal places" |
| VE-28 | Unknown channel enum | `channels: { YOUTUBE: ['VIDEO_POST'] }` | 400, invalid channel |
| VE-29 | Invalid currency enum | `currency: 'BTC'` | 400, "Currency must be ZAR, USD, GBP, or EUR" |
| VE-30 | User without brandId | No org user tries to create bounty | 400, "You must belong to an brand" |
| VE-31 | LIVE bounty edit restricted fields | LIVE bounty, try to update `title` | 400, "Cannot edit these fields on a LIVE bounty: title" |
| VE-32 | CLOSED bounty edit any field | CLOSED bounty, try to update `maxSubmissions` | 400, "Cannot edit a closed bounty" |
| VE-33 | Acknowledge visibility without postVisibilityRule set | Draft bounty, postVisibilityRule=null | 400, "Bounty has no visibility rule set" |
| VE-34 | Acknowledge visibility on LIVE bounty | LIVE bounty | 400, "Bounty must be in DRAFT or PAUSED status" |
| VE-35 | ~~Visibility acknowledgment reset on postVisibility update~~ | — | **REMOVED 2026-04-17** — the reset-on-update behavior was removed with the acknowledgment gate |

### 2.3 Abuse Prevention Tests

| # | Test Case | Attack Vector | Input | Expected Result |
|---|-----------|--------------|-------|-----------------|
| AP-01 | XSS in title | Stored XSS | `title: '<script>alert(1)</script>'` | Stored as plain text (sanitized on output), no script execution |
| AP-02 | XSS in custom eligibility rules | Stored XSS | `customRules: ['<img onerror=alert(1) src=x>']` | Stored as plain text, output-escaped |
| AP-03 | XSS in tag account | Reflected XSS | `tagAccount: '@<script>alert(1)</script>'` | 400, regex validation rejects |
| AP-04 | XSS in description | Stored XSS | `shortDescription: '<svg onload=alert(1)>'` | Stored as text, no execution |
| AP-05 | SQL injection in title | SQLi | `title: "'; DROP TABLE bounties; --"` | Stored literally (Prisma parameterized), no SQL execution |
| AP-06 | SQL injection in search | SQLi | `search: "' OR 1=1 --"` | Prisma parameterized query, no injection |
| AP-07 | Extremely large reward value | Overflow | `monetaryValue: 99999999999.99` | Accepted within Decimal(12,2) range |
| AP-08 | Reward value exceeding Decimal(12,2) | Overflow | `monetaryValue: 9999999999999.99` | 400, exceeds precision |
| AP-09 | Negative maxSubmissions | Logic bypass | `maxSubmissions: -1` | 400, must be positive |
| AP-10 | Invalid enum values in channels | Type confusion | `channels: { 'INVALID': ['STORY'] }` | 400, invalid channel |
| AP-11 | Invalid enum in reward type | Type confusion | `rewardType: 'FREE'` | 400, invalid reward type |
| AP-12 | Manipulated request with extra fields | Mass assignment | `{ ...validData, role: 'SUPER_ADMIN', status: 'LIVE' }` | Extra fields ignored, bounty created as DRAFT |
| AP-13 | Currency mismatch attempt | Logic bypass | Create bounty with USD, update to ZAR | Update succeeds (currency can be changed on DRAFT) |
| AP-14 | Prototype pollution in JSON fields | Object injection | `structuredEligibility: { '__proto__': { admin: true } }` | Rejected or safely ignored |
| AP-15 | Very large channel/format arrays | DoS | `channels: { INSTAGRAM: ['STORY' repeated 1000 times] }` | 400, duplicate formats rejected or array capped |
| AP-16 | Very large custom rules array | DoS | `customRules: [...100 strings of 500 chars]` | 400, max 5 rules |
| AP-17 | Non-string values in customRules | Type confusion | `customRules: [123, true, null]` | 400, each rule must be a string |
| AP-18 | BA accessing another org's bounty | RBAC bypass | BA from org-1 tries to update bounty from org-2 | 403, "Not authorized" |
| AP-19 | Participant creating bounty | RBAC bypass | PARTICIPANT role calls POST /bounties | 403, role check |
| AP-20 | NaN/Infinity as monetaryValue | Type confusion | `monetaryValue: NaN` or `Infinity` | 400, must be a valid positive number |

### 2.4 Integration Scenarios

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| IS-01 | Create then read back | POST /bounties, GET /bounties/:id | All fields match, rewards array populated |
| IS-02 | Create with rewards verifies BountyReward rows | POST /bounties with 2 rewards | prisma.bountyReward.createMany called with correct data |
| IS-03 | Update rewards on DRAFT replaces all | PATCH /bounties/:id with new rewards | Old rewards deleted, new rewards inserted |
| IS-04 | Update restricted fields on LIVE bounty | Set status to LIVE, PATCH with title | 400, "Cannot edit these fields on a LIVE bounty: title" |
| IS-05 | Delete DRAFT with rewards | Create bounty with rewards, DELETE /bounties/:id | Bounty soft-deleted, cascade handles rewards |
| IS-06 | List bounties with new fields | Create 2 bounties, GET /bounties | List includes channels, currency, rewards, totalRewardValue |
| IS-07 | Full lifecycle: create, publish, pause, close (no acknowledge step after 2026-04-17) | Multiple API calls | Each transition succeeds, final status=CLOSED |
| IS-08 | ~~Visibility reset on update~~ | — | **REMOVED 2026-04-17** — update no longer touches visibilityAcknowledged |
| IS-09 | Legacy field population on create | POST with structured data | rewardType, rewardValue, rewardDescription, eligibilityRules all populated |
| IS-10 | LIVE bounty allows maxSubmissions update | Set bounty LIVE, PATCH maxSubmissions | 200, maxSubmissions updated |
| IS-11 | LIVE bounty allows custom rules append | Set bounty LIVE, PATCH with additional custom rules | 200, custom rules extended (not replaced) |

---

## 3. Test Implementation Files

### File Structure

```
apps/api/src/modules/bounties/__tests__/
  create-bounty.service.spec.ts      # Create bounty happy paths + validation
  update-bounty.service.spec.ts      # Update bounty happy paths + field restrictions
  bounty-rewards.service.spec.ts     # Reward line CRUD, limits, validation
  bounty-channels.service.spec.ts    # Channel selection validation
  bounty-visibility.service.spec.ts  # Post visibility rules, acknowledgment, reset
  bounty-eligibility.service.spec.ts # Structured eligibility validation
  bounty-engagement.service.spec.ts  # Engagement requirements validation
  bounty-status.service.spec.ts      # State machine transitions, DRAFT->LIVE gate
  bounty-abuse.service.spec.ts       # XSS, SQLi, overflow, RBAC bypass attempts
```

Each file uses the existing test pattern from `bounties.service.spec.ts`:
- Jest with `TestingModule`
- Mocked `PrismaService` and `AuditService`
- `AuthenticatedUser` fixtures for PARTICIPANT, BA, SA
- `describe/it` structure with clear scenario naming
