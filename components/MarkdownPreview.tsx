"use client";

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

function renderWithLinks(text: string) {
  const parts = text.split(URL_REGEX);
  return parts.map((part, i) =>
    /^https?:\/\/[^\s]+$/.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300 break-all"
      >
        {part}
      </a>
    ) : (
      part
    )
  );
}

interface MarkdownPreviewProps {
  markdown: string;
  view: "raw" | "preview";
}

export default function MarkdownPreview({ markdown, view }: MarkdownPreviewProps) {
  const parts = markdown.split("---\n");
  const frontmatter = parts.length >= 3 ? parts[1].trim() : "";
  const body = parts.length >= 3 ? parts.slice(2).join("---\n").trim() : markdown;

  if (view === "raw") {
    return (
      <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="px-4 py-2 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 shrink-0">
          <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
            Raw Markdown
          </span>
        </div>
        <div className="p-4 overflow-y-auto flex-1 min-h-0">
          <pre className="text-sm font-mono whitespace-pre-wrap text-neutral-800 dark:text-neutral-200">
            {markdown}
          </pre>
        </div>
      </div>
    );
  }

  // Preview: no container, content flows naturally for page scroll
  return (
    <div className="space-y-4 px-4">
      {frontmatter && (
        <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-md p-3 text-sm">
          {frontmatter.split("\n").map((line, i) => {
            const [key, ...rest] = line.split(": ");
            const value = rest.join(": ");
            return (
              <div key={i} className="flex gap-2">
                <span className="font-medium text-neutral-500 dark:text-neutral-400 min-w-[80px]">
                  {key}
                </span>
                <span className="text-neutral-800 dark:text-neutral-200">{value}</span>
              </div>
            );
          })}
        </div>
      )}
      <div className="prose dark:prose-invert prose-sm max-w-none">
        {body.split("\n\n---\n\n").map((section, i) => (
          <div key={i}>
            {i > 0 && <hr className="my-4 border-neutral-200 dark:border-neutral-700" />}
            {section.split("\n").map((line, j) => (
              <p key={j} className="mb-2 text-neutral-800 dark:text-neutral-200">
                {renderWithLinks(line)}
              </p>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
