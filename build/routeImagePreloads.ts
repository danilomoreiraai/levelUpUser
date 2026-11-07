import { normalizePath, type Plugin } from "vite";

import { featuredProjectImage, portraitSrcSet } from "../src/routes/criticalImages";
import { routes } from "../src/routes/routes";

const preloadMarker = "<!-- route-image-preload -->";

export function routeImagePreloads(): Plugin {
  return {
    name: "route-image-preloads",
    apply: "build",
    generateBundle: {
      order: "post",
      handler(_options, bundle) {
        const document = bundle["index.html"];
        if (document?.type !== "asset" || !document.source.toString().includes(preloadMarker)) {
          throw new Error("The built index.html is missing its route image preload marker");
        }
        const html = document.source.toString();

        function portraitUrl(width: number) {
          const source = `src/assets/danilo-portrait-${width}.webp`;
          const asset = Object.values(bundle).find(
            (item) => item.type === "asset" && item.originalFileNames.includes(source),
          );
          if (!asset) throw new Error(`Missing built portrait asset for ${source}`);
          return `/${asset.fileName}`;
        }

        function routeModulePreload(page: string) {
          const module = Object.values(bundle).find(
            (item) =>
              item.type === "chunk" &&
              item.facadeModuleId &&
              normalizePath(item.facadeModuleId).endsWith(`/src/pages/${page}.tsx`),
          );
          if (!module) throw new Error(`Missing built route module for ${page}`);
          return `<link rel="modulepreload" href="/${module.fileName}">`;
        }

        const srcSet = portraitSrcSet(portraitUrl(144), portraitUrl(288), portraitUrl(432));
        const documents = [
          {
            fileName: ".route-preloads/home.html",
            page: "HomePage",
            link: `<link rel="preload" as="image" imagesrcset="${srcSet}" fetchpriority="high" data-route-image="${routes.home}">`,
          },
          {
            fileName: ".route-preloads/projects.html",
            page: "ProjectsPage",
            link: `<link rel="preload" as="image" imagesrcset="${featuredProjectImage.srcSet}" imagesizes="${featuredProjectImage.sizes}" media="${featuredProjectImage.media}" fetchpriority="high" data-route-image="${routes.projects}">`,
          },
        ];
        for (const { fileName, page, link } of documents) {
          const preloads = `${link}\n    ${routeModulePreload(page)}`;
          this.emitFile({ type: "asset", fileName, source: html.replace(preloadMarker, preloads) });
        }
      },
    },
  };
}
