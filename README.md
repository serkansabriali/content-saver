# Content Saver

A Next.js web app that converts tweets, X threads, and X articles into Markdown files.

## Features

- **Tweets & threads** — paste any `x.com` or `twitter.com` URL to get a clean Markdown snapshot
- **X Articles** — detects article-type posts and converts their full content to Markdown
- **Live preview** — side-by-side raw Markdown and rendered preview
- **Export** — copy to clipboard or download as a `.md` file
- **Dark mode** — system-aware theme with manual toggle

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), paste a tweet or thread URL, and click **Save Tweet**.

## Tech Stack

- [Next.js 15](https://nextjs.org/) (App Router, Turbopack)
- [React 19](https://react.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [react-tweet](https://react-tweet.vercel.app/) — tweet data fetching
- [fxtwitter API](https://github.com/FixTweet/FxTwitter) — article content fetching

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
