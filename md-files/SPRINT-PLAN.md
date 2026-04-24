# Social Bounty — Sprint Plan & Iteration Roadmap

> **Total Sprints**: 8 (16 weeks)
> **Sprint Duration**: 2 weeks each
> **Start Date**: 2026-03-27 (Sprint 0)
> **Target Release**: Sprint 8 completion

---

## Sprint Overview

| Sprint | Theme | Focus Areas | Key Deliverables |
|--------|-------|-------------|------------------|
| **0** | Foundation | Audit, team setup, design system | Audit report, AGENTS.md, design tokens |
| **1** | Critical Fixes & Design Tokens | Security, Redis, futuristic theme | Secure auth, design system, error boundaries |
| **2** | Auth & Shell Overhaul | Login/signup UX, app shell, navigation | Futuristic auth flow, new app shell, dark mode |
| **3** | Participant Experience | Marketplace, submissions, profile | Bounty browse, submit, track — fully polished |
| **4** | Business Admin Experience | Dashboard, bounty mgmt, review | Dashboard viz, creation wizard, review center |
| **5** | Super Admin & Platform | Admin panel, audit, settings | Admin dashboard, user mgmt, system controls |
| **6** | Payments, Notifications & Polish | TradeSafe unified rail, emails, in-app notifications | Payment flow, notification system, UX polish |
| **7** | QA Hardening & Performance | Full test suite, load tests, a11y | 100% tests passing, performance budgets met |
| **8** | Production Readiness | CI/CD, monitoring, docs, final QA | Production deployment, runbook, sign-off |

---

## Sprint 0: Foundation (Current — Week 0)

**Sprint Goal**: Establish team, audit codebase, define futuristic design direction.

**Status**: ✅ IN PROGRESS

### Backlog

| ID | Story | Owner | Status |
|----|-------|-------|--------|
| S0-1 | Review entire codebase (API, frontend, schema, shared) | Team Lead | ✅ Done |
| S0-2 | Review all MD documentation files | Team Lead | ✅ Done |
| S0-3 | Create agent team roster (AGENTS.md) | PM | ✅ Done |
| S0-4 | Create sprint plan (SPRINT-PLAN.md) | PM | 🔄 In Progress |
| S0-5 | Create codebase audit report (archive/AUDIT-REPORT-2026-03-27.md) | Solutions Architect | ⬜ Pending |
| S0-6 | Define futuristic design system (DESIGN-SYSTEM.md) | UI Designer | ⬜ Pending |
| S0-7 | Research: Futuristic marketplace UI inspiration | UX Researcher | ⬜ Pending |
| S0-8 | Inventory technical debt from audit | Team Lead | ⬜ Pending |

---

## Sprint 1: Critical Fixes & Design Foundation (Weeks 1-2)

**Sprint Goal**: Fix critical security issues, establish futuristic design tokens, implement error boundaries.

### Research Track
| ID | Story | Points | Owner |
|----|-------|--------|-------|
| S1-R1 | Research: Futuristic dark-mode dashboard inspiration (Dribbble, Behance, Awwwards) | 3 | UX Researcher |
| S1-R2 | Research: Best-in-class bounty/marketplace platforms UX | 3 | UX Researcher |
| S1-R3 | Research: Glassmorphism implementation patterns + accessibility impact | 2 | UX Researcher |

### Design Track
| ID | Story | Points | Owner |
|----|-------|--------|-------|
| S1-D1 | Define futuristic color palette (dark-first, neon accents) | 3 | UI Designer |
| S1-D2 | Define typography scale (Space Grotesk + Inter hierarchy) | 2 | UI Designer |
| S1-D3 | Design glassmorphism card component (variants, states) | 3 | UI Designer |
| S1-D4 | Design status badge system (luminous, animated) | 2 | UI Designer |
| S1-D5 | Define micro-animation principles (durations, easing, triggers) | 2 | UI Designer |
| S1-D6 | Write content style guide (voice, tone, patterns) | 3 | UX Writer |

### Backend Track
| ID | Story | Points | Owner |
|----|-------|--------|-------|
| S1-B1 | **CRITICAL**: Replace in-memory token storage with Redis | 8 | Sr. Backend Dev |
| S1-B2 | **CRITICAL**: Database-back the settings service | 5 | Sr. Backend Dev |
| S1-B3 | **CRITICAL**: Fix payout scheduler race condition | 3 | Sr. Backend Dev |
| S1-B4 | Add request ID tracking middleware (X-Request-Id) | 3 | Mid Backend Dev |
| S1-B5 | Add Prisma error handling middleware (P2002, P2025, etc.) | 3 | Mid Backend Dev |
| S1-B6 | Improve HTML sanitization (replace regex with sanitize-html) | 3 | Mid Backend Dev |
| S1-B7 | Add missing database indexes (deletedAt, compound indexes) | 2 | Jr. Backend Dev |
| S1-B8 | Fix seed script environment check + paths | 1 | Jr. Backend Dev |

### Frontend Track
| ID | Story | Points | Owner |
|----|-------|--------|-------|
| S1-F1 | Implement futuristic design tokens in Tailwind config | 5 | Sr. Frontend Dev |
| S1-F2 | Implement dark mode CSS custom properties + toggle | 5 | Sr. Frontend Dev |
| S1-F3 | Add React Error Boundary components (page + global) | 3 | Sr. Frontend Dev |
| S1-F4 | Move refresh token to httpOnly cookie (requires API change) | 5 | Sr. Frontend Dev |
| S1-F5 | Add search debouncing (300ms) to all search inputs | 2 | Mid Frontend Dev |
| S1-F6 | Fix accessibility: aria-required, aria-invalid on all forms | 3 | Mid Frontend Dev |
| S1-F7 | Remove hardcoded demo passwords from frontend code | 1 | Jr. Frontend Dev |
| S1-F8 | Add proper loading skeletons with futuristic styling | 2 | Jr. Frontend Dev |

### QA Track
| ID | Story | Points | Owner |
|----|-------|--------|-------|
| S1-Q1 | Write test plan for Sprint 1 deliverables | 3 | QA Lead |
| S1-Q2 | Set up Playwright for E2E testing framework | 5 | QA Engineer |
| S1-Q3 | Write auth flow E2E tests (login, signup, password reset) | 5 | QA Engineer |
| S1-Q4 | Run npm audit and fix critical/high vulnerabilities | 3 | Security Engineer |

### DevOps Track
| ID | Story | Points | Owner |
|----|-------|--------|-------|
| S1-O1 | Add Redis to Docker Compose + configure connection | 3 | DevOps Engineer |
| S1-O2 | Fix CI pipeline (add shared build step before API tests) | 2 | DevOps Engineer |
| S1-O3 | Add health check endpoints for Redis and all services | 2 | DevOps Engineer |

**Sprint 1 Total Points**: ~97

---

## Sprint 2: Auth & Application Shell Overhaul (Weeks 3-4)

**Sprint Goal**: Futuristic login/signup experience, redesigned app shell with dark mode, role-based navigation.

### Research Track
| ID | Story | Points | Owner |
|----|-------|--------|-------|
| S2-R1 | Research: Modern auth UX patterns (passwordless, social, biometric) | 3 | UX Researcher |
| S2-R2 | Research: Sidebar navigation patterns for complex apps | 2 | UX Researcher |
| S2-R3 | Research: Onboarding flow best practices (first-time experience) | 3 | UX Researcher |

### Design Track
| ID | Story | Points | Owner |
|----|-------|--------|-------|
| S2-D1 | UX flow: Complete auth journey (signup → verify → onboard → dashboard) | 5 | UX Designer |
| S2-D2 | UI mockup: Futuristic login page (animated background, glass form) | 5 | UI Designer |
| S2-D3 | UI mockup: Futuristic signup page (multi-step, progress indicator) | 5 | UI Designer |
| S2-D4 | UI mockup: App shell (sidebar, header, user menu, breadcrumbs) | 8 | UI Designer |
| S2-D5 | UI mockup: First-time onboarding flow (role selection, org creation) | 5 | UI Designer |
| S2-D6 | Write auth copy: All error messages, field labels, CTAs | 3 | UX Writer |
| S2-D7 | Write onboarding copy: Welcome messages, tooltips, empty states | 3 | UX Writer |

### Backend Track
| ID | Story | Points | Owner |
|----|-------|--------|-------|
| S2-B1 | Implement httpOnly cookie for refresh tokens | 5 | Sr. Backend Dev |
| S2-B2 | Add brute force protection (account lockout after 5 failed attempts) | 5 | Sr. Backend Dev |
| S2-B3 | Add login event logging (IP, user agent, timestamp) | 3 | Mid Backend Dev |
| S2-B4 | Implement email verification reminder (24h after signup) | 3 | Mid Backend Dev |
| S2-B5 | Add user onboarding status tracking field | 2 | Jr. Backend Dev |
| S2-B6 | Write unit tests for Redis token service | 3 | Jr. Backend Dev |

### Frontend Track
| ID | Story | Points | Owner |
|----|-------|--------|-------|
| S2-F1 | Implement futuristic login page with glassmorphism | 8 | Sr. Frontend Dev |
| S2-F2 | Implement futuristic signup page (multi-step) | 8 | Sr. Frontend Dev |
| S2-F3 | Redesign app shell: sidebar, header, breadcrumbs (dark mode) | 8 | Sr. Frontend Dev |
| S2-F4 | Implement dark/light mode toggle with system preference detection | 3 | Mid Frontend Dev |
| S2-F5 | Implement first-time onboarding wizard | 5 | Mid Frontend Dev |
| S2-F6 | Implement animated page transitions | 3 | Mid Frontend Dev |
| S2-F7 | Implement password reset flow with futuristic styling | 3 | Jr. Frontend Dev |
| S2-F8 | Implement email verification page with futuristic styling | 2 | Jr. Frontend Dev |

### QA Track
| ID | Story | Points | Owner |
|----|-------|--------|-------|
| S2-Q1 | Test plan: Auth flow + app shell | 3 | QA Lead |
| S2-Q2 | E2E tests: Full signup → verify → onboard → dashboard flow | 5 | QA Engineer |
| S2-Q3 | Accessibility audit: Auth pages (contrast, keyboard, screen reader) | 3 | QA Engineer |
| S2-Q4 | Security review: Auth hardening (brute force, token rotation) | 3 | Security Engineer |

### DevOps Track
| ID | Story | Points | Owner |
|----|-------|--------|-------|
| S2-O1 | Configure httpOnly cookie handling in CORS/proxy | 2 | DevOps Engineer |
| S2-O2 | Set up staging environment | 5 | DevOps Engineer |

---

## Sprint 3: Participant Experience (Weeks 5-6)

**Sprint Goal**: Stunning bounty marketplace, seamless submission flow, polished dashboard.

### Research Track
| ID | Story | Points | Owner |
|----|-------|--------|-------|
| S3-R1 | Research: Marketplace browse/filter UX (Etsy, ProductHunt, Dribbble) | 3 | UX Researcher |
| S3-R2 | Research: Multi-step form UX (proof submission, file upload) | 3 | UX Researcher |
| S3-R3 | Research: Personal dashboard patterns (progress, earnings, activity) | 2 | UX Researcher |

### Design Track
| ID | Story | Points | Owner |
|----|-------|--------|-------|
| S3-D1 | UX flow: Bounty discovery → view → submit → track | 5 | UX Designer |
| S3-D2 | UI mockup: Bounty marketplace (grid/list, filters, search, categories) | 8 | UI Designer |
| S3-D3 | UI mockup: Bounty detail page (hero, requirements, CTA) | 5 | UI Designer |
| S3-D4 | UI mockup: Submission form (multi-step wizard, file upload) | 5 | UI Designer |
| S3-D5 | UI mockup: My Submissions dashboard (earnings, filters, table) | 5 | UI Designer |
| S3-D6 | UI mockup: Submission detail page (proof, status, timeline) | 3 | UI Designer |
| S3-D7 | Write marketplace copy: Empty states, filters, search, CTAs | 3 | UX Writer |
| S3-D8 | Write submission copy: Form labels, validation, confirmation | 3 | UX Writer |

### Backend Track
| ID | Story | Points | Owner |
|----|-------|--------|-------|
| S3-B1 | Optimize bounty listing query (single query with counts) | 5 | Sr. Backend Dev |
| S3-B2 | Add full-text search to bounties (title, description) | 5 | Sr. Backend Dev |
| S3-B3 | Implement submission resubmission after rejection | 3 | Mid Backend Dev |
| S3-B4 | Add proof link URL validation (check social media domains) | 3 | Mid Backend Dev |
| S3-B5 | Add submission image count validation (max from constants) | 2 | Mid Backend Dev |
| S3-B6 | Add earnings aggregation endpoint for participant dashboard | 3 | Mid Backend Dev |
| S3-B7 | Write integration tests for bounty listing with filters | 3 | Jr. Backend Dev |
| S3-B8 | Write integration tests for submission workflow | 3 | Jr. Backend Dev |

### Frontend Track
| ID | Story | Points | Owner |
|----|-------|--------|-------|
| S3-F1 | Implement futuristic bounty marketplace page (grid/list toggle) | 8 | Sr. Frontend Dev |
| S3-F2 | Implement advanced filter panel with animated expand/collapse | 5 | Sr. Frontend Dev |
| S3-F3 | Implement bounty detail page with parallax hero | 5 | Mid Frontend Dev |
| S3-F4 | Implement submission wizard (multi-step with progress) | 8 | Mid Frontend Dev |
| S3-F5 | Implement My Submissions dashboard with earnings cards | 5 | Mid Frontend Dev |
| S3-F6 | Implement submission detail with proof gallery + timeline | 5 | Mid Frontend Dev |
| S3-F7 | Implement bounty card component (futuristic, animated hover) | 3 | Jr. Frontend Dev |
| S3-F8 | Implement category filter chips with glow effects | 2 | Jr. Frontend Dev |
| S3-F9 | Add infinite scroll option for bounty listing | 3 | Sr. Frontend Dev |
| S3-F10 | Implement optimistic updates for submission mutations | 3 | Sr. Frontend Dev |

### QA Track
| ID | Story | Points | Owner |
|----|-------|--------|-------|
| S3-Q1 | Test plan: Participant experience (marketplace + submissions) | 3 | QA Lead |
| S3-Q2 | E2E tests: Browse → view → submit → track flow | 5 | QA Engineer |
| S3-Q3 | E2E tests: Search, filter, sort, pagination | 3 | QA Engineer |
| S3-Q4 | Performance test: Bounty listing with 1000+ bounties | 3 | Performance Eng. |
| S3-Q5 | Accessibility audit: Marketplace + submission pages | 3 | QA Engineer |

---

## Sprint 4: Business Admin Experience (Weeks 7-8)

**Sprint Goal**: Data-rich dashboard, intuitive bounty creation wizard, efficient review center.

### Research Track
| ID | Story | Points | Owner |
|----|-------|--------|-------|
| S4-R1 | Research: Business dashboard patterns (Stripe, Shopify, HubSpot) | 3 | UX Researcher | <!-- historical -->
| S4-R2 | Research: Content creation wizard UX (WordPress, Notion, Figma) | 3 | UX Researcher |
| S4-R3 | Research: Review/approval workflow patterns (GitHub PRs, Jira) | 2 | UX Researcher |

### Design Track
| ID | Story | Points | Owner |
|----|-------|--------|-------|
| S4-D1 | UX flow: Business admin complete journey (dashboard → create → review → payout) | 5 | UX Designer |
| S4-D2 | UI mockup: Business dashboard (metric cards, charts, activity feed) | 8 | UI Designer |
| S4-D3 | UI mockup: Bounty creation wizard (steps, preview, brand assets) | 8 | UI Designer |
| S4-D4 | UI mockup: Review center (kanban or table, inline review, bulk actions) | 8 | UI Designer |
| S4-D5 | UI mockup: Organization settings page | 3 | UI Designer |
| S4-D6 | Write dashboard copy: Metrics labels, empty states, tooltips | 2 | UX Writer |
| S4-D7 | Write creation wizard copy: Step labels, field help text, validation | 3 | UX Writer |
| S4-D8 | Write review copy: Action labels, confirmation dialogs, status messages | 3 | UX Writer |

### Backend Track
| ID | Story | Points | Owner |
|----|-------|--------|-------|
| S4-B1 | Optimize business dashboard (single aggregation query) | 5 | Sr. Backend Dev |
| S4-B2 | Add dashboard caching with Redis (5-minute TTL) | 3 | Sr. Backend Dev |
| S4-B3 | Implement bounty duplication endpoint | 3 | Mid Backend Dev |
| S4-B4 | Implement bulk submission review endpoint | 5 | Mid Backend Dev |
| S4-B5 | Add member invitation system for organizations | 5 | Mid Backend Dev |
| S4-B6 | Add member removal endpoint | 2 | Jr. Backend Dev |
| S4-B7 | Write tests for dashboard aggregation | 3 | Jr. Backend Dev |
| S4-B8 | Write tests for bulk review operations | 3 | Jr. Backend Dev |

### Frontend Track
| ID | Story | Points | Owner |
|----|-------|--------|-------|
| S4-F1 | Implement futuristic business dashboard (animated charts, sparklines) | 8 | Sr. Frontend Dev |
| S4-F2 | Implement bounty creation wizard (multi-step, auto-save, preview) | 8 | Sr. Frontend Dev |
| S4-F3 | Implement review center (table with inline actions) | 8 | Mid Frontend Dev |
| S4-F4 | Implement organization settings page | 3 | Mid Frontend Dev |
| S4-F5 | Implement member invitation flow | 3 | Mid Frontend Dev |
| S4-F6 | Implement metric cards with animated counters | 3 | Jr. Frontend Dev |
| S4-F7 | Implement bounty preview modal (live preview of created bounty) | 3 | Jr. Frontend Dev |

### QA Track
| ID | Story | Points | Owner |
|----|-------|--------|-------|
| S4-Q1 | Test plan: Business admin experience | 3 | QA Lead |
| S4-Q2 | E2E tests: Create bounty → publish → review submissions → payout | 5 | QA Engineer |
| S4-Q3 | E2E tests: Organization management (create, invite, remove) | 3 | QA Engineer |
| S4-Q4 | Performance test: Dashboard with 500+ bounties, 2000+ submissions | 3 | Performance Eng. |
| S4-Q5 | Security review: Business admin RBAC (can't access other orgs) | 3 | Security Engineer |

---

## Sprint 5: Super Admin & Platform Controls (Weeks 9-10)

**Sprint Goal**: Powerful admin dashboard, user management, audit logs, system controls.

### Research Track
| ID | Story | Points | Owner |
|----|-------|--------|-------|
| S5-R1 | Research: Admin panel patterns (Retool, Forest Admin, Django Admin) | 3 | UX Researcher |
| S5-R2 | Research: Audit log visualization (timeline, filtering, export) | 2 | UX Researcher |
| S5-R3 | Research: System health monitoring UX (Grafana, Datadog) | 2 | UX Researcher |

### Design Track
| ID | Story | Points | Owner |
|----|-------|--------|-------|
| S5-D1 | UX flow: Admin workflows (user mgmt, overrides, audit, settings) | 5 | UX Designer |
| S5-D2 | UI mockup: Admin dashboard (platform metrics, health, alerts) | 8 | UI Designer |
| S5-D3 | UI mockup: User management (search, filter, actions, detail modal) | 5 | UI Designer |
| S5-D4 | UI mockup: Audit log viewer (timeline, filters, export) | 5 | UI Designer |
| S5-D5 | UI mockup: System settings (toggles, health checks, config) | 3 | UI Designer |
| S5-D6 | UI mockup: Override modal (status override with reason) | 3 | UI Designer |
| S5-D7 | Write admin copy: Action labels, confirmation dialogs, audit descriptions | 3 | UX Writer |

### Backend Track
| ID | Story | Points | Owner |
|----|-------|--------|-------|
| S5-B1 | Implement audit log search/query endpoint with filters | 5 | Sr. Backend Dev |
| S5-B2 | Add audit log retention policy (archive after 90 days) | 3 | Sr. Backend Dev |
| S5-B3 | Implement system health metrics endpoint (DB, Redis, disk, memory) | 5 | Sr. Backend Dev |
| S5-B4 | Add user search with full-text search | 3 | Mid Backend Dev |
| S5-B5 | Implement force password reset for admin | 2 | Mid Backend Dev |
| S5-B6 | Add organization suspension/reinstatement | 3 | Mid Backend Dev |
| S5-B7 | Add admin override audit trail (before/after state) | 3 | Jr. Backend Dev |
| S5-B8 | Write tests for admin operations and RBAC | 5 | Jr. Backend Dev |

### Frontend Track
| ID | Story | Points | Owner |
|----|-------|--------|-------|
| S5-F1 | Implement futuristic admin dashboard (platform metrics, health) | 8 | Sr. Frontend Dev |
| S5-F2 | Implement user management page (data table, search, actions) | 5 | Sr. Frontend Dev |
| S5-F3 | Implement audit log viewer (filterable timeline) | 5 | Mid Frontend Dev |
| S5-F4 | Implement system settings page | 3 | Mid Frontend Dev |
| S5-F5 | Implement override modal with reason field | 3 | Mid Frontend Dev |
| S5-F6 | Implement organization management page (admin view) | 3 | Jr. Frontend Dev |
| S5-F7 | Implement admin action confirmation dialogs | 2 | Jr. Frontend Dev |

### QA Track
| ID | Story | Points | Owner |
|----|-------|--------|-------|
| S5-Q1 | Test plan: Super admin experience | 3 | QA Lead |
| S5-Q2 | E2E tests: User suspend/reinstate, force password reset | 5 | QA Engineer |
| S5-Q3 | E2E tests: Override bounty/submission status with audit trail | 3 | QA Engineer |
| S5-Q4 | E2E tests: Audit log filtering and pagination | 3 | QA Engineer |
| S5-Q5 | Security review: Admin RBAC (super admin only, audit logging) | 3 | Security Engineer |
| S5-Q6 | Performance test: Audit log query with 100k+ entries | 3 | Performance Eng. |

---

## Sprint 6: Payments, Notifications & Polish (Weeks 11-12)

**Sprint Goal**: Robust payment flow, notification system, UX polish across all pages.

### Research Track
| ID | Story | Points | Owner |
|----|-------|--------|-------|
| S6-R1 | Research: Payment UX patterns (hosted checkout, in-app payments) | 3 | UX Researcher |
| S6-R2 | Research: Notification system patterns (bell icon, toast, email digest) | 3 | UX Researcher |
| S6-R3 | Research: Micro-interaction patterns (success, error, loading) | 2 | UX Researcher |

### Design Track
| ID | Story | Points | Owner |
|----|-------|--------|-------|
| S6-D1 | UX flow: Payment → fund bounty → track payout | 3 | UX Designer |
| S6-D2 | UX flow: Notification delivery (in-app + email) | 3 | UX Designer |
| S6-D3 | UI mockup: Payment flow (TradeSafe hosted checkout redirect, success/failure) | 5 | UI Designer |
| S6-D4 | UI mockup: Notification center (bell icon, dropdown, list) | 5 | UI Designer |
| S6-D5 | UI mockup: Email templates (receipt, status change, payout) | 3 | UI Designer |
| S6-D6 | Define all micro-animations (hover, click, transition, loading) | 3 | UI Designer |
| S6-D7 | Write notification copy: All notification messages and emails | 5 | UX Writer |
| S6-D8 | Write payment copy: Checkout, receipt, error messages | 2 | UX Writer |

### Backend Track
| ID | Story | Points | Owner |
|----|-------|--------|-------|
| S6-B1 | Implement TradeSafe webhook handling via URL-path-secret + GraphQL re-fetch (transaction.FUNDS_RECEIVED, allocation.FUNDS_RELEASED, allocation.CANCELLED) | 8 | Sr. Backend Dev |
| S6-B2 | Enforce double-entry ledger idempotency via UNIQUE(referenceId, actionType) on LedgerTransactionGroup | 3 | Sr. Backend Dev |
| S6-B3 | Implement in-app notification system (DB + API) | 8 | Sr. Backend Dev |
| S6-B4 | Implement email notification triggers (submission status, payout) | 5 | Mid Backend Dev |
| S6-B5 | Add email template system (Handlebars) | 5 | Mid Backend Dev |
| S6-B6 | Implement email queue with retry logic | 3 | Mid Backend Dev |
| S6-B7 | Add refund endpoint | 3 | Jr. Backend Dev |
| S6-B8 | Write tests for payment + notification services | 5 | Jr. Backend Dev |

### Frontend Track
| ID | Story | Points | Owner |
|----|-------|--------|-------|
| S6-F1 | Implement payment flow via TradeSafe hosted checkout redirect + return page | 8 | Sr. Frontend Dev |
| S6-F2 | Implement notification center (bell icon + dropdown) | 5 | Sr. Frontend Dev |
| S6-F3 | Implement real-time notification updates (polling or WebSocket) | 5 | Sr. Frontend Dev |
| S6-F4 | UX polish pass: All participant pages | 5 | Mid Frontend Dev |
| S6-F5 | UX polish pass: All business admin pages | 5 | Mid Frontend Dev |
| S6-F6 | UX polish pass: All admin pages | 3 | Mid Frontend Dev |
| S6-F7 | Implement all micro-animations (CSS transitions + Framer Motion) | 5 | Jr. Frontend Dev |
| S6-F8 | Implement toast notification system (success, error, info, warning) | 2 | Jr. Frontend Dev |

### QA Track
| ID | Story | Points | Owner |
|----|-------|--------|-------|
| S6-Q1 | Test plan: Payment + notification system | 3 | QA Lead |
| S6-Q2 | E2E tests: Fund bounty → TradeSafe hosted checkout → FUNDS_RECEIVED webhook → allocationAcceptDelivery payout | 5 | QA Engineer |
| S6-Q3 | E2E tests: Notification delivery (in-app + email via MailHog) | 3 | QA Engineer |
| S6-Q4 | Visual regression testing setup (Percy or Chromatic) | 5 | QA Engineer |
| S6-Q5 | Security review: Payment flow (TradeSafe URL-path-secret, GraphQL re-fetch, ledger idempotency, data handling) | 3 | Security Engineer |

---

## Sprint 7: QA Hardening & Performance (Weeks 13-14)

**Sprint Goal**: Achieve 100% test pass rate, meet performance budgets, full accessibility compliance.

### Research Track
| ID | Story | Points | Owner |
|----|-------|--------|-------|
| S7-R1 | Research: Accessibility testing tools and automation | 2 | UX Researcher |
| S7-R2 | Research: Performance optimization case studies | 2 | UX Researcher |

### Backend Track
| ID | Story | Points | Owner |
|----|-------|--------|-------|
| S7-B1 | Fix all failing tests identified during QA | 8 | Sr. Backend Dev |
| S7-B2 | Implement connection pooling configuration | 3 | Sr. Backend Dev |
| S7-B3 | Optimize all N+1 queries (EXPLAIN ANALYZE) | 5 | Sr. Backend Dev |
| S7-B4 | Add rate limiting per user (not just global) | 3 | Mid Backend Dev |
| S7-B5 | Convert synchronous file I/O to async | 3 | Mid Backend Dev |
| S7-B6 | Add request/response logging middleware | 3 | Mid Backend Dev |
| S7-B7 | Achieve >80% unit test coverage on all services | 8 | Jr. Backend Dev |
| S7-B8 | Write API documentation (OpenAPI/Swagger) | 5 | Jr. Backend Dev |

### Frontend Track
| ID | Story | Points | Owner |
|----|-------|--------|-------|
| S7-F1 | Fix all failing tests identified during QA | 8 | Sr. Frontend Dev |
| S7-F2 | Implement code splitting and lazy loading for all routes | 5 | Sr. Frontend Dev |
| S7-F3 | Implement virtual scrolling for large lists | 3 | Sr. Frontend Dev |
| S7-F4 | Optimize images (next/image, lazy loading, responsive) | 3 | Mid Frontend Dev |
| S7-F5 | Fix all accessibility issues from audit | 8 | Mid Frontend Dev |
| S7-F6 | Achieve >80% test coverage on critical components | 8 | Mid Frontend Dev |
| S7-F7 | Fix all responsive issues from cross-browser testing | 5 | Jr. Frontend Dev |
| S7-F8 | Implement proper meta tags and SEO for public pages | 3 | Jr. Frontend Dev |

### QA Track (HEAVY SPRINT)
| ID | Story | Points | Owner |
|----|-------|--------|-------|
| S7-Q1 | Complete regression test suite for ALL features | 8 | QA Lead |
| S7-Q2 | Full WCAG 2.1 AA accessibility audit | 8 | QA Lead |
| S7-Q3 | E2E tests: Complete user journey for ALL three roles | 8 | QA Engineer |
| S7-Q4 | Cross-browser testing: Chrome, Firefox, Safari, Edge | 5 | QA Engineer |
| S7-Q5 | Mobile responsive testing: iOS Safari, Android Chrome | 5 | QA Engineer |
| S7-Q6 | Load test: 100 concurrent users, all endpoints | 5 | Performance Eng. |
| S7-Q7 | Performance audit: Core Web Vitals on all pages | 5 | Performance Eng. |
| S7-Q8 | Full security penetration test (OWASP Top 10) | 8 | Security Engineer |
| S7-Q9 | Dependency vulnerability scan and fix | 3 | Security Engineer |

---

## Sprint 8: Production Readiness (Weeks 15-16)

**Sprint Goal**: Production deployment, monitoring, documentation, final sign-off.

### Backend Track
| ID | Story | Points | Owner |
|----|-------|--------|-------|
| S8-B1 | Final bug fixes from Sprint 7 QA | 5 | Sr. Backend Dev |
| S8-B2 | Implement graceful shutdown handling | 2 | Sr. Backend Dev |
| S8-B3 | Add structured logging (JSON format for aggregation) | 3 | Mid Backend Dev |
| S8-B4 | Production database migration script + rollback plan | 3 | Mid Backend Dev |
| S8-B5 | Final seed data for production (super admin account) | 1 | Jr. Backend Dev |

### Frontend Track
| ID | Story | Points | Owner |
|----|-------|--------|-------|
| S8-F1 | Final bug fixes from Sprint 7 QA | 5 | Sr. Frontend Dev |
| S8-F2 | Production build optimization (bundle analysis, tree shaking) | 3 | Sr. Frontend Dev |
| S8-F3 | Implement Sentry error tracking integration | 3 | Mid Frontend Dev |
| S8-F4 | Final responsive and cross-browser fixes | 3 | Jr. Frontend Dev |

### QA Track
| ID | Story | Points | Owner |
|----|-------|--------|-------|
| S8-Q1 | Final regression run (100% pass rate required) | 5 | QA Lead |
| S8-Q2 | Production smoke test script | 3 | QA Engineer |
| S8-Q3 | Final performance validation (budgets met) | 3 | Performance Eng. |
| S8-Q4 | Final security scan | 3 | Security Engineer |

### DevOps Track (HEAVY SPRINT)
| ID | Story | Points | Owner |
|----|-------|--------|-------|
| S8-O1 | Production infrastructure setup (cloud DB, Redis, S3) | 8 | DevOps Engineer |
| S8-O2 | Production CI/CD pipeline (build → test → deploy) | 8 | DevOps Engineer |
| S8-O3 | Monitoring setup (Sentry, health checks, uptime) | 5 | DevOps Engineer |
| S8-O4 | SSL/TLS configuration | 2 | DevOps Engineer |
| S8-O5 | Backup and recovery procedures | 3 | DevOps Engineer |
| S8-O6 | Deployment runbook documentation | 3 | DevOps Engineer |
| S8-O7 | Environment variable management (secrets vault) | 3 | DevOps Engineer |

### Release
| ID | Story | Points | Owner |
|----|-------|--------|-------|
| S8-R1 | Sprint review: Full platform demo | — | PM |
| S8-R2 | PO acceptance: All features against acceptance criteria | — | PO |
| S8-R3 | Team Lead sign-off: Technical quality | — | Team Lead |
| S8-R4 | QA Lead sign-off: 100% test pass rate | — | QA Lead |
| S8-R5 | Security sign-off: No critical/high vulnerabilities | — | Security Eng. |
| S8-R6 | Go/no-go decision | — | PO + PM |
| S8-R7 | Production deployment | — | DevOps Eng. |
| S8-R8 | Post-deployment smoke test | — | QA Engineer |

---

## Velocity Tracking

| Sprint | Planned | Completed | Velocity | Notes |
|--------|---------|-----------|----------|-------|
| 0 | — | — | — | Setup sprint |
| 1 | ~97 | | | |
| 2 | | | | |
| 3 | | | | |
| 4 | | | | |
| 5 | | | | |
| 6 | | | | |
| 7 | | | | |
| 8 | | | | |

---

## Risk Register

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Redis integration complexity | High | Medium | Spike in Sprint 1, fallback to in-memory with proper abstraction |
| PrimeReact customization limits | Medium | Medium | CSS override layer, consider Radix for complex components |
| TradeSafe webhook reliability | High | Low | UNIQUE dedup on WebhookEvent, GraphQL re-fetch for authoritative state, ledger idempotency header, retry logic, reconciliation catch-up |
| Performance with large datasets | Medium | Medium | Virtual scrolling, pagination, caching |
| Accessibility compliance gaps | Medium | High | Continuous auditing, axe-core integration |
| Scope creep | High | High | PO enforces MVP boundaries, PM shields team |
| Design-code drift | Medium | Medium | UI Designer reviews all frontend PRs |
