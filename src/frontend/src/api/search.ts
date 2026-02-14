import type { ApiResponse, CodeApiResponse } from "../types";
import axios from "axios";

const API = "http://localhost:3000/api";

export const searchApi = async (
  query: string,
  page: number = 1,
): Promise<ApiResponse> => {
  const response = await axios.get(`${API}/search?q=${query}&page=${page}`);
  return response.data;
};

export const searchCodeApi = async (
  query: string,
  page: number = 1,
): Promise<CodeApiResponse> => {
  const response = await axios.get(
    `${API}/code-search?q=${query}&page=${page}`,
  );
  return response.data;
};
