import type { ApiResponse } from "../types";

const API = "http://localhost:3000/api";

export const searchApi = async (
  query: string,
  page: number = 1,
): Promise<ApiResponse> => {
  const response = await fetch(`${API}/search?q=${query}&page=${page}`);
  if (!response.ok) {
    throw new Error("Failed to fetch result at >> /api/search.ts");
  }

  return response.json();
};
