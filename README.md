# pomodo.study

pomodo.study is a free set of in-browser study tools including a pomodoro timer, ambience setting, and a simple to-do list for study session tasks.

## Running locally

### Prerequisites

- [Node.js](https://nodejs.org/) **20+** (tested with Node 20 and 22)
- npm 10+ (ships with recent Node versions)

### Install dependencies

```sh
npm install
```

### Development server

Starts the Express server (which boots Vite in middleware mode) on `http://localhost:5000`:

```sh
npm run dev
```

You can override the port/host via environment variables:

```sh
# macOS / Linux
PORT=3000 npm run dev

# Windows (PowerShell)
$env:PORT=3000; npm run dev

# Windows (cmd)
set PORT=3000 && npm run dev
```

### Production build

```sh
npm run build
npm start
```

`npm run build` produces:

- `dist/public/` — the static client bundle (served by Express in production)
- `dist/index.js` — the bundled server entrypoint

`npm start` then runs the bundled server, serving both the API and the static client on port `5000` (override via `PORT`).

### Type-checking

```sh
npm run check
```

## Notes on running outside Replit

This project was originally created on Replit. To keep it portable:

- The Replit-only Vite plugins (`@replit/vite-plugin-cartographer`,
  `@replit/vite-plugin-runtime-error-modal`,
  `@replit/vite-plugin-shadcn-theme-json`) are loaded **lazily** in
  `vite.config.ts` and are skipped automatically when not running on Replit
  (i.e. when the `REPL_ID` environment variable is not set). They're no
  longer listed as dependencies, so a plain `npm install` works on any OS.
- All scripts use [`cross-env`](https://www.npmjs.com/package/cross-env) so the
  `NODE_ENV` variable is set correctly on Windows as well as macOS/Linux.
- The server's `reusePort` socket option (Linux-only) is disabled
  automatically on Windows.

## Optional: database

The schema in `shared/schema.ts` and the `drizzle.config.ts` file expect a
PostgreSQL `DATABASE_URL` environment variable, but the application's current
in-memory storage (`server/storage.ts`) doesn't actually require a database to
run. You only need to set `DATABASE_URL` if you intend to run
`npm run db:push`.
