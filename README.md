# LevelUp User

Premium entry / cover page for the future **LevelUp User** product.
Built with **React + TypeScript + Vite + Tailwind CSS**, organized in a small, layered architecture so the project is ready to scale without overengineering.

---

## Project structure

```
src/
  app/
    App.tsx              # Router shell
  lib/
    monitoring.ts        # GlitchTip/Sentry-compatible error monitoring
  pages/
    HomePage.tsx         # Landing page (title + avatar + CTA)
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
Repository: idanmoreira/levelUpUser
Branch: main
Build method: Buildpacks
Builder: heroku/builder:24
Start command: npm start
Port: 3000
```

For Vite environment variables, enable Easypanel's `.env` file creation and rebuild the app after changes.

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

Full setup notes: [`docs/monitoring.md`](docs/monitoring.md).

---

## GitHub Remote

The repo lives at <https://github.com/idanmoreira/levelUpUser.git>.

---

## Design notes

- Color palette: brand blue `#007AFF`, white `#FFFFFF`, subtle light blue surface.
- Typography: Inter (Google Fonts) with Apple system fallbacks.
- Accessibility: visible `:focus-visible` rings, semantic `<header>` / `<main>`, `aria-label` on the CTA and avatar.
- Mobile-first responsive layout, vertically + horizontally centered.

---

## Roadmap (not implemented yet)

- `/projects` page
- Replace `AvatarPlaceholder` with a stylized avatar bust (SVG or animated component)
- Auth, dashboards, backend — intentionally out of scope for this entry screen
