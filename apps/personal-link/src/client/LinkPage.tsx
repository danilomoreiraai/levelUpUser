import { useRef, useState } from "react";

import type { Presentation } from "../shared/contracts";
import type { LocalTheme } from "../shared/theme";
import { originalArtwork, originalSocialIcons } from "./originalArtwork";
import "./original-template.css";
import { formatHandle, socialNames } from "./presentation";
import { useLocalTheme } from "./useLocalTheme";

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

function SocialLabel({ original, platform }: { original: boolean; platform: Platform }) {
  const icon =
    original && (platform === "instagram" || platform === "youtube")
      ? originalSocialIcons[platform]
      : null;

  return (
    <>
      <span aria-hidden="true" className={`social-icon social-icon--${platform}`}>
        {icon ? <img alt="" height={24} src={icon} width={24} /> : socialIcons[platform]}
      </span>
      <span className={original ? "visually-hidden" : undefined}>{socialNames[platform]}</span>
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
  const autoTheme = useLocalTheme();
  const [override, setOverride] = useState<LocalTheme | null>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const theme = override ?? autoTheme;
  const targetTheme = theme === "dark" ? "light" : "dark";
  const themeLabel = targetTheme === "dark" ? "Tema escuro" : "Tema claro";
  const original = presentation.preset === "original";
  const artwork = originalArtwork[theme];
  const showExamplePortrait = original && preview && !presentation.avatarUrl;
  const avatar = showExamplePortrait ? artwork.avatar : presentation.avatarUrl;
  const backgroundStyle = { filter: `blur(${presentation.blur}px)` };
  const handle = formatHandle(presentation.handle);
  const Display = preview ? "section" : "main";
  const Title = preview ? "h3" : "h1";

  return (
    <Display
      className={`link-page${preview ? " link-page--preview" : ""}`}
      data-theme={theme}
      data-preset={presentation.preset}
      aria-label={preview ? "Prévia da página de links" : undefined}
    >
      {presentation.backgroundUrl ? (
        <img
          className="link-background"
          src={presentation.backgroundUrl}
          alt=""
          aria-hidden="true"
          fetchPriority={preview ? "low" : undefined}
          style={backgroundStyle}
        />
      ) : (
        original && (
          <picture className="original-background">
            <source media="(min-width: 700px)" srcSet={artwork.desktop} />
            <img
              className="link-background"
              src={artwork.mobile}
              alt=""
              fetchPriority={preview ? "low" : undefined}
              style={backgroundStyle}
            />
          </picture>
        )
      )}
      <div className="link-content">
        <div className="link-profile">
          {avatar ? (
            <img
              className="link-avatar"
              src={avatar}
              alt={showExamplePortrait ? "Foto de exemplo do modelo" : ""}
              width={original ? 112 : 96}
              height={original ? 112 : 96}
            />
          ) : (
            <span className="link-avatar link-avatar--placeholder" aria-hidden="true">
              {handle === "Seu @" ? "@" : [...handle][1]?.toLocaleUpperCase("pt-BR")}
            </span>
          )}
          <Title>{handle}</Title>
        </div>

        <div className="link-theme">
          <button
            aria-label={themeLabel}
            className={original ? "theme-button original-theme-switch" : "theme-button"}
            onClick={() => setOverride(targetTheme)}
            ref={toggle}
            type="button"
          >
            {original ? (
              <img
                className="original-theme-knob"
                alt=""
                src={artwork.themeIcon}
                width={32}
                height={32}
              />
            ) : (
              <>
                <span aria-hidden="true">{targetTheme === "dark" ? "☾" : "☀"}</span>
                {themeLabel}
              </>
            )}
          </button>
          {override && (
            <button
              className="theme-reset"
              onClick={() => {
                setOverride(null);
                toggle.current?.focus();
              }}
              type="button"
            >
              Automático
            </button>
          )}
        </div>

        {presentation.links.length > 0 ? (
          <ul className="link-stack" aria-label="Links">
            {identifyRows(presentation.links, ({ label, url }) => [label, url]).map(
              ({ item: link, key }) => (
                <li key={key}>
                  {preview ? (
                    <span className="public-link">{link.label}</span>
                  ) : (
                    <a className="public-link" href={link.url} rel="noreferrer" target="_blank">
                      {link.label}
                    </a>
                  )}
                </li>
              ),
            )}
          </ul>
        ) : (
          preview && <p className="link-empty">Seus links aparecem aqui.</p>
        )}

        {presentation.socials.length > 0 && (
          <ul className="social-stack" aria-label="Redes sociais">
            {identifyRows(presentation.socials, ({ platform, url }) => [platform, url]).map(
              ({ item: social, key }) => (
                <li key={key}>
                  {preview ? (
                    <span className="public-social">
                      <SocialLabel original={original} platform={social.platform} />
                    </span>
                  ) : (
                    <a className="public-social" href={social.url} rel="noreferrer" target="_blank">
                      <SocialLabel original={original} platform={social.platform} />
                    </a>
                  )}
                </li>
              ),
            )}
          </ul>
        )}
      </div>
    </Display>
  );
}
