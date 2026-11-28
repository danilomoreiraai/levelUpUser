export const presets = ["original", "neutral", "sage", "dusk"] as const;
export const platforms = [
  "instagram",
  "facebook",
  "tiktok",
  "youtube",
  "linkedin",
  "github",
  "x",
  "whatsapp",
  "other",
] as const;

type Preset = (typeof presets)[number];
type Platform = (typeof platforms)[number];

export type PageContent = {
  handle: string;
  links: { label: string; url: string }[];
  socials: { platform: Platform; url: string }[];
  preset: Preset;
  blur: number;
};

export type Presentation = PageContent & {
  avatarUrl: string | null;
  backgroundUrl: string | null;
};

export type ShowcasePage = Presentation & { slug: string };

export type ShowcaseBatch = {
  pages: ShowcasePage[];
  nextCursor: string | null;
};

export type AdminPage = {
  id: string;
  slug: string;
  revision: number;
  published: boolean;
  slugLocked: boolean;
  hasClientLink?: boolean;
  instagramLookupAvailable?: boolean;
  draft: Presentation;
};
