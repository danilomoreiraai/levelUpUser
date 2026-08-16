# LevelUp User

A privacy-aware React portfolio built with TypeScript, Vite, Tailwind CSS, Motion, and liquidGL.

## Local development

Use Node.js 20 and install the locked dependencies:

```bash
npm ci
npm run dev
```

The development server prints its local URL, normally `http://localhost:5173`.

## Required delivery workflow

Every code or documentation change starts with a GitHub issue containing scope and acceptance
criteria. Work must happen on a focused branch and be delivered through a pull request that links
the issue using `Closes #<number>`, `Fixes #<number>`, or `Refs #<number>`.

Production deploys are allowed only from `main`, after the pull request is merged and CI succeeds.
The complete instructions for all human and automated contributors are in
[`AGENTS.md`](AGENTS.md). The repository also provides issue forms and a pull request template in
`.github/`.

## Quality commands

```bash
npm run lint                  # ESLint and Biome
npm run quality               # Architecture contract and Knip dead-code analysis
npm run quality:security      # Production dependency vulnerability audit
npm run test                  # Unit and integration tests
npm run test:coverage         # Vitest coverage report
npm run test:e2e              # Playwright critical journeys
npm run test:mutation         # Stryker mutation tests for consent logic
npm run build                 # TypeScript and production bundle
npm run validate              # Required local/CI validation suite
```

The architecture contract prevents reusable layers from importing route-level pages and prevents
framework UI from leaking into `src/lib`. Commit messages follow Conventional Commits and are
validated by commitlint in CI. Codecov receives the LCOV report when its repository integration is
configured.

## Loading and motion behavior

- Route components are lazy-loaded and use an accessible skeleton/progress fallback.
- Route entry and exit transitions use Motion and respect `prefers-reduced-motion`.
- Project thumbnails use native lazy loading, asynchronous decoding, skeletons, and fade-in motion.
- Persistent navigation uses liquidGL with a capability-based fallback when WebGL is unavailable.

## Privacy and consent

The `/privacy` route documents the operational privacy baseline. Essential storage is limited to
the consent record. Analytics, marketing, and optional monitoring remain disabled until the user
grants the corresponding category. Users can reject all optional processing, save granular choices,
reopen preferences, and revoke consent.

The policy is designed for LGPD/GDPR-style transparency and global data-subject rights, but it is
not legal advice. A qualified privacy professional should review the deployed product, controller
identity, vendors, retention periods, and target jurisdictions.

## Environment variables

Copy `.env.example` and configure only the services used by the deployment:

```txt
VITE_APP_ENV=production
VITE_SENTRY_DSN=
VITE_SENTRY_TRACES_SAMPLE_RATE=0
VITE_GA_MEASUREMENT_ID=
VITE_META_PIXEL_ID=
VITE_PRIVACY_CONTACT_EMAIL=
VITE_OTEL_EXPORTER_OTLP_ENDPOINT=
```

Vite embeds `VITE_*` values at build time. Never commit real secrets, private collector credentials,
or access tokens. Google Analytics and Meta Pixel identifiers are inactive until matching consent is
granted. OpenTelemetry browser export must target a secure, CORS-restricted collector endpoint.

## Observability

- Sentry-compatible error reporting is enabled only with monitoring consent and a configured DSN.
- Web Vitals report CLS, FCP, INP, LCP, and TTFB to consented analytics/monitoring providers.
- OpenTelemetry exports browser spans only with monitoring consent and a configured OTLP endpoint.
- Revoking monitoring consent shuts down the browser tracer provider for the current session.

Operational setup and security notes are in [`docs/monitoring.md`](docs/monitoring.md).

## Continuous integration and deployment

GitHub Actions validates push and pull request commits, static analysis, unit/integration coverage,
the production build, and Playwright journeys. The production workflow runs only after a successful
`CI` workflow on `main` and then invokes the configured Easypanel webhook.

Recommended Easypanel settings:

```txt
Source: GitHub
Repository: danilomoreiraai/levelUpUser
Branch: main
Build method: Buildpacks
Builder: heroku/builder:24
Start command: npm start
Port: 3000
```

Configure `EASYPANEL_DEPLOY_WEBHOOK_URL` as a GitHub Actions secret to enable automatic rebuilds.
Rollback by reverting the merged pull request on `main`, allowing CI to pass, and redeploying that
known-good revision.

## Project structure

```txt
src/
  app/          Application shell, lazy routes, and transitions
  components/   Accessible UI, feedback, privacy, and liquid-glass navigation
  data/         Portfolio project data
  lib/          Consent, tracking, observability, metadata, and liquidGL adapters
  pages/        Route-level pages
  routes/       Central route constants
  styles/       Tailwind layers, skeletons, progress, and reduced-motion rules
  test/         Shared unit/integration test setup
e2e/            Playwright critical user journeys
docs/           Operational documentation
```
