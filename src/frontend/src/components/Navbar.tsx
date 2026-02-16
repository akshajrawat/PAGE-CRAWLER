import { SearchCheck, SearchIcon } from "lucide-react";
import { Logo } from "./Logo";
import { useState, useEffect } from "react";
import { NavLink, type SetURLSearchParams } from "react-router-dom";

const Navbar = ({
  query,
  setSearchParams,
}: {
  query: string;
  setSearchParams: SetURLSearchParams;
}) => {
  const [localQuery, setLocalQuery] = useState(query);

  // Sync local state if URL query changes externally
  useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  const handleSearch = (e: any) => {
    e.preventDefault();
    if (localQuery.trim()) {
      setSearchParams({ q: localQuery });
    }
  };

  const handleQuerySearch = (e: any) => {
    setLocalQuery(e.target.value);
  };

  // Helper function to keep code clean
  const getTabClass = (isActive: boolean) => {
    return `pb-3 border-b-2 text-sm font-medium transition-all ${
      isActive
        ? "border-purple-500 text-white shadow-[0_1px_0_0_rgba(168,85,247,0.5)]" // Active State
        : "border-transparent text-gray-400 hover:text-white hover:border-white/10" // Inactive State
    }`;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#0A0A0A]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center gap-8">
        {/* Logo */}
        <a href="/" className="hover:opacity-80 transition-opacity">
          <Logo size="small" />
        </a>

        {/* Search Bar */}
        <form
          onSubmit={handleSearch}
          className="flex-1 max-w-2xl relative group"
        >
          <div className="relative flex items-center w-full h-11 rounded-full bg-white/5 border border-white/10 focus-within:bg-white/10 focus-within:border-purple-500/50 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all">
            <div className="pl-4 text-gray-500 group-focus-within:text-purple-400">
              <SearchCheck size={18} />
            </div>
            <input
              className="w-full h-full bg-transparent border-none outline-none px-3 text-sm text-white placeholder-gray-500"
              value={localQuery}
              onChange={handleQuerySearch}
              placeholder="Search..."
            />
            <button
              type="submit"
              className="pr-4 text-gray-500 hover:text-white transition-colors"
            >
              <SearchIcon size={18} />
            </button>
          </div>
        </form>

        {/* User Profile */}
        <div className="hidden md:flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-linear-to-tr from-purple-500 to-pink-500 ring-2 ring-white/10"></div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 flex gap-6 mt-2">
        <NavLink
          to={`/search?q=${query}`}
          end
          className={({ isActive }) => getTabClass(isActive)}
        >
          All Results
        </NavLink>

        <NavLink
          to={`/search/code?q=${query}`}
          className={({ isActive }) => getTabClass(isActive)}
        >
          Code
        </NavLink>

        {/* Make sure this path matches your Route definition in main.tsx or App.tsx */}
        <NavLink
          to={`/search/ask-ai?q=${query}`}
          className={({ isActive }) => getTabClass(isActive)}
        >
          Ask AI
        </NavLink>
      </div>
    </header>
  );
};

export default Navbar;
