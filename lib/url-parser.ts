const TWEET_URL_REGEX =
  /(?:twitter\.com|x\.com)\/(\w+)\/status\/(\d+)/;

export function parseTwitterUrl(url: string): {
  tweetId: string;
  handle: string;
} {
  const match = url.match(TWEET_URL_REGEX);
  if (!match) {
    throw new Error(
      "Invalid tweet URL. Expected format: https://x.com/user/status/123456"
    );
  }
  return { handle: match[1], tweetId: match[2] };
}
