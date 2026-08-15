import { useEffect } from "react";

type PageMetadata = {
  title: string;
  description: string;
};

function upsertMetaTag(name: string, content: string) {
  const selector = `meta[name="${name}"]`;
  const existingTag = document.head.querySelector<HTMLMetaElement>(selector);

  if (existingTag) {
    existingTag.content = content;
    return;
  }

  const metaTag = document.createElement("meta");
  metaTag.name = name;
  metaTag.content = content;
  document.head.append(metaTag);
}

export function usePageMetadata({ description, title }: PageMetadata) {
  useEffect(() => {
    document.title = title;
    upsertMetaTag("description", description);
  }, [description, title]);
}
