import { Link } from "react-router-dom";

import { routes } from "@/routes/routes";

export function NotFoundPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-surface-subtle px-6">
      <section className="max-w-sm text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-brand">
          404
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
          Page not found
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          The page you are looking for does not exist or has moved.
        </p>
        <Link
          className="mt-6 inline-flex rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-hover"
          to={routes.home}
        >
          Back to home
        </Link>
      </section>
    </main>
  );
}
