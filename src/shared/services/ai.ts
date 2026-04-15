import axios from "axios";
import { configDotenv } from "dotenv";

configDotenv();

/**
 * Takes a string and return a list of floating point numbers
 * @param text
 * @returns numbers[] : a list of 384 numbers
 */
export async function getVectorEmbeddings(text: string): Promise<number[]> {
  try {
    // send post request and return reponse
    const response = await axios.post(`${process.env.AI_URL}/embed`, {
      text: text,
    });
    return response.data.embedding;
  } catch (error) {
    console.error("❌ AI SERVICE ERROR: Is the Python server running?");
    throw new Error(
      "Failed to generate embedding. Ensure Python service is active on port 8000.",
    );
  }
}

// simple health check function
export async function healthCheck(): Promise<boolean> {
  try {
    await axios.get(process.env.AI_URL!);
    return true;
  } catch (error) {
    return false;
  }
}
