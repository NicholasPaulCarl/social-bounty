# `HttpExceptionFilter.catch()`

> Single global exception filter that normalises every NestJS error into the platform's `ApiErrorResponse` shape.

## What it does

`HttpExceptionFilter.catch(exception, host)` is a NestJS `ExceptionFilter` implementation registered globally in `main.ts` that intercepts every throw on the API request lifecycle and produces a typed `ApiErrorResponse` JSON body — `{ message: string, details?: ApiErrorDetail[], code?: string, statusCode: number, path: string, timestamp: string }`. It branches on exception type: `HttpException` subclasses (BadRequest, NotFound, Forbidden, Conflict) have their `getResponse()` mined for `message` + `details`; Prisma errors (`P2002` unique-constraint, `P2025` row-missing) are translated to 409/404 with code hints; everything else becomes a 500 with a Sentry-correlated `code` and a generic `Internal server error` message (so stack traces never leak to browser clients).

## Why it exists

Every TanStack Query hook (`useBounties`, `useWallet`, `useDisputes` etc.) assumes a stable error shape to render — the error boundary, the `toast.error(data.message)`, the form-level field errors derived from `details[]`. This filter is the enforcement point. The `details[]` convention is critical for the submissions flow's hard approval gate (commit `d7f2752`): when the backend rejects an `APPROVED` transition with `BadRequestException({ details: [{ field, message }] })`, the frontend reads that typed array back off `ApiErrorResponse.details` and surfaces per-URL failures in the `<VerificationReportPanel>`. Without the filter's round-trip of the `details` field, that UX would not survive.

## How it connects

- **`ApiErrorResponse`, `ApiErrorDetail` (shared)** — the DTOs this filter produces; imported by every web-side API consumer.
- **`HttpException` (NestJS)** — the base class the filter unwraps; `BadRequestException`, `ForbiddenException`, `NotFoundException`, `ConflictException`, `UnauthorizedException` are all subclasses.
- **`Prisma.PrismaClientKnownRequestError`** — recognised by the `instanceof` branch; `P2002`/`P2025` get domain-appropriate HTTP codes.
- **`Logger` (NestJS)** — unhandled errors get logged with stack + request metadata.
- **Sentry** — the 500-path issues a capture; the `code` in the response is the Sentry event id for support correlation.
- **`main.ts`** — where the filter is registered globally via `app.useGlobalFilters(new HttpExceptionFilter())`.

The degree of 30 reflects how many domain exceptions and response DTOs pass through this single `.catch()` method.

---
**degree:** 30 • **community:** "API service layer" (ID 1) • **source:** `apps/api/src/common/filters/http-exception.filter.ts`
**last touched:** (unknown) • **commits (90d):** (n/a) • **commits (total):** (n/a)

> **Architectural note:** this filter is the reason the 1347-test api suite can assert on `.response.body.details[0].field` — without it, every error-path test would have to hand-assert on ad-hoc shapes. Worth reviewing before any change to the response contract; a breaking change here ripples through all 1651 tests.
