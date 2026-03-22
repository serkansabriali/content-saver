# Content Saver

A Next.js app that converts X/Twitter tweets, threads, and articles into clean, exportable Markdown files.

## Tech Stack

- **Next.js 15** (App Router, Turbopack)
- **React 19** + **TypeScript 5** (strict mode)
- **Tailwind CSS v4** with custom theme variables
- **next-themes** for dark mode
- **react-tweet** + fxtwitter API + ThreadReaderApp for content fetching

## Project Structure

```
app/
  api/fetch-tweet/route.ts  # Server-side POST endpoint: URL parsing + fetching
  layout.tsx                # Root layout (fonts, metadata, ThemeProvider)
  page.tsx                  # Home page (renders TweetForm)
  globals.css               # Tailwind + custom CSS theme variables
components/
  TweetForm.tsx             # Main orchestrator: form, state, API calls, layout
  MarkdownPreview.tsx       # Dual raw/rendered markdown view
  ExportButtons.tsx         # Copy to clipboard + download .md
  ThemeProvider.tsx         # next-themes wrapper
  ThemeToggle.tsx           # Dark/light toggle button
lib/
  types.ts                  # TweetData, FetchTweetResponse interfaces
  url-parser.ts             # Extract tweet ID from X/Twitter URLs
  tweet-fetcher.ts          # Multi-strategy fetcher (ThreadReaderApp → reply chain → fxtwitter)
  article-fetcher.ts        # Detect + fetch X article content
  article-converter.ts      # Draft.js → Markdown conversion
  markdown-generator.ts     # YAML front-matter + Markdown body generation
```

## Architecture

**Data flow:** URL input → `/api/fetch-tweet` (server) → markdown generation → client preview/export

**Multi-strategy fetching** (tweet-fetcher.ts):
1. ThreadReaderApp scraping (best for full threads)
2. Walk backward via `in_reply_to` chain (react-tweet API)
3. Single tweet fallback (fxtwitter API)

**Server/client split:** API route handles fetching (privacy/security); components handle UI and export.

## Conventions

- Path alias `@/` maps to project root
- `lib/` for pure utilities, `components/` for React components
- All TypeScript interfaces in `lib/types.ts`
- Tailwind utility class `.label-mono` for monospace labels
- Thread filename: `thread-{handle}-{id}.md`; tweet: `tweet-{handle}-{id}.md`
- YAML front-matter fields: `title`, `author`, `date`, `url`, `saved_at`, `type`, `tweet_count` (threads)

## Key Notes

- No environment variables required for basic functionality
- Draft.js inline styles are applied at character level; process entity ranges in reverse to avoid index shifting
- YAML values must be escaped (special characters in titles/authors)
- Dark mode uses class-based toggling via next-themes
- Accent color: `#A33A1E` (rust/burnt orange)

## Commands

```bash
npm run dev    # Start dev server with Turbopack
npm run build  # Production build
npm run lint   # ESLint
```
