import desktopDark from "./template-assets/bg-desktop.jpg";
import desktopLight from "./template-assets/bg-desktop-light.jpg";
import mobileDark from "./template-assets/bg-mobile.jpg";
import mobileLight from "./template-assets/bg-mobile-light.jpg";
import instagram from "./template-assets/logo-instagram.svg?raw";
import youtube from "./template-assets/logo-youtube.svg?raw";
import moon from "./template-assets/moon-stars.svg";
import sun from "./template-assets/sun.svg";

export const originalArtwork = {
  light: { desktop: desktopLight, mobile: mobileLight, themeIcon: sun },
  dark: { desktop: desktopDark, mobile: mobileDark, themeIcon: moon },
};

function iconPaths(svg: string) {
  return Array.from(svg.matchAll(/<path d="([^"]+)"/g), ([, shape]) => shape);
}

export const originalSocialIcons = { instagram: iconPaths(instagram), youtube: iconPaths(youtube) };
