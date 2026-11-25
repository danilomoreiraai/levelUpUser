import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { getLinkPageEditorUrl, type ServiceId, services } from "@/data/services";
import { usePageMetadata } from "@/lib/pageMetadata";

const serviceOrder: readonly ServiceId[] = ["linkPage", "urlShortener", "qrCode"];

const serviceIcons: Record<ServiceId, ReactNode> = {
  linkPage: (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <rect height="20" rx="3" stroke="currentColor" strokeWidth="1.8" width="14" x="5" y="2" />
      <circle cx="12" cy="7" r="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 13h6m-6 4h6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  ),
  urlShortener: (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path
        d="M10.5 13.5a4.5 4.5 0 0 0 6.36.14l2.5-2.5a4.5 4.5 0 0 0-6.36-6.36l-1.43 1.43m1.93 4.29a4.5 4.5 0 0 0-6.36-.14l-2.5 2.5A4.5 4.5 0 0 0 11 19.22l1.43-1.43"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  ),
  qrCode: (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path
        d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h2v2h-2v-2Zm4 0h2v4h-2v-4Zm-4 4h4v2h-4v-2Zm6 2h.01"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  ),
};

function ServiceCard({ destination, id }: { destination: string; id: ServiceId }) {
  const { comingSoon, description, name } = services[id];
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;
  const statusId = `${id}-status`;

  return (
    <Link
      aria-describedby={comingSoon ? `${descriptionId} ${statusId}` : descriptionId}
      aria-labelledby={titleId}
      className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:border-brand/60 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-hover motion-safe:transition sm:p-7"
      to={destination}
    >
      <div className="flex items-start justify-between gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand [&>svg]:size-6">
          {serviceIcons[id]}
        </span>
        {comingSoon && (
          <span
            className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700"
            id={statusId}
          >
            Coming soon
          </span>
        )}
      </div>

      <div className="mt-6 flex items-baseline justify-between gap-3">
        <h2
          className="text-xl font-semibold tracking-tight text-slate-900 group-hover:underline group-focus-visible:underline"
          id={titleId}
        >
          {name}
        </h2>
        <span aria-hidden="true" className="text-lg font-semibold text-brand-hover">
          →
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600" id={descriptionId}>
        {description}
      </p>
    </Link>
  );
}

export function ServicesPage() {
  const editorUrl = getLinkPageEditorUrl();

  usePageMetadata({
    title: "Services | LevelUp User",
    description:
      "Discover simple tools from LevelUp User, including personalized link pages, URL shortening, and QR code generation.",
  });

  return (
    <main className="min-h-dvh bg-gradient-to-b from-surface to-surface-subtle px-6 pb-16 pt-32 sm:px-8 sm:pb-24 sm:pt-36">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">Services</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            Simple tools for everyday tasks.
          </h1>
        </header>

        <section
          aria-label="Services catalog"
          className="mt-12 grid gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3"
        >
          {serviceOrder.map((id) => (
            <ServiceCard
              destination={id === "linkPage" && editorUrl ? editorUrl : services[id].path}
              id={id}
              key={id}
            />
          ))}
        </section>
      </div>
    </main>
  );
}
