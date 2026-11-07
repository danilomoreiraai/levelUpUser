import portrait1x from "@/assets/danilo-portrait-144.webp";
import portrait2x from "@/assets/danilo-portrait-288.webp";
import portrait3x from "@/assets/danilo-portrait-432.webp";

export function ProfilePhoto() {
  return (
    <img
      src={portrait1x}
      srcSet={`${portrait1x} 1x, ${portrait2x} 2x, ${portrait3x} 3x`}
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
