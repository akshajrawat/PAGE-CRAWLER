import { Search, SearchCheck } from "lucide-react";
import { Logo } from "../components/Logo";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const onChange = (e: any) => {
    setSearch(e.target.value);
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();

    if (search.trim() === "") {
      return;
    } else {
      navigate(`/search?q=${encodeURIComponent(search)}`);
    }
  };

  return (
    // CONTAINER: Full viewport height, flex centered
    <div className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden font-sans">
      {/* --- BACKGROUND LAYER --- */}
      {/* We use a fixed background with a blur to make the text pop */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center scale-105"
        style={{
          backgroundImage: "url('/home-background.jpg')", // Make sure this image exists in public/
        }}
      ></div>

      {/* --- CONTENT LAYER (z-10 sits above background) --- */}
      <div className="relative z-10 w-full flex flex-col items-center px-6 animate-in fade-in zoom-in duration-700">
        {/* 1. THE LOGO */}
        <div className="mb-12 ">
          <Logo size="large" />
        </div>

        {/* 2. THE SEARCH BAR WRAPPER */}
        <div className="w-full max-w-3xl group">
          <div className="relative flex items-center w-full h-16 md:h-18 rounded-full border bg-white border-black/10 shadow-md ">
            {/* Icon (Left) */}
            <div className="pl-6 md:pl-8 text-black/50 ">
              <SearchCheck
                className="w-6 h-6 md:w-8 md:h-8"
                strokeWidth={2.5}
              />
            </div>

            {/* Input Field */}
            <input
              type="text"
              className="w-full h-full bg-transparent border-none outline-none px-4 md:px-6 text-lg md:text-2xl text-black/50 placeholder-gray-400 font-medium"
              placeholder="Search the universe..."
              value={search}
              onChange={onChange}
              autoFocus
            />

            {/* Action Button (Right) */}
            <button
              onClick={handleSubmit}
              className="mr-2 md:mr-3 p-3 md:p-4 bg-purple-600 rounded-full text-white hover:bg-purple-500 transition-all shadow-lg hover:shadow-purple-500/50 active:scale-95"
            >
              <Search className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
