import { Link } from "react-router-dom";

import { routes } from "@/routes/routes";

const termsSections = [
  {
    title: "Use of the website",
    body: "LevelUp User is a personal project showcase for presenting work that is live, in progress, or planned. By using this website, you agree to access it lawfully and avoid actions that could compromise its security, availability, or integrity.",
  },
  {
    title: "Project availability",
    body: "Projects may be shown at different stages of maturity. Some may be production work, prototypes, experiments, or future concepts, and they may change, become unavailable, or be removed without prior notice.",
  },
  {
    title: "No availability guarantee",
    body: "The website and featured projects are provided as is. While care is taken to keep information accurate and accessible, continuous operation, error-free behavior, or fitness for a specific purpose is not guaranteed.",
  },
  {
    title: "Intellectual property",
    body: "Text, interfaces, code, brands, images, and other materials belong to their respective owners. You may not copy, redistribute, or reuse website content without permission, except where a specific project license allows it.",
  },
  {
    title: "External links",
    body: "Some projects may link to repositories, demos, tools, or third-party websites. Those services have their own terms and policies, and LevelUp User does not control or take responsibility for their content or operation.",
  },
  {
    title: "Limitation of liability",
    body: "LevelUp User is not responsible for losses, damages, downtime, decisions, or outcomes resulting from use of this website, demos, or information presented here, to the extent permitted by applicable law.",
  },
  {
    title: "Changes to these terms",
    body: "These terms may be updated to reflect changes to the website, projects, or operational requirements. The version published on this page is the current reference for use of LevelUp User.",
  },
  {
    title: "Contact",
    body: "For questions about these terms, project requests, or content usage inquiries, contact the LevelUp User owner through the official channel provided by the service owner.",
  },
];

export function TermsPage() {
  return (
    <main className="min-h-dvh bg-surface-subtle px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-3xl">
        <Link
          className="text-sm font-medium text-brand hover:text-brand-hover"
          to={routes.home}
        >
          Back to home
        </Link>

        <header className="mt-8 border-b border-slate-200 pb-8">
          <p className="text-sm font-medium uppercase tracking-wide text-brand">
            Terms
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Terms of Service
          </h1>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Last updated: August 15, 2026. These terms explain the conditions
            for using LevelUp User, a personal website for presenting live,
            in-progress, and upcoming software projects.
          </p>
        </header>

        <div className="mt-8 space-y-6">
          {termsSections.map((section) => (
            <section
              className="rounded-lg border border-slate-200 bg-white p-5"
              key={section.title}
            >
              <h2 className="text-lg font-semibold">{section.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {section.body}
              </p>
            </section>
          ))}
        </div>

        <p className="mt-8 text-xs leading-5 text-slate-500">
          This page is a practical terms notice for a personal portfolio
          website and is not a substitute for legal advice. Review it with
          counsel before relying on it for regulated, commercial, or higher-risk
          contexts.
        </p>
      </div>
    </main>
  );
}
