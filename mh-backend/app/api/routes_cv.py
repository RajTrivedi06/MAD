# app/routes/cv_routes.py

import logging
from datetime import datetime
from typing import Dict, Any, Optional

from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from supabase import create_client, Client
from app.core.profile_summary import ProfileSummaryService
from app.models.schemas import ProfileSummarizeRequest, ProfileSummarizeResponse
from app.core.auth import get_current_user
from app.core.config import get_settings
from app.core.cv_parser import create_cv_parser, CVProcessingResult

logger = logging.getLogger(__name__)

# Secure all CV routes with JWT auth
router = APIRouter(
    prefix="/cv",
    tags=["cv"],
    dependencies=[Depends(get_current_user)],
)

def get_supabase_client() -> Client:
    """
    Instantiate Supabase client from centralized settings
    """
    settings = get_settings()
    url = settings.get("SUPABASE_URL")
    key = settings.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        logger.error("Supabase configuration missing")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase configuration missing"
        )
    return create_client(url, key)


@router.post("/parse")
async def parse_cv(
    file: UploadFile = File(...),
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Full CV parse pipeline:
      1) PDF → raw text extraction
      2) Remove PII
      3) Structure via OpenAI
      4) (Optional) Upsert into Supabase profile
    """
    # Validate PDF
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="File must be a PDF")
    if getattr(file, "size", None) and file.size > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File too large (max 10MB)")

    try:
        parser: CVProcessingResult = create_cv_parser()
        result = parser.parse_cv(file.file, file.filename)

        response_data = {
            "success": True,
            "stored_in_profile": False
            }
        
        user_id = current_user.id

        if user_id:
            supabase = get_supabase_client()
            # Clear previous CV-related fields to support re-uploads
            try:
                supabase.table("profiles").update({
                    "cv_data": None,
                    "updated_at": datetime.utcnow().isoformat(),
                }).eq("id", user_id).execute()
            except Exception as e:
                logger.warning(f"Could not clear previous CV data for {user_id}: {e}")

            update_data = {
                "cv_data": result.structured_data,
                "processing_status": {
                    "cv": "completed",
                    "cv_processed_at": datetime.utcnow().isoformat(),
                },
                "updated_at": datetime.utcnow().isoformat(),
            }
            # Preserve existing DARS status
            try:
                rec = supabase.table("profiles")\
                             .select("processing_status")\
                             .eq("id", user_id)\
                             .single().execute().data
                existing = rec.get("processing_status", {}) or {}
                for k in ("dars", "dars_processed_at"):
                    if k in existing:
                        update_data["processing_status"][k] = existing[k]
            except Exception:
                logger.warning("Could not fetch existing profile status; continuing")

            try:
                supabase.table("profiles")\
                        .upsert({"id": user_id, **update_data})\
                        .execute()
                response_data["stored_in_profile"] = True
                if response_data["stored_in_profile"]:
                    # load the updated row
                    profile = supabase.table("profiles")\
                                    .select("dars_data, cv_data, processing_status")\
                                    .eq("id", user_id).single().execute().data
                    if profile.get("dars_data"):
                        ProfileSummaryService().summarize(
                            ProfileSummarizeRequest(user_id=user_id, force_regenerate=True)
                        )
            except Exception as e:
                logger.error(f"CV upsert failed: {e}")
                response_data.update(stored_in_profile=False)

        return response_data

    except ValueError as ve:
        logger.error(f"Validation error: {ve}")
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        logger.exception("Unexpected error in /cv/parse")
        raise HTTPException(status_code=500, detail="CV processing failed")


@router.get("/profile/{user_id}")
async def get_user_cv_data(user_id: str) -> Dict[str, Any]:
    """
    Retrieve a user's stored CV data and processing status.
    """
    try:
        supabase = get_supabase_client()
        res = supabase.table("profiles")\
                     .select("cv_data, processing_status")\
                     .eq("id", user_id)\
                     .single().execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="User profile not found")
        status_info = res.data.get("processing_status", {})
        return {
            "success": True,
            "cv_data": res.data.get("cv_data"),
            "status": status_info.get("cv", "not_uploaded"),
            "processed_at": status_info.get("cv_processed_at"),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error fetching user CV data")
        raise HTTPException(status_code=500, detail="Failed to retrieve CV data")


@router.delete("/profile/{user_id}")
async def delete_user_cv_data(user_id: str) -> Dict[str, Any]:
    """
    Delete a user's CV data from their profile.
    """
    try:
        supabase = get_supabase_client()
        supabase.table("profiles").update({
            "cv_data": None,
            "processing_status": {"cv": "not_uploaded"},
            "updated_at": datetime.utcnow().isoformat(),
        }).eq("id", user_id).execute()
        return {"success": True, "message": "CV data deleted successfully", "deleted_at": datetime.utcnow().isoformat()}
    except Exception as e:
        logger.exception("Error deleting CV data")
        raise HTTPException(status_code=500, detail="Failed to delete CV data")