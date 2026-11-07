export const featuredProjectImage = {
  src: "/projects/levelup-user.jpg",
  media: "(min-width: 320px) and (min-height: 520px)",
};

export function portraitSrcSet(oneX: string, twoX: string, threeX: string) {
  return `${oneX} 1x, ${twoX} 2x, ${threeX} 3x`;
}
