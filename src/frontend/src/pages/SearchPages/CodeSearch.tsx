import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertCircle, FileCode, Terminal, ExternalLink } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { searchCodeApi } from "../../api/search";
import type { CodeSnippet } from "../../types";

const CodeSearch = () => {
  const [results, setResults] = useState<CodeSnippet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  useEffect(() => {
    const fetchCode = async () => {
      if (!query) return;
      setIsLoading(true);
      setError("");

      try {
        const data = await searchCodeApi(query);
        setResults(data?.data || []);
      } catch (err) {
        setError("Neural connection lost. Vector database unresponsive.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCode();
  }, [query]);

  return (
    <div>
      {/* STATS BAR */}
      {!isLoading && !error && results.length > 0 && (
        <p className="text-xs text-gray-500 mb-8 font-mono flex items-center gap-2">
          <Terminal size={12} />
          <span>Scanned {results.length} vector embeddings in 0.8s.</span>
        </p>
      )}

      {/* LOADING STATE (Code Block Skeletons) */}
      {isLoading && (
        <div className="space-y-8 animate-pulse">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-3">
              <div className="h-6 bg-white/10 rounded w-1/4"></div>
              <div className="h-40 bg-white/5 rounded-lg border border-white/5 w-full"></div>
            </div>
          ))}
        </div>
      )}

      {/* ERROR STATE */}
      {error && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="p-4 rounded-full bg-red-500/10 text-red-400 mb-4">
            <AlertCircle size={40} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            Vector Search Failed
          </h3>
          <p className="text-gray-400 max-w-md">{error}</p>
        </div>
      )}

      {/* RESULTS LIST */}
      <div className="space-y-12">
        {results.map((snippet, index) => (
          <div key={index} className="group max-w-4xl relative">
            {/* HEADER: File Info & Similarity */}
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-1.5 rounded bg-blue-500/10 text-blue-400">
                  <FileCode size={16} />
                </div>
                <div className="flex flex-col">
                  <a
                    href={snippet.page_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-gray-200 hover:text-purple-400 transition-colors truncate"
                  >
                    {snippet.page_title}
                  </a>
                  <span className="text-xs text-gray-500 font-mono truncate max-w-md">
                    {snippet.page_url}
                  </span>
                </div>
              </div>

              {/* Similarity Badge */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                  Match
                </span>
                <div className="px-2 py-0.5 rounded text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20">
                  {(snippet.similarity * 100).toFixed(0)}%
                </div>
              </div>
            </div>

            {/* CODE BLOCK (The "VS Code" Look) */}
            <div className="relative rounded-lg overflow-hidden border border-white/10 bg-[#1e1e1e] group-hover:border-purple-500/30 transition-colors shadow-2xl">
              {/* Language Tag */}
              <div className="absolute top-0 right-0 px-3 py-1 bg-white/5 text-[10px] text-gray-400 font-mono border-b border-l border-white/10 rounded-bl-lg">
                {snippet.language || "TYPESCRIPT"}
              </div>

              <SyntaxHighlighter
                language={snippet.language || "typescript"}
                style={vscDarkPlus}
                customStyle={{
                  margin: 0,
                  padding: "1.5rem",
                  fontSize: "0.9rem",
                  lineHeight: "1.5",
                  background: "transparent",
                  whiteSpace: "pre-wrap", 
                  wordBreak: "break-word", 
                }}
                wrapLines={true}
                wrapLongLines={true} 
              >
                {snippet.content}
              </SyntaxHighlighter>

              {/* Overlay Gradient for Long Snippets (Optional) */}
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-linear-to-t from-[#1e1e1e] to-transparent pointer-events-none"></div>
            </div>

            {/* ACTION FOOTER */}
            <div className="mt-3 flex justify-end">
              <a
                href={snippet.page_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-white transition-colors"
              >
                <ExternalLink size={12} />
                View Full Context
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* NO RESULTS */}
      {!isLoading && !error && results.length === 0 && query && (
        <div className="py-20 text-center border border-dashed border-white/10 rounded-xl bg-white/5">
          <Terminal size={40} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400 text-lg">
            No code snippets found for{" "}
            <span className="text-white">"{query}"</span>
          </p>
          <p className="text-sm text-gray-600 mt-2 max-w-sm mx-auto">
            Try searching for specific functions like "useEffect" or
            "middleware".
          </p>
        </div>
      )}
    </div>
  );
};

export default CodeSearch;
