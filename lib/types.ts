export interface TweetData {
  id: string;
  text: string;
  author: {
    name: string;
    handle: string;
    avatarUrl?: string;
  };
  createdAt: string;
  url: string;
  media?: {
    type: "photo" | "video" | "gif";
    url: string;
  }[];
}

export interface FetchTweetResponse {
  tweets: TweetData[];
  isThread: boolean;
}
