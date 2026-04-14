import express from "express";
import cors from "cors";
import searchRoutes from "./routes/search-routes";
import dotenv from "dotenv";
import { startRankUpdater } from "../services/cron-jobs/authScoreIncrease";

const app = express();
app.use(cors());
app.use(express.json());
dotenv.config();

const port = process.env.PORT || 3000;

// Start the background cron jobs
startRankUpdater();

// Routes
app.use("/api", searchRoutes);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
