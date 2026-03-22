import type { TweetData } from "./types";

function escapeYaml(value: string): string {
  if (/[:#\[\]{}&*!|>'"`,@]/.test(value) || value.trim() !== value) {
    return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  }
  return `"${value}"`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toISOString().split("T")[0];
}

function formatTweetBody(tweet: TweetData): string {
  let body = tweet.text;

  if (tweet.media?.length) {
    body += "\n";
    for (const m of tweet.media) {
      if (m.type === "photo") {
        body += `\n![image](${m.url})`;
      } else {
        body += `\n[${m.type}](${m.url})`;
      }
    }
  }

  return body;
}

export function generateMarkdown(
  tweets: TweetData[],
  isThread: boolean
): string {
  if (tweets.length === 0) return "";

  const first = tweets[0];
  const lines: string[] = ["---"];

  if (isThread) {
    lines.push(`title: ${escapeYaml(`Thread by @${first.author.handle}`)}`);
  } else {
    lines.push(`title: ${escapeYaml(`Tweet by @${first.author.handle}`)}`);
  }

  lines.push(`author: ${escapeYaml(first.author.name)}`);
  lines.push(`handle: ${escapeYaml(`@${first.author.handle}`)}`);
  lines.push(`date: ${escapeYaml(formatDate(first.createdAt))}`);
  lines.push(`url: ${escapeYaml(first.url)}`);
  lines.push(`saved_at: ${escapeYaml(new Date().toISOString())}`);
  lines.push(`type: ${isThread ? "thread" : "tweet"}`);

  if (isThread) {
    lines.push(`tweet_count: ${tweets.length}`);
  }

  lines.push("---");
  lines.push("");

  if (isThread) {
    const bodies = tweets.map((t) => formatTweetBody(t));
    lines.push(bodies.join("\n\n---\n\n"));
  } else {
    lines.push(formatTweetBody(first));
  }

  lines.push("");
  return lines.join("\n");
}

export function generateFilename(tweets: TweetData[], isThread: boolean): string {
  const first = tweets[0];
  const prefix = isThread ? "thread" : "tweet";
  return `${prefix}-${first.author.handle}-${first.id}.md`;
}
