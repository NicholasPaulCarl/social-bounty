# Agency & Influencer Management — Feature Specification

> **Status:** Proposed
> **Author:** Product Team
> **Priority:** High — unlocks B2B revenue channel
> **Estimated Sprints:** 4-5 (8-10 weeks)

---

## 1. Executive Summary

This feature introduces an **Agency layer** to Social Bounty, enabling PR companies, talent managers, and influencer agencies to manage rosters of influencers, organize them into teams, coordinate campaign assignments across client bounties, track post performance in real-time, and generate branded reports for clients.

**Why this matters:**
- **For Agencies:** Centralized dashboard to manage 10-1000+ influencers, automate reporting, and demonstrate ROI to clients
- **For Businesses:** Access to managed, vetted influencer networks instead of individual participants — higher quality, lower risk
- **For Influencers:** Professional management, curated bounty assignments, streamlined workflow
- **For the Platform:** Higher-value B2B contracts, network effects, increased bounty completion rates

---

## 2. User Roles

### New Role: AGENCY_MANAGER

| Aspect | Detail |
|--------|--------|
| **Who** | PR company employees, talent managers, agency owners |
| **How they get the role** | Create an Agency (similar to how creating an Brand promotes to BUSINESS_ADMIN) |
| **What they can do** | Manage influencer roster, create teams, assign bounties, track posts, generate reports |
| **What they cannot do** | Create bounties (that's the business), approve submissions (that's the business), access super admin |

### Updated Role Hierarchy

```
SUPER_ADMIN          — Full platform control
  │
  ├── BUSINESS_ADMIN — Creates bounties, reviews submissions, manages payouts
  │
  ├── AGENCY_MANAGER — Manages influencers, assigns bounties, tracks & reports
  │
  └── PARTICIPANT    — Browses bounties, submits proof, tracks earnings
                       (Can also be a "managed influencer" under an agency)
```

### Dual-Role Participants

A Participant can be both:
- An independent participant (browses and submits on their own)
- A managed influencer under one or more agencies

Agency management is **additive** — it doesn't restrict the participant's independent capabilities. An influencer can still browse and submit to bounties on their own.

---

## 3. Data Model

### 3.1 New Models

```prisma
// ─── Agency (the talent management company) ───

model Agency {
  id           String       @id @default(uuid())
  name         String
  logo         String?
  website      String?
  contactEmail String
  description  String?      @db.Text
  status       AgencyStatus @default(ACTIVE)
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt

  // Relations
  managers     AgencyManager[]
  influencers  AgencyInfluencer[]
  teams        Team[]
  campaigns    Campaign[]
  reports      AgencyReport[]

  @@index([status])
  @@map("agencies")
}

// ─── Agency Managers (staff who run the agency) ───

model AgencyManager {
  id        String          @id @default(uuid())
  agencyId  String
  userId    String
  role      AgencyStaffRole @default(MANAGER)
  joinedAt  DateTime        @default(now())

  agency Agency @relation(fields: [agencyId], references: [id], onDelete: Cascade)
  user   User   @relation(fields: [userId], references: [id], onDelete: Restrict)

  @@unique([agencyId, userId])
  @@index([userId])
  @@map("agency_managers")
}

// ─── Agency Influencers (managed talent roster) ───

model AgencyInfluencer {
  id              String                @id @default(uuid())
  agencyId        String
  userId          String
  status          AgencyInfluencerStatus @default(INVITED)
  nickname        String?               // internal label ("Sarah - Fitness")
  notes           String?               @db.Text
  categories      Json?                 // ["fitness", "lifestyle", "fashion"]
  platformHandles Json?                 // { instagram: "@handle", tiktok: "@handle" }
  invitedAt       DateTime              @default(now())
  joinedAt        DateTime?
  removedAt       DateTime?

  agency      Agency             @relation(fields: [agencyId], references: [id], onDelete: Cascade)
  user        User               @relation(fields: [userId], references: [id], onDelete: Restrict)
  teamMembers TeamMember[]
  assignments CampaignAssignment[]
  postMetrics PostTracking[]

  @@unique([agencyId, userId])
  @@index([agencyId, status])
  @@index([userId])
  @@map("agency_influencers")
}

// ─── Teams (groupings within an agency) ───

model Team {
  id          String   @id @default(uuid())
  agencyId    String
  name        String
  description String?  @db.Text
  color       String?  // hex color for UI grouping
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  agency  Agency       @relation(fields: [agencyId], references: [id], onDelete: Cascade)
  members TeamMember[]

  @@index([agencyId])
  @@map("teams")
}

model TeamMember {
  id                 String   @id @default(uuid())
  teamId             String
  agencyInfluencerId String
  addedAt            DateTime @default(now())

  team       Team             @relation(fields: [teamId], references: [id], onDelete: Cascade)
  influencer AgencyInfluencer @relation(fields: [agencyInfluencerId], references: [id], onDelete: Cascade)

  @@unique([teamId, agencyInfluencerId])
  @@map("team_members")
}

// ─── Campaigns (coordinated work for a client) ───

model Campaign {
  id             String         @id @default(uuid())
  agencyId       String
  clientOrgId    String?        // the business Brand this campaign serves
  name           String
  description    String?        @db.Text
  brief          String?        @db.Text  // client's campaign brief
  startDate      DateTime?
  endDate        DateTime?
  budget         Decimal?       @db.Decimal(12, 2)
  currency       Currency       @default(ZAR)
  status         CampaignStatus @default(DRAFT)
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  agency      Agency               @relation(fields: [agencyId], references: [id], onDelete: Cascade)
  clientOrg   Brand?        @relation(fields: [clientOrgId], references: [id], onDelete: SetNull)
  bounties    CampaignBounty[]
  assignments CampaignAssignment[]
  reports     AgencyReport[]

  @@index([agencyId, status])
  @@index([clientOrgId])
  @@map("campaigns")
}

// ─── Campaign ↔ Bounty link ───

model CampaignBounty {
  id         String   @id @default(uuid())
  campaignId String
  bountyId   String
  addedAt    DateTime @default(now())

  campaign Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  bounty   Bounty   @relation(fields: [bountyId], references: [id], onDelete: Cascade)

  @@unique([campaignId, bountyId])
  @@map("campaign_bounties")
}

// ─── Campaign Assignments (influencer → bounty within a campaign) ───

model CampaignAssignment {
  id                 String           @id @default(uuid())
  campaignId         String
  agencyInfluencerId String
  bountyId           String
  status             AssignmentStatus @default(ASSIGNED)
  deadline           DateTime?
  managerNotes       String?          @db.Text
  createdAt          DateTime         @default(now())
  updatedAt          DateTime         @updatedAt

  campaign   Campaign         @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  influencer AgencyInfluencer @relation(fields: [agencyInfluencerId], references: [id], onDelete: Cascade)
  bounty     Bounty           @relation(fields: [bountyId], references: [id], onDelete: Cascade)

  @@unique([campaignId, agencyInfluencerId, bountyId])
  @@index([agencyInfluencerId])
  @@index([bountyId])
  @@map("campaign_assignments")
}

// ─── Post Tracking (real-time metrics per post) ───

model PostTracking {
  id                 String    @id @default(uuid())
  agencyInfluencerId String
  submissionId       String?   // links to the actual submission if one exists
  platform           SocialChannel
  postUrl            String
  postType           PostFormat?
  metrics            Json?     // { views, likes, comments, shares, saves, reach, impressions }
  screenshotUrl      String?   // proof screenshot
  postedAt           DateTime?
  lastTrackedAt      DateTime?
  status             PostStatus @default(LIVE)
  createdAt          DateTime   @default(now())
  updatedAt          DateTime   @updatedAt

  influencer AgencyInfluencer @relation(fields: [agencyInfluencerId], references: [id], onDelete: Cascade)
  submission Submission?      @relation(fields: [submissionId], references: [id], onDelete: SetNull)

  @@index([agencyInfluencerId])
  @@index([submissionId])
  @@index([platform, postedAt])
  @@map("post_tracking")
}

// ─── Agency Reports (generated for clients) ───

model AgencyReport {
  id          String     @id @default(uuid())
  agencyId    String
  campaignId  String?
  clientOrgId String?
  title       String
  reportType  ReportType
  dateFrom    DateTime
  dateTo      DateTime
  data        Json       // structured report data
  status      ReportStatus @default(DRAFT)
  sharedAt    DateTime?  // when shared with client
  sharedWith  Json?      // email addresses it was shared with
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  agency   Agency    @relation(fields: [agencyId], references: [id], onDelete: Cascade)
  campaign Campaign? @relation(fields: [campaignId], references: [id], onDelete: SetNull)

  @@index([agencyId])
  @@index([campaignId])
  @@map("agency_reports")
}
```

### 3.2 New Enums

```prisma
enum AgencyStatus {
  ACTIVE
  SUSPENDED
  INACTIVE
}

enum AgencyStaffRole {
  OWNER
  MANAGER
  VIEWER     // read-only access for junior staff
}

enum AgencyInfluencerStatus {
  INVITED    // invitation sent, not yet accepted
  ACTIVE     // accepted and active on roster
  PAUSED     // temporarily inactive
  REMOVED    // removed from roster
}

enum CampaignStatus {
  DRAFT      // being planned
  BRIEFED    // brief shared with team
  ACTIVE     // in progress
  COMPLETED  // all deliverables done
  ARCHIVED   // historical
}

enum AssignmentStatus {
  ASSIGNED   // influencer assigned to bounty
  ACCEPTED   // influencer accepted the assignment
  DECLINED   // influencer declined
  IN_PROGRESS // working on it
  SUBMITTED  // proof submitted (links to Submission)
  COMPLETED  // verified and done
}

enum PostStatus {
  SCHEDULED  // planned but not yet posted
  LIVE       // currently published
  REMOVED    // post was taken down
  EXPIRED    // past minimum duration
}

enum ReportType {
  CAMPAIGN   // single campaign performance
  MONTHLY    // monthly summary across campaigns
  INFLUENCER // individual influencer performance
  CLIENT     // aggregated report for a client
  CUSTOM     // ad-hoc report
}

enum ReportStatus {
  DRAFT      // being assembled
  READY      // ready to share
  SHARED     // sent to client
}
```

### 3.3 Model Relationships to Existing Schema

Add these relations to existing models:

```prisma
// Add to User model:
agencyManagements  AgencyManager[]
agencyMemberships  AgencyInfluencer[]

// Add to Brand model:
campaigns Campaign[]

// Add to Bounty model:
campaignBounties    CampaignBounty[]
campaignAssignments CampaignAssignment[]

// Add to Submission model:
postTracking PostTracking[]
```

---

## 4. Feature Breakdown

### 4.1 Agency Dashboard

**Route:** `/agency/dashboard`

| Metric | Source |
|--------|--------|
| Total Influencers | Count of ACTIVE AgencyInfluencer records |
| Active Campaigns | Count of ACTIVE Campaign records |
| Pending Assignments | Count of ASSIGNED/IN_PROGRESS CampaignAssignment records |
| Total Posts Tracked | Count of LIVE PostTracking records |
| Avg. Engagement Rate | Aggregated from PostTracking metrics |
| Revenue This Month | Sum from completed campaign budgets |

**Widgets:**
- Influencer roster summary (top performers by engagement)
- Active campaigns with progress bars
- Recent post activity feed
- Upcoming deadlines (assignment due dates)

---

### 4.2 Influencer Roster Management

**Route:** `/agency/roster`

| Function | Description |
|----------|-------------|
| **View Roster** | Paginated list of all managed influencers with avatar, handle, platform stats, team assignment, and status. |
| **Invite Influencer** | Send invitation by email. If the user exists on Social Bounty, link them. If not, send signup invitation with agency pre-link. |
| **Accept/Decline Invitation** | Influencer sees invitation on their dashboard and can accept or decline. Accepting adds them to the agency roster. |
| **Influencer Profile** | View detailed profile: platform handles, categories, historical performance, team memberships, active assignments, post history. |
| **Edit Influencer** | Update nickname, categories, notes, platform handles (agency-side metadata — doesn't change the user's profile). |
| **Pause Influencer** | Temporarily remove from active roster without deleting history. |
| **Remove Influencer** | Soft-remove from roster. Historical data preserved for reporting. |
| **Search & Filter** | Search by name/handle, filter by team, category, status, platform. |
| **Bulk Actions** | Assign multiple influencers to a campaign, move to team, export list. |

**Influencer Card Display:**
```
┌─────────────────────────────────────────┐
│  [Avatar]  Sarah Mitchell               │
│            @sarahfitness                 │
│            IG: 45.2K  TT: 128K          │
│  ┌───────┐ ┌─────────┐ ┌──────────┐    │
│  │Fitness│ │Lifestyle│ │Team Alpha│    │
│  └───────┘ └─────────┘ └──────────┘    │
│  3 active assignments  •  Avg ER: 4.2% │
└─────────────────────────────────────────┘
```

---

### 4.3 Team Management

**Route:** `/agency/teams`

| Function | Description |
|----------|-------------|
| **Create Team** | Name, description, color tag. Example teams: "Fitness Squad", "Cape Town Creators", "Client X Roster". |
| **Assign to Team** | Add/remove influencers from teams. An influencer can be in multiple teams. |
| **Team Overview** | See all members, collective stats, active campaigns, performance comparison. |
| **Team Performance** | Aggregated engagement metrics across all team members. |

**Use Cases for Teams:**
- **By Niche:** "Fitness", "Food", "Travel", "Tech"
- **By Client:** "Nike Team", "Woolworths Team"
- **By Campaign:** "Summer 2026 Campaign Creators"
- **By Location:** "Cape Town", "Johannesburg", "Durban"
- **By Tier:** "Macro Influencers (100K+)", "Micro (10-50K)", "Nano (<10K)"

---

### 4.4 Campaign Management

**Route:** `/agency/campaigns`

A Campaign is a coordinated effort that links an agency's influencers to a client's bounties.

| Function | Description |
|----------|-------------|
| **Create Campaign** | Name, client (Brand), brief, date range, budget. |
| **Link Bounties** | Connect existing bounties from the client's brand to the campaign. |
| **Assign Influencers** | Assign specific influencers to specific bounties within the campaign. Set individual deadlines and notes. |
| **Campaign Brief** | Rich text brief from the client — shared with assigned influencers. |
| **Campaign Timeline** | Visual timeline showing assignment dates, submission deadlines, post dates, reporting dates. |
| **Campaign Status** | Track progress: Draft → Briefed → Active → Completed → Archived. |
| **Budget Tracking** | Track campaign budget vs. actual spend (bounty rewards + agency fees). |

**Campaign Detail View:**
```
Campaign: Nike Summer Run 2026
Client: Nike South Africa
Budget: R 150,000  |  Status: Active  |  Dec 1 - Jan 31

Bounties (3):
  ├── Instagram Reel Challenge  │ 8/10 assigned │ 6 submitted │ 4 approved
  ├── TikTok Unboxing           │ 5/10 assigned │ 3 submitted │ 2 approved
  └── Story Takeover            │ 3/10 assigned │ 3 submitted │ 3 approved

Influencers (12):
  ├── Sarah Mitchell     │ 2 bounties │ 2 submitted │ ER: 5.1%
  ├── James Peterson     │ 3 bounties │ 1 submitted │ ER: 3.8%
  └── ...
```

---

### 4.5 Assignment Workflow

When an agency manager assigns an influencer to a bounty:

```
ASSIGNED ──→ ACCEPTED ──→ IN_PROGRESS ──→ SUBMITTED ──→ COMPLETED
               │
               └──→ DECLINED (manager can reassign)
```

| Step | What Happens |
|------|-------------|
| **Assigned** | Manager assigns influencer. Influencer gets a notification. |
| **Accepted** | Influencer accepts the assignment. Commitment confirmed. |
| **Declined** | Influencer declines. Manager can reassign to someone else. |
| **In Progress** | Influencer is working on the task. |
| **Submitted** | Influencer submits proof via the normal submission flow. Assignment auto-updates. |
| **Completed** | Business approves the submission. Assignment marked complete. |

**Influencer's View:**
The influencer sees their assignments on a new "My Assignments" section on their dashboard — separate from bounties they find independently. Assigned bounties show the agency name, campaign context, and manager notes.

---

### 4.6 Post Tracking

**Route:** `/agency/campaigns/:id/posts` or `/agency/roster/:id/posts`

| Function | Description |
|----------|-------------|
| **Add Post** | Manually add a post URL with platform, type, and posted date. |
| **Link to Submission** | Connect a tracked post to an existing submission for cross-referencing. |
| **Record Metrics** | Log views, likes, comments, shares, saves, reach, impressions. |
| **Update Metrics** | Re-check and update metrics over time (manual or future API integration). |
| **Screenshot Proof** | Upload a screenshot of the post metrics as proof for clients. |
| **Post Status** | Track if post is still live, was removed, or has expired past minimum duration. |
| **Metric History** | Track how metrics change over time (e.g., views at 24h, 48h, 7d, 30d). |

**Post Tracking Card:**
```
┌──────────────────────────────────────────────┐
│  IG Reel  •  @sarahfitness  •  Mar 15, 2026 │
│  instagram.com/reel/ABC123                    │
│                                               │
│  Views     Likes    Comments   Shares         │
│  45,200    3,841    287        512            │
│                                               │
│  Engagement Rate: 10.2%  •  Status: LIVE     │
│  Last checked: 2h ago                         │
└──────────────────────────────────────────────┘
```

**Future Enhancement:** API integration with Instagram Graph API, TikTok API, and Facebook API for automatic metric fetching.

---

### 4.7 Client Reporting

**Route:** `/agency/reports`

| Function | Description |
|----------|-------------|
| **Generate Report** | Create a report for a specific campaign, time period, influencer, or client. |
| **Report Templates** | Pre-built templates: Campaign Summary, Monthly Recap, Influencer Spotlight, Client Overview. |
| **Report Data** | Automatically aggregated from PostTracking, Submissions, and Campaign data. |
| **Share Report** | Share via email with client stakeholders. Generates a branded PDF or shareable link. |
| **Report History** | View all previously generated reports with status (Draft, Ready, Shared). |

**Campaign Report Contents:**
```
Campaign Summary Report
═══════════════════════

Campaign: Nike Summer Run 2026
Client: Nike South Africa
Period: Dec 1 - Jan 31, 2026

Overview:
  Total Influencers: 12
  Total Posts: 28
  Total Reach: 1,245,000
  Total Engagement: 89,420
  Avg. Engagement Rate: 7.18%
  Budget: R 150,000  |  Spend: R 142,500

Platform Breakdown:
  Instagram: 15 posts  │  Reach: 845K  │  ER: 6.9%
  TikTok:    10 posts  │  Reach: 380K  │  ER: 8.2%
  Facebook:   3 posts  │  Reach:  20K  │  ER: 3.1%

Top Performers:
  1. Sarah Mitchell  │  ER: 10.2%  │  4 posts  │  Reach: 180K
  2. James Peterson  │  ER: 8.7%   │  3 posts  │  Reach: 145K
  3. Thandi Mabaso   │  ER: 7.9%   │  3 posts  │  Reach: 122K

Deliverables:
  ✓ 28/30 posts delivered (93%)
  ✓ 24/28 approved by client (86%)
  ⏳ 4 pending review
```

---

### 4.8 Business-Side Integration

Businesses gain new capabilities when working with agencies:

| Function | Description |
|----------|-------------|
| **View Agency** | See which agency is managing influencers on their bounties. |
| **Invite Agency** | Invite a specific agency to participate in a bounty or campaign. |
| **Campaign Brief** | Write a campaign brief that's shared with the assigned agency. |
| **View Reports** | Access reports shared by the agency for their campaigns. |
| **Agency Badge** | Submissions from agency-managed influencers show an "Agency Managed" badge in the review center. |

---

## 5. Frontend Routes

### Agency Manager Navigation

```
/agency/dashboard              — Overview metrics, active campaigns, recent activity
/agency/roster                 — Influencer roster (list/grid view)
/agency/roster/invite          — Invite new influencer
/agency/roster/:id             — Influencer detail + performance
/agency/teams                  — Team management
/agency/teams/new              — Create team
/agency/teams/:id              — Team detail + members
/agency/campaigns              — Campaign list
/agency/campaigns/new          — Create campaign
/agency/campaigns/:id          — Campaign detail + assignments + posts
/agency/campaigns/:id/assign   — Assign influencers to bounties
/agency/campaigns/:id/posts    — Post tracking for campaign
/agency/campaigns/:id/report   — Generate campaign report
/agency/reports                — Report history
/agency/reports/:id            — Report detail / editor
/agency/clients                — Client relationships
/agency/settings               — Agency profile & settings
/agency/profile                — Personal profile
```

### Participant (Influencer) Additions

```
/my-assignments                — View agency assignments (new section)
/my-assignments/:id            — Assignment detail with campaign context
```

### Business Admin Additions

```
/business/agencies             — View agencies on your bounties (new section)
/business/campaigns/:id/report — View agency-shared reports
```

---

## 6. API Endpoints

### Agency Management

| Method | Route | Description | Role |
|--------|-------|-------------|------|
| POST | `/agencies` | Create agency | PARTICIPANT (promotes to AGENCY_MANAGER) |
| GET | `/agencies/:id` | Get agency details | AGENCY_MANAGER (own), SUPER_ADMIN |
| PATCH | `/agencies/:id` | Update agency | AGENCY_MANAGER (owner) |
| GET | `/agencies/:id/managers` | List agency staff | AGENCY_MANAGER |
| POST | `/agencies/:id/managers` | Add staff member | AGENCY_MANAGER (owner) |
| DELETE | `/agencies/:id/managers/:userId` | Remove staff | AGENCY_MANAGER (owner) |

### Roster Management

| Method | Route | Description | Role |
|--------|-------|-------------|------|
| GET | `/agencies/:id/influencers` | List roster | AGENCY_MANAGER |
| POST | `/agencies/:id/influencers/invite` | Invite influencer | AGENCY_MANAGER |
| PATCH | `/agencies/:id/influencers/:iid` | Update influencer metadata | AGENCY_MANAGER |
| PATCH | `/agencies/:id/influencers/:iid/status` | Pause/remove influencer | AGENCY_MANAGER |
| POST | `/influencer-invitations/:token/accept` | Accept invitation | PARTICIPANT |
| POST | `/influencer-invitations/:token/decline` | Decline invitation | PARTICIPANT |

### Team Management

| Method | Route | Description | Role |
|--------|-------|-------------|------|
| GET | `/agencies/:id/teams` | List teams | AGENCY_MANAGER |
| POST | `/agencies/:id/teams` | Create team | AGENCY_MANAGER |
| PATCH | `/agencies/:id/teams/:tid` | Update team | AGENCY_MANAGER |
| DELETE | `/agencies/:id/teams/:tid` | Delete team | AGENCY_MANAGER |
| POST | `/agencies/:id/teams/:tid/members` | Add member | AGENCY_MANAGER |
| DELETE | `/agencies/:id/teams/:tid/members/:mid` | Remove member | AGENCY_MANAGER |

### Campaign Management

| Method | Route | Description | Role |
|--------|-------|-------------|------|
| GET | `/agencies/:id/campaigns` | List campaigns | AGENCY_MANAGER |
| POST | `/agencies/:id/campaigns` | Create campaign | AGENCY_MANAGER |
| GET | `/agencies/:id/campaigns/:cid` | Campaign detail | AGENCY_MANAGER |
| PATCH | `/agencies/:id/campaigns/:cid` | Update campaign | AGENCY_MANAGER |
| POST | `/agencies/:id/campaigns/:cid/bounties` | Link bounty | AGENCY_MANAGER |
| DELETE | `/agencies/:id/campaigns/:cid/bounties/:bid` | Unlink bounty | AGENCY_MANAGER |
| POST | `/agencies/:id/campaigns/:cid/assign` | Assign influencer | AGENCY_MANAGER |
| PATCH | `/agencies/:id/campaigns/:cid/assignments/:aid` | Update assignment | AGENCY_MANAGER |
| GET | `/agencies/:id/campaigns/:cid/assignments` | List assignments | AGENCY_MANAGER |

### Post Tracking

| Method | Route | Description | Role |
|--------|-------|-------------|------|
| GET | `/agencies/:id/posts` | List all tracked posts | AGENCY_MANAGER |
| POST | `/agencies/:id/posts` | Add tracked post | AGENCY_MANAGER |
| PATCH | `/agencies/:id/posts/:pid` | Update post metrics | AGENCY_MANAGER |
| GET | `/agencies/:id/posts/:pid/history` | Metric history | AGENCY_MANAGER |
| GET | `/agencies/:id/influencers/:iid/posts` | Posts by influencer | AGENCY_MANAGER |

### Reporting

| Method | Route | Description | Role |
|--------|-------|-------------|------|
| GET | `/agencies/:id/reports` | List reports | AGENCY_MANAGER |
| POST | `/agencies/:id/reports` | Generate report | AGENCY_MANAGER |
| GET | `/agencies/:id/reports/:rid` | Report detail | AGENCY_MANAGER |
| PATCH | `/agencies/:id/reports/:rid` | Update report | AGENCY_MANAGER |
| POST | `/agencies/:id/reports/:rid/share` | Share with client | AGENCY_MANAGER |
| GET | `/reports/shared/:token` | View shared report | PUBLIC (token-based) |

### Influencer Assignments (Participant-facing)

| Method | Route | Description | Role |
|--------|-------|-------------|------|
| GET | `/my-assignments` | View my assignments | PARTICIPANT |
| GET | `/my-assignments/:id` | Assignment detail | PARTICIPANT |
| PATCH | `/my-assignments/:id/accept` | Accept assignment | PARTICIPANT |
| PATCH | `/my-assignments/:id/decline` | Decline assignment | PARTICIPANT |

---

## 7. Notifications

### Email Notifications

| Trigger | Recipient | Content |
|---------|-----------|---------|
| Influencer invited to agency | Influencer | Invitation with agency name, accept/decline links |
| Influencer accepts invitation | Agency manager | Confirmation with influencer name |
| Assignment created | Influencer | Bounty name, deadline, campaign context, manager notes |
| Assignment accepted/declined | Agency manager | Influencer response with name and bounty |
| Submission approved for assignment | Agency manager | Influencer name, bounty, approval details |
| Report shared | Client (business) | Report link, campaign name, date range |

### In-App Notifications (for Influencers)

```
[Agency Icon] FitFluence Agency invited you to join their roster
[Assignment] New assignment: Nike Summer Reel Challenge — due Jan 15
[Update] Your post metrics were updated: +2,500 views on IG Reel
```

---

## 8. Permissions Matrix

| Resource | PARTICIPANT | AGENCY_MANAGER | BUSINESS_ADMIN | SUPER_ADMIN |
|----------|-------------|----------------|----------------|-------------|
| Create agency | Own | — | — | Yes |
| View agency | If member | Own agency | Linked campaigns | All |
| Manage roster | — | Own agency | — | All |
| Create team | — | Own agency | — | All |
| Create campaign | — | Own agency | — | All |
| Assign influencer | — | Own roster | — | All |
| Track posts | — | Own roster | — | All |
| Generate reports | — | Own agency | — | All |
| View shared reports | — | Own agency | If shared | All |
| Accept assignment | Own | — | — | — |
| See agency badge | — | — | On submissions | All |

---

## 9. Implementation Plan

### Sprint A: Foundation (2 weeks)
- Prisma schema: Agency, AgencyManager, AgencyInfluencer, Team, TeamMember
- New enum: AGENCY_MANAGER role
- Agency CRUD module (create, update, view)
- Roster management (invite, accept, pause, remove)
- Team CRUD
- Frontend: Agency dashboard shell, roster page, team page
- Auth: Role promotion on agency creation

### Sprint B: Campaigns & Assignments (2 weeks)
- Prisma schema: Campaign, CampaignBounty, CampaignAssignment
- Campaign CRUD module
- Assignment workflow (assign, accept, decline, status tracking)
- Frontend: Campaign management, assignment flow
- Influencer view: My Assignments page
- Email notifications for invitations and assignments

### Sprint C: Post Tracking & Metrics (2 weeks)
- Prisma schema: PostTracking
- Post tracking CRUD with metric history
- Frontend: Post tracking UI, metric cards, trend visualization
- Integration with submission system (link posts to submissions)
- Business side: Agency badge on submissions

### Sprint D: Reporting & Polish (2 weeks)
- Prisma schema: AgencyReport
- Report generation engine (aggregation queries)
- Frontend: Report builder, templates, share flow
- Business side: View shared reports
- Token-based public report viewing
- Admin: Agency management in super admin panel
- QA: Full E2E testing of agency flows

### Sprint E: Optimization & Launch (1 week)
- Performance optimization (dashboard caching, query optimization)
- Security audit of agency RBAC
- Documentation update
- Demo data seeding for agency role

---

## 10. Future Enhancements (Post-MVP)

| Enhancement | Description |
|-------------|-------------|
| **API Integrations** | Auto-fetch metrics from Instagram Graph API, TikTok API, Facebook API |
| **Influencer Discovery** | Search/browse platform participants as potential roster additions |
| **Rate Cards** | Influencers set their rates; agencies compare costs |
| **Contract Management** | Digital contracts between agencies and influencers |
| **Invoice Generation** | Agencies invoice clients based on campaign deliverables |
| **White-Label Reports** | Custom-branded reports with agency logo |
| **Real-Time Dashboard** | WebSocket-powered live metrics updates |
| **Competitor Analysis** | Track competitor campaign performance |
| **Sentiment Analysis** | AI analysis of comments on tracked posts |
| **Scheduling** | Schedule posts across platforms (integration with Buffer/Later) |
| **Multi-Agency Support** | An influencer can belong to multiple agencies |
| **Agency Marketplace** | Businesses browse and hire agencies directly on the platform |
