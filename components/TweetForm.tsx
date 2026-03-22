"use client";

import { useState } from "react";
import type { TweetData } from "@/lib/types";
import { generateMarkdown, generateFilename } from "@/lib/markdown-generator";
import MarkdownPreview from "./MarkdownPreview";
import ExportButtons from "./ExportButtons";

export default function TweetForm() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [filename, setFilename] = useState("");
  const [includeFrontMatter, setIncludeFrontMatter] = useState(true);

  function stripFrontMatter(md: string): string {
    const parts = md.split("---\n");
    if (parts.length >= 3) return parts.slice(2).join("---\n").trimStart();
    return md;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMarkdown(null);

    try {
      const res = await fetch("/api/fetch-tweet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to fetch tweet");
        return;
      }

      if (data.isArticle) {
        setMarkdown(data.markdown);
        setFilename(data.filename);
      } else {
        const { tweets, isThread } = data as {
          tweets: TweetData[];
          isThread: boolean;
        };
        setMarkdown(generateMarkdown(tweets, isThread));
        setFilename(generateFilename(tweets, isThread));
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const form = (
    <form onSubmit={handleSubmit} className="relative w-full" aria-label="Save tweet or thread">
      <input
        id="tweet-url"
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Paste a tweet or thread URL..."
        required
        aria-label="Tweet or thread URL"
        aria-describedby={error ? "tweet-url-error" : undefined}
        className="w-full pl-4 pr-12 py-3 rounded-lg border border-rule bg-card text-ink placeholder-mid focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent shadow-rest"
      />
      <button
        type="submit"
        disabled={loading}
        aria-busy={loading}
        className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center p-1 rounded-md text-accent hover:bg-accent/10 active:bg-accent/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      >
        {loading ? (
          <svg aria-hidden="true" className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg aria-label="Save" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        )}
      </button>
    </form>
  );

  // ── Empty / error state ──────────────────────────────────────────────────
  if (!markdown && !loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex flex-col items-center justify-center flex-1 px-4 pb-16">
          <div className="w-full max-w-xl flex flex-col items-center gap-6">
            <div className="text-center">
              <h1 className="text-2xl font-black tracking-tight">Content Saver</h1>
              <p className="text-xs font-mono uppercase tracking-widest text-mid mt-1">
                Save tweets and threads as markdown
              </p>
            </div>
            {form}
            <div className="w-full flex flex-col gap-4 text-center">
              <p className="text-xs font-mono uppercase tracking-widest text-mid">How it works</p>
              <div className="grid grid-cols-4 gap-3 text-left">
                {[
                  { n: "01", label: "Copy link", desc: "Grab the URL of any tweet, thread, or article on X/Twitter" },
                  { n: "02", label: "Paste & save", desc: "Paste it into the input above and press enter" },
                  { n: "03", label: "Preview", desc: "Review the generated Markdown with YAML front-matter" },
                  { n: "04", label: "Export", desc: "Copy or download and paste into your note-taking app" },
                ].map(({ n, label, desc }) => (
                  <div key={n} className="flex flex-col gap-2 p-3 rounded-lg border border-rule bg-rule/30">
                    <span className="font-mono text-xs text-accent">{n}</span>
                    <span className="text-xs font-semibold tracking-tight text-ink">{label}</span>
                    <span className="text-xs text-mid leading-relaxed">{desc}</span>
                  </div>
                ))}
              </div>
            </div>
            {error && (
              <div id="tweet-url-error" role="alert" aria-live="assertive" className="w-full p-4 bg-error/5 border border-error/30 rounded-lg text-error text-sm">
                {error}
              </div>
            )}
          </div>
        </div>
        <footer className="shrink-0 py-4 text-center flex flex-col gap-1">
          <p className="text-xs text-mid font-mono">
            Built by{" "}
            <a
              href="https://serkanali.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:text-accent/80 transition-colors"
            >
              Serkan Ali
            </a>
          </p>
          <p className="text-xs text-mid/60 font-mono">
            For personal archival of public content only. Respect copyright and platform terms of service.
          </p>
        </footer>
      </div>
    );
  }

  const displayMarkdown = markdown
    ? includeFrontMatter ? markdown : stripFrontMatter(markdown)
    : null;

  // ── Loading / Results state: two-column fluid layout ─────────────────────
  return (
    <div className="lg:h-screen lg:overflow-hidden grid grid-cols-1 lg:grid-cols-2 gap-6 px-6 py-4 lg:items-start">
      {/* Left column: fixed to viewport height, raw markdown scrolls internally */}
      <div className="lg:h-full flex flex-col gap-4 py-2 overflow-hidden">
        <div className="shrink-0">
          <h1 className="text-2xl font-black tracking-tight">Content Saver</h1>
          <p className="text-xs font-mono uppercase tracking-widest text-mid mt-1">
            Save tweets and threads as markdown
          </p>
        </div>
        <div className="shrink-0 px-0.5 py-0.5">{form}</div>
        {error && (
          <div id="tweet-url-error" role="alert" aria-live="assertive" className="shrink-0 p-4 bg-error/5 border border-error/30 rounded-lg text-error text-sm">
            {error}
          </div>
        )}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {displayMarkdown ? (
            <MarkdownPreview markdown={displayMarkdown} view="raw" />
          ) : (
            <div aria-busy="true" aria-label="Loading content" className="flex-1 flex flex-col gap-3 pt-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-3 rounded bg-rule/50 animate-pulse" style={{ width: `${70 + (i % 3) * 10}%` }} />
              ))}
            </div>
          )}
        </div>
        <footer className="shrink-0 py-2 flex flex-col gap-1">
          <p className="text-xs text-mid font-mono">
            Built by{" "}
            <a
              href="https://serkanali.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:text-accent/80 transition-colors"
            >
              Serkan Ali
            </a>
          </p>
          <p className="text-xs text-mid/60 font-mono">
            For personal archival of public content only. Respect copyright and platform terms of service.
          </p>
        </footer>
      </div>

      {/* Right column: independent scroll within viewport */}
      <div className="lg:h-full lg:overflow-y-auto flex flex-col gap-4 py-2">
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-bg">
          <span className="text-xs font-mono uppercase tracking-widest text-mid">
            Preview
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              role="switch"
              aria-checked={includeFrontMatter}
              onClick={() => setIncludeFrontMatter((v) => !v)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md font-mono text-xs uppercase tracking-widest text-mid hover:bg-rule/40 hover:text-ink active:bg-rule/70 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 select-none"
            >
              Front-matter
              <span className={`relative w-7 h-3.5 rounded-full transition-colors ${includeFrontMatter ? "bg-accent" : "bg-rule"}`}>
                <span className={`absolute top-0.5 left-0.5 w-2.5 h-2.5 rounded-full bg-white transition-transform ${includeFrontMatter ? "translate-x-3.5" : "translate-x-0"}`} />
              </span>
            </button>
            {displayMarkdown && <ExportButtons markdown={displayMarkdown} filename={filename} />}
          </div>
        </div>
        {displayMarkdown ? (
          <MarkdownPreview markdown={displayMarkdown} view="preview" />
        ) : (
          <div aria-hidden="true" className="flex flex-col gap-4 px-4">
            <div className="h-6 w-2/3 rounded bg-rule/50 animate-pulse" />
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="h-3 rounded bg-rule/50 animate-pulse" style={{ width: `${85 + (i % 2) * 10}%` }} />
                <div className="h-3 rounded bg-rule/50 animate-pulse" style={{ width: `${60 + (i % 3) * 10}%` }} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
