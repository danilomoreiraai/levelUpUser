# LevelUp User

Built with **React + TypeScript + Vite + Tailwind CSS**

---

## Project structure

```
src/
  app/
    App.tsx              # Router shell
  data/
    projects.ts          # Project showcase data
  lib/
    monitoring.ts        # GlitchTip/Sentry-compatible error monitoring
  pages/
    HomePage.tsx         # Landing page (title + avatar + CTA)
    ProjectsPage.tsx     # Project cards and pipeline
    PrivacyPage.tsx      # Privacy policy
    TermsPage.tsx        # Terms of service
  components/
    layout/
      PageContainer.tsx  # Centered, full-viewport layout
    avatar/
      AvatarPlaceholder.tsx
    ui/
      Button.tsx         # Reusable, accessible button
  styles/
    globals.css          # Tailwind layers + base tokens
  routes/
    routes.ts            # Centralized route paths
  main.tsx               # App bootstrap (StrictMode + BrowserRouter)
```

Path alias `@/*` maps to `src/*` (configured in `vite.config.ts` and `tsconfig.app.json`).

---

## Run locally

```bash
npm install
npm run dev
```

Then open the URL printed by Vite (default `http://localhost:5173`).

Other scripts:

```bash
npm run build     # Type-check + production build
npm run ci        # Lint + production build
npm run preview   # Preview the production build locally
npm start         # Serve dist/ for production platforms
```

Project thumbnails live in `public/projects/` and should be referenced from
`src/data/projects.ts` with root-relative URLs such as
`/projects/levelup-user.jpg`.

---

## CI

GitHub Actions runs on every push to any branch:

```txt
npm ci
npm run lint
npm run build
```

Workflow file: `.github/workflows/ci.yml`.

---

## Deploy on Easypanel

The production app is deployed on Easypanel with Cloud Native Buildpacks.

Recommended settings:

```txt
Source: GitHub
Repository: danilomoreiraai/levelUpUser
Branch: main
Build method: Buildpacks
Builder: heroku/builder:24
Start command: npm start
Port: 3000
```

For Vite environment variables, enable Easypanel's `.env` file creation and
rebuild the app after changes. If production does not update after a push,
trigger a manual rebuild in Easypanel.

Optional automatic rebuild:

1. Create an Easypanel deploy/rebuild webhook for the app.
2. Add it to GitHub repository secrets as `EASYPANEL_DEPLOY_WEBHOOK_URL`.
3. After CI passes on `main`, `.github/workflows/deploy.yml` calls the webhook.

---

## Monitoring

Frontend errors are captured with `@sentry/react` and sent to a Sentry-compatible backend. The current production setup uses GlitchTip.

Required Easypanel variables:

```txt
VITE_APP_ENV=production
VITE_SENTRY_DSN=<glitchtip-project-dsn>
VITE_SENTRY_TRACES_SAMPLE_RATE=0
```

Errors are routed from GlitchTip to a Telegram group using a project alert webhook. Keep the Telegram bot token out of GitHub, frontend code, and this repository.

Project interactions are reported only after optional cookie consent is accepted.
Tracked events include project link clicks, card hover intent, and thumbnail load
failures.

Full setup notes: [`docs/monitoring.md`](docs/monitoring.md).

---

## GitHub Remote

The repo lives at <https://github.com/danilomoreiraai/levelUpUser.git>.

---

## Design notes

- Color palette: brand blue `#007AFF`, white `#FFFFFF`, subtle light blue surface.
- Typography: Inter (Google Fonts) with Apple system fallbacks.
- Accessibility: visible `:focus-visible` rings, semantic `<header>` / `<main>`, `aria-label` on the CTA and avatar.
- Mobile-first responsive layout, vertically + horizontally centered.

---

## Maintenance checklist

- Add or update projects in `src/data/projects.ts`.
- Keep thumbnails cropped to 16:9 and below 150KB when possible.
- Run `npm run lint` and `npm run build` before pushing.
- Push to `main` and confirm GitHub Actions passes.
- Confirm Easypanel rebuilt production after the push.
- Review GlitchTip/Sentry events after production changes.
