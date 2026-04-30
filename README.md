# LevelUp User

Premium entry / cover page for the future **LevelUp User** product.
Built with **React + TypeScript + Vite + Tailwind CSS**, organized in a small, layered architecture so the project is ready to scale without overengineering.

---

## Project structure

```
src/
  app/
    App.tsx              # Router shell
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
npm run preview   # Preview the production build locally
```

---

## Connect to GitHub

The repo lives at <https://github.com/idanmoreira/levelUpUser.git>.

From the project root:

```bash
git init
git add .
git commit -m "feat: scaffold LevelUp User landing page"
git branch -M main
git remote add origin https://github.com/idanmoreira/levelUpUser.git
git push -u origin main
```

If the remote already has commits, rebase first:

```bash
git pull --rebase origin main
git push -u origin main
```

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
