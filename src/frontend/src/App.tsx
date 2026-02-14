import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import SearchLayout from "./pages/SearchLayout";
import Dashboard from "./pages/Dashboard";
import WebSearch from "./pages/SearchPages/WebSearch";
import CodeSearch from "./pages/SearchPages/CodeSearch";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<SearchLayout />}>
          <Route index element={<WebSearch />} />
          <Route path="code" element={<CodeSearch />} />
          <Route element={<Home />} />
        </Route>
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
