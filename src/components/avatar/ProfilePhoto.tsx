import { portraitImage } from "@/lib/portraitImage";

export function ProfilePhoto() {
  return (
    <img
      src={portraitImage.src}
      srcSet={portraitImage.srcSet}
      alt="Danilo Moreira"
      width={144}
      height={144}
      decoding="async"
      draggable={false}
      onContextMenu={(event) => event.preventDefault()}
      className="h-36 w-36 shrink-0 rounded-full border-4 border-white object-cover object-[center_20%] shadow-sm ring-1 ring-slate-200"
    />
  );
}
