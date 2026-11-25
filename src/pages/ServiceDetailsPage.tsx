import { Link } from "react-router-dom";

import { getLinkPageEditorUrl, type ServiceId, services } from "@/data/services";
import { usePageMetadata } from "@/lib/pageMetadata";
import { routes } from "@/routes/routes";

export function ServiceDetailsPage({ serviceId }: { serviceId: ServiceId }) {
  const service = services[serviceId];
  const editorUrl = serviceId === "linkPage" ? getLinkPageEditorUrl() : undefined;

  usePageMetadata({
    title: `${service.name} | LevelUp User`,
    description: service.description,
  });

  return (
    <main className="min-h-dvh bg-gradient-to-b from-surface to-surface-subtle px-6 pb-16 pt-32 sm:px-8 sm:pb-24 sm:pt-36">
      <div className="mx-auto max-w-2xl">
        <Link className="text-sm font-semibold text-brand-hover underline" to={routes.services}>
          Back to Services
        </Link>

        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
          {service.name}
        </h1>
        <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg">{service.description}</p>

        {service.comingSoon && <p className="mt-6 font-semibold text-slate-700">Coming soon</p>}
        {serviceId === "linkPage" &&
          (editorUrl ? (
            <Link
              className="mt-6 inline-block font-semibold text-brand-hover underline"
              to={editorUrl}
            >
              Open the link page editor
            </Link>
          ) : (
            <p className="mt-6 text-slate-600">The editor is currently unavailable.</p>
          ))}
      </div>
    </main>
  );
}
