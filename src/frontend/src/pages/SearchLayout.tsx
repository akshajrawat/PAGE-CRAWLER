import { Outlet, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";

const SearchLayout = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-gray-300 font-sans selection:bg-purple-500/30">
      {/* --- HEADER (Sticky & Glass) --- */}
      <Navbar query={query} setSearchParams={setSearchParams} />

      {/* --- MAIN CONTENT --- */}
      <main className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default SearchLayout;
