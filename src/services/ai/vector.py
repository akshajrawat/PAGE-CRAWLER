from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

# initialize an app
app = FastAPI()

# load ai model
print("Loading AI Model...")
model = SentenceTransformer('all-MiniLM-L6-v2')
print("AI loaded")

# type
class TextRequest(BaseModel):
    text: str

# api endpoint
@app.post("/embed")
async def generate_vector(request: TextRequest):
    # generate vector
    vector = model.encode(request.text)
    # Return it as a simple list of numbers
    return {"embedding": vector.tolist()}


@app.get('/')
async def root():
    return {"status": "Ai service online"}
