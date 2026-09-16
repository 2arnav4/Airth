# Conveyor — API

NestJS + TypeORM + PostgreSQL. See the [root README](../../README.md) for the
architecture, the concurrency reasoning and the live URLs.

```bash
bun install
cp .env.example .env      # fill in DATABASE_URL
bun run migration:run
bun run start:dev         # http://localhost:3000
```

| Command | Does |
|---|---|
| `bun run test` | Transition rules (pure functions, no database) |
| `bun run test:e2e` | Boots the app and exercises every route against the database |
| `bun scripts/race-test.ts [url]` | Fires concurrent status changes and asserts one winner |
| `bun run migration:generate src/database/migrations/<Name>` | Diffs entities against the database |
| `bun run migration:run` / `bun run migration:revert` | Apply / undo |
