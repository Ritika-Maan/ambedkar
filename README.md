# Ask Ambedkar

An interactive digital museum and retrieval-augmented Q&A system on the life, writings, and constitutional work of Dr. B. R. Ambedkar. Every answer is grounded in primary sources and cited to a Constituent Assembly Debates volume and date.

**Live demo:** https://ambedkar-mu.vercel.app/  
**API:** https://ambedkar-xy6e.onrender.com/docs

> The API runs on a free-tier instance that sleeps when idle. The first request after a period of inactivity can take 40-60 seconds while it wakes up.

---

## Features

- **Cited answers.** Questions are answered from an indexed archive, and each response returns its sources with volume, date, and relevance.
- **Three answer modes.** *Student* (clear explanations), *Scholar* (academic depth), and *Constitutional* (legal analysis).
- **Four languages.** English, Hindi, Marathi, and Tamil.
- **Corpus selection.** Search Constituent Assembly debates, Ambedkar's writings, or both.
- **Compare view.** Ask the same question against two dates to see how a position developed across the debates.
- **Debate search.** Filter interventions by date, volume, or topic.
- **Knowledge graph.** Explore the people, concepts, and themes connected to Ambedkar's work.
- **Timeline and archive.** A curated chronology of his life and a browsable document archive.
- **Constitution reading room.** A page-turning reading view with an embedded assistant.
- **Voice input and read-aloud.** Speech recognition and text-to-speech in the supported languages.

## Architecture

```
┌──────────────────────┐   HTTPS / JSON   ┌───────────────────────────┐
│  museum-frontend     │ ───────────────► │  FastAPI backend          │
│  React + Vite + TS   │                  │  main.py, src/query.py    │
│  (Vercel)            │ ◄─────────────── │  (Render)                 │
└──────────────────────┘                  └────────────┬──────────────┘
                                                       │
                                     ┌─────────────────┴───────────────┐
                                     ▼                                 ▼
                              ChromaDB (persistent)              Groq LLM API
                              debates + writings                 answer generation
                              collections
```

1. A question arrives at `POST /ask` with a mode, language, and corpus.
2. The backend embeds the query and retrieves the closest passages from ChromaDB.
3. The retrieved passages are passed to the LLM with mode-specific instructions.
4. The answer is returned with structured source metadata. Repeat questions are served from an in-memory cache.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS |
| Backend | Python, FastAPI, Pydantic, Uvicorn |
| Vector store | ChromaDB (persistent, default MiniLM embeddings) |
| LLM | Groq API |
| Hosting | Vercel (frontend), Render (backend) |

## Repository structure

```
.
├── main.py                    # FastAPI app and routes
├── src/
│   ├── query.py               # retrieval + answer generation (ask())
│   ├── ingest.py              # ChromaDB client, collections, ingest helpers
│   └── ingest_interventions.py
├── ingest_writings.py         # ingests writings from data/writings/cleaned
├── data/
│   ├── debates/               # curated Constituent Assembly interventions
│   ├── writings/cleaned/      # cleaned text of Ambedkar's writings
│   └── graph/knowledge_graph.json
├── chroma_db/                 # prebuilt vector index (committed)
├── requirements.txt
└── museum-frontend/           # React application
    └── src/
        ├── components/        # Hero, Timeline, Archive, Debates, Compare,
        │                      # KnowledgeGraph, AskPanel, ConstitutionReadingRoom
        └── config.ts          # API base URL
```

## Getting started

### Prerequisites

- Python 3.10+
- Node.js 18+
- A [Groq API key](https://console.groq.com)

### Backend

```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

export GROQ_API_KEY=your_key    # Windows PowerShell: $env:GROQ_API_KEY="your_key"
uvicorn main:app --reload
```

The API is now at `http://127.0.0.1:8000`, with interactive docs at `/docs`.

The repository ships a prebuilt `chroma_db/`, so no ingestion is required to run. To rebuild the index from source, run the ingestion modules in `src/` and `ingest_writings.py` locally, then commit the resulting `chroma_db/`. Embedding on a small instance can exceed 512 MB of RAM, which is why the index is built ahead of time rather than at startup.

### Frontend

```bash
cd museum-frontend
npm install
```

Create `museum-frontend/.env`:

```
VITE_API_BASE=http://127.0.0.1:8000
```

```bash
npm run dev
```

The dev server also proxies `/ask`, `/compare`, `/debates-search`, and `/graph-data` to `localhost:8000`.

## API reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check |
| `POST` | `/ask` | Answer a question with cited sources |
| `POST` | `/compare` | Answer one question in the context of two dates |
| `GET` | `/timeline` | Curated interventions, sorted by date |
| `GET` | `/debates-search` | Filter debates by `date`, `volume`, `topic`, `limit` |
| `GET` | `/graph-data` | Knowledge graph nodes and edges |
| `GET` | `/debug` | Indexed document count |

**Example**

```bash
curl -X POST https://ambedkar-xy6e.onrender.com/ask \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What did Ambedkar say about reservations for SC/ST?",
    "mode": "student",
    "corpus": "both",
    "lang": "en"
  }'
```

**Request fields**

| Field | Type | Default | Notes |
|---|---|---|---|
| `question` | string | required | The user's question |
| `mode` | `student` \| `scholar` \| `constitutional` | `student` | Answer style |
| `corpus` | `debates` \| `writings` \| `both` | `both` | Which sources to search |
| `lang` | `en` \| `hi` \| `mr` \| `ta` | `en` | Response language |
| `n_results` | integer 1-20 | `5` | Passages to retrieve |
| `history` | array | `[]` | Prior turns for follow-up questions |

**Response**

```json
{
  "answer": "...",
  "mode": "student",
  "sources": [
    {
      "date": "1949-08-24",
      "volume": "IX",
      "title": "Reserved Seats for SC/ST",
      "type": "summary",
      "relevance": "high",
      "snippet": "..."
    }
  ],
  "lang": "en",
  "cached": false
}
```

## Deployment

### Backend on Render

| Setting | Value |
|---|---|
| Root directory | *(blank)* |
| Build command | `pip install -r requirements.txt` |
| Start command | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| Environment variable | `GROQ_API_KEY` |

### Frontend on Vercel

| Setting | Value |
|---|---|
| Root directory | `museum-frontend` |
| Build command | `npm run build` |
| Output directory | `dist` |
| Environment variable | `VITE_API_BASE` = your Render URL, no trailing slash |

Vite embeds environment variables at build time, so redeploy after changing `VITE_API_BASE`.

## Limitations

- Answers are generated by a language model over a curated set of summaries and writings. They can be incomplete or imperfect, so verify important claims against the cited primary sources.
- The debates index covers a selected set of Ambedkar's interventions, not the full Constituent Assembly record.
- Hindi, Marathi, and Tamil answers are machine-generated and have not been reviewed by native-speaker scholars.
- The free-tier backend has cold starts and limited memory.

## Author

**Ritika Maan**  
GitHub: [@Ritika-Maan](https://github.com/Ritika-Maan)
**Priya Prakash**
**Shreya Singh**
**Niyati**
**Namya Jain**
**Nalini Bharadwaj**

## License

No license has been specified. All rights reserved by the author.

## Acknowledgements

Primary material drawn from the Constituent Assembly Debates and the published writings and speeches of Dr. B. R. Ambedkar.
