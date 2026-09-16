# Conveyor

A job queue dashboard. A *job* here is a unit of background work a server owes someone — send a welcome email, render an invoice, resize an upload. Conveyor is the operator's screen for that queue: create jobs, move them through their lifecycle, and see what's waiting, running, done or broken.

- **Dashboard:** https://conveyor-nu.vercel.app
- **API:** https://conveyor-ykd6.onrender.com
- **Health check:** https://conveyor-ykd6.onrender.com/health

> The API runs on Render's free tier and sleeps after ~15 minutes of inactivity. The first request after an idle period can take up to a minute; open the health check once before demoing.

## Stack

| Layer | Choice |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, TanStack Query |
| Backend | NestJS 12, TypeScript, TypeORM 0.3 |
| Database | PostgreSQL (Neon) |
| Runtime & package manager | Bun 1.3 |
| Hosting | Vercel (frontend), Render (API) |

## The job lifecycle

```
pending ──> running ──> completed
                   └──> failed
```

`completed` and `failed` are terminal. A job cannot skip `running`, and nothing can return to `pending`.

## API

| Method | Path | Body / query | Returns |
|---|---|---|---|
| `GET` | `/health` | — | `200` `{status, timestamp}` |
| `POST` | `/jobs` | `{title, type, priority?}` | `201` job · `400` invalid or unknown fields |
| `GET` | `/jobs` | `?status=` optional | `200` jobs, newest first · `400` unknown status |
| `GET` | `/jobs/stats` | — | `200` `{pending, running, completed, failed}` |
| `PATCH` | `/jobs/:id/status` | `{status}`, optional `If-Match: <version>` | `200` job + `ETag` · `409` · `412` · `404` · `400` |
| `DELETE` | `/jobs/:id` | — | `204` · `404` · `400` |

A job is `{ id, title, type, priority, status, version, createdAt }`.

Every error — including Nest's own "no such route" — comes back in one shape:

```json
{
  "statusCode": 409,
  "error": "CONFLICT",
  "message": "Cannot change status from \"running\" to \"running\"",
  "path": "/jobs/2f143b34.../status",
  "timestamp": "2026-09-16T07:28:14.718Z"
}
```

## The concurrency problem

> Two browser tabs both see a job as `pending`. Both click Start at almost the same moment.

**Where the rule is enforced:** in the database, as part of the write itself.

```ts
// src/jobs/jobs.service.ts
const result = await this.jobsRepository.update(
  { id, status: In(allowedFrom) },   // the condition
  { status: next },                  // the change
);
```

which Postgres executes as a single atomic statement:

```sql
UPDATE jobs SET status = 'running', version = version + 1
WHERE id = $1 AND status IN ('pending');
```

The first request to reach the row matches and changes one row. The second evaluates `status IN ('pending')` against the already-updated row, matches nothing, and reports `affected = 0`. There is no window between checking and writing, because they are the same statement.

The alternative — read the job, check its status in JavaScript, then save — has exactly that window, and both requests would succeed.

**Answers to the four questions in the brief:**

1. **Where should the rule be enforced?** In the database, inside the `WHERE` clause. The service owns the transition map, and the UI only hides buttons as a convenience.
2. **What if someone bypasses React and calls the API directly?** Nothing changes. `curl` gets the same 409. The DTO layer (`forbidNonWhitelisted`) also refuses to let a client set `status` or `createdAt` at creation, so a job can never be born `completed`.
3. **What if two requests arrive at nearly the same time?** Exactly one gets `affected = 1` and a `200`. The others get `409 Conflict` and the UI refetches. Which one wins is not controllable and does not matter.
4. **How is invalid state prevented?** Four layers: `ParseUUIDPipe` and the DTOs reject malformed input (400); the service's transition map rejects illegal moves; the conditional `UPDATE` resolves races; and the Postgres `job_status` enum plus a `pending` default make an invalid status impossible even from raw SQL.

**Why not a pessimistic lock (`SELECT … FOR UPDATE`)?** A row lock earns its cost when the decision depends on data you must read and compute first — a bank balance minus a withdrawal. Here the entire rule fits in a `WHERE` clause, so a lock would add round trips and buy nothing. The trade-off: losers fail immediately rather than queueing for their turn, which is the behaviour a dashboard wants.

**Proof:** `bun scripts/race-test.ts <api-url>` creates a pending job, fires five concurrent PATCHes with `Promise.all`, and asserts exactly one `200`, four `409`s, and a final status of `running`. It passes against the deployed API.

## Bonus: optimistic locking with `If-Match`

Every job carries a `version`, bumped inside the same atomic update. A client may send the version it last saw:

```
PATCH /jobs/<id>/status
If-Match: 2
{"status":"completed"}
```

If the job has changed since, the request is refused with `412 Precondition Failed` instead of overwriting someone else's work. The header is optional, so the transition rules still apply without it.

**Why this one, and how much it actually adds.** Today `status` is the only writable field, so most stale writes are already caught by the conditional `UPDATE`: if your version is old, the status moved, and your transition is usually illegal now — a `409` rather than a `412`.

The gap it closes is the case where the intervening change happens to make your request *legal*. A client holding a stale `pending` view asks for `completed`; meanwhile someone else started the job. Without `If-Match` the `UPDATE` matches (`status IN ('running')`) and the job is completed by a caller who never saw it start. With `If-Match` that write is refused.

So the honest claim is narrower than "an extra integrity layer": it separates *"that move is illegal"* (409) from *"your copy is out of date"* (412), and it closes one real hole in today's model. It becomes materially more valuable the moment a second writable field exists — a title edit, an assignee, a retry count — because then two legal writes can collide without the status ever changing. It costs one integer column and one optional header.

## Running locally

**Requirements:** Bun 1.3+, and any PostgreSQL 15+ connection string (Neon's free tier is fine).

```bash
git clone https://github.com/2arnav4/conveyor.git
cd conveyor
```

**Backend**

```bash
cd backend/conveyor-backend
bun install
cp .env.example .env          # then fill in DATABASE_URL
bun run migration:run         # creates the jobs table, enum and index
bun run start:dev             # http://localhost:3000
```

`.env`:

```
DATABASE_URL=postgres://user:password@host/db?sslmode=verify-full
PORT=3000
CORS_ORIGINS=http://localhost:5173
```

**Frontend**

```bash
cd frontend
bun install
cp .env.example .env          # VITE_API_URL=http://localhost:3000
bun run dev                   # http://localhost:5173
```

**Tests**

```bash
cd backend/conveyor-backend
bun run test        # transition rules: pure functions, no database
bun run test:e2e    # every route against the real database, with the same
                    # ValidationPipe and exception filter as main.ts; creates
                    # jobs and deletes them afterwards
bun scripts/race-test.ts [url]   # the concurrency proof; needs a running server
```

The e2e suite (18 tests) covers the cases a UI cannot produce: a blank title, a client
trying to set `status` at creation, an unknown status filter, starting a job
twice (409), skipping `running` (409), a stale `If-Match` (412), an unknown
uuid (404), a malformed uuid (400), delete-twice (204 then 404), and a block
of hostile-input cases described under "Input safety".

The race script is deliberately separate from `bun test`: it needs a server on
a real URL, and it is the one check that proves the *concurrency* claim rather
than the rules.

## Project layout

```
backend/conveyor-backend/src/
  config/env.validation.ts     refuses to boot without a usable DATABASE_URL
  common/http-exception.filter.ts  one JSON error shape; hides internals on 500
  health/health.controller.ts  GET /health
  jobs/job.entity.ts           the table: UUID key, enum status, (status, created_at) index
  jobs/job-transitions.ts      the rules as data + the reverse lookup used by the SQL
  jobs/dto/                    the public request contract
  jobs/jobs.service.ts         all business logic, including the atomic update
  jobs/jobs.controller.ts      six routes, status codes, If-Match / ETag
  database/                    migration CLI data source + three migrations
frontend/src/
  api/client.ts                every API call; turns non-OK responses into ApiError
  hooks/useJobs.ts             queries and mutations; refetches on conflict
  components/                  counts, form, queue rows, notices
```

## Decisions and trade-offs

| Decision | Reasoning | Cost |
|---|---|---|
| Conditional `UPDATE` rather than a row lock | The whole rule fits in a `WHERE` clause | Losers must refetch instead of waiting their turn |
| UUID primary key | Unguessable, mintable anywhere, leaks no row count | 16 bytes instead of 4 |
| Postgres enum + `pending` default | Invalid statuses are impossible even from raw SQL | Adding a status needs a migration, not just a code change |
| Explicit field mapping in the service, not `...dto` | A DTO is a public contract, an entity is private storage; one shouldn't silently become the other | Two edits to add a field instead of one |
| Migrations, never `synchronize` | Schema changes are reviewable, ordered and reversible | A CLI step in deployment |
| `pending → failed` is not allowed | The brief's diagram branches to `failed` only from `running`; a job that never ran cannot have failed | A job that's wrong on arrival must be started before it can be failed |
| `RETURNING *` on the status update, not a follow-up `SELECT` | The row you get back is the row that statement wrote; a separate read could return someone else's newer write | Raw column names have to be mapped to the entity by hand |
| Delete asks for confirmation | It is the only irreversible action, and a `running` job is work in progress | One extra click; `window.confirm` is crude for a polished product |
| `ETag` means "job version", not a body hash | Express's automatic weak ETag was turned off, so one header has one meaning across the API | `GET` responses lose HTTP caching validators; irrelevant at this size |
| Statuses are lowercase only | `RUNNING` is rejected; the API doesn't guess what the client meant | Clients must match the enum exactly |
| A `running` job can be deleted | An operator's dashboard shouldn't refuse to remove a stuck job | Work in progress can vanish, which is why the UI now confirms first; refusing with 409 is the other defensible call |
| `type` is free text | The brief lists no job types | No guarantee of a consistent set; an enum would fix that |
| TanStack Query, no client state store | Jobs are server state; caching, refetching and loading states come for free | One more dependency |
| No pagination | Right-sized for the data volume here | Needs `limit`/cursor before real use |
| Bun as runtime and package manager | One tool, fast installs, runs TypeScript directly | Less-trodden path than Node for Nest |

## Input safety

No user input is ever concatenated into SQL. TypeORM sends parameterised
queries, so Postgres receives the query shape and the values separately and a
value can never become executable SQL.

```
Title: Robert'); DROP TABLE jobs;--
  ->  INSERT INTO jobs (title, type, priority) VALUES ($1, $2, $3)
  ->  stored as text, rendered as text, table untouched
```

| Input | Guard |
|---|---|
| `title`, `type` | Parameterised insert, `@IsString`, length caps (200 / 50) |
| `priority` | `@IsInt`, `@Min(0)`, `@Max(10)` — rejected before it reaches SQL |
| `status` (body and query) | `@IsEnum` — only the four exact lowercase values |
| `:id` | `ParseUUIDPipe` — a malformed id is a 400, never a query |
| `If-Match` | Parsed to a positive integer or rejected |
| Any unknown field | `forbidNonWhitelisted` → 400 |
| Rendering | React escapes text; there is no `dangerouslySetInnerHTML` |

The only raw SQL fragment in the codebase is `version: () => '"version" + 1'`,
a hardcoded string containing no user input.

Seven e2e tests cover this directly: SQL in a title (stored as text, table still
answers afterwards), script tags in a title, injection attempts in the status
filter, in the `:id` parameter, in the status body, in `priority`, and in the
`If-Match` header.

**What is deliberately not protected, and why:** there is no authentication,
no rate limiting, and no per-user scoping. The brief describes an internal
operator dashboard with no user model, so adding auth would have been scope
invented rather than scope requested. In production this API would sit behind
authentication, the database role would be narrowed from owner to
`SELECT/INSERT/UPDATE/DELETE` on one table, and writes would be rate limited.

## References

Sources that informed specific decisions, rather than a general reading list.
The reasoning I went through with each is recorded, not just the link.

| Source | What it settled |
|---|---|
| [NestJS — First steps](https://docs.nestjs.com/first-steps) | Module / controller / service structure, and the CLI's file-naming convention (`kebab-case.type.ts`), which this repo follows throughout |
| [NestJS request lifecycle, explained (DEV)](https://dev.to/parsajiravand/nestjs-request-lifecycle-explained-with-cheat-sheet-227l) | Where each guard sits in the chain: why `ParseUUIDPipe` and the `ValidationPipe` run before the controller, and why the exception filter catches everything after |
| [A NestJS banking ledger that cannot be overdrawn (DEV)](https://dev.to/peacemelodi/i-built-a-nestjs-banking-ledger-that-cannot-be-overdrawn-even-under-concurrent-requests-421l) | The lost-update anomaly, and the case for a pessimistic `SELECT … FOR UPDATE` lock. **I read this first and deliberately did not follow it** — see the note below |
| [NestJS configuration docs](https://docs.nestjs.com/techniques/configuration) | `ConfigModule.forRoot({ validate })` and the `forRootAsync` pattern, so the database URL is validated before TypeORM ever sees it |
| [TypeORM 1.0 release notes](https://typeorm.io/blog/typeorm-1-0/) | Why this project pins TypeORM `0.3.31`: v1 had just landed and most NestJS material still targets 0.3 |

### Why I did not use the lock from the ledger article

This was the decision I spent the most time on, so the reasoning is worth recording.

The article is correct for its own problem. A ledger must **read the balance, do
arithmetic, and then decide**: `balance - 60 >= 0`. That question cannot be
expressed in a `WHERE` clause, so the row has to be held still between the read
and the write, which is exactly what `SELECT … FOR UPDATE` is for.

My rule is not arithmetic. It is a plain equality check: *is this job still
`pending`?* That fits inside the statement, so the check and the write become one
thing and there is nothing to hold still:

```sql
UPDATE jobs SET status = 'running'
WHERE id = $1 AND status IN ('pending');
```

| | This project | The ledger |
|---|---|---|
| The question | `status = 'pending'`? | `balance - amount >= 0`? |
| Expressible in a `WHERE`? | Yes | No, it needs a read then arithmetic |
| So | Atomic conditional update, one round trip | Pessimistic lock, three or more |
| The loser | Fails immediately with 409 | Waits for the lock, then fails |

A lock here would cost extra round trips and turn every contended job into a
queue, while buying no correctness the `WHERE` clause does not already provide.
If a future rule needed data I had to read and compute first — deducting from a
quota, say — I would switch to the lock for that operation.

## Assumptions

- A human operator drives the queue. There is no worker process; the brief asks for a dashboard that *changes* status, not one that executes work.
- `priority` (0–10) is my addition, not a requirement. It's shown on each row and demonstrates how a new field flows through DTO, entity and migration.
- Jobs are global. There are no users, tenants or authentication.
- The status filter and the counts are computed server-side, so they stay correct regardless of what any one client has cached.

## With more time

- **A real worker** claiming jobs with `SELECT … FOR UPDATE SKIP LOCKED`, so several workers can run without picking the same job — the same concurrency problem at the other end of the queue.
- **Idempotency key on `POST /jobs`**, so a double-click or a network retry can't create two jobs.
- **Pagination and sorting** on `GET /jobs`.
- **A shared types package**, so `Job` is declared once rather than mirrored in the frontend.
- **Swagger** (`@nestjs/swagger`) for a browsable route list.
- **Retry as a new job** linked to the failed one, preserving history instead of reviving a terminal row.
- **Structured logging and request ids**, so a 409 in production can be traced to a specific client.
