import portrait1x from "@/assets/danilo-portrait-144.webp";
import portrait2x from "@/assets/danilo-portrait-288.webp";
import portrait3x from "@/assets/danilo-portrait-432.webp";
import { portraitSrcSet } from "@/routes/criticalImages";

export const portraitImage = {
  src: portrait1x,
  srcSet: portraitSrcSet(portrait1x, portrait2x, portrait3x),
};
