import { useCallback, useState } from "react";
import type { ApiResponse, AskResponseSource, CodeApiResponse } from "../types";
import axios from "axios";

export const BACKEND_API = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "http://localhost:3000/api";

// for normal search and getting data
export const searchApi = async (
  query: string,
  page: number = 1,
  options?: { signal?: AbortSignal },
): Promise<ApiResponse> => {
  const response = await axios.get(
    `${BACKEND_API}/search?q=${query}&page=${page}`,
    {
      signal: options?.signal,
    },
  );
  return response.data;
};

// for search of codes data
export const searchCodeApi = async (
  query: string,
  page: number = 1,
): Promise<CodeApiResponse> => {
  const response = await axios.get(
    `${BACKEND_API}/code-search?q=${query}&page=${page}`,
  );
  return response.data;
};

// ask ai streaming
export const useAskAiStream = () => {
  const [answer, setAnswer] = useState<string>("");
  const [sources, setSources] = useState<AskResponseSource[]>([]);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const askAi = useCallback(async (query: string) => {
    // Reset state for a new question
    setAnswer("");
    setSources([]);
    setError(null);
    setIsStreaming(true);

    try {
      const response = await fetch(
        `${BACKEND_API}/ask?q=${encodeURIComponent(query)}`,
        {
          method: "GET",
          headers: {
            Accept: "text/event-stream",
          },
        },
      );

      if (!response.body) {
        throw new Error("No readable stream available");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;
      let buffer = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;

        if (value) {
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n\n");

          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const jsonString = line.substring(6);

              try {
                const parsed = JSON.parse(jsonString);

                // Route the data based on the type we defined in the backend
                if (parsed.type === "sources") {
                  setSources(parsed.data);
                } else if (parsed.type === "chunk") {
                  // Append the new text to the existing answer state
                  setAnswer((prev) => prev + parsed.text);
                } else if (parsed.type === "error") {
                  setError(parsed.message);
                } else if (parsed.type === "done") {
                  setIsStreaming(false);
                }
              } catch (e: any) {
                console.error("Failed to parse SSE chunk:", jsonString, e);
              }
            }
          }
        }
      }
    } catch (err: any) {
      console.error("Stream failed:", err);
      setError(err.message || "Connection lost.");
    } finally {
      setIsStreaming(false);
    }
  }, []);

  return { askAi, answer, sources, isStreaming, error };
};
