import { routes } from "@/routes/routes";

export const services = {
  linkPage: {
    name: "Personalized Link Page",
    description:
      "A custom page for your brand, bringing your links, services, and social profiles together.",
    path: routes.linkPage,
    comingSoon: false,
  },
  urlShortener: {
    name: "URL Shortener",
    description: "Create compact, shareable links that are easy to manage and remember.",
    path: routes.urlShortener,
    comingSoon: true,
  },
  qrCode: {
    name: "QR Code Generator",
    description: "Turn links and text into downloadable QR codes in a few simple steps.",
    path: routes.qrCode,
    comingSoon: true,
  },
} as const;

export type ServiceId = keyof typeof services;

export function getLinkPageEditorUrl(): string | undefined {
  try {
    const url = new URL(import.meta.env.VITE_PERSONAL_LINK_ORIGIN ?? "");

    if (url.protocol === "https:" || url.protocol === "http:") {
      return `${url.origin}/admin`;
    }
  } catch {
    // An unconfigured or invalid origin uses the first-party service details.
  }
}
