# app/api/routes_labs.py

from uuid import UUID
from typing import List, Optional, Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.core.recommender_labs import (
    get_interest_embedding,
    get_profile_embedding,
    get_combined_embedding,
    find_lab_matches,
)

router = APIRouter(prefix="/labs", tags=["Labs"])

class LabsRequest(BaseModel):
    user_id: UUID
    interest: Optional[str] = None
    mode: Literal["interest", "profile", "combined"]
    top_n: Optional[int] = 5

class LabMatch(BaseModel):
    lab_id: int
    url: str
    similarity: float

@router.post("/find", response_model=List[LabMatch])
def find_labs(req: LabsRequest):
    try:
        if req.mode == "interest":
            if not req.interest:
                raise HTTPException(400, "`interest` is required for mode='interest'")
            emb = get_interest_embedding(req.interest)

        elif req.mode == "profile":
            emb = get_profile_embedding(req.user_id)

        else:  # combined
            if not req.interest:
                raise HTTPException(400, "`interest` is required for mode='combined'")
            emb = get_combined_embedding(req.interest, req.user_id)

        matches = find_lab_matches(emb, req.top_n or 5)
        return matches

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))
