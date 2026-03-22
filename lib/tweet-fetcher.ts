import { getTweet } from "react-tweet/api";
import type { TweetData } from "./types";

type RawTweet = NonNullable<Awaited<ReturnType<typeof getTweet>>>;

function mapReactTweetToTweetData(tweet: RawTweet, fullText?: string): TweetData {
  const media: TweetData["media"] = tweet.mediaDetails?.map((m) => ({
    type:
      m.type === "animated_gif"
        ? ("gif" as const)
        : (m.type as "photo" | "video"),
    url:
      m.type === "photo"
        ? m.media_url_https
        : m.video_info?.variants?.[0]?.url ?? m.media_url_https,
  }));

  return {
    id: tweet.id_str,
    text: fullText ?? tweet.text,
    author: {
      name: tweet.user.name,
      handle: tweet.user.screen_name,
      avatarUrl: tweet.user.profile_image_url_https,
    },
    createdAt: tweet.created_at,
    url: `https://x.com/${tweet.user.screen_name}/status/${tweet.id_str}`,
    media: media?.length ? media : undefined,
  };
}

async function fetchFullTextFromFxTwitter(id: string): Promise<string | undefined> {
  try {
    const res = await fetch(`https://api.fxtwitter.com/status/${id}`);
    if (res.ok) {
      const data = await res.json();
      return data.tweet?.text ?? undefined;
    }
  } catch {
    // ignore
  }
  return undefined;
}

export async function fetchTweet(id: string): Promise<TweetData | null> {
  try {
    const tweet = await getTweet(id);
    if (tweet) {
      const fullText = tweet.note_tweet
        ? await fetchFullTextFromFxTwitter(id)
        : undefined;
      return mapReactTweetToTweetData(tweet, fullText);
    }
  } catch {
    // Fall through to fallback
  }

  try {
    const res = await fetch(`https://api.fxtwitter.com/status/${id}`);
    if (!res.ok) return null;
    const data = await res.json();
    const t = data.tweet;
    if (!t) return null;
    return {
      id: String(t.id),
      text: t.text ?? "",
      author: {
        name: t.author?.name ?? "Unknown",
        handle: t.author?.screen_name ?? "unknown",
        avatarUrl: t.author?.avatar_url,
      },
      createdAt: t.created_at ?? new Date().toISOString(),
      url: t.url ?? `https://x.com/i/status/${id}`,
      media: t.media?.photos?.map((p: { url: string }) => ({
        type: "photo" as const,
        url: p.url,
      })),
    };
  } catch {
    return null;
  }
}

const MAX_THREAD_DEPTH = 25;

/**
 * Fetch a full thread from ThreadReaderApp by scraping the unrolled thread page.
 * Returns null if the thread isn't available there.
 */
async function fetchThreadFromThreadReader(
  tweetId: string
): Promise<TweetData[] | null> {
  try {
    const res = await fetch(
      `https://threadreaderapp.com/thread/${tweetId}.html`,
      {
        headers: { "User-Agent": "Mozilla/5.0" },
        redirect: "manual",
      }
    );

    // ThreadReaderApp redirects (302) if the thread doesn't exist
    if (res.status !== 200) return null;

    const html = await res.text();

    // Extract handle from the page
    const handleMatch = html.match(/@(\w+)/);
    const handle = handleMatch ? handleMatch[1] : "unknown";

    // Extract author name from meta or page content
    const authorNameMatch = html.match(
      /Thread by @\w+\s*(?:aka\s+)?([^|<\n]+)/i
    );
    const authorName = authorNameMatch ? authorNameMatch[1].trim() : handle;

    // Split by id="tweet_N" to isolate each tweet block.
    // Only these blocks are actual thread tweets — "More from @user" section
    // at the bottom uses different markup without id="tweet_N".
    const parts = html.split(/id="tweet_\d+"/);
    const tweets: TweetData[] = [];

    for (let i = 1; i < parts.length && tweets.length < MAX_THREAD_DEPTH; i++) {
      const part = parts[i];
      const idMatch = part.match(/data-tweet="(\d+)"/);
      const contentMatch = part.match(/dir="auto">([\s\S]*?)<\/div>/);
      if (!idMatch || !contentMatch) continue;

      const individualTweetId = idMatch[1];
      const raw = contentMatch[1];

      // Extract image URLs from this block before stripping HTML
      const imageUrls: string[] = [];
      const imgRegex = /data-src="(https:\/\/pbs\.twimg\.com\/[^"]+)"/g;
      let imgMatch;
      while ((imgMatch = imgRegex.exec(raw))) {
        imageUrls.push(imgMatch[1]);
      }
      // Also check href for images
      const hrefImgRegex = /href="(https:\/\/pbs\.twimg\.com\/[^"]+)"/g;
      while ((imgMatch = hrefImgRegex.exec(raw))) {
        if (!imageUrls.includes(imgMatch[1])) {
          imageUrls.push(imgMatch[1]);
        }
      }

      // Strip HTML to get plain text
      const text = raw
        .replace(/<br\s*\/?>/g, "\n")
        .replace(/<span class="entity-image">[\s\S]*?<\/span>/g, "")
        .replace(/<span class="entity-video[^"]*">[\s\S]*?<\/span>/g, "")
        .replace(/<a[^>]*href="([^"]*)"[^>]*>[^<]*<\/a>/g, "$1")
        .replace(/<[^>]+>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      if (!text) continue;

      const media: TweetData["media"] = imageUrls.length
        ? imageUrls.map((url) => ({ type: "photo" as const, url }))
        : undefined;

      tweets.push({
        id: individualTweetId,
        text,
        author: { name: authorName, handle },
        createdAt: new Date().toISOString(),
        url: `https://x.com/${handle}/status/${individualTweetId}`,
        media,
      });
    }

    return tweets.length > 0 ? tweets : null;
  } catch {
    return null;
  }
}

/**
 * Walk backward from a tweet through its in_reply_to chain (same author only).
 */
async function walkBackward(id: string): Promise<TweetData[]> {
  const tweets: TweetData[] = [];
  let currentId: string | null = id;
  let depth = 0;

  while (currentId && depth < MAX_THREAD_DEPTH) {
    try {
      const rawTweet = await getTweet(currentId);
      if (!rawTweet) break;

      const fullText = rawTweet.note_tweet
        ? await fetchFullTextFromFxTwitter(currentId)
        : undefined;
      tweets.unshift(mapReactTweetToTweetData(rawTweet, fullText));

      if (
        rawTweet.in_reply_to_status_id_str &&
        rawTweet.in_reply_to_screen_name === rawTweet.user.screen_name
      ) {
        currentId = rawTweet.in_reply_to_status_id_str;
      } else {
        currentId = null;
      }
    } catch {
      break;
    }
    depth++;
  }

  return tweets;
}

/**
 * Fetch a full thread. Strategy:
 * 1. Try ThreadReaderApp for full thread content (works for any tweet in the thread)
 * 2. Fall back to walking backward via react-tweet (in_reply_to chain)
 * 3. Fall back to single tweet fetch
 */
export async function fetchThread(id: string): Promise<TweetData[]> {
  // Strategy 1: ThreadReaderApp — works regardless of which tweet in the thread is pasted
  const threadReaderTweets = await fetchThreadFromThreadReader(id);
  if (threadReaderTweets && threadReaderTweets.length > 1) {
    // Enrich the first tweet with proper metadata from react-tweet if possible
    try {
      const firstTweet = await getTweet(id);
      if (firstTweet) {
        const authorData = {
          name: firstTweet.user.name,
          handle: firstTweet.user.screen_name,
          avatarUrl: firstTweet.user.profile_image_url_https,
        };
        const createdAt = firstTweet.created_at;
        // Update all tweets with proper author info and the thread starter's URL
        for (const t of threadReaderTweets) {
          t.author = authorData;
          t.createdAt = createdAt;
        }
        threadReaderTweets[0].url = `https://x.com/${authorData.handle}/status/${firstTweet.id_str}`;
        threadReaderTweets[0].id = firstTweet.id_str;
      }
    } catch {
      // Keep ThreadReaderApp data as-is
    }
    return threadReaderTweets;
  }

  // Strategy 2: Walk backward via react-tweet
  const backwardTweets = await walkBackward(id);
  if (backwardTweets.length > 0) {
    return backwardTweets;
  }

  // Strategy 3: Single tweet fetch via fallback
  const single = await fetchTweet(id);
  return single ? [single] : [];
}
