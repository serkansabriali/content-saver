/**
 * Converts X/Twitter article content (Draft.js format) to markdown.
 */

interface InlineStyleRange {
  offset: number;
  length: number;
  style: string;
}

interface EntityRange {
  offset: number;
  length: number;
  key: number;
}

interface Block {
  text: string;
  type: string;
  inlineStyleRanges: InlineStyleRange[];
  entityRanges: EntityRange[];
}

interface EntityValue {
  data: {
    url?: string;
    caption?: string;
    mediaItems?: { mediaId: string }[];
  };
  type: string;
}

interface EntityMapEntry {
  key: string;
  value: EntityValue;
}

interface ArticleContent {
  blocks: Block[];
  entityMap: Record<string, EntityMapEntry>;
}

interface ArticleData {
  title: string;
  created_at: string;
  modified_at?: string;
  preview_text?: string;
  content: ArticleContent;
  cover_media?: {
    media_info?: {
      original_img_url?: string;
    };
  };
}

function applyInlineStyles(text: string, styles: InlineStyleRange[]): string {
  if (!styles.length || !text) return text;

  // Build a character-level style map
  const charStyles: Set<string>[] = Array.from({ length: text.length }, () => new Set());
  for (const s of styles) {
    for (let i = s.offset; i < s.offset + s.length && i < text.length; i++) {
      charStyles[i].add(s.style);
    }
  }

  // Group consecutive characters with the same styles
  let result = "";
  let i = 0;
  while (i < text.length) {
    const currentStyles = charStyles[i];
    let j = i + 1;
    while (j < text.length && setsEqual(charStyles[j], currentStyles)) {
      j++;
    }
    let chunk = text.slice(i, j);
    if (currentStyles.has("BOLD") && currentStyles.has("ITALIC")) {
      chunk = `***${chunk}***`;
    } else if (currentStyles.has("BOLD")) {
      chunk = `**${chunk}**`;
    } else if (currentStyles.has("ITALIC")) {
      chunk = `*${chunk}*`;
    }
    result += chunk;
    i = j;
  }

  return result;
}

function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const item of a) {
    if (!b.has(item)) return false;
  }
  return true;
}

function applyEntities(
  text: string,
  entityRanges: EntityRange[],
  entityMap: ArticleContent["entityMap"]
): string {
  if (!entityRanges.length) return text;

  // Sort entity ranges by offset in reverse so replacements don't shift indices
  const sorted = [...entityRanges].sort((a, b) => b.offset - a.offset);

  let result = text;
  for (const range of sorted) {
    const entity = entityMap[String(range.key)];
    if (!entity) continue;

    const original = result.slice(range.offset, range.offset + range.length);
    const entityValue = entity.value || (entity as unknown as EntityValue);

    if (entityValue.type === "LINK" && entityValue.data?.url) {
      const replacement = `[${original}](${entityValue.data.url})`;
      result =
        result.slice(0, range.offset) +
        replacement +
        result.slice(range.offset + range.length);
    }
  }

  return result;
}

export function articleToMarkdown(
  article: ArticleData,
  authorName: string,
  authorHandle: string,
  tweetUrl: string
): string {
  const lines: string[] = ["---"];
  lines.push(`title: "${article.title.replace(/"/g, '\\"')}"`);
  lines.push(`author: "${authorName}"`);
  lines.push(`handle: "@${authorHandle}"`);
  lines.push(`date: "${article.created_at.split("T")[0]}"`);
  lines.push(`url: "${tweetUrl}"`);
  lines.push(`saved_at: "${new Date().toISOString()}"`);
  lines.push("type: article");
  lines.push("---");
  lines.push("");

  // Add title as H1
  lines.push(`# ${article.title}`);
  lines.push("");

  for (const block of article.content.blocks) {
    switch (block.type) {
      case "header-one":
        lines.push(`# ${block.text}`);
        lines.push("");
        break;
      case "header-two":
        lines.push(`## ${block.text}`);
        lines.push("");
        break;
      case "header-three":
        lines.push(`### ${block.text}`);
        lines.push("");
        break;
      case "blockquote":
        lines.push(`> ${block.text}`);
        lines.push("");
        break;
      case "unordered-list-item":
        lines.push(`- ${processBlockText(block, article.content.entityMap)}`);
        break;
      case "ordered-list-item":
        lines.push(`1. ${processBlockText(block, article.content.entityMap)}`);
        break;
      case "atomic": {
        // Media/image blocks
        for (const er of block.entityRanges) {
          const entity = article.content.entityMap[String(er.key)];
          const ev = entity?.value || (entity as unknown as EntityValue);
          if (ev?.data?.mediaItems) {
            // Image caption
            if (ev.data.caption) {
              lines.push(`*${ev.data.caption}*`);
            }
          }
        }
        lines.push("");
        break;
      }
      case "unstyled":
      default: {
        const text = processBlockText(block, article.content.entityMap);
        if (text) {
          lines.push(text);
          lines.push("");
        } else {
          lines.push("");
        }
        break;
      }
    }
  }

  return lines.join("\n");
}

function processBlockText(
  block: Block,
  entityMap: ArticleContent["entityMap"]
): string {
  let text = block.text;
  text = applyEntities(text, block.entityRanges, entityMap);
  text = applyInlineStyles(text, block.inlineStyleRanges);
  return text;
}
