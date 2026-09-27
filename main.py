"""
FastAPI wrapper for the Ambedkar RAG pipeline.
Exposes POST /ask so Nalini's backend (or Priya's frontend directly,
in dev) can call retrieval+generation over HTTP instead of importing
query.py directly.

Run:
    uvicorn main:app --reload --port 8000

Test:
    curl -X POST http://localhost:8000/ask \
      -H "Content-Type: application/json" \
      -d '{"question": "what did Ambedkar say about federalism?", "mode": "scholar"}'
"""
import sys
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Literal, Optional

sys.path.insert(0, os.path.dirname(__file__))
from src.query import ask  # reuses the exact same ask() tested in the console

app = FastAPI(title="Ask Ambedkar API", version="0.1.0")

# Wide open for now — tighten to Priya's actual frontend origin before demo/deploy.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class AskRequest(BaseModel):
    question: str = Field(..., min_length=1, description="User's question")
    mode: Literal["student", "scholar", "constitutional"] = "student"
    n_results: int = Field(5, ge=1, le=20)
    corpus: Literal["debates", "writings", "both"] = "both"


class Source(BaseModel):
    date: Optional[str] = None
    volume: Optional[str] = None
    title: Optional[str] = None
    type: Optional[str] = None


class AskResponse(BaseModel):
    answer: str
    mode: str
    sources: list[Source]


@app.get("/")
def health():
    return {"status": "ok", "service": "ask-ambedkar"}


@app.post("/ask", response_model=AskResponse)
def ask_endpoint(req: AskRequest):
    try:
        result = ask(
            question=req.question,
            mode=req.mode,
            n_results=req.n_results,
            corpus=req.corpus,
        )
    except Exception as e:
        # Don't leak internals (API keys, stack traces) to the frontend —
        # log server-side, return a clean 500 to the client.
        print(f"[/ask] error: {e}")
        raise HTTPException(status_code=500, detail="Something went wrong generating the answer.")
    return result