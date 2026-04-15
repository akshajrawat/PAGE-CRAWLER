import { getVectorEmbeddings, healthCheck } from "../../shared/services/ai";

// DESCRIBE: Group of tests for the "AI Service"
describe("AI Service Integration", () => {
  // TEST 1: The Health Check
  it("should connect to the Python Brain (Health Check)", async () => {
    const isAlive = await healthCheck();

    // ASSERTION: We expect this to be true. If false, the test fails.
    expect(isAlive).toBe(true);
  });

  // TEST 2: The Vector Generation
  it("should generate a vector with 384 dimensions", async () => {
    const text = "Unit Testing is critical for production software.";

    const vector = await getVectorEmbeddings(text);

    // ASSERTION 1: It must be an array
    expect(Array.isArray(vector)).toBe(true);

    // ASSERTION 2: It must have exactly 384 numbers (Model Specific)
    expect(vector?.length).toBe(384);

    // ASSERTION 3: The first number must be a valid float
    expect(typeof vector?.[0]).toBe("number");
  });
});
