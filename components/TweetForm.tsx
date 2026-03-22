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
    <form onSubmit={handleSubmit} className="flex gap-3 w-full">
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Paste a tweet or thread URL (e.g. https://x.com/user/status/123)"
        required
        className="flex-1 px-4 py-3 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <button
        type="submit"
        disabled={loading}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium cursor-pointer whitespace-nowrap"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Fetching...
          </span>
        ) : (
          "Save Tweet"
        )}
      </button>
    </form>
  );

  // ── Empty / error state ──────────────────────────────────────────────────
  if (!markdown) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex flex-col items-center justify-center flex-1 px-4 pb-16">
          <div className="w-full max-w-xl flex flex-col items-center gap-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold">Content Saver</h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                Save tweets and threads as markdown
              </p>
            </div>
            {form}
            {error && (
              <div className="w-full p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Results state: two-column fluid layout ───────────────────────────────
  return (
    <div className="lg:h-screen lg:overflow-hidden grid grid-cols-1 lg:grid-cols-2 gap-6 px-6 py-4 lg:items-start">
      {/* Left column: fixed to viewport height, raw markdown scrolls internally */}
      <div className="lg:h-full flex flex-col gap-4 py-2 overflow-hidden">
        <div className="shrink-0">
          <h1 className="text-2xl font-bold">Content Saver</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Save tweets and threads as markdown
          </p>
        </div>
        <div className="shrink-0">{form}</div>
        {error && (
          <div className="shrink-0 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <MarkdownPreview markdown={markdown} view="raw" />
        </div>
      </div>

      {/* Right column: independent scroll within viewport */}
      <div className="lg:h-full lg:overflow-y-auto flex flex-col gap-4 py-2">
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-2 bg-white dark:bg-neutral-900">
          <span className="text-base font-semibold text-neutral-800 dark:text-neutral-200">
            Preview
          </span>
          <ExportButtons markdown={markdown} filename={filename} />
        </div>
        <MarkdownPreview markdown={markdown} view="preview" />
      </div>
    </div>
  );
}
