import React from "react";
import { toSourceLinks } from "@/lib/links";

export default function SourceLinks({ value }: { value: unknown }) {
  const links = toSourceLinks(value);
  if (!links.length) return null;

  return (
    <div className="mt-3">
      <div className="text-xs font-medium text-neutral-600">Sources</div>
      <ul className="mt-1 space-y-1 text-sm">
        {links.map((l) => (
          <li key={l.url}>
            <a
              href={l.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-sky-900 underline hover:text-sky-950"
            >
              {l.title || l.url}
            </a>
            {l.source && <span className="text-neutral-500"> · {l.source}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}