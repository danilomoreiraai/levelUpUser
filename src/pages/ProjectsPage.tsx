import { Link } from "react-router-dom";

import { projects } from "@/data/projects";
import type { Project } from "@/data/projects";
import type { ProjectPhase } from "@/data/projects";
import { trackProjectMetric } from "@/lib/monitoring";
import { usePageMetadata } from "@/lib/pageMetadata";
import { routes } from "@/routes/routes";

const projectSections: {
  title: string;
  eyebrow: string;
  description?: string;
  phase: ProjectPhase;
}[] = [
  {
    title: "Delivered",
    eyebrow: "Live work",
    phase: "delivered",
  },
];

function ProjectPlaceholder({ project }: { project: Project }) {
  return (
    <div className="grid h-full w-full place-items-center bg-gradient-to-br from-slate-900 via-brand to-sky-300 p-6 text-center text-white">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/75">
          {project.url ? "Preview" : "Concept"}
        </p>
        <p className="mt-2 text-xl font-semibold tracking-tight">
          {project.title}
        </p>
      </div>
    </div>
  );
}

function ProjectPreview({ project }: { project: Project }) {
  function trackThumbnailError() {
    trackProjectMetric({
      action: "project_thumbnail_error",
      phase: project.phase,
      projectTitle: project.title,
      status: project.status,
      url: project.url,
    });
  }

  return (
    <>
      <ProjectPlaceholder project={project} />
      {project.thumbnailUrl ? (
        <img
          alt={`${project.title} website thumbnail`}
          className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-500 ease-out group-hover:scale-[1.02] group-hover:opacity-100 group-focus-within:opacity-100"
          decoding="async"
          loading="lazy"
          onError={trackThumbnailError}
          src={project.thumbnailUrl}
          width="1200"
          height="675"
        />
      ) : null}
    </>
  );
}

function ProjectCard({ project }: { project: Project }) {
  function trackHoverIntent() {
    trackProjectMetric({
      action: "project_card_hover",
      phase: project.phase,
      projectTitle: project.title,
      status: project.status,
      url: project.url,
    });
  }

  function trackLinkClick() {
    trackProjectMetric({
      action: "project_link_click",
      phase: project.phase,
      projectTitle: project.title,
      status: project.status,
      url: project.url,
    });
  }

  return (
    <article
      className="group flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      onFocus={trackHoverIntent}
      onMouseEnter={trackHoverIntent}
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
        <ProjectPreview project={project} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-transparent" />
        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand shadow-sm backdrop-blur">
          {project.status}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">
          {project.title}
        </h2>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          {project.description}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <span
              className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600"
              key={tag}
            >
              {tag}
            </span>
          ))}
        </div>

        {project.url ? (
          <a
            className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-hover"
            href={project.url}
            onClick={trackLinkClick}
            rel="noreferrer"
            target="_blank"
          >
            Visit live project
          </a>
        ) : (
          <span className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-slate-100 px-5 py-2.5 text-sm font-medium text-slate-500">
            Concept stage
          </span>
        )}
      </div>
    </article>
  );
}

function ProjectSection({
  description,
  eyebrow,
  phase,
  title,
}: {
  description?: string;
  eyebrow: string;
  phase: ProjectPhase;
  title: string;
}) {
  const sectionProjects = projects.filter((project) => project.phase === phase);

  if (sectionProjects.length === 0) {
    return null;
  }

  return (
    <section className="mt-12">
      <div className="flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-brand">
            {eyebrow}
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            {title}
          </h2>
        </div>
        {description ? (
          <p className="max-w-sm text-sm leading-6 text-slate-600">
            {description}
          </p>
        ) : null}
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {sectionProjects.map((project) => (
          <ProjectCard key={project.title} project={project} />
        ))}
      </div>
    </section>
  );
}

function PipelineProjectCard({ project }: { project: Project }) {
  function trackLinkClick() {
    trackProjectMetric({
      action: "project_link_click",
      phase: project.phase,
      projectTitle: project.title,
      status: project.status,
      url: project.url,
    });
  }

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand">
            {project.status}
          </p>
          <h3 className="mt-2 text-base font-semibold tracking-tight text-slate-900">
            {project.title}
          </h3>
        </div>
        <span className="mt-1 text-sm text-slate-400 transition group-hover:text-brand">
          {project.url ? "Open" : "Soon"}
        </span>
      </div>
      <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
        {project.description}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {project.tags.slice(0, 4).map((tag) => (
          <span
            className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200"
            key={tag}
          >
            {tag}
          </span>
        ))}
      </div>
    </>
  );

  if (!project.url) {
    return (
      <article className="group block rounded-lg border border-slate-200 bg-slate-50 p-4">
        {content}
      </article>
    );
  }

  return (
    <a
      className="group block rounded-lg border border-slate-200 bg-slate-50 p-4 transition hover:border-brand/30 hover:bg-white hover:shadow-sm"
      href={project.url}
      onClick={trackLinkClick}
      rel="noreferrer"
      target="_blank"
    >
      {content}
    </a>
  );
}

function PipelineSection() {
  const inProgressProjects = projects.filter(
    (project) => project.phase === "inProgress",
  );

  return (
    <section className="mt-12 rounded-lg border border-slate-200 bg-white p-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-brand">
            Pipeline
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            In progress
          </h2>
        </div>
        <p className="max-w-sm text-sm leading-6 text-slate-600">
          Smaller previews for work that is not ready for the main showcase yet.
        </p>
      </div>

      {inProgressProjects.length > 0 ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {inProgressProjects.map((project) => (
            <PipelineProjectCard key={project.title} project={project} />
          ))}
        </div>
      ) : (
        <p className="mt-6 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-500">
          In-progress projects will appear here as they become ready to share.
        </p>
      )}
    </section>
  );
}

export function ProjectsPage() {
  usePageMetadata({
    title: "Projects | LevelUp User",
    description:
      "Browse delivered projects, active builds, and product concepts from LevelUp User.",
  });

  return (
    <main className="min-h-dvh bg-surface-subtle px-6 py-10 text-slate-900">
      <div className="mx-auto w-full max-w-6xl">
        <Link
          className="text-sm font-medium text-brand hover:text-brand-hover"
          to={routes.home}
        >
          Back to home
        </Link>

        <header className="mt-8 border-b border-slate-200 pb-8">
          <p className="text-sm font-medium uppercase tracking-wide text-brand">
            Projects
          </p>
          <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Ideas, products, and active builds.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            A focused look at the products I design, build, validate, and keep
            improving.
          </p>
        </header>

        {projectSections.map((section) => (
          <ProjectSection
            description={section.description}
            eyebrow={section.eyebrow}
            key={section.phase}
            phase={section.phase}
            title={section.title}
          />
        ))}

        <PipelineSection />
      </div>
    </main>
  );
}
