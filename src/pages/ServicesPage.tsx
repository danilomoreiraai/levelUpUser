import type { ReactNode } from "react";

import { usePageMetadata } from "@/lib/pageMetadata";

type Service = {
  description: string;
  icon: ReactNode;
  name: string;
};

const services: Service[] = [
  {
    name: "URL Shortener",
    description: "Create compact, shareable links that are easy to manage and remember.",
    icon: (
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
  },
  {
    name: "QR Code Generator",
    description: "Turn links and text into downloadable QR codes in a few simple steps.",
    icon: (
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
  },
];

function ServiceCard({ description, icon, name }: Service) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand [&>svg]:size-6">
          {icon}
        </span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Coming soon
        </span>
      </div>

      <h2 className="mt-6 text-xl font-semibold tracking-tight text-slate-900">{name}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
    </article>
  );
}

export function ServicesPage() {
  usePageMetadata({
    title: "Services | LevelUp User",
    description:
      "Discover simple tools from LevelUp User, including URL shortening and QR code generation.",
  });

  return (
    <main className="min-h-dvh bg-gradient-to-b from-surface to-surface-subtle px-6 pb-16 pt-32 sm:px-8 sm:pb-24 sm:pt-36">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">Services</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
            Simple tools for everyday tasks.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
            Useful services are on the way. We are starting with URL shortening and QR code
            generation, with more tools to follow.
          </p>
        </header>

        <section
          aria-label="Upcoming services"
          className="mt-12 grid gap-5 sm:grid-cols-2 sm:gap-6"
        >
          {services.map((service) => (
            <ServiceCard key={service.name} {...service} />
          ))}
        </section>

        <p className="mt-10 text-center text-sm leading-6 text-slate-500">
          We are working on the details. Check back soon.
        </p>
      </div>
    </main>
  );
}
