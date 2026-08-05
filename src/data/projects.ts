export type ProjectPhase = "delivered" | "inProgress";

export type ProjectStatus =
  | "Live"
  | "In progress"
  | "Delivered"
  | "Planned";

export type Project = {
  title: string;
  description: string;
  url?: string;
  phase: ProjectPhase;
  status: ProjectStatus;
  tags: string[];
  thumbnailUrl?: string;
};

export const projects: Project[] = [
  {
    title: "LevelUp User",
    description:
      "A personal portfolio for presenting shipped products, active builds, and upcoming ideas.",
    url: "https://levelupuser.com",
    phase: "delivered",
    status: "Live",
    tags: [
      "Portfolio",
      "Product",
      "React",
      "TypeScript",
      "Vite",
      "Tailwind CSS",
      "React Router",
      "Sentry",
    ],
    thumbnailUrl: "/projects/levelup-user.jpg",
  },
  {
    title: "Juliana Linktree",
    description:
      "A lightweight link hub for Juliana Manduca's community, services, contact channels, and social presence.",
    url: "https://link.julianamanduca.com.br",
    phase: "delivered",
    status: "Live",
    tags: [
      "Link Hub",
      "Personal Brand",
      "HTML",
      "CSS",
      "JavaScript",
      "Responsive UI",
    ],
    thumbnailUrl: "/projects/juliana-linktree.jpg",
  },
  {
    title: "Juliana Manduca Astro Website",
    description:
      "A public website for astrological consultations, services, positioning, and client conversion.",
    url: "https://julianamanduca.com.br",
    phase: "inProgress",
    status: "In progress",
    tags: ["Landing Page", "SEO", "React", "Vite", "Brand", "Lead Capture"],
    thumbnailUrl: "https://lovable.dev/opengraph-image-p98pqg.png",
  },
  {
    title: "O Meu Treino",
    description:
      "A fitness product concept for organizing training routines, progress, and personal workout planning.",
    phase: "inProgress",
    status: "Planned",
    tags: ["Fitness", "Product Concept", "UX", "Planning"],
  },
  {
    title: "Fast Rental",
    description:
      "A rental product concept focused on simplifying discovery, booking, and management flows.",
    phase: "inProgress",
    status: "Planned",
    tags: ["Rental", "Marketplace", "Product Concept", "Workflow"],
  },
  {
    title: "Juliana Manduca Online Service Platform",
    description:
      "A temporary development build for online service presentation, booking, and client-facing consultation flows.",
    url: "https://dev.julianamanduca.com.br",
    phase: "inProgress",
    status: "In progress",
    tags: ["Platform", "Services", "React", "Vite", "Client Flow"],
    thumbnailUrl: "https://lovable.dev/opengraph-image-p98pqg.png",
  },
];
