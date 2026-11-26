import avatarDark from "./template-assets/avatar.png";
import avatarLight from "./template-assets/avatar-light.png";
import desktopDark from "./template-assets/bg-desktop.jpg";
import desktopLight from "./template-assets/bg-desktop-light.jpg";
import mobileDark from "./template-assets/bg-mobile.jpg";
import mobileLight from "./template-assets/bg-mobile-light.jpg";
import instagram from "./template-assets/logo-instagram.svg";
import youtube from "./template-assets/logo-youtube.svg";
import moon from "./template-assets/moon-stars.svg";
import sun from "./template-assets/sun.svg";

export const originalArtwork = {
  light: { avatar: avatarLight, desktop: desktopLight, mobile: mobileLight, themeIcon: sun },
  dark: { avatar: avatarDark, desktop: desktopDark, mobile: mobileDark, themeIcon: moon },
};

export const originalSocialIcons = { instagram, youtube };
