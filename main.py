import sys
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Literal, Optional
from src.ingest import debates_collection
import json


sys.path.insert(0, os.path.dirname(__file__))
from src.query import ask  # reuses the exact same ask() tested in the console

app = FastAPI(title="Ask Ambedkar API", version="0.1.0")

# Only the frontend origins we actually use. If the kiosk tablet opens the app
# via the laptop's IP, add "http://<laptop-ip>:3000" to this list.
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AskRequest(BaseModel):
    question: str = Field(..., min_length=1, description="User's question")
    mode: Literal["student", "scholar", "constitutional"] = "student"
    n_results: int = Field(5, ge=1, le=20)
    corpus: Literal["debates", "writings", "both"] = "both"
    history: list[dict] = Field(default_factory=list, description="Prior turns: [{'role': 'user'/'assistant', 'content': '...'}]")
    lang: Literal["en", "hi", "mr", "ta"] = "en"


class Source(BaseModel):
    date: Optional[str] = None
    volume: Optional[str] = None
    title: Optional[str] = None
    type: Optional[str] = None
    relevance: Optional[str] = None
    section: Optional[int] = None
    snippet: Optional[str] = None


class AskResponse(BaseModel):
    answer: str
    mode: str
    sources: list[Source]
    lang: str
    cached: Optional[bool] = False


@app.get("/")
def health():
    return {"status": "ok", "service": "ask-ambedkar"}

import hashlib
_cache = {}

def _cache_key(question, mode, corpus, n_results, history=None, lang="en"):
    raw = f"{question.strip().lower()}|{mode}|{corpus}|{n_results}|{history or []}|{lang}"
    return hashlib.md5(raw.encode()).hexdigest()

@app.post("/ask", response_model=AskResponse)
def ask_endpoint(req: AskRequest):
    key = _cache_key(req.question, req.mode, req.corpus, req.n_results, req.history, req.lang)
    if key in _cache:
        cached_result = dict(_cache[key])
        cached_result["cached"] = True
        return cached_result
    try:
        result = ask(question=req.question, mode=req.mode, n_results=req.n_results,
                      corpus=req.corpus, history=req.history, lang=req.lang)
    except Exception as e:
        print(f"[/ask] error: {e}")
        raise HTTPException(status_code=500, detail="Something went wrong generating the answer.")
    result["cached"] = False
    if not result.get("degraded"):
        _cache[key] = result
    return result

@app.get("/timeline")
def timeline():
    from data.debates.interventions import INTERVENTIONS
    sorted_events = sorted(INTERVENTIONS, key=lambda r: r["date"])
    dates = sorted(set(r["date"] for r in INTERVENTIONS))
    return {"dates": dates, "events": sorted_events}

class CompareRequest(BaseModel):
    question: str = Field(..., min_length=1)
    date_a: str = Field(..., description="e.g. 1948-11-04")
    date_b: str = Field(..., description="e.g. 1949-11-25")
    mode: Literal["student", "scholar", "constitutional"] = "student"


class CompareSide(BaseModel):
    date: str
    answer: str
    mode: str
    sources: list[Source]


class CompareResponse(BaseModel):
    a: CompareSide
    b: CompareSide


@app.post("/compare", response_model=CompareResponse)
def compare_endpoint(req: CompareRequest):
    try:
        result_a = ask(f"{req.question} (in the context of {req.date_a})", mode=req.mode)
        result_b = ask(f"{req.question} (in the context of {req.date_b})", mode=req.mode)
    except Exception as e:
        print(f"[/compare] error: {e}")
        raise HTTPException(status_code=500, detail="Something went wrong generating the comparison.")
    return {
        "a": {"date": req.date_a, **result_a},
        "b": {"date": req.date_b, **result_b},
    }

@app.get("/debates-search")
def debates_search(date: str = None, volume: str = None, topic: str = None, limit: int = 20):
    where_clause = {}
    if date and volume:
        where_clause = {"$and": [{"date": date}, {"volume": volume}]}
    elif date:
        where_clause = {"date": date}
    elif volume:
        where_clause = {"volume": volume}

    if where_clause:
        results = debates_collection.get(where=where_clause)
    else:
        results = debates_collection.get()

    rows = list(zip(results["ids"], results["documents"], results["metadatas"]))

    if topic:
        topic_lower = topic.lower()
        rows = [
            r for r in rows
            if topic_lower in (r[2].get("title") or "").lower()
            or topic_lower in r[1].lower()
        ]

    rows = rows[:limit]

    return {
        "results": [
            {
                "id": r[0],
                "title": r[2].get("title"),
                "date": r[2].get("date"),
                "volume": r[2].get("volume"),
                "snippet": (r[1][:300] + "...") if len(r[1]) > 300 else r[1],
            }
            for r in rows
        ]
    }

GRAPH_DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "graph", "knowledge_graph.json")
@app.get("/graph-data")
def graph_data():
    try:
        with open(GRAPH_DATA_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return {"nodes": [], "edges": [], "status": "not yet available"}