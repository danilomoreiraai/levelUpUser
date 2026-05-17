import { Link } from "react-router-dom";

import { routes } from "@/routes/routes";

const policySections = [
  {
    title: "Information we collect",
    body: "LevelUp User collects only the information needed to operate the site, respond to requests, and improve reliability. This can include technical data such as browser type, device information, page URL, approximate time of visit, and error details when optional monitoring is accepted.",
  },
  {
    title: "Cookies and local storage",
    body: "Essential storage is used to remember your cookie preference and keep the website functioning. Optional monitoring storage is not activated unless you accept optional cookies. You can also block or delete cookies and local storage through your browser settings.",
  },
  {
    title: "Analytics and monitoring",
    body: "We use Sentry-compatible monitoring only after you accept optional cookies. Monitoring helps us diagnose crashes and performance issues. We configure monitoring to avoid intentionally sending personal information.",
  },
  {
    title: "How we use data",
    body: "We use data to provide the website, secure it, troubleshoot errors, understand aggregate reliability, and comply with legal obligations. We do not sell personal information.",
  },
  {
    title: "Sharing and processors",
    body: "We may share limited technical data with service providers that help host, secure, and monitor the website. These providers process data on our behalf and should not use it for their own independent purposes.",
  },
  {
    title: "Retention",
    body: "Cookie consent choices stay in your browser until you clear site data or we update the consent version. Optional monitoring events are retained only as long as needed for debugging and operational review.",
  },
  {
    title: "Your choices",
    body: "You can reject optional cookies, clear site storage, use browser privacy controls, or contact us to request access, correction, deletion, or restriction of personal data where applicable law grants those rights.",
  },
  {
    title: "Contact",
    body: "For privacy questions, data requests, or complaints, contact the LevelUp User team through the official support channel provided by the service owner.",
  },
];

export function PrivacyPage() {
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
            Privacy
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Privacy Policy
          </h1>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Last updated: May 17, 2026. This policy explains how LevelUp User
            handles privacy, cookies, and optional monitoring on this website.
          </p>
        </header>

        <div className="mt-8 space-y-6">
          {policySections.map((section) => (
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
          This page is a practical privacy notice for the website and is not a
          substitute for legal advice. Review it with counsel before relying on
          it for regulated, high-risk, or multi-jurisdictional processing.
        </p>
      </div>
    </main>
  );
}
