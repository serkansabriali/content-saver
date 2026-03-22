import { getTweet } from "react-tweet/api";
import { articleToMarkdown } from "./article-converter";

interface ArticleFetchResult {
  markdown: string;
  filename: string;
  isArticle: true;
}

export async function fetchArticle(
  tweetId: string
): Promise<ArticleFetchResult | null> {
  try {
    const res = await fetch(
      `https://api.fxtwitter.com/status/${tweetId}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const article = data.tweet?.article;
    if (!article?.content?.blocks) return null;

    // Get author info from FxTwitter
    let authorName = data.tweet.author?.name ?? "Unknown";
    let authorHandle = data.tweet.author?.screen_name ?? "unknown";

    // Try to enrich with react-tweet for more accurate data
    try {
      const tweet = await getTweet(tweetId);
      if (tweet) {
        authorName = tweet.user.name;
        authorHandle = tweet.user.screen_name;
      }
    } catch {
      // Keep FxTwitter data
    }

    const tweetUrl = `https://x.com/${authorHandle}/status/${tweetId}`;
    const markdown = articleToMarkdown(
      article,
      authorName,
      authorHandle,
      tweetUrl
    );

    const slug = article.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 50);
    const filename = `article-${authorHandle}-${slug}.md`;

    return { markdown, filename, isArticle: true };
  } catch {
    return null;
  }
}
