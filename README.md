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
VITE_APP_RELEASE=
VITE_SENTRY_DSN=
VITE_SENTRY_TRACES_SAMPLE_RATE=0
VITE_GA_MEASUREMENT_ID=
VITE_META_PIXEL_ID=
VITE_PRIVACY_CONTACT_EMAIL=
VITE_OTEL_EXPORTER_OTLP_ENDPOINT=
```

Vite embeds `VITE_*` values at build time. Never commit real secrets, private collector credentials,
or access tokens. Google Analytics and Meta Pixel identifiers are inactive until matching consent is
granted. OpenTelemetry browser export must target a secure, CORS-restricted collector endpoint. The
build resolves its release from `VITE_APP_RELEASE`, Cloudflare Pages, GitHub Actions, Easypanel's
`GIT_SHA`, or the buildpack `SOURCE_VERSION`, in that order.

## Observability

- Sentry-compatible error reporting is enabled only with monitoring consent and a configured DSN.
- Web Vitals report CLS, FCP, INP, LCP, and TTFB to consented analytics/OpenTelemetry providers
  without creating error issues.
- OpenTelemetry exports browser spans only with monitoring consent and a configured OTLP endpoint.
- Revoking monitoring consent shuts down the browser tracer provider for the current session.

Operational setup and security notes are in [`docs/monitoring.md`](docs/monitoring.md).

## Continuous integration and deployment

GitHub Actions validates the portfolio and [Personal Link](apps/personal-link/README.md), including
the production build and browser journeys. After a successful push CI run on `main`, **Release container
images** publishes a commit-tagged image for each application and records the immutable digests
in the job summary. A release requires manual promotion of the chosen digest in Coolify.

The portfolio runs as a Compose service on port 3000. Record its existing image and settings
before promotion, replace the portfolio image with the digest from the job summary, and deploy
the service. Verify `/release.json` returns the expected commit and check the user-facing changes.
For rollback, restore the previously recorded image reference in the same service.

Set any existing public Vite build settings as GitHub repository variables before building the
site image. To activate the Personalized Link Page card, set `VITE_PERSONAL_LINK_ORIGIN` to the
verified editor origin before the release run. The editor's database URL and administrator hash
are runtime configuration in Coolify.

The current static server returns one-year immutable caching for Vite's hashed `/assets/*`, no-store
for release metadata, and revalidation for SPA HTML. Missing assets return 404 instead of the HTML
fallback. This prevents browsers from interpreting an HTML fallback as a JavaScript module.

For the lowest cold-start latency, deploy the same build to Cloudflare Pages with build command
`npm run build` and output directory `dist`. The committed `public/_headers` file applies the same
cache policy on Pages. Pages' default SPA routing preserves direct navigation, while
`public/assets/404.html` prevents missing hashed chunks from being rewritten to `index.html`.
Validate the preview deployment, environment variables, consent flows, custom domain, and rollback
before changing the active Coolify service.

The production build enforces a 120 KiB gzip budget for the entry JavaScript bundle. Override
`MAX_ENTRY_GZIP_BYTES` only for an investigated, documented exception.

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
