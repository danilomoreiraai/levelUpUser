const featuredThumbnailSmall = "/projects/levelup-user-640.webp";
const featuredThumbnailLarge = "/projects/levelup-user-1200.webp";

export const featuredProjectImage = {
  src: featuredThumbnailSmall,
  srcSet: `${featuredThumbnailSmall} 640w, ${featuredThumbnailLarge} 1200w`,
  // The project grid uses one, two, or three columns with 24px gaps and page padding.
  sizes:
    "(min-width: 1200px) 366px, (min-width: 1024px) calc(33.333vw - 34px), (min-width: 640px) calc(50vw - 38px), calc(100vw - 50px)",
  media: "(min-width: 320px) and (min-height: 520px)",
};

export function portraitSrcSet(oneX: string, twoX: string, threeX: string) {
  return `${oneX} 1x, ${twoX} 2x, ${threeX} 3x`;
}
