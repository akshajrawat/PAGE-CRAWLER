// The data we get from the sql query
export interface SearchResult {
  url: string;
  title: string;
  last_crawled: string;
  rank?: number;
}

// The response of the api
export interface ApiResponse {
  count: number;
  page: number;
  data: SearchResult[];
}
