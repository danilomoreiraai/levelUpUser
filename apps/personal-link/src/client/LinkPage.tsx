import { type CSSProperties, useState } from "react";

import type { Presentation } from "../shared/contracts";
import type { LocalTheme } from "../shared/theme";
import { originalArtwork, originalSocialIcons } from "./originalArtwork";
import "./original-template.css";
import { formatHandle, socialNames } from "./presentation";
import { useLocalAppearance } from "./useLocalAppearance";

type Platform = Presentation["socials"][number]["platform"];

const socialIcons: Record<Platform, string> = {
  instagram: "◎",
  facebook: "f",
  tiktok: "♪",
  youtube: "▶",
  linkedin: "in",
  github: "GH",
  x: "𝕏",
  whatsapp: "☏",
  other: "↗",
};

function SocialLabel({ platform }: { platform: Platform }) {
  const icon =
    platform === "instagram" || platform === "youtube" ? originalSocialIcons[platform] : null;

  return (
    <>
      <span aria-hidden="true" className="original-social-icon">
        {icon ? (
          <svg aria-hidden="true" fill="currentColor" height={24} viewBox="0 0 512 512" width={24}>
            {icon.map((shape) => (
              <path d={shape} key={shape} />
            ))}
          </svg>
        ) : (
          socialIcons[platform]
        )}
      </span>
      <span className="visually-hidden">{socialNames[platform]}</span>
    </>
  );
}

function identifyRows<T>(items: T[], describe: (item: T) => string[]) {
  const occurrences = new Map<string, number>();
  return items.map((item) => {
    const descriptor = JSON.stringify(describe(item));
    const occurrence = (occurrences.get(descriptor) ?? 0) + 1;
    occurrences.set(descriptor, occurrence);
    return { item, key: `${descriptor}-${occurrence}` };
  });
}

export function LinkPage({
  presentation,
  preview = false,
}: {
  presentation: Presentation;
  preview?: boolean;
}) {
  const { theme: autoTheme, year } = useLocalAppearance();
  const [override, setOverride] = useState<LocalTheme | null>(null);
  const theme = override ?? autoTheme;
  const targetTheme = theme === "dark" ? "light" : "dark";
  const themeLabel = targetTheme === "dark" ? "Tema escuro" : "Tema claro";
  const artwork = originalArtwork[theme];
  const avatar = presentation.avatarUrl;
  const backgroundStyle = { filter: `blur(${presentation.blur}px)` };
  const handle = formatHandle(presentation.handle);
  const Display = preview ? "section" : "main";
  const Title = preview ? "h3" : "h1";
  return (
    <Display
      className={`original-link-page${preview ? " original-link-page--preview" : ""}`}
      data-theme={theme}
      data-preset={presentation.preset}
      aria-label={preview ? "Prévia da página de links" : undefined}
    >
      {presentation.backgroundUrl ? (
        <img
          className="link-background"
          data-blurred={presentation.blur > 0}
          src={presentation.backgroundUrl}
          alt=""
          aria-hidden="true"
          fetchPriority={preview ? "low" : undefined}
          style={backgroundStyle}
        />
      ) : (
        <picture
          className="original-background"
          data-blurred={presentation.blur > 0}
          style={
            {
              "--original-mobile-background": `url("${artwork.mobile}")`,
              "--original-desktop-background": `url("${artwork.desktop}")`,
            } as CSSProperties
          }
        >
          {!preview && <source media="(min-width: 700px)" srcSet={artwork.desktop} />}
          <img
            className="link-background"
            data-blurred={presentation.blur > 0}
            src={artwork.mobile}
            alt=""
            fetchPriority={preview ? "low" : undefined}
            style={backgroundStyle}
          />
        </picture>
      )}
      <div className="original-container">
        <div className="original-profile">
          {avatar ? (
            <img className="original-avatar" src={avatar} alt="" width={112} height={112} />
          ) : (
            <span className="original-avatar original-avatar--placeholder" aria-hidden="true" />
          )}
          <Title>{handle}</Title>
        </div>

        <div className="original-switch">
          <button
            aria-label={themeLabel}
            className="original-theme-knob"
            onClick={() => setOverride(targetTheme)}
            style={{ backgroundImage: `url("${artwork.themeIcon}")` }}
            type="button"
          />
          <span aria-hidden="true" className="original-theme-track" />
        </div>

        {presentation.links.length > 0 ? (
          <ul className="original-links" aria-label="Links">
            {identifyRows(presentation.links, ({ label, url }) => [label, url]).map(
              ({ item: link, key }) => (
                <li key={key}>
                  {preview ? (
                    <span className="original-link">{link.label}</span>
                  ) : (
                    <a className="original-link" href={link.url} rel="noreferrer" target="_blank">
                      {link.label}
                    </a>
                  )}
                </li>
              ),
            )}
          </ul>
        ) : (
          preview && <p className="original-empty">Seus links aparecem aqui.</p>
        )}

        {presentation.socials.length > 0 && (
          <ul className="original-socials" aria-label="Redes sociais">
            {identifyRows(presentation.socials, ({ platform, url }) => [platform, url]).map(
              ({ item: social, key }) => (
                <li key={key}>
                  {preview ? (
                    <span className="original-social">
                      <SocialLabel platform={social.platform} />
                    </span>
                  ) : (
                    <a
                      className="original-social"
                      href={social.url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <SocialLabel platform={social.platform} />
                    </a>
                  )}
                </li>
              ),
            )}
          </ul>
        )}
        {presentation.handle.trim() && (
          <footer className="original-footer">
            {`${handle} ${year}. Todos os direitos reservados.`}
          </footer>
        )}
      </div>
    </Display>
  );
}
