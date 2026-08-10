import os
import json
import logging
import re
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import chromadb
# pyrefly: ignore [missing-import]
from sentence_transformers import SentenceTransformer
from openai import OpenAI

# Configure logging format to clearly show AI microservice events
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("ai_service")

# Auto-load .env file if present
def load_env_file():
    env_paths = [".env", "../.env", os.path.join(os.path.dirname(__file__), "../.env")]
    for path in env_paths:
        if os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            key, val = line.split("=", 1)
                            key = key.strip()
                            val = val.strip().strip("'\"")
                            if key and not os.getenv(key):
                                os.environ[key] = val
                logger.info(f"Loaded environment variables from {path}")
                break
            except Exception as e:
                logger.warning(f"Could not parse {path}: {e}")

load_env_file()

app = FastAPI(title="SmartOps AI & Vector Search Microservice")

# Initialize SentenceTransformer embedding model (BAAI/bge-small-en-v1.5)
logger.info("⏳ Loading BAAI/bge-small-en-v1.5 SentenceTransformer embedding model...")
embedding_model = SentenceTransformer("BAAI/bge-small-en-v1.5")
logger.info("✅ BAAI/bge-small-en-v1.5 model loaded successfully!")

# Initialize ChromaDB Vector Database using Cosine distance space
chroma_client = chromadb.PersistentClient(path="./chroma_db")
collection = chroma_client.get_or_create_collection(
    name="smartops_tasks",
    metadata={"hnsw:space": "cosine"}
)

# Similarity threshold default (can be configured via environment variable)
SIMILARITY_THRESHOLD = float(os.getenv("SIMILARITY_THRESHOLD", "0.60"))

# Environment Variables & LLM API Client Setup
NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY", os.getenv("OPENAI_API_KEY", "")).strip()
NVIDIA_BASE_URL = os.getenv("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1").strip()
NVIDIA_MODEL = os.getenv("NVIDIA_MODEL", "z-ai/glm-5.2").strip()

llm_client = None

if NVIDIA_API_KEY and NVIDIA_API_KEY != "<api-key>":
    try:
        llm_client = OpenAI(
            base_url=NVIDIA_BASE_URL,
            api_key=NVIDIA_API_KEY,
        )
        logger.info(f"✅ [LLM CLIENT INITIALIZED] Connected to base_url='{NVIDIA_BASE_URL}' with model='{NVIDIA_MODEL}'")
    except Exception as e:
        logger.error(f"❌ [LLM INITIALIZATION ERROR] Failed creating OpenAI/NVIDIA client: {e}")
else:
    logger.warning("⚠️ [LLM API KEY MISSING] NVIDIA_API_KEY / OPENAI_API_KEY not found in environment or .env. Set NVIDIA_API_KEY in .env or environment.")


class TaskIndexRequest(BaseModel):
    task_id: int
    title: str
    description: Optional[str] = ""


class BreakdownRequest(BaseModel):
    parent_task_id: int
    title: str
    description: Optional[str] = ""


class SubTaskSuggestion(BaseModel):
    title: str
    description: str
    estimated_effort: str


@app.get("/")
def health_check():
    return {
        "status": "online",
        "service": "SmartOps AI & ChromaDB Microservice",
        "embedding_model": "BAAI/bge-small-en-v1.5",
        "similarity_threshold": SIMILARITY_THRESHOLD,
        "model": NVIDIA_MODEL,
        "llm_client_active": llm_client is not None,
        "api_key_configured": bool(NVIDIA_API_KEY and NVIDIA_API_KEY != "<api-key>")
    }


@app.post("/api/vector/index")
@app.post("/internal/ai/index")
def index_task(req: TaskIndexRequest):
    """Embed title and description separately using BAAI/bge-small-en-v1.5 and upsert into ChromaDB."""
    try:
        ids = []
        embeddings = []
        documents = []
        metadatas = []

        # 1. Title Embedding
        title_emb = embedding_model.encode(req.title, normalize_embeddings=True).tolist()
        ids.append(f"{req.task_id}_title")
        embeddings.append(title_emb)
        documents.append(req.title)
        metadatas.append({"task_id": req.task_id, "field": "title", "title": req.title})

        # 2. Description Embedding (if present and non-empty)
        if req.description and req.description.strip():
            desc_emb = embedding_model.encode(req.description, normalize_embeddings=True).tolist()
            ids.append(f"{req.task_id}_desc")
            embeddings.append(desc_emb)
            documents.append(req.description)
            metadatas.append({"task_id": req.task_id, "field": "description", "title": req.title})

        collection.upsert(
            ids=ids,
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas
        )
        logger.info(f"📌 [CHROMADB BGE INDEX] Task #{req.task_id} ('{req.title}') title and description embedded & indexed separately.")
        return {"status": "success", "task_id": req.task_id, "entries_indexed": len(ids)}
    except Exception as e:
        logger.error(f"❌ [CHROMADB INDEX ERROR] Task #{req.task_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/vector/search")
@app.post("/internal/ai/search")
def search_vector(q: Optional[str] = "", threshold: Optional[float] = None):
    """Semantic Vector Search querying BGE embeddings, deduplicating max(title, desc) score, and filtering by similarity threshold."""
    if not q or not q.strip():
        return {"task_ids": [], "results": []}

    target_threshold = threshold if threshold is not None else SIMILARITY_THRESHOLD

    try:
        query_emb = embedding_model.encode(q, normalize_embeddings=True).tolist()
        
        query_res = collection.query(
            query_embeddings=[query_emb],
            n_results=20,
            include=["metadatas", "distances", "documents"]
        )

        task_scores = {}
        task_details = {}

        if query_res and "ids" in query_res and len(query_res["ids"]) > 0:
            doc_ids = query_res["ids"][0]
            distances = query_res["distances"][0] if "distances" in query_res and query_res["distances"] else [0.0]*len(doc_ids)
            metadatas = query_res["metadatas"][0] if "metadatas" in query_res and query_res["metadatas"] else [{}]*len(doc_ids)

            for doc_id, dist, meta in zip(doc_ids, distances, metadatas):
                task_id = meta.get("task_id")
                if task_id is None:
                    try:
                        task_id = int(str(doc_id).split("_")[0])
                    except (ValueError, IndexError):
                        continue
                else:
                    task_id = int(task_id)

                field = meta.get("field", "title")
                # Cosine distance space in ChromaDB: cosine_similarity = 1.0 - distance
                sim_score = round(1.0 - float(dist), 4)

                if task_id not in task_scores:
                    task_scores[task_id] = sim_score
                    task_details[task_id] = {
                        "task_id": task_id,
                        "title": meta.get("title", ""),
                        "max_score": sim_score,
                        f"{field}_score": sim_score
                    }
                else:
                    # Deduplication logic: max(title emb score, desc emb score)
                    prev_max = task_scores[task_id]
                    new_max = max(prev_max, sim_score)
                    task_scores[task_id] = new_max
                    task_details[task_id]["max_score"] = new_max
                    task_details[task_id][f"{field}_score"] = sim_score

        # Filter by similarity threshold
        filtered_items = [
            info for task_id, info in task_details.items()
            if info["max_score"] >= target_threshold
        ]

        # Sort by max_score descending
        filtered_items.sort(key=lambda x: x["max_score"], reverse=True)

        task_ids = [item["task_id"] for item in filtered_items]

        logger.info(f"🔍 [BGE VECTOR SEARCH] Query: '{q}' (threshold={target_threshold}) -> Matched Task IDs: {task_ids}")
        return {"task_ids": task_ids, "results": filtered_items}
    except Exception as e:
        logger.error(f"❌ [VECTOR SEARCH ERROR] Query '{q}': {e}")
        return {"task_ids": [], "results": []}


@app.post("/api/tasks/breakdown", response_model=List[SubTaskSuggestion])
@app.post("/internal/ai/breakdown", response_model=List[SubTaskSuggestion])
def agentic_breakdown(req: BreakdownRequest):
    """Decompose large feature task into technical sub-tasks matching test.py OpenAI client call pattern."""
    logger.info(f"🤖 [BREAKDOWN REQUEST RECEIVED] Task #{req.parent_task_id}: Title='{req.title}' | Desc='{req.description}'")

    prompt = f"""You are an expert AI software architect. Break down the following high-level software task into N distinct, actionable technical sub-tasks.
Task Title: {req.title}
Task Description: {req.description or 'No extra description.'}

You MUST return strictly a valid JSON array of objects with keys "title", "description", and "estimated_effort".
Example output format:
[
  {{"title": "Database Schema & Migration", "description": "Create table schema and indexes.", "estimated_effort": "2h"}},
  {{"title": "API Handler Implementation", "description": "Build REST endpoint logic.", "estimated_effort": "4h"}},
  {{"title": "Unit & Integration Tests", "description": "Write automated test cases.", "estimated_effort": "2h"}}
]
Do not include any Markdown text or explanation outside the JSON array.
"""

    if llm_client:
        try:
            logger.info(f"⚡ [LLM CALL INITIATING] Dispatching request matching test.py pattern (Model: {NVIDIA_MODEL})...")
            
            response = llm_client.chat.completions.create(
                model=NVIDIA_MODEL,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=1,
                top_p=1,
                max_tokens=1024,
                seed=42,
                stream=False,
            )
            
            raw_response = response.choices[0].message.content.strip()
            logger.info(f"📥 [LLM RESPONSE RECEIVED] Total bytes received: {len(raw_response)}. Raw output:\n{raw_response}")

            # Clean markdown codeblock wrappers if present (e.g. ```json ... ```)
            cleaned_response = re.sub(r"^```(?:json)?", "", raw_response, flags=re.MULTILINE)
            cleaned_response = re.sub(r"```$", "", cleaned_response, flags=re.MULTILINE).strip()

            # Parse JSON output
            subtasks_data = json.loads(cleaned_response)
            
            if isinstance(subtasks_data, list) and len(subtasks_data) > 0:
                result = []
                for item in subtasks_data:
                    result.append(SubTaskSuggestion(
                        title=str(item.get("title", "Sub-task")),
                        description=str(item.get("description", "")),
                        estimated_effort=str(item.get("estimated_effort", "2h"))
                    ))
                logger.info(f"✅ [LLM PARSED SUCCESS] Successfully parsed {len(result)} sub-tasks from LLM response!")
                return result
            else:
                logger.warning("⚠️ [LLM PARSE WARNING] LLM output was not a valid non-empty list. Using fallback.")

        except Exception as e:
            logger.error(f"❌ [LLM FAILED] Error calling LLM model '{NVIDIA_MODEL}': {e}. Triggering fallback generator.")
    else:
        logger.warning(f"⚠️ [LLM BYPASSED] No active LLM client configured (NVIDIA_API_KEY environment variable missing). Using structured fallback generator.")

    # Structured fallback generator when API key is missing or offline
    logger.info(f"🔄 [FALLBACK GENERATOR ACTIVE] Returning default structured sub-tasks for task #{req.parent_task_id}.")
    return [
        SubTaskSuggestion(
            title=f"Technical Spec & Architecture for {req.title}",
            description=f"Define interface contracts and data models for {req.title}.",
            estimated_effort="2h"
        ),
        SubTaskSuggestion(
            title=f"Core Service Implementation for {req.title}",
            description=f"Develop backend handlers and domain logic for {req.title}.",
            estimated_effort="4h"
        ),
        SubTaskSuggestion(
            title=f"Unit Testing & Quality Assurance for {req.title}",
            description=f"Implement automated integration tests and error handling for {req.title}.",
            estimated_effort="2h"
        ),
    ]


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
