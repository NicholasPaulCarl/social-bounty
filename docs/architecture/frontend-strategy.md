# Frontend Strategy - Social Bounty MVP

## Overview

This document defines the Next.js App Router file structure, routing strategy, state management approach, API client layer, and shared layout structure for the Social Bounty MVP frontend.

**Related documents**:
- API contracts: `docs/architecture/api-contracts.md`
- Security/RBAC: `docs/architecture/security-and-rbac.md`
- Database schema: `docs/architecture/database-schema.md`
- MVP backlog: `docs/backlog/mvp-backlog.md`

**Tech stack**: Next.js (App Router), PrimeReact, Tailwind CSS, TypeScript strict mode

---

## 1. Next.js App Router File Structure

```
apps/web/
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Root layout (providers, global styles)
│   │   ├── not-found.tsx                 # Global 404 page
│   │   ├── error.tsx                     # Global error boundary
│   │   │
│   │   ├── (auth)/                       # Auth route group (public, no sidebar)
│   │   │   ├── layout.tsx                # Auth layout (centered card, no nav)
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── signup/
│   │   │   │   └── page.tsx
│   │   │   ├── forgot-password/
│   │   │   │   └── page.tsx
│   │   │   ├── reset-password/
│   │   │   │   └── page.tsx
│   │   │   └── verify-email/
│   │   │       └── page.tsx
│   │   │
│   │   ├── (participant)/                # Participant route group
│   │   │   ├── layout.tsx                # Participant layout (nav + content)
│   │   │   ├── bounties/
│   │   │   │   ├── page.tsx              # Browse live bounties
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx          # Bounty detail
│   │   │   │       └── submit/
│   │   │   │           └── page.tsx      # Submit proof
│   │   │   ├── my-submissions/
│   │   │   │   ├── page.tsx              # My submissions list
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx          # Submission detail
│   │   │   └── profile/
│   │   │       └── page.tsx              # View/edit profile
│   │   │
│   │   ├── (business)/                   # Business Admin route group
│   │   │   ├── layout.tsx                # Business layout (business nav + content)
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx              # Business admin dashboard
│   │   │   ├── bounties/
│   │   │   │   ├── page.tsx              # Manage bounties list
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx          # Create bounty
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx          # Bounty detail / edit
│   │   │   │       └── submissions/
│   │   │   │           ├── page.tsx      # Review submissions list
│   │   │   │           └── [submissionId]/
│   │   │   │               └── page.tsx  # Review single submission
│   │   │   ├── brand/
│   │   │   │   ├── page.tsx              # Org details / edit
│   │   │   │   └── members/
│   │   │   │       └── page.tsx          # Manage members
│   │   │   └── profile/
│   │   │       └── page.tsx              # View/edit profile
│   │   │
│   │   ├── (admin)/                      # Super Admin route group
│   │   │   ├── layout.tsx                # Admin layout (admin nav + content)
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx              # Super admin dashboard
│   │   │   ├── users/
│   │   │   │   ├── page.tsx              # User management list
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx          # User detail
│   │   │   ├── brands/
│   │   │   │   ├── page.tsx              # Org management list
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx          # Create org (SA)
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx          # Org detail
│   │   │   ├── bounties/
│   │   │   │   ├── page.tsx              # All bounties list
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx          # Bounty detail (with override)
│   │   │   ├── submissions/
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx          # Submission detail (with override)
│   │   │   ├── audit-logs/
│   │   │   │   ├── page.tsx              # Audit log list
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx          # Audit log detail
│   │   │   ├── troubleshooting/
│   │   │   │   └── page.tsx              # System health + recent errors
│   │   │   ├── settings/
│   │   │   │   └── page.tsx              # Global toggles
│   │   │   └── profile/
│   │   │       └── page.tsx              # View/edit profile
│   │   │
│   │   └── (shared)/                     # Shared routes accessible to multiple roles
│   │       └── create-brand/
│   │           └── page.tsx              # Create org (Participant flow)
│   │
│   ├── components/                       # Shared UI components
│   │   ├── layout/
│   │   │   ├── AppHeader.tsx
│   │   │   ├── AppSidebar.tsx
│   │   │   ├── AuthLayout.tsx
│   │   │   ├── MainLayout.tsx
│   │   │   └── RoleBadge.tsx
│   │   ├── common/
│   │   │   ├── ConfirmDialog.tsx
│   │   │   ├── DataTableWrapper.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── ErrorState.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── PageHeader.tsx
│   │   │   ├── Pagination.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   └── Toast.tsx
│   │   ├── forms/
│   │   │   ├── FormField.tsx
│   │   │   ├── FileUpload.tsx
│   │   │   └── SearchInput.tsx
│   │   └── features/
│   │       ├── bounty/
│   │       │   ├── BountyCard.tsx
│   │       │   ├── BountyForm.tsx
│   │       │   ├── BountyFilters.tsx
│   │       │   └── BountyStatusBadge.tsx
│   │       ├── submission/
│   │       │   ├── SubmissionCard.tsx
│   │       │   ├── SubmissionForm.tsx
│   │       │   ├── SubmissionStatusBadge.tsx
│   │       │   ├── PayoutStatusBadge.tsx
│   │       │   └── ReviewActions.tsx
│   │       └── admin/
│   │           ├── UserStatusActions.tsx
│   │           ├── OrgStatusActions.tsx
│   │           ├── OverrideDialog.tsx
│   │           └── AuditLogEntry.tsx
│   │
│   ├── hooks/                            # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useBounties.ts
│   │   ├── useSubmissions.ts
│   │   ├── useOrganisation.ts
│   │   ├── useAdminUsers.ts
│   │   ├── useAdminOrgs.ts
│   │   ├── useAuditLogs.ts
│   │   ├── useDashboard.ts
│   │   └── usePagination.ts
│   │
│   ├── lib/                              # Core library code
│   │   ├── api/
│   │   │   ├── client.ts                 # API client (fetch wrapper)
│   │   │   ├── auth.ts                   # Auth API calls
│   │   │   ├── bounties.ts               # Bounty API calls
│   │   │   ├── submissions.ts            # Submission API calls
│   │   │   ├── brands.ts          # Brand API calls
│   │   │   ├── admin.ts                  # Admin API calls
│   │   │   └── types.ts                  # API response types
│   │   ├── auth/
│   │   │   ├── AuthContext.tsx            # Auth React context + provider
│   │   │   ├── AuthGuard.tsx             # Client-side auth guard component
│   │   │   └── tokens.ts                 # Token management (memory + cookie)
│   │   └── utils/
│   │       ├── cn.ts                     # Tailwind class name utility
│   │       ├── format.ts                 # Date, currency formatters
│   │       └── validation.ts             # Client-side validation helpers
│   │
│   ├── middleware.ts                      # Next.js middleware (auth + role routing)
│   │
│   └── styles/
│       └── globals.css                   # Tailwind imports + PrimeReact theme overrides
│
├── public/
│   └── ...                               # Static assets
│
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 2. Route Groups and Role Mapping

### 2.1 Route Group Definitions

| Route Group | Path Prefix | Allowed Roles | Layout |
|-------------|-------------|---------------|--------|
| `(auth)` | `/login`, `/signup`, etc. | Public (unauthenticated) | Centered card, no navigation |
| `(participant)` | `/bounties`, `/my-submissions`, etc. | PARTICIPANT, BUSINESS_ADMIN, SUPER_ADMIN | Standard nav + content |
| `(business)` | `/business/*` (e.g., `/business/dashboard`) | BUSINESS_ADMIN | Business nav + content |
| `(admin)` | `/admin/*` (e.g., `/admin/dashboard`) | SUPER_ADMIN | Admin nav + content |
| `(shared)` | `/create-brand` | PARTICIPANT | Standard nav + content |

**Note**: Route groups in Next.js App Router use parentheses `(groupName)` which do not affect the URL path. The actual URL paths are defined by the folder names inside the group.

### 2.2 URL Route Table

| URL Path | Route Group | Page | Roles |
|----------|-------------|------|-------|
| `/login` | (auth) | Login | Public |
| `/signup` | (auth) | Signup | Public |
| `/forgot-password` | (auth) | Forgot Password | Public |
| `/reset-password` | (auth) | Reset Password | Public |
| `/verify-email` | (auth) | Verify Email | Public |
| `/bounties` | (participant) | Browse Bounties | P, BA, SA |
| `/bounties/:id` | (participant) | Bounty Detail | P, BA, SA |
| `/bounties/:id/submit` | (participant) | Submit Proof | P |
| `/my-submissions` | (participant) | My Submissions | P |
| `/my-submissions/:id` | (participant) | Submission Detail | P |
| `/profile` | (participant) | Profile | P, BA, SA |
| `/create-brand` | (shared) | Create Brand | P |
| `/business/dashboard` | (business) | Business Dashboard | BA |
| `/business/bounties` | (business) | Manage Bounties | BA |
| `/business/bounties/new` | (business) | Create Bounty | BA |
| `/business/bounties/:id` | (business) | Edit Bounty | BA |
| `/business/bounties/:id/submissions` | (business) | Review Submissions | BA |
| `/business/bounties/:id/submissions/:submissionId` | (business) | Review Single Submission | BA |
| `/business/brand` | (business) | Org Details | BA |
| `/business/brand/members` | (business) | Manage Members | BA |
| `/business/profile` | (business) | Profile | BA |
| `/admin/dashboard` | (admin) | Admin Dashboard | SA |
| `/admin/users` | (admin) | User Management | SA |
| `/admin/users/:id` | (admin) | User Detail | SA |
| `/admin/brands` | (admin) | Org Management | SA |
| `/admin/brands/new` | (admin) | Create Org (SA) | SA |
| `/admin/brands/:id` | (admin) | Org Detail | SA |
| `/admin/bounties` | (admin) | All Bounties | SA |
| `/admin/bounties/:id` | (admin) | Bounty Detail + Override | SA |
| `/admin/submissions/:id` | (admin) | Submission Detail + Override | SA |
| `/admin/audit-logs` | (admin) | Audit Logs | SA |
| `/admin/audit-logs/:id` | (admin) | Audit Log Detail | SA |
| `/admin/troubleshooting` | (admin) | System Health + Errors | SA |
| `/admin/settings` | (admin) | Global Settings | SA |
| `/admin/profile` | (admin) | Profile | SA |

### 2.3 Post-Login Redirect

After login, users are redirected based on their role:

| Role | Redirect To |
|------|-------------|
| PARTICIPANT | `/bounties` |
| BUSINESS_ADMIN | `/business/dashboard` |
| SUPER_ADMIN | `/admin/dashboard` |

---

## 3. Middleware (Auth and Role-Based Route Guards)

### 3.1 Next.js Middleware

The middleware at `src/middleware.ts` runs on every request and handles:

```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_ROUTES = ['/login', '/signup', '/forgot-password', '/reset-password', '/verify-email'];
const PARTICIPANT_ROUTES = ['/bounties', '/my-submissions', '/profile', '/create-brand'];
const BUSINESS_ROUTES_PREFIX = '/business';
const ADMIN_ROUTES_PREFIX = '/admin';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = getTokenFromCookies(request); // Read access token from cookie or header
  const user = token ? decodeToken(token) : null;

  // 1. Public routes: redirect authenticated users to their dashboard
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    if (user) {
      return NextResponse.redirect(new URL(getDashboardUrl(user.role), request.url));
    }
    return NextResponse.next();
  }

  // 2. Protected routes: redirect unauthenticated users to login
  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Role-based access control
  if (pathname.startsWith(ADMIN_ROUTES_PREFIX) && user.role !== 'SUPER_ADMIN') {
    return NextResponse.redirect(new URL('/403', request.url));
  }

  if (pathname.startsWith(BUSINESS_ROUTES_PREFIX) && user.role !== 'BUSINESS_ADMIN') {
    return NextResponse.redirect(new URL('/403', request.url));
  }

  // 4. Participant-specific routes (submit proof)
  if (pathname.includes('/submit') && user.role !== 'PARTICIPANT') {
    return NextResponse.redirect(new URL('/403', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

### 3.2 Middleware Responsibilities

| Check | Action |
|-------|--------|
| No token + protected route | Redirect to `/login?returnTo=<path>` |
| Valid token + public route (login/signup) | Redirect to role-appropriate dashboard |
| Valid token + unauthorized route | Redirect to `/403` |
| Valid token + authorized route | Allow request |
| Expired token | Client-side refresh handles this (see Token Refresh) |

**Important**: The middleware only does lightweight JWT decoding (no verification). Full JWT verification happens server-side at the API layer. The middleware is a UX optimization, not a security boundary.

---

## 4. State Management

### 4.1 Strategy Overview

| State Type | Tool | Purpose |
|-----------|------|---------|
| Server state (API data) | TanStack Query (React Query) | Caching, fetching, mutations, optimistic updates |
| Auth state | React Context | Current user, tokens, login/logout |
| Form state | react-hook-form + zod | Form validation, submission handling |
| UI state (modals, toasts) | React Context or PrimeReact built-ins | Toast notifications, dialog state |

**No Redux**: TanStack Query handles server state caching; React Context handles the small amount of global client state. Redux would be unnecessary overhead for MVP.

### 4.2 TanStack Query Configuration

```typescript
// src/lib/query-client.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,        // 30 seconds before data is considered stale
      gcTime: 5 * 60_000,       // 5 minutes garbage collection
      retry: 1,                 // Retry failed queries once
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 0,                 // No retries for mutations
    },
  },
});
```

### 4.3 Query Key Convention

```typescript
// Hierarchical key structure for easy invalidation
const queryKeys = {
  bounties: {
    all: ['bounties'] as const,
    lists: () => [...queryKeys.bounties.all, 'list'] as const,
    list: (filters: BountyFilters) => [...queryKeys.bounties.lists(), filters] as const,
    details: () => [...queryKeys.bounties.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.bounties.details(), id] as const,
  },
  submissions: {
    all: ['submissions'] as const,
    mine: (filters: SubmissionFilters) => [...queryKeys.submissions.all, 'mine', filters] as const,
    forBounty: (bountyId: string, filters: SubmissionFilters) =>
      [...queryKeys.submissions.all, 'forBounty', bountyId, filters] as const,
    detail: (id: string) => [...queryKeys.submissions.all, 'detail', id] as const,
  },
  brands: {
    all: ['brands'] as const,
    detail: (id: string) => [...queryKeys.brands.all, 'detail', id] as const,
    members: (id: string) => [...queryKeys.brands.all, id, 'members'] as const,
  },
  admin: {
    users: (filters: UserFilters) => ['admin', 'users', filters] as const,
    userDetail: (id: string) => ['admin', 'users', id] as const,
    brands: (filters: OrgFilters) => ['admin', 'brands', filters] as const,
    auditLogs: (filters: AuditLogFilters) => ['admin', 'audit-logs', filters] as const,
    auditLogDetail: (id: string) => ['admin', 'audit-logs', id] as const,
    dashboard: ['admin', 'dashboard'] as const,
    systemHealth: ['admin', 'system-health'] as const,
    recentErrors: (filters: ErrorFilters) => ['admin', 'recent-errors', filters] as const,
    settings: ['admin', 'settings'] as const,
  },
  business: {
    dashboard: ['business', 'dashboard'] as const,
  },
  user: {
    me: ['user', 'me'] as const,
  },
};
```

### 4.4 Example Hook: useBounties

```typescript
// src/hooks/useBounties.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bountyApi } from '@/lib/api/bounties';
import { queryKeys } from '@/lib/query-keys';

export function useBounties(filters: BountyFilters) {
  return useQuery({
    queryKey: queryKeys.bounties.list(filters),
    queryFn: () => bountyApi.list(filters),
  });
}

export function useBounty(id: string) {
  return useQuery({
    queryKey: queryKeys.bounties.detail(id),
    queryFn: () => bountyApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateBounty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bountyApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bounties.lists() });
    },
  });
}

export function useUpdateBountyStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: BountyStatus }) =>
      bountyApi.updateStatus(id, status),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.bounties.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.bounties.lists() });
    },
  });
}
```

### 4.5 Auth Context

```typescript
// src/lib/auth/AuthContext.tsx
interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<string | null>;
}

// The AuthProvider:
// 1. On mount, checks for existing refresh token cookie
// 2. If found, calls /auth/refresh to get a new access token
// 3. Stores access token in memory (React state)
// 4. Provides user info decoded from the access token
// 5. Sets up an interval to refresh the token before expiry (e.g., every 14 minutes)
// 6. On login, stores both tokens and updates user state
// 7. On logout, calls /auth/logout, clears tokens, redirects to /login
```

### 4.6 Form State (react-hook-form + zod)

```typescript
// Example: Create Bounty Form
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const createBountySchema = z.object({
  title: z.string().min(1).max(200),
  shortDescription: z.string().min(1).max(500),
  fullInstructions: z.string().min(1).max(10000),
  category: z.string().min(1).max(100),
  rewardType: z.enum(['CASH', 'PRODUCT', 'SERVICE', 'OTHER']),
  rewardValue: z.number().positive().optional(),
  rewardDescription: z.string().max(500).optional(),
  maxSubmissions: z.number().int().positive().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  eligibilityRules: z.string().min(1).max(5000),
  proofRequirements: z.string().min(1).max(5000),
}).refine(
  data => !data.startDate || !data.endDate || data.endDate > data.startDate,
  { message: 'End date must be after start date', path: ['endDate'] }
);

// Usage in component:
const form = useForm<CreateBountyInput>({
  resolver: zodResolver(createBountySchema),
  defaultValues: { rewardType: 'CASH', ... },
});
```

---

## 5. API Client Layer

### 5.1 Fetch Wrapper

```typescript
// src/lib/api/client.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

class ApiClient {
  private getAccessToken: () => string | null;
  private onUnauthorized: () => Promise<string | null>; // refresh token callback

  constructor(getAccessToken: () => string | null, onUnauthorized: () => Promise<string | null>) {
    this.getAccessToken = getAccessToken;
    this.onUnauthorized = onUnauthorized;
  }

  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = this.getAccessToken();
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    // Don't set Content-Type for FormData (browser sets it with boundary)
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      credentials: 'include', // Send cookies (refresh token)
    });

    // Auto-refresh on 401
    if (response.status === 401 && this.onUnauthorized) {
      const newToken = await this.onUnauthorized();
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(`${API_BASE_URL}${path}`, {
          ...options,
          headers,
          credentials: 'include',
        });
      }
    }

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(response.status, error.message, error.details);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'GET' });
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'DELETE' });
  }
}
```

### 5.2 Type-Safe API Modules

```typescript
// src/lib/api/bounties.ts
import { apiClient } from './client';
import type { Bounty, BountyDetail, PaginatedResponse, CreateBountyInput } from './types';

export const bountyApi = {
  list: (filters: BountyFilters): Promise<PaginatedResponse<Bounty>> =>
    apiClient.get(`/bounties?${buildQueryString(filters)}`),

  getById: (id: string): Promise<BountyDetail> =>
    apiClient.get(`/bounties/${id}`),

  create: (data: CreateBountyInput): Promise<BountyDetail> =>
    apiClient.post('/bounties', data),

  update: (id: string, data: Partial<CreateBountyInput>): Promise<BountyDetail> =>
    apiClient.patch(`/bounties/${id}`, data),

  updateStatus: (id: string, status: BountyStatus): Promise<{ id: string; status: BountyStatus }> =>
    apiClient.patch(`/bounties/${id}/status`, { status }),

  delete: (id: string): Promise<void> =>
    apiClient.delete(`/bounties/${id}`),
};
```

### 5.3 Error Handling

```typescript
// src/lib/api/client.ts
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public override message: string,
    public details?: Array<{ field: string; message: string }>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Usage in components with TanStack Query:
const { error } = useBounties(filters);

if (error instanceof ApiError) {
  if (error.statusCode === 403) {
    // Show forbidden message
  } else if (error.statusCode === 404) {
    // Show not found
  } else {
    // Show generic error with error.message
  }
}
```

### 5.4 Shared API Types

API response types live in `packages/shared/` (shared between frontend and backend):

```typescript
// packages/shared/src/types/api.ts
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiErrorResponse {
  statusCode: number;
  error: string;
  message: string;
  details?: Array<{ field: string; message: string }>;
}
```

---

## 6. Page-Level Data Fetching Strategy

### 6.1 Approach

All data fetching uses **client-side fetching with TanStack Query**. This approach is chosen because:

1. Most pages require authentication, which means we need the access token from the client-side auth context.
2. TanStack Query provides built-in caching, background refetching, loading/error states, and optimistic updates.
3. PrimeReact components (DataTable, etc.) work naturally with client-side data.

### 6.2 Page Pattern

Every data page follows this pattern:

```typescript
// src/app/(participant)/bounties/page.tsx
'use client';

import { useState } from 'react';
import { useBounties } from '@/hooks/useBounties';
import { BountyCard } from '@/components/features/bounty/BountyCard';
import { BountyFilters } from '@/components/features/bounty/BountyFilters';
import { Pagination } from '@/components/common/Pagination';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorState } from '@/components/common/ErrorState';
import { EmptyState } from '@/components/common/EmptyState';

export default function BountiesPage() {
  const [filters, setFilters] = useState<BountyFilters>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const { data, isLoading, error } = useBounties(filters);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorState error={error} />;
  if (!data?.data.length) return <EmptyState message="No bounties found." />;

  return (
    <>
      <PageHeader title="Browse Bounties" />
      <BountyFilters filters={filters} onChange={setFilters} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.data.map(bounty => <BountyCard key={bounty.id} bounty={bounty} />)}
      </div>
      <Pagination meta={data.meta} onPageChange={page => setFilters(f => ({ ...f, page }))} />
    </>
  );
}
```

### 6.3 Data Fetching by Page

| Page | API Call | Fetching Strategy |
|------|---------|-------------------|
| Browse Bounties | `GET /bounties` | TanStack Query with filters |
| Bounty Detail | `GET /bounties/:id` | TanStack Query by ID |
| Submit Proof | `POST /bounties/:id/submissions` | TanStack Mutation |
| My Submissions | `GET /submissions/me` | TanStack Query with filters |
| Submission Detail | `GET /submissions/:id` | TanStack Query by ID |
| Business Dashboard | `GET /business/dashboard` | TanStack Query |
| Manage Bounties | `GET /bounties` (org-scoped) | TanStack Query with filters |
| Review Submissions | `GET /bounties/:id/submissions` | TanStack Query with filters |
| Admin Dashboard | `GET /admin/dashboard` | TanStack Query |
| User Management | `GET /admin/users` | TanStack Query with filters |
| Audit Logs | `GET /admin/audit-logs` | TanStack Query with filters |
| System Health | `GET /admin/system-health` | TanStack Query (refetch every 30s) |

---

## 7. Shared Layout Structure

### 7.1 Root Layout

```typescript
// src/app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <PrimeReactProvider>
              <Toast ref={toastRef} />
              {children}
            </PrimeReactProvider>
          </AuthProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
```

### 7.2 Auth Layout (Login, Signup, etc.)

```
┌────────────────────────────────────────┐
│                                        │
│           Social Bounty Logo           │
│                                        │
│        ┌──────────────────┐            │
│        │                  │            │
│        │   Auth Form      │            │
│        │   (Login/Signup) │            │
│        │                  │            │
│        └──────────────────┘            │
│                                        │
│           Footer links                 │
│                                        │
└────────────────────────────────────────┘
```

### 7.3 Main App Layout (Participant, Business, Admin)

```
┌────────────────────────────────────────────────────┐
│  Header: Logo │ Search │ Notifications │ Profile ▼ │
├────────┬───────────────────────────────────────────┤
│        │                                           │
│ Side-  │  Page Content Area                        │
│ bar    │                                           │
│        │  ┌─────────────────────────────────┐      │
│ Nav    │  │ Page Header + Breadcrumbs       │      │
│ items  │  ├─────────────────────────────────┤      │
│ based  │  │                                 │      │
│ on     │  │ Page Body                       │      │
│ role   │  │ (Tables, Cards, Forms, etc.)    │      │
│        │  │                                 │      │
│        │  └─────────────────────────────────┘      │
│        │                                           │
├────────┴───────────────────────────────────────────┤
│  Footer (optional)                                  │
└────────────────────────────────────────────────────┘
```

### 7.4 Sidebar Navigation by Role

**Participant**:
- Browse Bounties
- My Submissions
- Profile

**Business Admin**:
- Dashboard
- Bounties (manage)
- Brand
- Profile

**Super Admin**:
- Dashboard
- Users
- Brands
- Bounties (all)
- Audit Logs
- Troubleshooting
- Settings
- Profile

### 7.5 Layout Implementation

```typescript
// src/app/(business)/layout.tsx
'use client';

import { useAuth } from '@/hooks/useAuth';
import { MainLayout } from '@/components/layout/MainLayout';
import { businessNavItems } from '@/lib/navigation';

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  // Extra safety: middleware handles this, but belt-and-suspenders
  if (user?.role !== 'BUSINESS_ADMIN') return null;

  return <MainLayout navItems={businessNavItems}>{children}</MainLayout>;
}
```

---

## 8. Token Refresh Flow

### 8.1 Client-Side Refresh

```
1. User makes API request
2. ApiClient attaches access token from memory
3. If 401 response:
   a. ApiClient calls AuthContext.refreshAccessToken()
   b. AuthContext sends POST /auth/refresh with httpOnly cookie
   c. If success: new access token stored in memory, retry original request
   d. If fail: clear auth state, redirect to /login
4. Background: AuthProvider sets interval to refresh proactively (every 14 min)
```

### 8.2 Handling Token Expiry During Navigation

The middleware reads a lightweight cookie (not the httpOnly refresh token) that indicates whether the user is authenticated. This cookie is:
- Set on login with the user's role
- Cleared on logout
- Used only by middleware for routing decisions (not for API calls)
- Not a security mechanism (API enforces real auth)

---

## 9. Assumptions

1. **Client-side rendering for all data pages**: No server-side rendering (SSR) or server components for authenticated pages. All data fetching happens client-side via TanStack Query. This simplifies auth token handling.
2. **PrimeReact theming**: Using a single PrimeReact theme (e.g., Lara Light) with Tailwind CSS overrides for spacing and layout.
3. **No ISR/SSG**: No static generation or incremental static regeneration for any pages. All pages are dynamically rendered.
4. **Mobile responsive**: All layouts use Tailwind responsive utilities. The sidebar collapses to a hamburger menu on small screens.
5. **Shared types package**: API types are defined in `packages/shared/` and imported by both `apps/web` and `apps/api`. This ensures type consistency.
6. **Participant routes accessible to all roles**: BA and SA users can also browse public bounties via the (participant) routes. The sidebar will show their role-appropriate navigation.
7. **No global state library**: TanStack Query for server state + React Context for auth is sufficient for MVP. No Redux, Zustand, or Jotai.
8. **react-hook-form for all forms**: All forms use react-hook-form with zod validation. PrimeReact form components are wrapped to integrate with react-hook-form's controller pattern.
