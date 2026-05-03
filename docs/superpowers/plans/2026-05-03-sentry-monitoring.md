# Sentry Monitoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Capture production frontend errors with Sentry and document Telegram alert routing.

**Architecture:** Initialize Sentry before React renders when `VITE_SENTRY_DSN` is present. Wrap the React app in a Sentry error boundary and document the Easypanel/Sentry environment variables and Telegram webhook setup.

**Tech Stack:** React 18, Vite, TypeScript, `@sentry/react`, GitHub Actions, Easypanel environment variables.

---

### Task 1: Add Sentry SDK

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Install dependency**

Run:

```bash
npm_config_cache=/tmp/levelupuser-npm-cache npm install @sentry/react
```

Expected: `@sentry/react` is added to `dependencies` and the lockfile updates.

### Task 2: Add Monitoring Module

**Files:**
- Create: `src/lib/monitoring.ts`
- Modify: `src/vite-env.d.ts`

- [ ] **Step 1: Create monitoring initializer**

Create `src/lib/monitoring.ts`:

```ts
import * as Sentry from "@sentry/react";

const defaultEnvironment = import.meta.env.PROD ? "production" : "development";

export function initMonitoring() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_APP_ENV || defaultEnvironment,
    tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? "0"),
    sendDefaultPii: false,
  });
}
```

- [ ] **Step 2: Type Vite environment variables**

Update `src/vite-env.d.ts`:

```ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_ENV?: string;
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_SENTRY_TRACES_SAMPLE_RATE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

### Task 3: Wire React Error Boundary

**Files:**
- Modify: `src/main.tsx`
- Modify: `src/app/App.tsx`

- [ ] **Step 1: Initialize monitoring before render**

Update `src/main.tsx` to call `initMonitoring()` before `createRoot(...).render(...)`.

- [ ] **Step 2: Wrap routes with Sentry error boundary**

Update `src/app/App.tsx` to import `@sentry/react` and wrap the route tree:

```tsx
<Sentry.ErrorBoundary fallback={<ProductionErrorFallback />}>
  <Routes>...</Routes>
</Sentry.ErrorBoundary>
```

### Task 4: Document Env and Telegram Alerts

**Files:**
- Create: `.env.example`
- Create: `docs/monitoring.md`

- [ ] **Step 1: Add environment example**

Create `.env.example`:

```txt
VITE_APP_ENV=production
VITE_SENTRY_DSN=
VITE_SENTRY_TRACES_SAMPLE_RATE=0
```

- [ ] **Step 2: Add operational docs**

Create `docs/monitoring.md` with steps to create a Sentry project, configure Easypanel variables, create a Telegram bot/chat id, and route Sentry alerts to Telegram through webhook integration.

### Task 5: Verify

**Files:**
- No source changes.

- [ ] **Step 1: Run lint**

Run:

```bash
npm run lint
```

Expected: passes.

- [ ] **Step 2: Run build**

Run:

```bash
npm run build
```

Expected: passes.

- [ ] **Step 3: Commit**

Run:

```bash
git add package.json package-lock.json src/lib/monitoring.ts src/vite-env.d.ts src/main.tsx src/app/App.tsx .env.example docs/monitoring.md docs/superpowers/plans/2026-05-03-sentry-monitoring.md
git commit -m "feat: add sentry monitoring"
```
