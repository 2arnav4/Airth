# Conveyor — dashboard

React 19 + Vite + Tailwind + TanStack Query. See the
[root README](../README.md) for the architecture and the live URLs.

```bash
bun install
cp .env.example .env      # VITE_API_URL=http://localhost:3000
bun run dev               # http://localhost:5173
```

| Command | Does |
|---|---|
| `bun run dev` | Dev server with HMR |
| `bun run build` | Typecheck, then production build to `dist/` |
| `bun run preview` | Serve the built bundle locally |
