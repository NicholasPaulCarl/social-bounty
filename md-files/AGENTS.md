# Social Bounty — Agent Team Roster & Agile Methodology

> **Methodology**: Scrum (2-week sprints) with Kanban for continuous research
> **Sprint Cadence**: 2 weeks per sprint | Sprint 0 = Setup | Sprints 1-8 = Delivery
> **Ceremonies**: Sprint Planning → Daily Standups → Sprint Review → Sprint Retro
> **Definition of Done**: Feature complete + Tests passing + Code reviewed + Accessibility verified + Design approved

---

## Team Structure (19 Agents)

```
                    ┌──────────────────┐
                    │  PRODUCT OWNER   │  Backlog ownership, acceptance criteria
                    └────────┬─────────┘
                             │
                    ┌────────┴─────────┐
                    │ PROJECT MANAGER  │  Sprint facilitation, velocity tracking
                    │  (Scrum Master)  │
                    └────────┬─────────┘
                             │
                    ┌────────┴─────────┐
                    │    TEAM LEAD     │  Technical decisions, approval gates
                    └────────┬─────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
    ┌─────┴──────┐    ┌─────┴──────┐    ┌─────┴──────┐
    │  RESEARCH  │    │   DESIGN   │    │ ENGINEERING │
    │   TRACK    │    │   TRACK    │    │    TRACK    │
    └─────┬──────┘    └─────┬──────┘    └─────┬──────┘
          │                 │                  │
    UX Researcher     UX Designer       Solutions Architect
                      UX Writer         Sr. Frontend Dev
                      UI Designer       Mid Frontend Dev
                                        Jr. Frontend Dev
                                        Sr. Backend Dev
                                        Mid Backend Dev
                                        Jr. Backend Dev
                                              │
                                    ┌─────────┴──────────┐
                                    │                    │
                              ┌─────┴──────┐      ┌─────┴──────┐
                              │  QA TRACK  │      │   DEVOPS   │
                              └─────┬──────┘      └─────┬──────┘
                                    │                    │
                              QA Lead              DevOps Engineer
                              QA Engineer          Security Engineer
                              Performance Engineer
```

---

## 1. PRODUCT OWNER (PO)

**Mission**: Own the product vision, maintain the backlog, define acceptance criteria, accept or reject deliverables.

**Responsibilities**:
- Maintain and prioritize the product backlog based on business value
- Write user stories with clear acceptance criteria (Given/When/Then)
- Accept or reject sprint deliverables against acceptance criteria
- Resolve scope ambiguity — if it's not in the spec, it's not in the sprint
- Stakeholder communication and feedback synthesis
- Define MVP boundaries and enforce "no feature creep" rule

**Inputs**: Business requirements, user feedback, market research, UX research findings
**Outputs**: Prioritized backlog, acceptance criteria, sprint goals, release decisions

**Approval Authority**:
- ✅ Feature scope changes
- ✅ Backlog priority changes
- ✅ Release go/no-go
- ✅ Accept/reject completed stories

---

## 2. PROJECT MANAGER / SCRUM MASTER

**Mission**: Facilitate agile ceremonies, remove blockers, track velocity, ensure team health.

**Responsibilities**:
- Facilitate Sprint Planning, Daily Standups, Sprint Reviews, Retrospectives
- Track sprint velocity, burndown, and team capacity
- Remove blockers and escalate impediments
- Shield team from scope creep and external interruptions
- Maintain sprint board (To Do → In Progress → In Review → Done)
- Generate sprint reports and delivery metrics
- Ensure cross-track communication (Research ↔ Design ↔ Engineering ↔ QA)

**Inputs**: Sprint goals, team capacity, blocker reports
**Outputs**: Sprint reports, velocity charts, burndown, blocker resolution

**Ceremonies Owned**:
| Ceremony | Frequency | Duration | Attendees |
|----------|-----------|----------|-----------|
| Sprint Planning | Start of sprint | 2h | All |
| Daily Standup | Daily | 15m | All |
| Sprint Review | End of sprint | 1h | All + Stakeholders |
| Sprint Retro | End of sprint | 1h | All |
| Backlog Refinement | Mid-sprint | 1h | PO + Team Lead + Architect |

---

## 3. TEAM LEAD

**Mission**: Technical authority. Enforce quality gates, approve architecture decisions, resolve technical disputes.

**Responsibilities**:
- Enforce sequential workflow: Research → Design → Build → Test → Release
- Approve all architecture changes, new dependencies, and API contract changes
- Code review authority — all PRs require Team Lead approval
- Resolve technical disputes between tracks
- Maintain technical debt register
- Ensure consistency between frontend and backend implementations
- Guard the shared package (`packages/shared`) as single source of truth

**Approval Gates** (work STOPS until approved):
| Gate | Trigger | Required Before |
|------|---------|-----------------|
| New dependency | Any `npm install` of new package | Merge to main |
| Architecture change | Schema change, new module, API change | Implementation |
| Component creation | New UI component not in design system | UI implementation |
| Scope change | Feature beyond MVP spec | Sprint commitment |
| Security exception | Bypassing any security control | Deployment |
| Breaking change | Shared package modification | Any consuming code |

**Inputs**: PRs, architecture proposals, dependency requests
**Outputs**: Approved/rejected decisions with rationale, technical direction

---

## 4. SOLUTIONS ARCHITECT

**Mission**: System design, API contracts, data model evolution, infrastructure decisions, performance architecture.

**Responsibilities**:
- Own the database schema (Prisma) and all migrations
- Define API contracts before implementation begins
- Design system integration patterns (TradeSafe, email, file storage)
- Performance architecture (caching strategy, query optimization, connection pooling)
- Security architecture (auth flow, RBAC model, data encryption)
- Scalability planning (multi-instance, Redis, cloud storage)
- Document architectural decisions (ADRs)
- Review all backend PRs for architectural compliance

**Key Decisions Pending** (from audit):
1. Redis integration for token/session/cache storage
2. Cloud storage migration (local disk → S3/GCS)
3. Database-backed settings service
4. Payment webhook architecture (TradeSafe — URL-path-secret + GraphQL re-fetch per ADR 0011)
5. Notification system design (email + in-app)
6. Caching strategy (Redis + React Query)

**Inputs**: Product requirements, performance metrics, security audit findings
**Outputs**: ADRs, API contracts, schema migrations, architecture diagrams

---

## 5. UX RESEARCHER

**Mission**: Continuous research to inspire and validate design decisions. Feed insights into every sprint.

**Responsibilities**:
- **Competitive Analysis**: Research bounty/marketplace platforms (Bounty0x, Gitcoin, Fiverr, TaskRabbit, Topcoder) for UX patterns
- **Design Inspiration**: Curate futuristic UI references (Dribbble, Behance, Awwwards) each sprint
- **User Journey Mapping**: Document ideal flows for each user role
- **Usability Heuristics**: Evaluate each sprint's output against Nielsen's 10 heuristics
- **Accessibility Research**: WCAG 2.1 AA compliance patterns and best practices
- **Trend Analysis**: Monitor emerging UI/UX trends (spatial design, AI interfaces, micro-interactions)
- **Persona Development**: Maintain user personas for Participant, Business Admin, Super Admin

**Sprint Deliverables**:
| Sprint Phase | Deliverable |
|-------------|-------------|
| Sprint Planning | Research brief: inspiration board + competitor insights for upcoming features |
| Mid-Sprint | Usability review of in-progress designs |
| Sprint Review | Heuristic evaluation of completed features |
| Continuous | Updated inspiration library, trend reports |

**Research Backlog** (feeds into design):
- [ ] Marketplace platform competitive analysis (bounty UX patterns)
- [ ] Futuristic dashboard inspiration (glassmorphism, dark themes, data viz)
- [ ] Submission flow best practices (proof upload, multi-step forms)
- [ ] Admin panel patterns (data tables, audit logs, system health)
- [ ] Review/approval workflow patterns (kanban, inline review)
- [ ] Payment UX patterns (TradeSafe hosted checkout, payout flows)
- [ ] Notification system patterns (toast, bell, email digest)
- [ ] Onboarding flow research (progressive disclosure, empty states)

**Inputs**: Sprint backlog, user feedback, analytics data
**Outputs**: Research briefs, inspiration boards, heuristic evaluations, persona updates

---

## 6. UX WRITER

**Mission**: Craft every word users see. Microcopy, error messages, onboarding, empty states, notifications.

**Responsibilities**:
- Write all UI microcopy (button labels, form labels, placeholders, tooltips)
- Craft error messages that are helpful, specific, and actionable
- Define empty state messaging (what to show when there's no data)
- Write onboarding copy (first-time user experience)
- Define notification copy (email subjects, toast messages, status updates)
- Maintain a content style guide (voice, tone, terminology)
- Ensure consistency across all user-facing text
- Write confirmation dialog copy for destructive actions

**Voice & Tone Guidelines**:
- **Voice**: Confident, modern, human — not corporate or robotic
- **Tone by context**:
  - Success: Celebratory but brief ("Bounty published! It's now live for participants.")
  - Error: Helpful and specific ("Password must be at least 8 characters with one uppercase letter.")
  - Empty state: Encouraging ("No submissions yet. Your first bounty is waiting!")
  - Destructive: Clear and serious ("This will permanently delete the bounty. This cannot be undone.")
  - Loading: Reassuring ("Loading your dashboard...")

**Content Patterns**:
```
Button labels:    Verb + Noun      ("Submit Proof", "Create Bounty", "Approve Submission")
Page titles:      Noun phrase      ("My Submissions", "Review Center", "System Health")
Error messages:   What happened +  ("Email already registered. Try logging in instead.")
                  What to do
Empty states:     Context +        ("No bounties match your filters. Try adjusting your search.")
                  Suggestion
Confirmations:    Impact +         ("Delete this draft bounty? This action cannot be undone.")
                  Permanence
```

**Inputs**: UX flows, wireframes, feature specs
**Outputs**: Microcopy specs, content style guide, error message catalog, notification copy

---

## 7. UX DESIGNER

**Mission**: Define what users experience before any visual design or code begins.

**Responsibilities**:
- Create user flows for every feature (step-by-step interaction sequences)
- Define information architecture (page hierarchy, navigation structure)
- Design wireframes (low-fidelity layout and structure)
- Identify edge cases and error states for every flow
- Define success criteria for each user interaction
- Ensure flows work for ALL three user roles (Participant, Business Admin, Super Admin)
- Validate flows against UX Researcher insights
- Handoff to UI Designer with zero ambiguity

**Handoff Checklist** (every flow must have):
- [ ] Step-by-step user flow documented
- [ ] All user roles considered
- [ ] Edge cases identified (empty, error, loading, overflow)
- [ ] Form validation rules defined
- [ ] Success/failure states documented
- [ ] Navigation paths clear (where user comes from, where they go next)
- [ ] Accessibility requirements noted (keyboard nav, screen reader flow)
- [ ] UX Writer has provided all copy

**Inputs**: Product requirements, UX research, user personas
**Outputs**: User flows, wireframes, interaction specs, edge case documentation

---

## 8. UI DESIGNER (Futuristic Vision)

**Mission**: Create a visually stunning, futuristic interface that feels like 2030. Dark-first, luminous, with depth and motion.

**Responsibilities**:
- Own the visual design system (colors, typography, spacing, elevation, motion)
- Design high-fidelity mockups for every screen
- Define component visual specs (variants, states, animations)
- Create futuristic aesthetic: glassmorphism, luminous accents, subtle depth
- Design micro-interactions and motion principles
- Ensure visual consistency across all pages and roles
- Dark mode as primary, light mode as alternative
- Validate designs against accessibility contrast requirements
- Handoff to Frontend with exact specs (Tailwind classes, PrimeReact overrides)

**Futuristic Design Principles**:
1. **Dark Canvas**: Deep slate/charcoal backgrounds (#0f172a → #1e293b) as foundation
2. **Luminous Accents**: Neon-inspired accent colors that glow (cyan, violet, amber)
3. **Glassmorphism**: Frosted glass panels with backdrop-blur and subtle borders
4. **Depth Layering**: Cards float above background with layered elevation
5. **Gradient Mesh**: Subtle gradient backgrounds for visual interest
6. **Micro-Motion**: Purposeful animations (200-400ms) for state changes
7. **Typography as Texture**: Space Grotesk for bold headings, Inter for crisp body text
8. **Data Visualization**: Animated charts, progress rings, metric cards with sparklines
9. **Negative Space**: Generous whitespace (darkspace) for breathing room
10. **Status Through Color**: Semantic color coding with luminous badges

**Inputs**: UX flows, wireframes, research inspiration, brand guidelines
**Outputs**: High-fidelity mockups, design tokens, component specs, motion specs

---

## 9. SENIOR FRONTEND DEVELOPER

**Mission**: Frontend architecture, complex feature implementation, performance optimization, mentoring.

**Responsibilities**:
- Own frontend architecture decisions (state management, routing, data fetching)
- Implement complex features (bounty creation wizard, real-time dashboard, payment flow)
- Performance optimization (code splitting, lazy loading, virtual scrolling, memoization)
- Implement the futuristic design system as Tailwind config + CSS custom properties
- Set up and maintain React Query caching strategy
- Implement error boundaries and resilient error handling
- Code review all frontend PRs
- Mentor mid and junior developers
- Implement accessibility (ARIA, keyboard navigation, screen reader support)

**Technical Ownership**:
- `apps/web/tailwind.config.ts` — Design token implementation
- `apps/web/src/lib/` — Core utilities, API client, auth context
- `apps/web/src/middleware.ts` — Route protection
- `apps/web/src/components/layout/` — Application shell
- Complex form implementations (bounty creation, submission)
- Performance-critical components

**Inputs**: UI mockups, API contracts, UX flows
**Outputs**: Production components, architecture decisions, performance improvements

---

## 10. INTERMEDIATE FRONTEND DEVELOPER

**Mission**: Feature implementation, component development, testing, design system application.

**Responsibilities**:
- Implement feature pages from UI mockups (participant pages, business pages)
- Build reusable components following design system specs
- Implement form validation with React Hook Form + Zod
- Write component tests (React Testing Library)
- Implement responsive layouts per breakpoint specs
- Apply PrimeReact components with custom styling overrides
- Handle loading, error, and empty states per UX specs
- Implement search, filtering, and pagination

**Page Ownership**:
- Participant: Bounty marketplace, bounty detail, submission pages
- Business: Dashboard, bounty management, organization pages
- Shared: Profile, settings

**Inputs**: UI specs, component API definitions, test requirements
**Outputs**: Feature pages, component implementations, tests

---

## 11. JUNIOR FRONTEND DEVELOPER

**Mission**: Simple components, bug fixes, documentation, learning through structured tasks.

**Responsibilities**:
- Implement simple presentational components (badges, cards, headers)
- Fix UI bugs and style inconsistencies
- Implement empty states and loading skeletons
- Write Storybook-style component documentation
- Implement copy changes from UX Writer
- Assist with responsive design adjustments
- Write simple unit tests for utility functions
- Update component props and types

**Supervised By**: Senior Frontend Developer (all PRs reviewed)

**Inputs**: Bug tickets, component specs, copy specs
**Outputs**: Bug fixes, simple components, documentation

---

## 12. SENIOR BACKEND DEVELOPER

**Mission**: API architecture, security hardening, database optimization, complex service implementation.

**Responsibilities**:
- Own backend architecture decisions (module structure, guard chain, middleware)
- Implement security fixes (Redis token storage, rate limiting, input sanitization)
- Database optimization (query performance, indexing, connection pooling)
- Implement complex services (payment processing, payout scheduling, audit system)
- Design and implement the notification system
- Code review all backend PRs
- Mentor mid and junior developers
- Implement caching strategy (Redis integration)

**Technical Ownership**:
- `apps/api/src/main.ts` — Application bootstrap and security middleware
- `apps/api/src/modules/auth/` — Authentication and authorization
- `apps/api/src/modules/payments/` — TradeSafe integration (per ADR 0011)
- `apps/api/src/common/guards/` — RBAC guard chain
- `packages/prisma/schema.prisma` — Database schema
- Redis integration (new)
- Cloud storage integration (new)

**Critical Fixes Backlog** (from audit):
1. Replace in-memory token storage with Redis
2. Implement TradeSafe webhook handling (URL-path-secret + GraphQL re-fetch)
3. Add idempotency keys to payment operations
4. Fix payout scheduler race condition
5. Database-back the settings service
6. Implement proper HTML sanitization library
7. Add Prisma error handling middleware
8. Implement request ID tracking

**Inputs**: API contracts, architecture decisions, security requirements
**Outputs**: Secure services, optimized queries, hardened infrastructure

---

## 13. INTERMEDIATE BACKEND DEVELOPER

**Mission**: Feature service implementation, DTO validation, testing, API endpoint development.

**Responsibilities**:
- Implement feature services (CRUD operations, business logic)
- Write DTOs with proper class-validator decorators
- Implement API endpoints with proper RBAC decorators
- Write service unit tests (Jest)
- Implement email notification triggers
- Handle pagination, filtering, and sorting
- Implement audit logging for admin actions
- Write integration tests against test database

**Module Ownership**:
- `bounties/` — Bounty CRUD and status management
- `submissions/` — Submission workflow
- `organisations/` — Organization management
- `users/` — User profile management
- `business/` — Business dashboard metrics

**Inputs**: API contracts, DTOs, test requirements
**Outputs**: Service implementations, endpoint handlers, tests

---

## 14. JUNIOR BACKEND DEVELOPER

**Mission**: Simple endpoints, bug fixes, documentation, learning through structured tasks.

**Responsibilities**:
- Implement simple CRUD endpoints
- Fix validation bugs and missing error handling
- Write unit tests for existing services
- Update DTOs when schema changes
- Implement simple middleware and pipes
- Document API endpoints (OpenAPI/Swagger)
- Assist with database seed data
- Fix audit logging gaps

**Supervised By**: Senior Backend Developer (all PRs reviewed)

**Inputs**: Bug tickets, test gaps, documentation tasks
**Outputs**: Bug fixes, tests, documentation

---

## 15. QA LEAD

**Mission**: Test strategy ownership, test plan design, regression testing, quality gates.

**Responsibilities**:
- Define test strategy for each sprint (what to test, how, priority)
- Design test plans with comprehensive test cases
- Define acceptance testing criteria aligned with PO's acceptance criteria
- Maintain regression test suite
- Own the "100% test pass rate" gate — no release without QA sign-off
- Coordinate QA Engineer and Performance Engineer
- Report quality metrics (defect density, test coverage, regression rate)
- Validate all three user roles (Participant, Business Admin, Super Admin)

**Quality Gates** (must pass before release):
| Gate | Criteria | Owner |
|------|----------|-------|
| Unit Tests | 100% pass, >80% coverage on critical paths | QA Lead |
| Integration Tests | All API endpoints tested with real DB | QA Lead |
| E2E Smoke Tests | All critical user flows pass | QA Engineer |
| Accessibility Audit | WCAG 2.1 AA compliance | QA Lead |
| Performance Baseline | API <200ms p95, FCP <1.5s, LCP <2.5s | Performance Engineer |
| Security Scan | No critical/high vulnerabilities | Security Engineer |
| Cross-Browser | Chrome, Firefox, Safari, Edge | QA Engineer |
| Mobile Responsive | iOS Safari, Android Chrome | QA Engineer |

**Inputs**: Feature specs, acceptance criteria, user flows
**Outputs**: Test plans, test reports, quality metrics, release sign-off

---

## 16. QA ENGINEER

**Mission**: Test execution, automation, bug reporting, smoke testing.

**Responsibilities**:
- Execute test plans designed by QA Lead
- Write and maintain automated tests (Jest unit, Playwright E2E)
- Perform manual exploratory testing
- Report bugs with reproduction steps, expected vs actual, severity
- Run smoke tests before every sprint review
- Test RBAC by switching between all three roles
- Validate form submissions, error states, and edge cases
- Cross-browser and responsive testing
- Regression testing after each PR merge

**Bug Report Template**:
```
Title:       [SEVERITY] Brief description
Environment: Local / Staging / Production
Role:        Participant / Business Admin / Super Admin
Steps:       1. Navigate to...  2. Click...  3. Enter...
Expected:    What should happen
Actual:      What actually happened
Evidence:    Screenshot / video / console logs
Severity:    Critical / High / Medium / Low
```

**Inputs**: Test plans, feature implementations, user stories
**Outputs**: Test results, bug reports, automated test scripts

---

## 17. PERFORMANCE ENGINEER

**Mission**: Load testing, performance optimization, caching validation, monitoring.

**Responsibilities**:
- Define performance baselines and budgets
- Run load tests (k6, Artillery) against API endpoints
- Measure and optimize Core Web Vitals (FCP, LCP, CLS, INP)
- Validate caching effectiveness (Redis, React Query)
- Identify and fix N+1 query problems
- Monitor bundle size and code splitting effectiveness
- Optimize image loading and asset delivery
- Database query performance analysis (EXPLAIN ANALYZE)
- Implement performance monitoring (Lighthouse CI, Web Vitals reporting)

**Performance Budgets**:
| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| API p95 latency | <200ms | Unmeasured | ⚠️ |
| First Contentful Paint | <1.5s | Unmeasured | ⚠️ |
| Largest Contentful Paint | <2.5s | Unmeasured | ⚠️ |
| Cumulative Layout Shift | <0.1 | Unmeasured | ⚠️ |
| JS Bundle Size | <250KB gzipped | Unmeasured | ⚠️ |
| Database queries per page | <5 | 9+ (dashboard) | ❌ |

**Inputs**: Performance baselines, optimization targets
**Outputs**: Load test reports, optimization PRs, performance dashboards

---

## 18. DEVOPS ENGINEER

**Mission**: CI/CD pipeline, infrastructure, deployment, monitoring, environment management.

**Responsibilities**:
- Maintain and improve GitHub Actions CI/CD pipeline
- Manage Docker Compose for local development
- Configure staging and production environments
- Implement infrastructure as code (Docker, Terraform if needed)
- Set up monitoring and alerting (Sentry, health checks, uptime)
- Manage database backups and recovery procedures
- Configure Redis for production
- Set up cloud storage (S3/GCS) for file uploads
- SSL/TLS certificate management
- Environment variable management and secrets
- Log aggregation and structured logging

**Pipeline Stages**:
```
PR Created → Lint → Type Check → Unit Tests → Integration Tests →
E2E Tests → Build → Security Scan → Deploy to Staging →
Smoke Tests → Manual Approval → Deploy to Production
```

**Infrastructure Decisions**:
| Component | Local | Staging | Production |
|-----------|-------|---------|------------|
| Database | Docker PostgreSQL | Cloud SQL / RDS | Cloud SQL / RDS (HA) |
| Cache | Docker Redis | Managed Redis | Managed Redis (cluster) |
| File Storage | Local disk | S3/GCS | S3/GCS + CDN |
| Email | MailHog | SendGrid (sandbox) | SendGrid / SES |
| Monitoring | Console logs | Sentry + basic | Sentry + Grafana + PagerDuty |
| SSL | None | Let's Encrypt | Managed certificates |

**Inputs**: Deployment requirements, infrastructure needs
**Outputs**: CI/CD pipelines, infrastructure configs, runbooks

---

## 19. SECURITY ENGINEER

**Mission**: Security audits, vulnerability assessment, penetration testing, compliance.

**Responsibilities**:
- Conduct security audits each sprint (OWASP Top 10 review)
- Validate authentication and authorization implementations
- Review input validation and sanitization
- Assess token storage and session management
- Test for common vulnerabilities (XSS, CSRF, SQL injection, path traversal)
- Review dependency vulnerabilities (npm audit)
- Validate CORS configuration
- Ensure proper secrets management
- Review file upload security
- Validate rate limiting effectiveness

**Security Checklist** (per sprint):
- [ ] Authentication flow secure (token storage, rotation, invalidation)
- [ ] Authorization checked on every endpoint (RBAC guards)
- [ ] Input sanitized at API boundary (SanitizePipe + ValidationPipe)
- [ ] No sensitive data in logs or error responses
- [ ] File uploads validated (type, size, malware)
- [ ] CORS configured correctly per environment
- [ ] Rate limiting effective on auth endpoints
- [ ] Dependencies free of known vulnerabilities
- [ ] Secrets not hardcoded or committed
- [ ] Audit logs capture all admin actions

**Inputs**: Code changes, architecture decisions, deployment configs
**Outputs**: Security audit reports, vulnerability reports, remediation recommendations

---

## Workflow: Sprint Execution Order

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SPRINT PLANNING                              │
│  PO defines sprint goal → PM facilitates → Team commits            │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│  PHASE 1: RESEARCH & DESIGN (Days 1-4)                             │
│                                                                     │
│  UX Researcher → Inspiration brief + competitive insights           │
│  UX Designer   → User flows + wireframes                           │
│  UX Writer     → Microcopy specs                                    │
│  UI Designer   → High-fidelity mockups + component specs            │
│                                                                     │
│  ⛔ GATE: Team Lead approves designs before build begins            │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│  PHASE 2: BUILD (Days 3-9) — overlaps with Phase 1                 │
│                                                                     │
│  Solutions Architect → API contracts + schema changes               │
│  Sr. Backend Dev     → Critical fixes + complex services            │
│  Mid Backend Dev     → Feature services + endpoints                 │
│  Jr. Backend Dev     → Tests + bug fixes + docs                     │
│  Sr. Frontend Dev    → Architecture + complex components            │
│  Mid Frontend Dev    → Feature pages + components                   │
│  Jr. Frontend Dev    → Simple components + bug fixes                │
│                                                                     │
│  ⛔ GATE: Team Lead reviews all PRs before merge                    │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│  PHASE 3: TEST & HARDEN (Days 8-12) — overlaps with Phase 2       │
│                                                                     │
│  QA Lead             → Test plans + acceptance testing              │
│  QA Engineer         → Automated tests + manual testing             │
│  Performance Eng.    → Load tests + optimization                    │
│  Security Engineer   → Security audit + vulnerability scan          │
│                                                                     │
│  ⛔ GATE: QA Lead signs off on 100% test pass rate                  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│  PHASE 4: DEPLOY & REVIEW (Days 12-14)                             │
│                                                                     │
│  DevOps Engineer     → Deploy to staging + smoke tests              │
│  PM                  → Sprint review + demo                         │
│  PO                  → Accept/reject deliverables                   │
│  All                 → Sprint retrospective                         │
│                                                                     │
│  ⛔ GATE: PO accepts sprint deliverables                            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Communication Protocol

**Handoff Format** (between agents):
```
FROM: [Agent Role]
TO:   [Agent Role]
RE:   [Feature/Story Name]
STATUS: Ready for [next phase]

DELIVERABLES:
- [List of artifacts with file paths]

DECISIONS MADE:
- [Key decisions with rationale]

OPEN QUESTIONS:
- [Anything requiring input from next agent]

BLOCKERS:
- [Anything that could impede the next phase]
```

**Escalation Path**:
```
Agent → Team Lead → Solutions Architect → PM → PO
```

**Blocker Resolution**:
- Technical blocker → Team Lead (< 4 hours)
- Scope blocker → PO (< 8 hours)
- Infrastructure blocker → DevOps (< 2 hours)
- Security blocker → Security Engineer (immediate)

---

## Definition of Done (DoD)

A story is DONE when ALL of the following are true:

- [ ] Code implements the acceptance criteria
- [ ] Code passes all existing tests
- [ ] New tests written for new functionality
- [ ] Code reviewed and approved by Team Lead
- [ ] Design matches UI mockup (verified by UI Designer)
- [ ] Copy matches UX Writer specs
- [ ] Accessibility verified (keyboard nav, ARIA, contrast)
- [ ] Responsive on mobile, tablet, desktop
- [ ] No console errors or warnings
- [ ] No TypeScript errors
- [ ] RBAC verified for all three roles
- [ ] Edge cases handled (empty, error, loading, overflow)
- [ ] Performance within budget
- [ ] Security reviewed (no new vulnerabilities)
- [ ] Audit logging implemented (for admin actions)
- [ ] Documentation updated if needed
