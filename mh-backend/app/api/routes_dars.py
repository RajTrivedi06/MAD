# app/api/routes_dars.py

import logging
import json
from fastapi.encoders import jsonable_encoder
from typing import Dict, Any, Optional, List
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, HTTPException, status, Form, Depends
from fastapi.responses import JSONResponse
from datetime import datetime, timezone, UTC
from PyPDF2 import PdfReader
from postgrest.exceptions import APIError
from app.core.dars_parser import (
    EnhancedDarsParser,
    validate_certificate_eligibility,
    generate_degree_audit_summary
)
from app.services.supabase_client import supabase  # shared Supabase client
from app.core.auth import get_current_user
from app.core.profile_summary import ProfileSummaryService
from app.models.schemas import ProfileSummarizeRequest

logger = logging.getLogger(__name__)
router = APIRouter(
    prefix="/dars",
    tags=["DARS"],
    dependencies=[Depends(get_current_user)],
)
dars_parser = EnhancedDarsParser()


from typing import Optional
import logging
from postgrest.exceptions import APIError
from app.services.supabase_client import supabase  # your shared client

logger = logging.getLogger(__name__)

def resolve_course_id(course_code: str) -> Optional[int]:
    """
    Try to resolve a course_code => course_id via:
      1) direct lookup in `courses`
      2) fallback via `course_code_variant` -> `course_code_lookup_norm`
    Returns the integer course_id or None if not found.
    """
    # 1) direct lookup
    try:
        res = (
            supabase
            .table("courses")
            .select("course_id")
            .eq("course_code", course_code)
            .maybe_single()
            .execute()
        )
        if res and getattr(res, "data", None):
            # res.data should be {"course_id": ...}
            return res.data.get("course_id")
    except Exception as e:
        logger.debug(f"resolve_course_id direct lookup failed for {course_code}: {e}")

    # 2) variant lookup
    try:
        v = (
            supabase
            .table("course_code_variant")
            .select("variant_id")
            .eq("code", course_code)
            .maybe_single()
            .execute()
        )
        if not getattr(v, "data", None):
            return None

        vid = v.data.get("variant_id")
        if vid is None:
            return None

        n = (
            supabase
            .table("course_code_lookup_norm")
            .select("course_id")
            .eq("variant_id", vid)
            .maybe_single()
            .execute()
        )
        if n and getattr(n, "data", None):
            return n.data.get("course_id")
    except APIError as e:
        # supabase 406 or other PostgREST errors
        logger.debug(f"resolve_course_id variant lookup APIError for {course_code}: {e}")
    except Exception as e:
        logger.debug(f"resolve_course_id variant lookup failed for {course_code}: {e}")

    return None




@router.post("/parse")
async def parse_dars(
    file: UploadFile = File(...),
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user)
) -> Dict[str, Any]:
    # … validation omitted for brevity …
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Must upload a PDF")
    if file.size and file.size > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Max size is 10MB")

    # Extract text via PyPDF2
    try:
        reader = PdfReader(file.file)
        text = "\n".join((page.extract_text() or "") for page in reader.pages)
    except Exception as e:
        logger.error(f"PDF read error: {e}")
        raise HTTPException(status_code=422, detail="Could not read PDF")

    if not text.strip():
        raise HTTPException(status_code=400, detail="No text extracted")

    try:
        reader = PdfReader(file.file)
        text = "\n".join((page.extract_text() or "") for page in reader.pages)

        # 2) parse
        parsed = dars_parser.parse_dars_report(text)
        parsed["file_metadata"] = {
            "filename": file.filename,
            "content_type": file.content_type,
            "file_size": file.size,
        }
        parsed["certificate_eligible"] = validate_certificate_eligibility(parsed)
        parsed["summary"] = generate_degree_audit_summary(parsed)
        # convert everything into pure JSON-friendly stuff
        # 3) normalize courses → IDs
        completed_ids: List[int] = []
        in_progress_ids: List[int] = []

        for c in parsed.get("courses", []):
            code = f"{c.subject} {c.number}"
            cid = resolve_course_id(code)
            if cid is None:
                continue
            if c.grade.upper() == "INP":
                in_progress_ids.append(cid)
            else:
                completed_ids.append(cid)

        # 4) IMPORTANT: JSON‐serialize the ENTIRE parsed dict
        parsed_clean: Dict[str, Any] = json.loads(
            json.dumps(parsed, default=lambda o: getattr(o, "__dict__", str(o)))
        )
        # convert everything into pure JSON-friendly stuff
        json_friendly = jsonable_encoder(parsed)

        response = {
            "success": True,
            "stored_in_profile": False,
        }

        user_id = current_user.id

        if user_id:
            # First clear previous DARS-related fields to support re-uploads (explicit delete then add)
            try:
                supabase.table("profiles").update({
                    "dars_data": None,
                    "completed_course_ids": [],
                    "in_progress_course_ids": [],
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }).eq("id", user_id).execute()
            except Exception as e:
                logger.warning(f"Could not clear previous DARS data for {user_id}: {e}")

            update_data = {
                "dars_data": json_friendly,    # store only primitives
                "completed_course_ids": completed_ids,
                "in_progress_course_ids": in_progress_ids,
                "processing_status": {
                    "dars": "completed",
                    "dars_processed_at": datetime.now(timezone.utc).isoformat()
                },
                "updated_at": datetime.now(timezone.utc).isoformat()
            }

            # preserve existing CV flags
            try:
                existing = (
                    supabase
                    .table("profiles")
                    .select("processing_status")
                    .eq("id", user_id)
                    .single()
                    .execute()
                ).data or {}
                for key in ("cv", "cv_processed_at"):
                    if key in existing.get("processing_status", {}):
                        update_data["processing_status"][key] = existing["processing_status"][key]
                        
            except Exception:
                logger.warning("Could not fetch existing processing_status")

            try:
                supabase.table("profiles").upsert({"id": user_id, **update_data}).execute()
                response["stored_in_profile"] = True
                if response["stored_in_profile"]:
                    # load the updated row
                    profile = supabase.table("profiles")\
                                    .select("dars_data, cv_data, processing_status")\
                                    .eq("id", user_id).single().execute().data
                    if profile.get("dars_data"):
                        ProfileSummaryService().summarize(
                            ProfileSummarizeRequest(user_id=user_id, force_regenerate=True)
                        )
            except Exception as e:
                logger.error(f"DARS upsert failed: {e}")
                response["storage_error"] = str(e)

        return response

    except HTTPException:
        raise
    except ValueError as ve:
        logger.error(f"Validation error: {ve}")
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        logger.exception("💥 Unexpected error in /dars/parse")
        raise HTTPException(status_code=500, detail=str(e))

# (the other endpoints remain unchanged)
@router.post("/parse/text")
async def parse_dars_text(text_content: Dict[str, str]) -> Dict[str, Any]:
    if "text" not in text_content or not text_content["text"].strip():
        raise HTTPException(status_code=400, detail="Must provide non-empty 'text'")
    parsed = dars_parser.parse_dars_report(text_content["text"])
    parsed["certificate_eligible"] = validate_certificate_eligibility(parsed)
    parsed["summary"] = generate_degree_audit_summary(parsed)
    return {"success": True, "dars_data": parsed}


@router.post("/parse/summary")
async def parse_dars_summary_only(file: UploadFile = File(...)) -> Dict[str, Any]:
    full = await parse_dars(file)
    return {
        "student_overview": full["dars_data"]["summary"]["student_overview"],
        "academic_progress": full["dars_data"]["summary"]["academic_progress"],
        "requirements_status": full["dars_data"]["summary"]["requirements_status"],
        "completion_status": full["dars_data"]["completion_status"],
        "certificate_eligible": full["dars_data"]["certificate_eligible"],
        "warnings": full["dars_data"]["parsing_metadata"]["warnings"],
        "file_metadata": full["dars_data"]["file_metadata"],
    }


@router.post("/validate")
async def validate_dars_file(file: UploadFile = File(...)) -> Dict[str, Any]:
    if not file.filename.lower().endswith(".pdf"):
        return {"is_valid": False, "errors": ["File must be a PDF"], "warnings": []}
    text = ""
    with pdfplumber.open(file.file) as pdf:
        for page in pdf.pages:
            text += (page.extract_text() or "") + "\n"
    try:
        dars_parser._validate_dars_format(text)
        return {
            "is_valid": True,
            "errors": [],
            "warnings": [],
            "file_info": {
                "filename": file.filename,
                "size": file.size,
                "pages": len(pdf.pages),
                "text_length": len(text)
            }
        }
    except ValueError as ve:
        return {
            "is_valid": False,
            "errors": [str(ve)],
            "warnings": [],
            "file_info": {"filename": file.filename, "size": file.size}
        }
    except Exception as e:
        return {
            "is_valid": False,
            "errors": [str(e)],
            "warnings": [],
            "file_info": {"filename": file.filename, "size": file.size}
        }


@router.get("/profile/{user_id}")
async def get_user_dars_data(user_id: str) -> Dict[str, Any]:
    record = (
        supabase
        .table("profiles")
        .select("dars_data, processing_status")
        .eq("id", user_id)
        .maybe_single()
        .execute()
    ).data
    if not record:
        raise HTTPException(status_code=404, detail="Profile not found")
    dars_data = record.get("dars_data")
    status_ = record.get("processing_status", {}).get("dars", "not_uploaded")
    return {
        "success": True,
        "dars_data": dars_data,
        "status": status_,
        "processed_at": record.get("processing_status", {}).get("dars_processed_at"),
    }


@router.get("/health")
async def health_check() -> Dict[str, str]:
    return {
        "status": "healthy",
        "service": "DARS Parser API",
        "version": "2.0.0"
    }


@router.delete("/profile/{user_id}")
async def delete_user_dars_data(user_id: str) -> Dict[str, Any]:
    """
    Delete a user's DARS data and related course arrays from their profile.
    """
    try:
        supabase.table("profiles").update({
            "dars_data": None,
            "completed_course_ids": [],
            "in_progress_course_ids": [],
            "processing_status": {"dars": "not_uploaded"},
            "updated_at": datetime.now(UTC).isoformat(),
        }).eq("id", user_id).execute()
        # Trigger summary regeneration since data changed
        ProfileSummaryService().summarize(
            ProfileSummarizeRequest(user_id=user_id, force_regenerate=True)
        )
        return {"success": True, "message": "DARS data deleted successfully", "deleted_at": datetime.now(UTC).isoformat()}
    except Exception as e:
        logger.exception("Error deleting DARS data")
        raise HTTPException(status_code=500, detail="Failed to delete DARS data")