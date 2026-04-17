# Create Bounty - Product Specification

## Overview

This document defines the complete data model, business rules, state machine, and API contract for the redesigned Create Bounty flow. The redesign adds channel-specific content requirements, structured rewards, eligibility rules, engagement requirements, post visibility rules, and AI content permissions.

**Scope**: This spec covers only the Create Bounty form and its supporting APIs. Submission review, payout, and participant-facing bounty display are not in scope.

> **Deprecation notice (2026-04-17)** — The `visibilityAcknowledged` field and the `POST /bounties/:id/acknowledge-visibility` endpoint are **deprecated**. The acknowledgment toggle ("I understand and confirm the post visibility requirements above") was removed from the brand UX, and the backend no longer enforces `visibilityAcknowledged = true` as a DRAFT → LIVE precondition. The column is still stored on the `Bounty` model for historical rows but is ignored for all business rules going forward. References to it below are kept for historical context — they describe the pre-2026-04-17 behavior.

---

## 1. Data Model

### 1.1 Bounty (updated fields)

The existing `Bounty` model is extended with these fields (already present in `schema.prisma`):

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `currency` | `Currency` enum | `ZAR` | Currency for all monetary reward values |
| `channels` | `Json?` | `null` | Selected channels and their post formats (see 1.2) |
| `aiContentPermitted` | `Boolean` | `false` | Whether AI-generated content is allowed |
| `engagementRequirements` | `Json?` | `null` | Tag/mention/comment requirements (see 1.5) |
| `postVisibilityRule` | `PostVisibilityRule?` | `null` | MUST_NOT_REMOVE or MINIMUM_DURATION |
| `postMinDurationValue` | `Int?` | `null` | Duration value (only when rule = MINIMUM_DURATION) |
| `postMinDurationUnit` | `DurationUnit?` | `null` | HOURS, DAYS, or WEEKS |
| `structuredEligibility` | `Json?` | `null` | Predefined + custom eligibility rules (see 1.4) |
| `visibilityAcknowledged` | `Boolean` | `false` | BA confirmed they understand the visibility rule |

**Legacy fields retained for backward compatibility** (see Section 6):
- `rewardType` - populated from first reward line
- `rewardValue` - populated from total reward value
- `rewardDescription` - populated from reward summary
- `eligibilityRules` - populated from structured eligibility text

### 1.2 Channel Selection

Stored in `Bounty.channels` as JSON. TypeScript type: `ChannelSelection` (already defined in `bounty.dto.ts`).

```typescript
type ChannelSelection = Partial<Record<SocialChannel, PostFormat[]>>;
```

**Example value**:
```json
{
  "INSTAGRAM": ["STORY", "REEL"],
  "TIKTOK": ["VIDEO_POST"]
}
```

**Constraints**:
- At least one channel must be selected.
- Each channel must have at least one post format selected.
- Post formats must be valid for the selected channel (see Section 2.1).

### 1.3 BountyReward (child table)

Already defined in `schema.prisma`. One bounty can have multiple reward lines.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `String` (UUID) | Primary key |
| `bountyId` | `String` | FK to Bounty |
| `rewardType` | `RewardType` enum | CASH, PRODUCT, SERVICE, OTHER |
| `name` | `String` (max 200) | Description of the reward (e.g. "R50 Cash", "Free T-Shirt") |
| `monetaryValue` | `Decimal(12,2)` | Monetary value of this reward line |
| `sortOrder` | `Int` | Display order (0-indexed) |
| `createdAt` | `DateTime` | Creation timestamp |

### 1.4 Structured Eligibility

Stored in `Bounty.structuredEligibility` as JSON. TypeScript type: `StructuredEligibilityInput`.

```typescript
interface StructuredEligibilityInput {
  minFollowers?: number | null;
  publicProfile?: boolean;
  minAccountAgeDays?: number | null;
  locationRestriction?: string | null;
  noCompetingBrandDays?: number | null;
  customRules?: string[];
}
```

**Predefined rules** (all optional):

| Rule | Type | Constraint |
|------|------|-----------|
| `minFollowers` | `number` | Positive integer, null = no minimum |
| `publicProfile` | `boolean` | true = profile must be public |
| `minAccountAgeDays` | `number` | Positive integer, account must be at least N days old |
| `locationRestriction` | `string` | Free text, max 200 chars (e.g. "South Africa only") |
| `noCompetingBrandDays` | `number` | No competing brand posts in last N days |

**Custom rules**:
- Array of free-text strings.
- Maximum 5 custom rules.
- Each rule max 500 characters.

### 1.5 Engagement Requirements

Stored in `Bounty.engagementRequirements` as JSON. TypeScript type: `EngagementRequirementsInput`.

```typescript
interface EngagementRequirementsInput {
  tagAccount?: string | null;
  mention?: boolean;
  comment?: boolean;
}
```

| Field | Type | Description |
|-------|------|-------------|
| `tagAccount` | `string` or `null` | Social account handle to tag (e.g. `@acmecorp`). Must start with `@` if provided. Max 100 chars. |
| `mention` | `boolean` | Whether the post must mention the brand |
| `comment` | `boolean` | Whether the participant must leave a comment |

### 1.6 Post Visibility

Stored as separate flat fields on `Bounty` (not JSON). TypeScript input type: `PostVisibilityInput`.

```typescript
interface PostVisibilityInput {
  rule: PostVisibilityRule;
  minDurationValue?: number | null;
  minDurationUnit?: DurationUnit | null;
}
```

| Rule | Description | Duration fields |
|------|-------------|-----------------|
| `MUST_NOT_REMOVE` | Post must never be deleted | Not applicable (null) |
| `MINIMUM_DURATION` | Post must stay up for a minimum time | `minDurationValue` + `minDurationUnit` required |

---

## 2. Business Rules Engine

### 2.1 Channel to Post Format Mapping

Defined in `CHANNEL_POST_FORMATS` constant (`packages/shared/src/constants.ts`):

| Channel | Allowed Post Formats |
|---------|---------------------|
| `INSTAGRAM` | STORY, REEL, FEED_POST |
| `FACEBOOK` | FEED_POST, STORY, REEL |
| `TIKTOK` | VIDEO_POST |

**Validation rule**: When a BA selects a channel, only the formats listed above may be selected. If a format is not in the mapping, the API rejects the request with a 400 error.

**Frontend behavior**: The format checkboxes should be dynamically rendered based on the selected channel. Deselecting a channel removes its formats from the payload.

### 2.2 Post Visibility Validation

| Scenario | Validation |
|----------|-----------|
| `rule = MUST_NOT_REMOVE` | `minDurationValue` and `minDurationUnit` must be null or omitted |
| `rule = MINIMUM_DURATION` | `minDurationValue` must be a positive integer; `minDurationUnit` must be a valid `DurationUnit` |
| No rule selected | `postVisibilityRule`, `postMinDurationValue`, `postMinDurationUnit` are all null |

**Duration constraints**:
- HOURS: 1-168 (up to 1 week in hours)
- DAYS: 1-90
- WEEKS: 1-12

### 2.3 Reward Constraints

Constants from `BOUNTY_REWARD_LIMITS`:
- Maximum **10** reward lines per bounty.
- Each reward line `name` max **200** characters.

**Per-line validation**:
- `rewardType`: required, must be a valid `RewardType` enum value.
- `name`: required, 1-200 characters.
- `monetaryValue`: required, must be a positive number (> 0), up to 2 decimal places.

**Aggregate rules**:
- At least **1** reward line is required.
- `totalRewardValue` is computed server-side as the sum of all `monetaryValue` fields.
- All reward lines share the same `currency` (set at bounty level).

**Sort order**: The `sortOrder` field is assigned server-side based on the array index (0-based) of the rewards in the request payload.

### 2.4 Eligibility Rule Constraints

Constants from `BOUNTY_REWARD_LIMITS`:
- Maximum **5** custom eligibility rules.
- Each custom rule max **500** characters.

**Predefined rule validation**:
- `minFollowers`: if provided, must be a positive integer.
- `publicProfile`: boolean, defaults to false if omitted.
- `minAccountAgeDays`: if provided, must be a positive integer.
- `locationRestriction`: if provided, 1-200 characters.
- `noCompetingBrandDays`: if provided, must be a positive integer.

**All predefined rules are optional.** The structured eligibility object itself is required in the create request but may have all fields null/empty (meaning "no specific eligibility requirements").

### 2.5 Engagement Requirement Validation

- `tagAccount`: if provided, must start with `@`, 2-100 characters total, alphanumeric + underscores + dots after the `@`.
- `mention`: boolean, defaults to false.
- `comment`: boolean, defaults to false.
- All three fields are optional; the object itself is required in the create request.

### 2.6 AI Content Permission

- `aiContentPermitted`: boolean, defaults to `false`.
- No additional validation. This is a simple toggle.

---

## 3. State Machine

### 3.1 Bounty Lifecycle

```
                 +-----------+
         +------>|   DRAFT   |
         |       +-----------+
         |             |
         |    (acknowledge visibility + all fields valid)
         |             |
         |             v
         |       +-----------+
         |       |   LIVE    |<------+
         |       +-----------+       |
         |          |     |          |
         |    pause |     | unpause  |
         |          v     |          |
         |       +-----------+       |
         |       |  PAUSED   |-------+
         |       +-----------+
         |          |
         |    close |      close
         |          v        |
         |       +-----------+
         |       |  CLOSED   |<--- (from LIVE)
         |       +-----------+
         |
         +--- (SA override can set any status)
```

### 3.2 Status Transitions (Business Admin)

| From | To | Preconditions |
|------|----|---------------|
| `DRAFT` | `LIVE` | All required fields populated (see §3.4) |
| `LIVE` | `PAUSED` | None |
| `PAUSED` | `LIVE` | None |
| `LIVE` | `CLOSED` | None (terminal) |
| `PAUSED` | `CLOSED` | None (terminal) |

**`CLOSED` is terminal.** A closed bounty cannot be reopened by a BA.

### 3.3 Visibility Acknowledgment Gate (DEPRECATED 2026-04-17)

> Historical: prior to 2026-04-17 the BA had to call `POST /bounties/:id/acknowledge-visibility` to set `visibilityAcknowledged = true` before publishing; changing `postVisibilityRule` on a DRAFT reset the flag, forcing re-acknowledgment. The acknowledgment toggle was removed from the brand UX and this gate is no longer enforced — the field is stored but ignored. The endpoint may still exist but is a no-op for business rules.

### 3.4 Required Fields for DRAFT to LIVE

All of the following must be non-null/non-empty:

| Field | Requirement |
|-------|------------|
| `title` | Non-empty string |
| `shortDescription` | Non-empty string |
| `fullInstructions` | Non-empty string |
| `category` | Non-empty string |
| `proofRequirements` | Non-empty string |
| `channels` | At least one channel with at least one format |
| `rewards` | At least one reward line (in `BountyReward` table) |
| `postVisibilityRule` | Must be set |
| `structuredEligibility` | Must be present (can have all null fields) |
| `engagementRequirements` | Must be present (can have all false/null fields) |
| `currency` | Must be set (has default ZAR) |

### 3.5 Edit Rules by Status

| Status | Editable Fields |
|--------|----------------|
| `DRAFT` | All fields |
| `LIVE` | `maxSubmissions`, `endDate`, `proofRequirements`, `structuredEligibility.customRules` (append only) |
| `PAUSED` | All fields (same as DRAFT) |
| `CLOSED` | No fields editable |

**Note on LIVE edits**: Channels, rewards, post visibility, engagement requirements, and core content (title, description, instructions) are locked once LIVE to prevent bait-and-switch.

---

## 4. API Contract

All endpoints below are under the base path `/api/v1`.

### 4.1 POST `/bounties` (Create Bounty - Updated)

Creates a new bounty with structured data. Bounty is created in `DRAFT` status.

**Access**: BA, SA
**Audit Log**: Yes

**Request Body**:
```json
{
  "title": "Share our new product on Instagram",
  "shortDescription": "Post a photo or reel featuring our product",
  "fullInstructions": "1. Unbox the product on camera\n2. Post to Instagram as a Reel\n3. Tag @acmecorp\n4. Submit the post URL",
  "category": "Social Media",
  "proofRequirements": "Submit the URL to your Instagram post. Post must be public.",
  "maxSubmissions": 50,
  "startDate": "2026-03-01T00:00:00.000Z",
  "endDate": "2026-04-01T00:00:00.000Z",
  "channels": {
    "INSTAGRAM": ["REEL", "FEED_POST"],
    "TIKTOK": ["VIDEO_POST"]
  },
  "rewards": [
    { "rewardType": "CASH", "name": "Cash reward", "monetaryValue": 50.00 },
    { "rewardType": "PRODUCT", "name": "Free sample pack", "monetaryValue": 150.00 }
  ],
  "postVisibility": {
    "rule": "MINIMUM_DURATION",
    "minDurationValue": 7,
    "minDurationUnit": "DAYS"
  },
  "structuredEligibility": {
    "minFollowers": 500,
    "publicProfile": true,
    "minAccountAgeDays": 90,
    "locationRestriction": "South Africa",
    "noCompetingBrandDays": null,
    "customRules": ["Must be 18 years or older"]
  },
  "currency": "ZAR",
  "aiContentPermitted": false,
  "engagementRequirements": {
    "tagAccount": "@acmecorp",
    "mention": true,
    "comment": false
  }
}
```

**Validation**: See Section 2 for all field-level validation rules.

**Response** `201 Created`:
```json
{
  "id": "bounty-uuid-new",
  "title": "Share our new product on Instagram",
  "shortDescription": "Post a photo or reel featuring our product",
  "fullInstructions": "...",
  "category": "Social Media",
  "rewardType": "CASH",
  "rewardValue": "200.00",
  "rewardDescription": "Cash reward, Free sample pack",
  "maxSubmissions": 50,
  "startDate": "2026-03-01T00:00:00.000Z",
  "endDate": "2026-04-01T00:00:00.000Z",
  "eligibilityRules": "Min 500 followers. Public profile required. Account age: 90+ days. Location: South Africa. Must be 18 years or older.",
  "proofRequirements": "Submit the URL to your Instagram post. Post must be public.",
  "status": "DRAFT",
  "brandId": "org-uuid-1",
  "createdById": "user-uuid-1",
  "createdAt": "2026-02-07T10:00:00.000Z",
  "updatedAt": "2026-02-07T10:00:00.000Z",
  "channels": {
    "INSTAGRAM": ["REEL", "FEED_POST"],
    "TIKTOK": ["VIDEO_POST"]
  },
  "currency": "ZAR",
  "aiContentPermitted": false,
  "engagementRequirements": {
    "tagAccount": "@acmecorp",
    "mention": true,
    "comment": false
  },
  "postVisibility": {
    "rule": "MINIMUM_DURATION",
    "minDurationValue": 7,
    "minDurationUnit": "DAYS"
  },
  "structuredEligibility": {
    "minFollowers": 500,
    "publicProfile": true,
    "minAccountAgeDays": 90,
    "locationRestriction": "South Africa",
    "noCompetingBrandDays": null,
    "customRules": ["Must be 18 years or older"]
  },
  "visibilityAcknowledged": false,
  "rewards": [
    {
      "id": "reward-uuid-1",
      "rewardType": "CASH",
      "name": "Cash reward",
      "monetaryValue": "50.00",
      "sortOrder": 0
    },
    {
      "id": "reward-uuid-2",
      "rewardType": "PRODUCT",
      "name": "Free sample pack",
      "monetaryValue": "150.00",
      "sortOrder": 1
    }
  ],
  "totalRewardValue": "200.00"
}
```

**Error Responses**:
- `400` - Validation error (invalid channel/format mapping, reward limits exceeded, etc.)
- `403` - Not a BA or SA

### 4.2 PATCH `/bounties/:id` (Update Bounty - Updated)

Updates bounty fields. Edit rules depend on bounty status (see Section 3.5).

**Access**: BA (own org), SA
**Audit Log**: Yes (with before/after state)

**Request Body** (all fields optional):
```json
{
  "title": "Updated title",
  "channels": {
    "INSTAGRAM": ["REEL"]
  },
  "rewards": [
    { "rewardType": "CASH", "name": "Updated cash reward", "monetaryValue": 75.00 }
  ],
  "postVisibility": {
    "rule": "MUST_NOT_REMOVE"
  },
  "structuredEligibility": {
    "minFollowers": 1000,
    "publicProfile": true,
    "customRules": ["Must be 18+", "No NSFW content"]
  },
  "currency": "USD",
  "aiContentPermitted": true,
  "engagementRequirements": {
    "tagAccount": "@acmecorp",
    "mention": true,
    "comment": true
  }
}
```

**Rewards update behavior**: When `rewards` is provided, the existing reward lines are **replaced entirely** (delete all existing, insert new). This is a full replacement, not a merge.

**Visibility acknowledgment reset (DEPRECATED 2026-04-17)**: Historically, if `postVisibility` was changed, `visibilityAcknowledged` was reset to `false`. This reset was removed along with the acknowledgment gate; the field is no longer touched on update.

**Response** `200 OK`: Full bounty object (same shape as `CreateBountyResponse`).

**Error Responses**:
- `400` - Validation error, field not editable in current status
- `403` - Not authorized
- `404` - Bounty not found

### 4.3 POST `/bounties/:id/acknowledge-visibility` (DEPRECATED 2026-04-17)

> Historical: this endpoint set `visibilityAcknowledged = true` and was required before a DRAFT → LIVE transition. The acknowledgment gate has been removed from the business rules. The endpoint may still exist in the controller for backward compatibility, but it is a no-op from a workflow perspective — callers no longer need to invoke it.

### 4.4 PATCH `/bounties/:id/status` (Updated)

Same as existing contract, with updated preconditions for DRAFT to LIVE.

**Updated precondition for `DRAFT -> LIVE`**:
- All required fields must be populated (see Section 3.4).

If the condition fails, the API returns `400` with a descriptive error listing the missing fields.

**Error response example**:
```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Cannot publish bounty. Missing required fields.",
  "details": [
    { "field": "rewards", "message": "At least one reward line is required" }
  ]
}
```

---

## 5. Computed Fields

These fields are computed server-side and included in responses but not stored as separate columns:

| Field | Computation |
|-------|-------------|
| `totalRewardValue` | `SUM(BountyReward.monetaryValue)` for all reward lines. Returned as string (decimal formatted). Null if no rewards. |
| `remainingSubmissions` | `maxSubmissions - submissionCount`. Null if `maxSubmissions` is null. |
| `postVisibility` | Assembled from `postVisibilityRule`, `postMinDurationValue`, `postMinDurationUnit` into a `PostVisibilityInput` object. Null if no rule set. |

---

## 6. Backward Compatibility

Legacy fields on `Bounty` are populated server-side from the new structured data when creating or updating a bounty. This ensures existing list/detail views and participant-facing pages continue to work.

### 6.1 Legacy Field Population Rules

| Legacy Field | Population Rule |
|-------------|----------------|
| `rewardType` | Set to the `rewardType` of the **first** reward line (sortOrder = 0). If multiple types exist, the first one wins. |
| `rewardValue` | Set to the **total** of all `BountyReward.monetaryValue` values. |
| `rewardDescription` | Comma-separated list of reward `name` values (e.g. "Cash reward, Free sample pack"). Truncated to 500 chars. |
| `eligibilityRules` | Generated text from structured eligibility. See 6.2. |

### 6.2 Eligibility Rules Text Generation

The `eligibilityRules` text field is generated from `structuredEligibility` as follows:

```
[If minFollowers] "Min {minFollowers} followers."
[If publicProfile] "Public profile required."
[If minAccountAgeDays] "Account age: {minAccountAgeDays}+ days."
[If locationRestriction] "Location: {locationRestriction}."
[If noCompetingBrandDays] "No competing brand posts in last {noCompetingBrandDays} days."
[For each customRule] "{customRule}."
```

Lines are joined with a space. If no rules are set, the text is "No specific eligibility requirements."

### 6.3 Legacy Field Override

If the API request includes **both** new structured fields and legacy fields, the structured fields take precedence. Legacy fields in the request body are ignored when structured fields are present.

If **only** legacy fields are provided (no `rewards`, `channels`, etc.), the bounty is created/updated in legacy mode, preserving backward compatibility for any existing API consumers.

---

## 7. Enums Reference

All enums are TypeScript `enum` types in `@social-bounty/shared/src/enums.ts` and mirrored in `schema.prisma`.

| Enum | Values |
|------|--------|
| `SocialChannel` | INSTAGRAM, FACEBOOK, TIKTOK |
| `PostFormat` | STORY, REEL, FEED_POST, VIDEO_POST |
| `PostVisibilityRule` | MUST_NOT_REMOVE, MINIMUM_DURATION |
| `DurationUnit` | HOURS, DAYS, WEEKS |
| `Currency` | ZAR, USD, GBP, EUR |
| `RewardType` | CASH, PRODUCT, SERVICE, OTHER |
| `BountyStatus` | DRAFT, LIVE, PAUSED, CLOSED |

---

## 8. Assumptions

1. **One currency per bounty**: All reward lines share the bounty-level currency. Mixed currencies within a single bounty are not supported.
2. **Reward replacement on update**: When rewards are updated, all existing reward lines are deleted and replaced. Partial reward updates are not supported for MVP simplicity.
3. **Visibility acknowledgment is per-draft**: Once a bounty goes LIVE and is later PAUSED, re-publishing (PAUSED -> LIVE) does not require re-acknowledgment unless the visibility rule was changed while paused.
4. **Channel URL validation at submission time**: The `CHANNEL_URL_PATTERNS` constant is used during submission validation, not during bounty creation. Bounty creation only validates channel/format mapping.
5. **Tag account format**: The `@` prefix is required. Validation uses a simple regex (`^@[a-zA-Z0-9_.]{1,99}$`). Platform-specific handle validation is out of scope for MVP.
6. **No cascading format removal**: If a channel is removed during an update, its formats are simply dropped. No warning or confirmation is needed at the API level (the frontend may show a confirmation).
7. **PostFormat enum not in Prisma**: `PostFormat` exists only in the shared TypeScript enums, not as a Prisma enum, because it is stored inside the JSON `channels` field.
8. **Custom eligibility rules are append-only when LIVE**: When a bounty is LIVE, custom rules can only be added, not removed or edited, to prevent changing terms after participants have started submitting.
