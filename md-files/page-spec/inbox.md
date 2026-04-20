# Inbox — `/inbox`

**Route path:** `/inbox`
**File:** `apps/web/src/app/(participant)/inbox/page.tsx`
**Role:** Any authenticated role (participant layout uses `AuthGuard` without a role filter; nav entry exposed per role via `getNavSections`).
**Access:** `AuthGuard` wraps `(participant)/layout.tsx` — any authenticated user. Surfaces both notifications and direct-message conversations.
**Nav entry:** Sidebar "Inbox" (participant surface).
**Layout:** `apps/web/src/app/(participant)/layout.tsx` (`AuthGuard` → `MainLayout`).

See also: `docs/architecture/sitemap.md`.

## Purpose
Unified inbox with two tabs: Notifications (system events) and Messages (DM threads). Primary action is opening the item; secondary is starting a new conversation.

## Entry & exit
- **Reached from:** Sidebar nav, bell badge in header, deep-link from emails.
- **Links out to:** Each notification's `actionUrl` (variable — submissions, bounties, wallet, subscription), `/inbox/conversations/[id]` for threads.

## Data
- **React Query hooks:** `useNotifications({ limit: 50 })`, `useMarkNotificationRead()`, `useMarkAllRead()`, `useConversations({ limit: 50 })`.
- **API endpoints called:** `GET /notifications`, `POST /notifications/:id/read`, `POST /notifications/mark-all-read`, `GET /conversations`.
- **URL params:** None.
- **Search params:** None (tab state is local).

## UI structure
- `PageHeader` "Inbox" with `New message` action (opens `NewConversationDialog`).
- Two-tab pill control (glass-card): `Notifications` (Bell icon) / `Messages` (MessagesSquare icon).
- `NotificationsTab`: header row with count + "Mark all read"; EmptyState card if zero; else divided list — each row shows icon-colored by `NotificationType`, unread red dot, title, relative timestamp, line-clamped body.
- `MessagesTab`: conversation list — avatar with initials (pink) + unread badge (danger), participant names, subject, last message preview, right chevron.
- `NewConversationDialog` (dialog component) — opens, creates conversation, routes to `/inbox/conversations/:id`.

## States
- **Loading:** `LoadingState type="inline"` per tab.
- **Empty:** "All caught up" (Bell, pink circle) / "No conversations" (MessagesSquare, slate circle).
- **Error:** No explicit error UI (hooks should surface via toast); defaults to empty list.
- **Success:** Click-through to `actionUrl` or conversation, mutation marks item read in cache.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Notifications tab | `setActiveTab('notifications')` | Local state |
| Messages tab | `setActiveTab('messages')` | Local state |
| Mark all read | `markAll.mutate()` | Clears unread flags server-side |
| Row click (notification) | `markRead.mutate(id)` + `router.push(actionUrl)` | Marks read then navigates |
| Row click (conversation) | `router.push('/inbox/conversations/:id')` | Opens thread |
| New message | Opens `NewConversationDialog` | On create → routes to new conversation |

## Business rules
- Notification `actionUrl` is backend-controlled deep-link (can be any in-app route).
- No RBAC gate on the page itself — the content is scoped to the authenticated user by the API.
- No financial mutations on this page.

## Edge cases
- Unauthenticated → `AuthGuard` redirects to `/login`.
- Notification without `actionUrl` → click only marks it read, no navigation.
- Very long participant list → joined with commas (no truncation at this level — CSS `truncate` handles overflow).
- Unread count > 9 → displayed as "9+" badge.

## Tests
No colocated tests for the page itself; hooks tested under `apps/web/src/hooks/__tests__/useInbox.*`.

## Related files
- `@/components/features/inbox/NewConversationDialog` — conversation creation modal
- `@/components/common/PageHeader`, `LoadingState`
- `NotificationType` enum (shared) drives the icon/color map
- `ConversationListItem`, `NotificationResponse` (shared DTOs)

## Open questions / TODOs
- No explicit error state per tab; inline errors from hooks fall through silently.
- `NotificationType.NEW_MESSAGE` does not auto-filter to the Messages tab on click — uses `actionUrl`.
