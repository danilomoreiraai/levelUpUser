import { portraitImage } from "@/lib/portraitImage";
import { featuredProjectImage } from "@/routes/criticalImages";
import { routes } from "@/routes/routes";

export function preloadRouteImage(pathname: string) {
  const route = pathname.replace(/\/+$/, "").toLowerCase() || "/";
  if (route !== routes.home && route !== routes.projects) return;

  let link = document.head.querySelector<HTMLLinkElement>(`link[data-route-image="${route}"]`);
  if (!link) {
    link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.fetchPriority = "high";
    link.dataset.routeImage = route;
    if (route === routes.home) {
      link.imageSrcset = portraitImage.srcSet;
    } else {
      link.imageSrcset = featuredProjectImage.srcSet;
      link.imageSizes = featuredProjectImage.sizes;
      link.media = featuredProjectImage.media;
    }
    document.head.append(link);
  }

  return () => link.remove();
}
