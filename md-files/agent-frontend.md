# Frontend Agent Reference

> Next.js pages, PrimeReact components, routing, state management

## Responsibilities

- Build and maintain Next.js pages and components in `apps/web/src/`
- Use PrimeReact for all UI components + Tailwind CSS for layout/styling
- Manage client-side state with React Query
- Implement role-based routing and auth guards
- Consume the REST API via typed API client modules

## Tech Stack

- **Framework**: Next.js 14 (App Router) — `apps/web/`
- **UI Library**: PrimeReact 10 (theme: `lara-light-blue`)
- **Styling**: Tailwind CSS 3 with custom color palette
- **State**: TanStack React Query 5
- **Forms**: Controlled components with React state (react-hook-form + zod available but not primary pattern)
- **Auth**: Custom AuthContext with JWT (access token in-memory, refresh token in localStorage)
- **Shared types**: `@social-bounty/shared` (enums, DTOs, constants)

---

## Route Structure

### Auth Routes — `src/app/(auth)/` (route group, no URL prefix)

```
/login                    page.tsx — Login form + demo buttons (behind NEXT_PUBLIC_DEMO_MODE)
/signup                   page.tsx — Registration
/forgot-password          page.tsx — Request password reset
/reset-password           page.tsx — Reset with token
/verify-email             page.tsx — Email verification
```

### Participant Routes — `src/app/(participant)/` (route group)

```
/bounties                 page.tsx — Browse live bounties (list + filters)
/bounties/[id]            page.tsx — Bounty detail
/bounties/[id]/submit     page.tsx — Submit proof form
/my-submissions           page.tsx — User's submission list
/my-submissions/[id]      page.tsx — Submission detail
/my-submissions/[id]/update  page.tsx — Update submission
/profile                  page.tsx — Participant profile
```

### Business Admin Routes — `src/app/business/` (real path segment)

```
/business/dashboard                              page.tsx
/business/bounties                               page.tsx — Manage org bounties
/business/bounties/new                           page.tsx — Create bounty
/business/bounties/[id]                          page.tsx — Bounty detail
/business/bounties/[id]/edit                     page.tsx — Edit bounty
/business/bounties/[id]/submissions              page.tsx — Review list
/business/bounties/[id]/submissions/[submissionId]  page.tsx — Review detail
/business/organisation                           page.tsx — Org details
/business/organisation/edit                      page.tsx — Edit org
/business/organisation/members                   page.tsx — Manage members
/business/profile                                page.tsx
```

### Super Admin Routes — `src/app/admin/` (real path segment)

```
/admin/dashboard          page.tsx — Platform metrics
/admin/users              page.tsx — User list
/admin/users/[id]         page.tsx — User detail + actions
/admin/organisations      page.tsx — Org list
/admin/organisations/new  page.tsx — Create org
/admin/organisations/[id] page.tsx — Org detail
/admin/bounties           page.tsx — All bounties
/admin/bounties/[id]      page.tsx — Bounty detail + override
/admin/submissions/[id]   page.tsx — Submission detail + override
/admin/audit-logs         page.tsx — Audit log list
/admin/audit-logs/[id]    page.tsx — Audit log detail
/admin/troubleshooting    page.tsx — System health + errors
/admin/settings           page.tsx — Platform settings
/admin/profile            page.tsx
```

### Shared Routes — `src/app/(shared)/`

```
/create-organisation      page.tsx — Org creation (post-signup)
```

**Critical**: Route groups `(business)/` + `(admin)/` conflict if they share child route names. That's why `business/` and `admin/` use real path segments.

---

## Layout Hierarchy

```
app/layout.tsx (root)
  └── providers.tsx (QueryClientProvider, PrimeReactProvider, AuthProvider, Toast)
      ├── (auth)/layout.tsx → AuthLayout (centered card design, no nav)
      ├── (participant)/layout.tsx → AuthGuard + MainLayout (sidebar + header)
      ├── (shared)/layout.tsx → AuthGuard + MainLayout
      ├── business/layout.tsx → AuthGuard(allowedRoles=[BUSINESS_ADMIN]) + MainLayout
      └── admin/layout.tsx → AuthGuard(allowedRoles=[SUPER_ADMIN]) + MainLayout
```

---

## Auth System

### AuthContext (`src/lib/auth/AuthContext.tsx`)

**Provides**: `{ user, isAuthenticated, isLoading, login, logout, refreshAccessToken }`

**Token storage**:
- Access token: in-memory variable (`src/lib/auth/tokens.ts`)
- Refresh token: `localStorage.getItem('sb_refresh_token')`
- Role cookie: `sb_auth_role` — used by middleware for route protection (not for auth)

**Login flow**:
1. Call `authApi.login({ email, password })`
2. Store access token in memory, refresh token in localStorage
3. Set `sb_auth_role` cookie
4. Redirect to `returnTo` param or role-based dashboard

**Auto-refresh**: interval every 14 minutes when user is authenticated.

**Initialization**: on mount, checks localStorage for refresh token, calls `/auth/refresh`.

### AuthGuard (`src/lib/auth/AuthGuard.tsx`)

```tsx
<AuthGuard allowedRoles={[UserRole.BUSINESS_ADMIN]}>
  {children}
</AuthGuard>
```

- Shows nothing while loading
- Redirects to `/login?returnTo=...` if unauthenticated
- Redirects to `/bounties` if authenticated but wrong role

### Middleware (`src/middleware.ts`)

Server-side route protection using `sb_auth_role` cookie:
- Public routes: `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/verify-email`
- Authenticated users on public routes → redirect to dashboard
- Unauthenticated on protected routes → redirect to `/login?returnTo=...`
- `/admin/*` → SUPER_ADMIN only
- `/business/*` → BUSINESS_ADMIN only
- `/submit` routes → PARTICIPANT only

**Dashboard mapping**: PARTICIPANT → `/bounties`, BUSINESS_ADMIN → `/business/dashboard`, SUPER_ADMIN → `/admin/dashboard`

---

## API Client

### Base Client (`src/lib/api/client.ts`)

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

apiClient.get<T>(path, params?)    // GET with query string
apiClient.post<T>(path, body?)     // POST (JSON or FormData)
apiClient.patch<T>(path, body?)    // PATCH
apiClient.delete<T>(path)          // DELETE
```

**Features**:
- Auto-injects `Authorization: Bearer <token>` header
- Detects FormData for file uploads (skips Content-Type)
- Auto-retries on 401: calls `refreshAccessToken()`, retries with new token
- Throws `ApiError(statusCode, message, details?)` on non-OK responses

### Feature Modules

| Module | File | Key functions |
|---|---|---|
| Auth | `src/lib/api/auth.ts` | signup, login, logout, forgotPassword, resetPassword, verifyEmail, refresh |
| Bounties | `src/lib/api/bounties.ts` | list, getById, create, update, updateStatus, delete |
| Submissions | `src/lib/api/submissions.ts` | create, listMine, listForBounty, getById, update, review, updatePayout |
| Organisations | `src/lib/api/organisations.ts` | create, getById, update, listMembers, inviteMember, removeMember |
| Users | `src/lib/api/users.ts` | getMe, updateMe, changePassword |
| Business | `src/lib/api/business.ts` | getDashboard |
| Admin | `src/lib/api/admin.ts` | ~24 functions covering users, orgs, overrides, audit logs, settings, health |

---

## React Query

### Query Client (`src/lib/query-client.ts`)

```typescript
staleTime: 30_000,          // 30s
gcTime: 5 * 60_000,        // 5m
retry: 1,
refetchOnWindowFocus: true,
mutations: { retry: 0 }
```

### Query Keys (`src/lib/query-keys.ts`)

Factory pattern with hierarchical keys:
```typescript
queryKeys.bounties.all          // ['bounties']
queryKeys.bounties.list(filters) // ['bounties', 'list', {...}]
queryKeys.bounties.detail(id)    // ['bounties', 'detail', 'abc-123']
queryKeys.admin.dashboard        // ['admin', 'dashboard']
queryKeys.user.me                // ['user', 'me']
```

### Custom Hooks

**Pattern** — each domain has query + mutation hooks:

```typescript
// Query
export function useBounties(filters) {
  return useQuery({ queryKey: queryKeys.bounties.list(filters), queryFn: () => bountyApi.list(filters) });
}

// Mutation with cache invalidation
export function useCreateBounty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => bountyApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.bounties.lists() }),
  });
}
```

**Hook files**:
- `src/hooks/useBounties.ts` — useBounties, useBounty, useCreateBounty, useUpdateBounty, useUpdateBountyStatus, useDeleteBounty
- `src/hooks/useSubmissions.ts` — useMySubmissions, useSubmissionsForBounty, useSubmission, useCreateSubmission, useUpdateSubmission, useReviewSubmission, useUpdatePayout
- `src/hooks/useOrganisation.ts` — useOrganisation, useOrganisationMembers, useCreateOrganisation, useUpdateOrganisation, useInviteMember, useRemoveMember
- `src/hooks/useAdmin.ts` — ~24 hooks for admin functions
- `src/hooks/useProfile.ts` — useProfile, useUpdateProfile, useChangePassword
- `src/hooks/useDashboard.ts` — useBusinessDashboard
- `src/hooks/useAuth.ts` — wraps AuthContext
- `src/hooks/usePagination.ts` — page/limit/first/onPageChange/resetPage
- `src/hooks/useToast.ts` — showSuccess, showError, showInfo, showWarn

---

## PrimeReact Components Used

| Component | Import | Common Usage |
|---|---|---|
| Button | `primereact/button` | Actions, submit, demo login. Props: `label`, `icon`, `severity`, `outlined`, `loading`, `disabled` |
| InputText | `primereact/inputtext` | Text fields |
| InputTextarea | `primereact/inputtextarea` | Multi-line text |
| Password | `primereact/password` | Password input (`feedback={false}`, `toggleMask`) |
| InputNumber | `primereact/inputnumber` | Numeric input (currency mode) |
| Dropdown | `primereact/dropdown` | Select (status, reward type, sorting) |
| Calendar | `primereact/calendar` | Date picker |
| FileUpload | `primereact/fileupload` | Image upload |
| Card | `primereact/card` | Content containers |
| Tag | `primereact/tag` | Status badges |
| Message | `primereact/message` | Inline alerts/errors |
| Toast | `primereact/toast` | Global notifications (top-right) |
| Dialog | `primereact/dialog` | Modal dialogs |
| ConfirmDialog | `primereact/confirmdialog` | Confirmation prompts |
| Paginator | `primereact/paginator` | Pagination controls |
| BreadCrumb | `primereact/breadcrumb` | Navigation breadcrumbs |
| Divider | `primereact/divider` | Section separators |
| Skeleton | `primereact/skeleton` | Loading placeholders |
| ProgressSpinner | `primereact/progressspinner` | Loading spinner |
| Menu | `primereact/menu` | Popup menu (user dropdown) |

### Button Severity Mapping

| Severity | Color | Use case |
|---|---|---|
| (default) | Blue | Primary actions |
| `secondary` | Gray | Neutral/cancel |
| `success` | Green | Positive actions, approve |
| `warning` | Amber | Caution actions |
| `danger` | Red | Destructive actions |
| `info` | Blue | Informational |

### Icon Classes
PrimeIcons: `pi pi-search`, `pi pi-plus`, `pi pi-times`, `pi pi-user`, `pi pi-sign-in`, `pi pi-shield`, `pi pi-briefcase`, `pi pi-check`, `pi pi-pencil`, `pi pi-trash`, `pi pi-eye`, etc.

---

## Tailwind CSS

### Config (`tailwind.config.ts`)

Custom color palette:
- `primary` — Blue (#3b82f6 base, 50-900 scale)
- `secondary` — Slate (50-900)
- `success` — Green
- `warning` — Amber
- `danger` — Red
- `info` — Blue
- `neutral` — Gray (50-900)

### Common Patterns

```tsx
// Layout
className="min-h-screen bg-neutral-50"
className="max-w-7xl w-full mx-auto"
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"

// Typography
className="text-2xl font-bold text-neutral-900"
className="text-sm text-neutral-500"
className="line-clamp-2"

// Spacing
className="space-y-6"
className="p-6"
className="gap-3"

// Interactive
className="hover:shadow-md transition-shadow cursor-pointer"
```

---

## Common Components

### StatusBadge (`src/components/common/StatusBadge.tsx`)
```tsx
<StatusBadge type="bounty" value={bounty.status} size="small" />
<StatusBadge type="submission" value={submission.status} />
<StatusBadge type="user" value={user.status} />
```

### PageHeader (`src/components/common/PageHeader.tsx`)
```tsx
<PageHeader
  title="Browse Bounties"
  subtitle="Find bounties"
  breadcrumbs={[{ label: 'Bounties', url: '/bounties' }, { label: 'Detail' }]}
  actions={<Button label="Create" />}
/>
```

### LoadingState (`src/components/common/LoadingState.tsx`)
```tsx
<LoadingState type="cards-grid" cards={6} />
<LoadingState type="table" rows={10} columns={4} />
<LoadingState type="form" />
<LoadingState type="detail" />
<LoadingState type="inline" />
```

### ErrorState / EmptyState (`src/components/common/`)
```tsx
<ErrorState error={error} onRetry={() => refetch()} />
<EmptyState icon="pi-search" title="No results" message="Try adjusting filters" ctaLabel="Clear" ctaAction={reset} />
```

### ConfirmAction (`src/components/common/ConfirmAction.tsx`)
```tsx
<ConfirmAction
  visible={show} onHide={() => setShow(false)}
  title="Delete Bounty?" message="This cannot be undone."
  confirmLabel="Delete" confirmSeverity="danger"
  onConfirm={handleDelete} requireReason={true} loading={isPending}
/>
```

### OverrideModal (`src/components/common/OverrideModal.tsx`)
Admin-only modal for overriding bounty/submission status with reason.

### Feature Components
- `src/components/features/bounty/BountyCard.tsx` — Card with status badge, reward, title, description, category, time remaining
- `src/components/features/bounty/BountyFilters.tsx` — Search, status dropdown, reward type, sort, clear
- `src/components/features/submission/ReviewActionBar.tsx` — Review actions
- `src/components/features/submission/PayoutActionBar.tsx` — Payout actions

---

## Navigation (`src/lib/navigation.ts`)

Role-based nav items for sidebar:
- **Participant**: Browse Bounties, My Submissions, Profile
- **Business**: Dashboard, Bounties, Organisation, Profile
- **Admin**: Dashboard, Users, Organisations, Bounties, Audit Logs, System Health, Settings, Profile

Active state: `pathname === item.href || pathname.startsWith(item.href + '/')`

---

## Utility Functions

### `src/lib/utils/cn.ts`
```typescript
cn(...classes: (string | undefined | null | false)[]): string
// Filters falsy, joins with space
```

### `src/lib/utils/format.ts`
```typescript
formatDate(dateString): string          // "Jan 15, 2025"
formatDateTime(dateString): string      // "Jan 15, 2025, 10:30 AM"
formatCurrency(value): string           // "$1,234.56"
formatEnumLabel(value): string          // "NEEDS_MORE_INFO" → "Needs More Info"
formatBytes(bytes): string              // 1024 → "1 KB"
truncate(text, maxLength): string       // Adds ellipsis
timeRemaining(endDate): string | null   // "5 days left", "Ended"
```

---

## Shared Package Usage (Critical Rules)

### Enum Imports
```typescript
// CORRECT — value import for runtime use
import { UserRole, BountyStatus } from '@social-bounty/shared';
const role = UserRole.PARTICIPANT;

// WRONG — type import loses enum values
import type { UserRole } from '@social-bounty/shared';
const role: UserRole = 'PARTICIPANT'; // Type error!
```

### DTO Nesting
DTOs use nested objects, NOT flattened:
```typescript
submission.bounty.title       // NOT bountyTitle
data.users.total              // NOT totalUsers
member.user.firstName         // NOT userName
PAGINATION_DEFAULTS.LIMIT     // NOT DEFAULT_LIMIT
```

---

## Form Handling Pattern

```typescript
const [title, setTitle] = useState('');
const createMutation = useCreateBounty();

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!title.trim()) { setError('Title required'); return; }

  try {
    await createMutation.mutateAsync({ title, ... });
    toast.showSuccess('Created!');
    router.push('/bounties');
  } catch (err) {
    if (err instanceof ApiError) showError(err.message);
  }
};
```

### File Upload Pattern
```typescript
const [images, setImages] = useState<File[]>([]);

<FileUpload
  onSelect={(e) => setImages(e.files as File[])}
  onRemove={(e) => setImages(prev => prev.filter(f => f !== e.file))}
  onClear={() => setImages([])}
/>
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | API base URL (default: `http://localhost:3001/api/v1`) |
| `NEXT_PUBLIC_DEMO_MODE` | Show demo login buttons when `true` |
