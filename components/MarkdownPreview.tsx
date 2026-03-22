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
        className="text-accent hover:text-accent/90 underline break-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 rounded"
      >
        {part}
        <span className="sr-only"> (opens in new tab)</span>
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
      <div className="border border-rule rounded-lg overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="px-4 py-2 border-b border-rule bg-bg shrink-0">
          <span className="text-xs font-mono uppercase tracking-widest text-mid">
            Raw Markdown
          </span>
        </div>
        <div className="p-4 overflow-y-auto flex-1 min-h-0 bg-card">
          <pre className="text-sm font-mono whitespace-pre-wrap break-all text-ink">
            {markdown}
          </pre>
        </div>
      </div>
    );
  }

  // Preview: no container, content flows naturally for page scroll
  return (
    <div className="space-y-4">
      {frontmatter && (
        <div className="bg-rule/30 rounded-md p-3 text-sm">
          {frontmatter.split("\n").map((line, i) => {
            const [key, ...rest] = line.split(": ");
            const value = rest.join(": ");
            return (
              <div key={i} className="flex gap-2 min-w-0">
                <span className="font-mono text-mid min-w-[80px] shrink-0">
                  {key}
                </span>
                <span className="text-ink break-all min-w-0">{value}</span>
              </div>
            );
          })}
        </div>
      )}
      <div className="prose prose-sm max-w-prose">
        {body.split("\n\n---\n\n").map((section, i) => (
          <div key={i}>
            {i > 0 && <hr className="my-4 border-rule" />}
            {section.split("\n").map((line, j) => (
              <p key={j} className="mb-2 text-ink">
                {renderWithLinks(line)}
              </p>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
