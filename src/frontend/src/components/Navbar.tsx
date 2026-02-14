import { SearchCheck, SearchIcon } from "lucide-react";
import { Logo } from "./Logo";
import { useState } from "react";
import { NavLink, type SetURLSearchParams } from "react-router-dom";

const Navbar = ({
  query,
  setSearchParams,
}: {
  query: string;
  setSearchParams: SetURLSearchParams;
}) => {
  const [localQuery, setLocalQuery] = useState(query);

  // handle fetching of data
  const handleSearch = (e: any) => {
    e.preventDefault();
    if (localQuery.trim()) {
      setSearchParams({ q: localQuery });
    }
  };

  // Handle the input feild
  const handleQuerySearch = (e: any) => {
    setLocalQuery(e.target.value);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#0A0A0A]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center gap-8">
        {/* Logo (Click to go Home) */}
        <a href="/" className="hover:opacity-80 transition-opacity">
          <Logo size="small" />
        </a>

        {/* Search Bar (Compact) */}
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
            />
            <button
              type="submit"
              className="pr-4 text-gray-500 hover:text-white transition-colors"
            >
              <SearchIcon size={18} />
            </button>
          </div>
        </form>

        {/* User/Profile (Optional Visual) */}
        <div className="hidden md:flex items-center gap-4">
          <div className="w-8 h-8 rounded-full bg-linear-to-tr from-purple-500 to-pink-500 ring-2 ring-white/10"></div>
        </div>
      </div>

      {/* Navigation Tabs (Google Style) */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 flex gap-6 text-sm font-medium text-gray-400">
        <NavLink
          to={`/search?q=${query}`}
          end
          className="pb-3 border-b-2 border-purple-500 text-white"
        >
          All Results
        </NavLink>
        <NavLink
          to={"/"}
          end
          className="pb-3 border-b-2 border-transparent hover:text-white transition-colors"
        >
          Images
        </NavLink>
        <NavLink
          to={"/"}
          end
          className="pb-3 border-b-2 border-transparent hover:text-white transition-colors"
        >
          News
        </NavLink>
        <NavLink
          to={`/search/code?q=${query}`}
          end
          className="pb-3 border-b-2 border-transparent hover:text-white transition-colors"
        >
          Code
        </NavLink>
      </div>
    </header>
  );
};

export default Navbar;
