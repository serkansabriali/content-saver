import { NextResponse } from "next/server";
import { parseTwitterUrl } from "@/lib/url-parser";
import { fetchThread } from "@/lib/tweet-fetcher";
import { fetchArticle } from "@/lib/article-fetcher";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url } = body as { url?: string };

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid URL" },
        { status: 400 }
      );
    }

    const { tweetId } = parseTwitterUrl(url);

    // Try fetching as an article first
    const articleResult = await fetchArticle(tweetId);
    if (articleResult) {
      return NextResponse.json(articleResult);
    }

    // Fall back to tweet/thread fetching
    const tweets = await fetchThread(tweetId);

    if (tweets.length === 0) {
      return NextResponse.json(
        { error: "Could not fetch tweet. It may be deleted or private." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      tweets,
      isThread: tweets.length > 1,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
