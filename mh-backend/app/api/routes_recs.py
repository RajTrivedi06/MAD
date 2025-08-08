# app/api/routes_recs.py
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
import numpy as np
import ast

from app.core.auth import get_current_user
from app.core.config import get_db_connection, get_openai
from app.models.schemas import RecResponse


router = APIRouter(prefix="/recommend", tags=["recommendations"])


class InterestOnlyRequest(BaseModel):
    interest_text: str = Field(..., description="Freeform user interest text")
    top_k: int = Field(default=10, ge=1, le=50)


@router.post(
    "/interest",
    response_model=List[RecResponse],
)
def recommend_by_interest(
    req: InterestOnlyRequest,
    current_user=Depends(get_current_user)
):
    """
    Compute text-embedding-3-large for the provided interest text and
    return the top_k most similar courses by cosine similarity over
    the courses.embedding_large column.
    """
    interest = (req.interest_text or "").strip()
    if not interest:
        raise HTTPException(status_code=400, detail="interest_text is required")

    # 1) embed the interest with OpenAI
    openai = get_openai()
    emb_resp = openai.embeddings.create(
        model="text-embedding-3-large",
        input=[interest]
    )
    q_emb = np.array(emb_resp.data[0].embedding, dtype=float)

    # 2) pull all course embeddings + ids and minimal metadata
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT course_id, course_code, catalog_number, title, embedding_large
                  FROM courses
                 WHERE embedding_large IS NOT NULL AND last_taught_term = 'Fall 2025';
                """
            )
            rows = cur.fetchall()

        if not rows:
            return []

        course_ids: list[int] = []
        meta: list[tuple[str | None, str | None, str | None]] = []
        embs: list[np.ndarray] = []
        for cid, code, num, title, raw in rows:
            vec = ast.literal_eval(raw) if isinstance(raw, str) else raw
            if not vec:
                continue
            course_ids.append(cid)
            meta.append((code, num, title))
            embs.append(np.array(vec, dtype=float))

        if not embs:
            return []

        M = np.stack(embs)
        # 3) cosine similarity efficiently
        q_norm = np.linalg.norm(q_emb) + 1e-8
        m_norm = np.linalg.norm(M, axis=1) + 1e-8
        sims = (M @ q_emb) / (m_norm * q_norm)

        # 4) top-k indices
        k = max(1, min(req.top_k, len(course_ids)))
        top_idx = np.argsort(-sims)[:k]

        results: list[RecResponse] = []
        for i in top_idx:
            code, num, title = meta[i]
            results.append(
                RecResponse(
                    course_id=course_ids[i],
                    course_code=code,
                    catalog_number=num,
                    title=title,
                    similarity=float(sims[i]),
                )
            )
        return results
    finally:
        try:
            conn.close()
        except Exception:
            pass