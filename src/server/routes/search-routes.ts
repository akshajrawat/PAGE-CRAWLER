import express from "express";
import { searchController } from "../controller/search-controller";
import { codeSearchController } from "../controller/codeSearch-controller";
import { askController } from "../controller/ask-controller";

const router = express.Router();

// define the home page route
router.get("/search", searchController);
router.get("/code-search", codeSearchController);
router.get("/ask", askController);

export default router;
