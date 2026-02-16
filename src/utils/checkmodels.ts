import { GoogleGenerativeAI } from "@google/generative-ai";
require("dotenv").config();

async function check() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  console.log("Checking available models...");

  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`,
  );
  const data = await response.json();

  console.log("AVAILABLE MODELS:");
  data.models.forEach((m: any) =>
    console.log(`- ${m.name.replace("models/", "")}`),
  );
}

check();
