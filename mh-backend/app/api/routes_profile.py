# app/routes/profile_routes.py

import logging
from fastapi import APIRouter, Depends, HTTPException, status

from app.core.auth import get_current_user
from app.core.profile_summary import ProfileSummaryService
from app.models.schemas import ProfileSummarizeRequest, ProfileSummarizeResponse

logger = logging.getLogger(__name__)

# Secure profile routes with JWT auth
router = APIRouter(
    prefix="/profile",
    tags=["profile"],
    dependencies=[Depends(get_current_user)]
)

# Instantiate our summary service
service = ProfileSummaryService()

@router.post(
    "/summarize",
    response_model=ProfileSummarizeResponse,
    summary="Generate or retrieve AI-powered profile summary"
)
async def summarize_profile(
    request: ProfileSummarizeRequest
) -> ProfileSummarizeResponse:
    """
    Delegate to ProfileSummaryService to generate (or fetch cached) profile summary.

    - If `force_regenerate=False` and a summary exists in the database, returns the cached summary.
    - Otherwise, calls OpenAI to generate a new summary, validates it, saves it, and returns it.
    """
    try:
        return service.summarize(request)
    except ValueError as ve:
        logger.warning(f"Profile summarization validation error: {ve}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Unexpected error in /profile/summarize")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Profile summarization failed"
        )
