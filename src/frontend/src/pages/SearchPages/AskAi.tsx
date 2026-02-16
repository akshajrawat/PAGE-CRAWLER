import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import type { AskResponse } from "../../types";
import { askAi } from "../../api/search";

const AskAi = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q");

  const [data, setData] = useState<AskResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) return;

    const fetchAnswer = async () => {
      setLoading(true);
      setData(null);
      try {
        const data = await askAi(query);
        setData(data);
      } catch (err) {
        console.error("Failed to ask AI", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnswer();
  }, [query]);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      {/* 1. The Header with Glow Effect */}
      <div className="mb-8 relative">
        <div className="absolute -inset-1 bg-linear-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-25"></div>
        <h2 className="relative text-2xl font-bold text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-purple-400 flex items-center gap-3">
          <svg
            className="w-6 h-6 text-blue-400 animate-pulse"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          MOXCETY AI
        </h2>
      </div>

      {/* 2. Loading State (High Tech Skeleton) */}
      {loading && (
        <div className="space-y-6 animate-pulse">
          <div className="h-4 bg-gray-800 rounded w-3/4"></div>
          <div className="h-4 bg-gray-800 rounded w-full"></div>
          <div className="h-4 bg-gray-800 rounded w-5/6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 bg-gray-900 border border-gray-800 rounded-lg"
              ></div>
            ))}
          </div>
        </div>
      )}

      {/* 3. The Answer Area */}
      {!loading && data && (
        <div className="bg-neutral-900/50 border border-white/10 rounded-xl p-6 md:p-8 shadow-2xl backdrop-blur-sm">
          {/* Using prose-invert for readable text on dark backgrounds */}
          <div className="prose prose-invert prose-blue max-w-none">
            <ReactMarkdown
              components={{
                // Custom styling for code blocks to make them pop
                code: ({
                  node,
                  inline,
                  className,
                  children,
                  ...props
                }: any) => {
                  return inline ? (
                    <code
                      className="bg-gray-800 text-blue-300 px-1 py-0.5 rounded text-sm"
                      {...props}
                    >
                      {children}
                    </code>
                  ) : (
                    <div className="bg-black/50 rounded-lg p-4 border border-gray-800 overflow-x-auto my-4">
                      <code className="text-gray-300 text-sm" {...props}>
                        {children}
                      </code>
                    </div>
                  );
                },
              }}
            >
              {data.answer}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* 4. The Sources Grid */}
      {!loading && data && data.sources.length > 0 && (
        <div className="mt-10">
          <h3 className="text-xs font-semibold text-gray-500 mb-4 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Reference Sources
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.sources.map((source, idx) => (
              <a
                key={idx}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex flex-col justify-between p-4 bg-neutral-900 border border-neutral-800 rounded-xl hover:border-blue-500/50 hover:bg-neutral-800 transition-all duration-300"
              >
                <div>
                  <div className="font-medium text-gray-200 group-hover:text-blue-400 transition-colors line-clamp-1 mb-1">
                    {source.title || "Untitled Page"}
                  </div>
                  <div className="text-xs text-gray-500 font-mono truncate">
                    {new URL(source.url).hostname}
                  </div>
                </div>

                {/* Tiny arrow icon that appears on hover */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1">
                  <svg
                    className="w-4 h-4 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AskAi;
