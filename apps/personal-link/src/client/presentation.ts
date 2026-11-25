import type { Presentation } from "../shared/contracts";

export const socialNames: Record<Presentation["socials"][number]["platform"], string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  youtube: "YouTube",
  linkedin: "LinkedIn",
  github: "GitHub",
  x: "X",
  whatsapp: "WhatsApp",
  other: "Outra rede",
};

export function formatHandle(handle: string): string {
  const name = handle.trim().replace(/^@+/, "");
  return name ? `@${name}` : "Seu @";
}
