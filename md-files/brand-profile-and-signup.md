────────────────────────
BRAND PROFILE PAGE & SIGN-UP FLOW
────────────────────────
Status: SPEC DRAFT
Date: 2026-04-09

This document specifies the Brand Profile Page (public-facing), the updated sign-up flow
to support brand accounts, multi-brand management, and the navigation changes required
for both Hunters and Brand Admins.

────────────────────────
1. BRAND PROFILE PAGE
────────────────────────

1.1 PURPOSE
─────────
A public-facing page where Hunters can view a Brand's identity, track record,
interests, and social presence. Accessible at `/brands/:brandId`.

1.2 UI COMPONENTS
─────────────────

┌─────────────────────────────────────────────────────────────────┐
│  COVER PHOTO (full-width banner, 1200×300 recommended)          │
│                                                                  │
│  ┌──────┐                                                        │
│  │ LOGO │  Brand Name                    [ Message Brand ]       │
│  │64×64 │  @handle · Industry/Category    (toggle-controlled)    │
│  └──────┘                                                        │
├─────────────────────────────────────────────────────────────────┤
│  Bio (short text, max 500 chars)                                 │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────────┐  ┌────────────────────┐  │
│  │ Total Amount │  │ Achievement Rate │  │ Bounties Posted    │  │
│  │ R 45,000     │  │ 72%              │  │ 18                 │  │
│  └─────────────┘  └──────────────────┘  └────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  Target Interests: [ Fitness ] [ Food ] [ Tech ] [ Fashion ]    │
├─────────────────────────────────────────────────────────────────┤
│  Social Links: Instagram · TikTok · Facebook · Website          │
├─────────────────────────────────────────────────────────────────┤
│  [ Active Bounties ]  [ Past Bounties ]                         │
│  Bounty cards (LIVE = clickable / PAST = disabled, greyed out)  │
└─────────────────────────────────────────────────────────────────┘

1.3 COMPONENT BREAKDOWN
────────────────────────

COVER PHOTO
- Full-width banner image at top of profile
- Default placeholder if none uploaded (branded gradient or pattern)
- Brand Admin can upload/replace via profile edit
- Accepted formats: JPEG, PNG, WebP
- Max file size: 5MB
- Recommended dimensions: 1200×300px (4:1 aspect ratio)
- Cropped/scaled to fit on display

BRAND LOGO
- Displayed overlapping bottom-left of cover photo
- Circular or rounded-square crop (64×64 display, upload at 256×256 min)
- Accepted formats: JPEG, PNG, WebP
- Max file size: 2MB
- Falls back to first letter of brand name if not set

BRAND NAME & HANDLE
- Brand name (from Brand.name)
- Optional handle/slug for URL-friendly brand identifier

BIO
- Short brand description, max 500 characters
- Plain text only (no markdown/HTML)
- Editable by Brand Admin from profile edit page
- Displayed below the header area

STATS CARDS (read-only, computed)
- Total Amount: Sum of all reward values across all bounties posted by this brand
  - Calculation: SUM(Bounty.rewardLines[].value) WHERE Bounty.brandId = brand.id
  - Displayed in brand's primary currency (ZAR default)
  - Format: "R 45,000" with thousands separator
- Achievement Rate: Percentage of approved submissions vs total submissions received
  - Calculation: (COUNT submissions WHERE status = APPROVED) / (COUNT all submissions) × 100
  - Scoped to all bounties belonging to this brand
  - Displayed as percentage with one decimal: "72.3%"
  - Show "No submissions yet" if denominator is zero
- Bounties Posted: Total count of bounties created by this brand (all statuses)
  - Calculation: COUNT(Bounty) WHERE brandId = brand.id

TARGET INTERESTS
- Array of interest tags the brand is targeting for campaigns
- Displayed as PrimeReact Chip/Tag components
- Uses the same interest taxonomy as Hunter interests (HUNTER_INTERESTS constant)
- Brand Admin selects these during profile setup/edit
- Helps Hunters discover relevant brands

SOCIAL PROFILE LINKS
- Links to the brand's social media profiles
- Platforms: Instagram, TikTok, Facebook, X (Twitter), Website
- Displayed as icon links (platform icon + handle)
- Opens in new tab
- Optional — only show platforms that have been configured

MESSAGE BRAND BUTTON
- PrimeReact Button component, prominent placement in header area
- Opens a new conversation with the brand (uses existing Conversation/Message system)
- Visibility controlled by a toggle the Brand Admin sets:
  - messagingEnabled: Boolean (default: true)
  - When OFF: button is hidden, Hunters cannot initiate messages to this brand
  - When ON: button is visible, clicking opens a new or existing conversation
- Brand Admin toggles this from their brand settings/edit page
- Label: "Message Brand" (or "Message" on mobile)

BOUNTIES SECTION (tabbed)
- Two tabs: "Active Bounties" and "Past Bounties"
- Active Bounties tab (default):
  - List of LIVE bounties belonging to this brand
  - Displayed as bounty cards (reuse existing BountyCard component)
  - Clickable — navigates to /bounties/:bountyId
  - Sorted by createdAt descending (newest first)
  - Paginated if more than 6 bounties
  - Shows empty state: "This brand has no active bounties" if none are live
- Past Bounties tab:
  - List of CLOSED and PAUSED bounties belonging to this brand
  - Displayed as bounty cards with DISABLED styling:
    - Reduced opacity (opacity: 0.6)
    - No hover effect, cursor: default (not pointer)
    - NOT clickable — no navigation on click
    - Status badge shown on card (e.g. "Closed", "Paused")
    - Greyed-out reward amount
  - Sorted by updatedAt descending (most recently closed first)
  - Paginated if more than 6 bounties
  - Shows empty state: "This brand has no past bounties"
  - Purpose: gives Hunters visibility into the brand's history and track record
    without allowing interaction with expired campaigns

1.4 PAGE STATES
───────────────

LOADING: Skeleton placeholders for cover photo, logo, stats, and bounty list
ERROR: "Brand not found" or "This brand is no longer active" for suspended/inactive orgs
EMPTY: Default placeholders for missing optional fields (cover photo, bio, social links)
OWN PROFILE: If the logged-in user is the Brand Admin, show an "Edit Profile" button
             instead of (or alongside) the Message button

1.5 RBAC
────────

- Any authenticated user (Hunter or Brand Admin) can VIEW a brand profile
- Only Brand Admins who are members of the brand can EDIT the profile
- Super Admins can view all brand profiles
- Suspended brands show a "This brand is currently unavailable" state

────────────────────────
2. DATA MODEL CHANGES
────────────────────────

2.1 ORGANISATION TABLE — NEW FIELDS

| Field              | Type       | Default  | Description                                         |
|--------------------|------------|----------|-----------------------------------------------------|
| coverPhotoUrl      | String?    | null     | URL to uploaded cover photo                         |
| bio                | String?    | null     | Short brand description (max 500 chars)             |
| handle             | String?    | null     | URL-friendly brand identifier (unique, optional)    |
| targetInterests    | Json?      | null     | String array of interest categories                 |
| websiteUrl         | String?    | null     | Brand website URL                                   |
| socialLinks        | Json?      | null     | Object: { instagram?, tiktok?, facebook?, x? }      |
| messagingEnabled   | Boolean    | true     | Whether Hunters can message this brand              |

2.2 NO CHANGES TO USER TABLE

The User model remains unchanged. Brand ownership is determined through the existing
BrandMember relationship. A single user can be a member of multiple brands
(see Section 3 below).

────────────────────────
3. BRAND SIGN-UP FLOW CHANGES
────────────────────────

3.1 OVERVIEW
────────────

The current sign-up flow remains the default "Hunter" sign-up. A new toggle is added
to allow users to indicate they want to create a brand during registration.

3.2 UPDATED SIGN-UP FORM
─────────────────────────

STEP 1 — DETAILS (existing fields + new toggle)

| Field             | Type     | Required | Notes                                    |
|-------------------|----------|----------|------------------------------------------|
| firstName         | String   | Yes      | Existing                                 |
| lastName          | String   | Yes      | Existing                                 |
| email             | String   | Yes      | Existing                                 |
| password          | String   | Yes      | Existing                                 |
| registerAsBrand   | Boolean  | No       | Toggle/checkbox: "I want to register a Brand" |

- Default: registerAsBrand = false (Hunter sign-up)
- When toggled ON, show additional brand fields inline:

| Field             | Type     | Required | Notes                                    |
|-------------------|----------|----------|------------------------------------------|
| brandName         | String   | Yes      | Brand name                        |
| brandContactEmail | String   | No       | Defaults to user email if not provided   |

STEP 2 — OTP VERIFICATION (unchanged)

- Same OTP flow as current implementation
- On successful OTP verification:
  - If registerAsBrand = false:
    - Create User with role = PARTICIPANT (existing behaviour)
  - If registerAsBrand = true:
    - Create User with role = BUSINESS_ADMIN
    - Create Brand with provided brandName and contactEmail
    - Create BrandMember linking user to org with role = OWNER
    - Redirect to brand profile setup page (cover photo, logo, bio, interests)

3.3 BUSINESS RULES
───────────────────

- A user who signs up as a Hunter can later create brands (see Section 4)
- A user who signs up as a Brand also has full Hunter capabilities
- The registerAsBrand toggle only determines the INITIAL account setup
- Role assignment: When a Hunter creates their first brand, their role changes
  to BUSINESS_ADMIN (they retain all Hunter capabilities)
- Email verification is required before brand creation is finalised

────────────────────────
4. MULTI-BRAND MANAGEMENT
────────────────────────

4.1 OVERVIEW
────────────

Any logged-in user can create and manage multiple brands. This uses the existing
Brand and BrandMember models — each brand is an Brand, and
a user can be a member of multiple Brands.

4.2 "BRANDS" MENU ITEM
───────────────────────

Add a "Brands" button to the BUSINESS_ADMIN navigation menu:

| Menu Item | Route           | Icon              | Description                   |
|-----------|-----------------|-------------------|-------------------------------|
| Brands    | /business/brands | pi pi-building   | List and manage user's brands |

This page shows:
- List of all brands the user is a member of
- Each card shows: logo, brand name, status, bounty count
- "Create New Brand" button at the top
- Click a brand to enter that brand's management context

4.3 BRAND CONTEXT SWITCHING
────────────────────────────

When a user has multiple brands, they need to select which brand they are
operating as. This affects:
- Which bounties they see in their dashboard
- Which brand is used when creating a new bounty
- Which brand's submissions they review

Implementation:
- Store selected brand (brandId) in session/local state
- Show brand selector in sidebar header (logo + name, dropdown to switch)
- Default to most recently used brand on login

4.4 CREATE BRAND FLOW (for existing users)
───────────────────────────────────────────

Route: /business/brands/create

| Field             | Type     | Required | Notes                                    |
|-------------------|----------|----------|------------------------------------------|
| brandName         | String   | Yes      | Brand name (max 200 chars)        |
| contactEmail      | String   | Yes      | Brand contact email                      |
| logo              | File     | No       | Upload during creation or later          |
| bio               | String   | No       | Short description (max 500 chars)        |

On submit:
- Create Brand
- Create BrandMember (userId, brandId, role = OWNER)
- If user's role is PARTICIPANT, upgrade to BUSINESS_ADMIN
- Redirect to brand profile edit page for full setup
- Audit log: brand.create

────────────────────────
5. BOUNTY CREATION — BRAND SELECTOR
────────────────────────

5.1 CHANGE
──────────

When creating a bounty, the first field must be a brand selector dropdown:

| Field         | Type     | Required | Notes                                         |
|---------------|----------|----------|-----------------------------------------------|
| brandId| String   | Yes      | Dropdown: "Select Brand" — lists all orgs the |
|               |          |          | user is an OWNER or MEMBER of                 |

- If the user only has one brand, auto-select it but still show the dropdown
  (so the user sees which brand the bounty belongs to)
- If the user has no brands, show a prompt: "You need to create a brand first"
  with a link to /business/brands/create
- The selected brand determines:
  - Which brand the bounty belongs to
  - Which subscription tier applies (for admin fee calculation)
  - Which brand profile the bounty links to

5.2 UI PLACEMENT
────────────────

The brand selector appears as the FIRST field in the bounty creation form,
above the existing title field. Use a PrimeReact Dropdown component with:
- Brand logo as item template (icon + name)
- Placeholder: "Select a brand for this bounty"
- Validation: required, show error if not selected on submit

────────────────────────
6. HUNTER NAVIGATION — BROWSE BRANDS
────────────────────────

6.1 NEW MENU ITEM
──────────────────

Add a "Browse Brands" button to the PARTICIPANT navigation menu:

| Menu Item      | Route          | Icon            | Description                    |
|----------------|----------------|-----------------|--------------------------------|
| Browse Brands  | /brands        | pi pi-building  | Discover and explore brands    |

6.2 BROWSE BRANDS PAGE
───────────────────────

Route: /brands

A discovery page where Hunters can browse all active brands on the platform.

LAYOUT:
- Search bar at top (search by brand name)
- Filter by interest categories (multi-select chips)
- Grid of brand cards (3 columns desktop, 2 tablet, 1 mobile)

BRAND CARD COMPONENT:
- Cover photo (cropped thumbnail) or gradient placeholder
- Logo (circular, small)
- Brand name
- Bio (truncated to 2 lines)
- Achievement rate badge
- Interest tags (first 3, "+N more" if more)
- Click navigates to /brands/:brandId (Brand Profile Page)

SORTING:
- Default: by achievement rate (highest first)
- Options: newest, most bounties, alphabetical

PAGINATION:
- Infinite scroll or paginated (20 per page)

────────────────────────
7. NAVIGATION SUMMARY
────────────────────────

7.1 PARTICIPANT (HUNTER) MENU — UPDATED

| Menu Item        | Route              | Change   |
|------------------|--------------------|----------|
| Inbox            | /inbox             | Existing |
| Browse Bounties  | /bounties          | Existing |
| Browse Brands    | /brands            | NEW      |
| My Submissions   | /submissions       | Existing |
| My Disputes      | /disputes          | Existing |
| Wallet           | /wallet            | Existing |
| Profile          | /profile           | Existing |

7.2 BUSINESS ADMIN MENU — UPDATED

| Menu Item    | Route                  | Change   |
|--------------|------------------------|----------|
| Inbox        | /business/inbox        | Existing |
| Dashboard    | /business/dashboard    | Existing |
| Brands       | /business/brands       | NEW      |
| Bounties     | /business/bounties     | Existing |
| Review Center| /business/reviews      | Existing |
| Hunters      | /business/hunters      | Existing |
| Disputes     | /business/disputes     | Existing |
| Profile      | /business/profile      | Existing |

Note: "Brand" menu item is replaced by "Brands" which provides
the same functionality but supports multiple brands.

────────────────────────
8. API ENDPOINTS (NEW/MODIFIED)
────────────────────────

8.1 BRAND PROFILE (PUBLIC)

| Method | Route                          | Auth     | Description                    |
|--------|--------------------------------|----------|--------------------------------|
| GET    | /brands                        | Any      | List active brands (paginated) |
| GET    | /brands/:id                    | Any      | Get brand profile with stats   |
| GET    | /brands/:id/bounties           | Any      | List brand's live bounties     |

8.2 BRAND MANAGEMENT (AUTHENTICATED)

| Method | Route                          | Auth          | Description                    |
|--------|--------------------------------|---------------|--------------------------------|
| GET    | /my/brands                     | Authenticated | List user's brands             |
| POST   | /my/brands                     | Authenticated | Create new brand               |
| PATCH  | /my/brands/:id                 | Brand Owner   | Update brand profile           |
| POST   | /my/brands/:id/cover-photo     | Brand Owner   | Upload cover photo             |
| POST   | /my/brands/:id/logo            | Brand Owner   | Upload logo                    |
| PATCH  | /my/brands/:id/messaging       | Brand Owner   | Toggle messaging on/off        |

8.3 BRAND STATS (COMPUTED)

The GET /brands/:id response includes computed fields:

```json
{
  "id": "uuid",
  "name": "Brand Name",
  "handle": "brandname",
  "logo": "https://...",
  "coverPhotoUrl": "https://...",
  "bio": "Short brand description...",
  "targetInterests": ["Fitness & Wellness", "Tech & Gaming"],
  "socialLinks": {
    "instagram": "https://instagram.com/brand",
    "tiktok": "https://tiktok.com/@brand"
  },
  "websiteUrl": "https://brand.com",
  "messagingEnabled": true,
  "stats": {
    "totalAmount": 45000,
    "currency": "ZAR",
    "achievementRate": 72.3,
    "totalBounties": 18,
    "activeBounties": 5,
    "totalSubmissions": 120,
    "approvedSubmissions": 87
  },
  "createdAt": "2026-01-15T10:00:00Z"
}
```

8.4 SIGN-UP (MODIFIED)

The existing POST /auth/signup endpoint gains an optional body extension:

```json
{
  "firstName": "Nic",
  "lastName": "Carl",
  "email": "nic@example.com",
  "password": "...",
  "registerAsBrand": true,
  "brandName": "My Brand",
  "brandContactEmail": "hello@mybrand.com"
}
```

When registerAsBrand = true:
- Validate brandName is provided and within FIELD_LIMITS.ORG_NAME_MAX
- After user creation + OTP verification, create Brand + BrandMember
- Set user role to BUSINESS_ADMIN

────────────────────────
9. ASSUMPTIONS & CONSTRAINTS
────────────────────────

1. A user can own/belong to MULTIPLE brands (brands). This is already
   supported by the BrandMember linking table.
2. The existing Brand model is reused — "Brand" is a UI/UX term,
   "Brand" remains the backend entity name.
3. Stats (totalAmount, achievementRate) are computed at query time for now.
   If performance becomes an issue, introduce cached/materialised stats.
4. Cover photo and logo uploads use the existing FileUpload infrastructure.
5. The messaging toggle uses the existing Conversation system — it only
   controls whether NEW conversations can be initiated by Hunters.
6. Brand handle is optional for MVP. If provided, it must be unique and
   URL-safe (lowercase alphanumeric + hyphens).
7. When a Hunter's role is upgraded to BUSINESS_ADMIN upon creating their
   first brand, they retain all Hunter capabilities (browse bounties,
   submit proof, wallet, etc.).
8. The "Browse Brands" page is accessible to all authenticated users,
   not just Hunters.

────────────────────────
10. OUT OF SCOPE (NOT IN THIS SPEC)
────────────────────────

- Brand verification/badge system
- Brand analytics dashboard (impressions, engagement)
- Brand-to-brand messaging
- Brand team management (inviting other users to manage a brand)
- Brand subscription management from the profile page
- Public brand profile for unauthenticated users
- Brand ratings/reviews by Hunters
