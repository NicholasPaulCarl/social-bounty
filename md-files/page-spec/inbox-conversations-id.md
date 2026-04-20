# Conversation Thread — `/inbox/conversations/[id]`

**Route path:** `/inbox/conversations/[id]`
**File:** `apps/web/src/app/(participant)/inbox/conversations/[id]/page.tsx`
**Role:** Any authenticated role.
**Access:** `AuthGuard` via participant layout; API enforces participant membership on the conversation.
**Nav entry:** Deep-link only (reached from `/inbox` list or notification `actionUrl`).
**Layout:** `apps/web/src/app/(participant)/layout.tsx`.

See also: `docs/architecture/sitemap.md`.

## Purpose
Full-height chat view for a single conversation thread. Renders messages, reviewer/system events, and an input composer. Marks the conversation as read on mount.

## Entry & exit
- **Reached from:** `/inbox` conversations tab, notification `actionUrl` on NEW_MESSAGE, `NewConversationDialog` on create.
- **Links out to:** `/inbox` (back arrow), attachment URLs (external).

## Data
- **React Query hooks:** `useConversation(id)`, `useSendMessage(id)`, `useMarkConversationRead(id)`, `useAuth()`.
- **API endpoints called:** `GET /conversations/:id`, `POST /conversations/:id/messages`, `POST /conversations/:id/read`.
- **URL params:** `id` — conversation UUID.
- **Search params:** None.

## UI structure
- Header glass-card: back button (ArrowLeft), subject, participant names (Users icon), context pill (pink), reference ID short (Link2 icon) when present.
- Messages column: scrollable glass-card. System messages centered pill (Info icon). Deleted messages render placeholder ("Message deleted"). Regular messages as bubbles — right-aligned/pink tint for `msg.senderId === user.id`, left-aligned/slate for others. Each bubble shows avatar initials, sender name, relative timestamp, optional "(edited)" marker, body, and optional attachment link (Paperclip icon).
- Auto-scroll ref on `messagesEndRef` triggers on every `data.messages` change.
- Composer glass-card: textarea (Enter submits, Shift+Enter newline), rounded Send button. Input cleared + focused on successful send.

## States
- **Loading:** `LoadingState type="page"` (full page placeholder).
- **Empty:** Inline empty state inside message column — MessagesSquare icon + "No messages yet. Start the conversation."
- **Error:** `ErrorState` with retry.
- **Success:** Message appended to cache via mutation; input resets; focus returns to textarea.

## Primary actions
| Label | Action | Destination / Effect |
|-------|--------|----------------------|
| Back | `router.push('/inbox')` | Returns to inbox |
| Send message | `sendMessage.mutate({ body })` | Appends message; resets input |
| Attachment link | `<a target="_blank">` | Opens attachment URL |

## Business rules
- `markRead.mutate()` fires once on mount (id-keyed effect with deliberate `exhaustive-deps` disable — `markRead` reference changes per render).
- Sender alignment derived from `msg.senderId === user.id` (own messages right/pink, others left/slate).
- Empty or whitespace-only bodies silently rejected (`body.trim()` guard).

## Edge cases
- Unauthorized/non-participant → API 403; surfaces as `ErrorState`.
- Missing conversation (`!data` after load) → returns `null` (blank shell).
- Composer disabled while `sendMessage.isPending`.
- Deleted messages preserve layout but show opaque "Message deleted" placeholder.
- System messages skip the standard bubble layout.

## Tests
No colocated tests.

## Related files
- `@social-bounty/shared` — `InboxMessageResponse`, conversation DTOs
- `@/hooks/useInbox` — all three hooks share a query-key namespace
- `@/components/common/LoadingState`, `ErrorState`

## Open questions / TODOs
- No pagination — full thread loaded on mount. Could be heavy for long histories.
- Attachment preview not rendered (only a link).
- `exhaustive-deps` disable on `markRead` effect noted in code comment.
