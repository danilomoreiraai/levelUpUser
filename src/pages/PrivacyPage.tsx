import { Link } from "react-router-dom";

import { usePageMetadata } from "@/lib/pageMetadata";
import { routes } from "@/routes/routes";

const policySections = [
  {
    title: "Controller and scope",
    body: "LevelUp User is responsible for the personal data described in this notice when operating this website. This notice applies to visitors worldwide and is designed around transparency principles found in Brazil's LGPD, the GDPR, and comparable privacy laws.",
  },
  {
    title: "Data we process",
    body: "Essential processing can include consent records stored in your browser, requested URLs, security logs, IP-derived network information, browser and device characteristics, and information you deliberately send through an official contact channel. With permission, analytics, marketing attribution, error details, performance spans, and interaction events may also be processed.",
  },
  {
    title: "Purposes and legal bases",
    body: "We process strictly necessary data to provide, secure, and defend the service, based on performance of the service, legitimate interests, and legal obligations where applicable. Google Analytics, Meta Pixel, and optional monitoring rely on your consent. You can withdraw that consent at any time without affecting processing that was lawful before withdrawal.",
  },
  {
    title: "Cookies and local storage",
    body: "Essential local storage remembers your privacy choices. Analytics, marketing, and monitoring technologies are disabled by default and load only after you opt in to the matching category. The Privacy choices control remains available so you can change or revoke your selection.",
  },
  {
    title: "Analytics, marketing, and monitoring",
    body: "If enabled, Google Analytics measures aggregate site usage, Meta Pixel supports campaign measurement and attribution, and Sentry-compatible monitoring helps diagnose errors and performance. Identifiers are supplied through deployment configuration and are not embedded as fixed values in the source code.",
  },
  {
    title: "Sharing and international transfers",
    body: "Limited data may be processed by hosting, security, analytics, advertising, and observability providers acting as processors or independent controllers under their own terms. Those providers may process data outside your country. We use contractual, consent-based, or other lawful transfer mechanisms where required.",
  },
  {
    title: "Retention and deletion",
    body: "Consent choices remain in your browser until you clear site data or the consent version changes. Operational, analytics, marketing, and monitoring records are retained only for configured service periods, legal obligations, security, dispute resolution, and the purposes described above, then deleted or aggregated.",
  },
  {
    title: "Your global privacy rights",
    body: "Depending on your location, you may request confirmation of processing, access, correction, portability, deletion, anonymization, restriction, objection, information about sharing, review of automated decisions, or withdrawal of consent. Brazilian data subjects may also contact the ANPD; other users may contact their local supervisory authority.",
  },
  {
    title: "Security and incident response",
    body: "We use reasonable technical and organizational controls such as least-privilege access, encrypted transport, dependency and code checks, monitoring, and controlled deployments. No internet service can guarantee absolute security. Material incidents are assessed and reported when applicable law requires it.",
  },
  {
    title: "Children",
    body: "This portfolio is not directed to children and we do not knowingly use analytics or marketing technologies to profile children. A parent or guardian who believes a child submitted personal data may request its review and deletion.",
  },
  {
    title: "Contact and complaints",
    body: "Send privacy questions or rights requests to the privacy contact configured by the site owner. Include enough information to identify the request, but do not send passwords, government identifiers, or other unnecessary sensitive data. We may need to verify your identity before fulfilling a request.",
  },
  {
    title: "Changes to this notice",
    body: "We may update this notice when processing, providers, laws, or features change. Material changes will update the date below and, when required, trigger a renewed consent choice.",
  },
];

export function PrivacyPage() {
  const privacyContact = import.meta.env.VITE_PRIVACY_CONTACT_EMAIL;

  usePageMetadata({
    title: "Privacy Policy | LevelUp User",
    description:
      "Global privacy notice covering LGPD rights and optional analytics, marketing, and monitoring.",
  });

  return (
    <main className="min-h-dvh bg-surface-subtle px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-3xl">
        <Link className="text-sm font-medium text-brand hover:text-brand-hover" to={routes.home}>
          Back to home
        </Link>

        <header className="mt-8 border-b border-slate-200 pb-8">
          <p className="text-sm font-medium uppercase tracking-wide text-brand">Privacy</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Global Privacy Policy</h1>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Last updated: August 16, 2026. This notice explains how LevelUp User handles personal
            data, consent, cookies, analytics, advertising, and observability technologies.
          </p>
          {privacyContact ? (
            <p className="mt-3 text-sm text-slate-600">
              Privacy contact:{" "}
              <a className="font-medium text-brand underline" href={`mailto:${privacyContact}`}>
                {privacyContact}
              </a>
            </p>
          ) : null}
        </header>

        <div className="mt-8 space-y-6">
          {policySections.map((section) => (
            <section
              className="rounded-lg border border-slate-200 bg-white p-5"
              key={section.title}
            >
              <h2 className="text-lg font-semibold">{section.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{section.body}</p>
            </section>
          ))}
        </div>

        <p className="mt-8 text-xs leading-5 text-slate-500">
          This operational notice is designed to support common global privacy requirements, but it
          is not legal advice. The service owner should obtain qualified review for actual
          processing activities and target jurisdictions before production use.
        </p>
      </div>
    </main>
  );
}
