import { Route, Routes } from "react-router-dom";

import { HomePage } from "@/pages/HomePage";
import { routes } from "@/routes/routes";

/**
 * App shell. Wires the router; pages own their own layout.
 *
 * The `/projects` route is intentionally a placeholder until the projects page is built.
 */
export function App() {
  return (
    <Routes>
      <Route path={routes.home} element={<HomePage />} />
      <Route
        path={routes.projects}
        element={
          <main className="min-h-dvh grid place-items-center px-6">
            <p className="text-slate-500">Projects page — coming soon.</p>
          </main>
        }
      />
    </Routes>
  );
}
