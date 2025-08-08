from uuid import UUID
from typing import List, Optional, Literal

from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
import requests

# FIX: point to the actual module you keep these in
from app.core.recommender_labs import (
    get_interest_embedding,
    get_profile_embedding,
    get_combined_embedding,
    find_lab_matches,
)
from app.core.auth import get_current_user  # must return object or dict with .id / ["id"]

router = APIRouter(prefix="/labs", tags=["Labs"])

# Legacy endpoint (kept as-is for compatibility)
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

# Clean endpoint the UI uses
class RecommendRequest(BaseModel):
  mode: Optional[Literal["interest", "profile", "combined"]] = None
  user_id: Optional[str] = None        # legacy/testing fallback
  interest: Optional[str] = None
  top_n: Optional[int] = 10
  include_lab_json: Optional[bool] = False

@router.post("/recommend")
def recommend(req: RecommendRequest, user = Depends(get_current_user)):
  # Prefer auth user id from JWT
  auth_user_id = None
  if user:
    auth_user_id = getattr(user, "id", None)
    if not auth_user_id and isinstance(user, dict):
      auth_user_id = user.get("id")
  provided_user_id = (req.user_id or "").strip() or None

  interest_present = bool(req.interest and req.interest.strip())
  user_present = bool(auth_user_id or provided_user_id)

  # Infer mode if omitted
  mode = req.mode
  if mode is None:
    if interest_present and user_present:
      mode = "combined"
    elif interest_present:
      mode = "interest"
    elif user_present:
      mode = "profile"
    else:
      raise HTTPException(400, "Provide at least one of: interest or authenticated user.")

  if mode not in {"interest", "profile", "combined"}:
    raise HTTPException(400, "mode must be 'interest', 'profile', or 'combined'.")

  if mode in {"interest", "combined"} and not interest_present:
    raise HTTPException(400, "interest is required for this mode.")
  if mode in {"profile", "combined"} and not user_present:
    raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Authentication required for this mode.")

  top_n: int = 10 if req.top_n is None else max(1, min(50, req.top_n))

  # Build embedding
  if mode == "interest":
    emb = get_interest_embedding(req.interest.strip())
  elif mode == "profile":
    uid = (auth_user_id or provided_user_id)
    emb = get_profile_embedding(UUID(uid))
  else:  # combined
    uid = (auth_user_id or provided_user_id)
    emb = get_combined_embedding(req.interest.strip(), UUID(uid))

  hits = find_lab_matches(emb, top_n)

  if req.include_lab_json:
    enriched = []
    for h in hits:
      lab_json = None
      try:
        r = requests.get(h["url"], timeout=8)
        r.raise_for_status()
        lab_json = r.json()
      except Exception:
        pass
      enriched.append({**h, "lab": lab_json})
    return enriched

  return hits
