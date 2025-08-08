import logging
import pdfplumber
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
from supabase import create_client, Client

from app.core.config import get_settings, get_db_connection
from app.core.dars_parser import EnhancedDarsParser, validate_certificate_eligibility

logger = logging.getLogger(__name__)

def get_course_id(conn, course_code: str) -> Optional[int]:
    """
    Resolve `course_code` ⇒ `course_id` via:
      1) direct lookup in courses
      2) via course_code_variant ⇒ course_code_lookup_norm
    """
    with conn.cursor() as cur:
        cur.execute(
            "SELECT course_id FROM courses WHERE course_code = %s",
            (course_code,)
        )
        row = cur.fetchone()
        if row:
            return row[0]

        # fallback: variant lookup
        cur.execute(
            "SELECT variant_id FROM course_code_variant WHERE code = %s",
            (course_code,)
        )
        v = cur.fetchone()
        if not v:
            return None

        cur.execute(
            "SELECT course_id FROM course_code_lookup_norm WHERE variant_id = %s",
            (v[0],)
        )
        n = cur.fetchone()
        return n[0] if n else None


class DarsService:
    """
    Encapsulates DARS parsing logic and Supabase storage.
    """
    def __init__(self):
        settings = get_settings()
        self.supabase: Client = create_client(
            settings["SUPABASE_URL"],
            settings["SUPABASE_SERVICE_ROLE_KEY"]
        )
        self.parser = EnhancedDarsParser()

    def parse_and_store(
        self,
        file,
        user_id: Optional[str]
    ) -> Dict[str, Any]:
        # 1) extract text from PDF
        text = ""
        with pdfplumber.open(file.file) as pdf:
            if not pdf.pages:
                raise ValueError("PDF file appears to be empty or corrupted")
            for page in pdf.pages:
                text += (page.extract_text() or "") + "\n"

        # 2) parse
        parsed = self.parser.parse_dars_report(text)

        # 3) attach metadata + eligibility
        parsed["file_metadata"] = {
            "filename": file.filename,
            "content_type": file.content_type,
            "file_size": getattr(file, "size", None),
            "pages_processed": len(pdf.pages),
        }
        parsed["certificate_eligible"] = validate_certificate_eligibility(parsed)

        # 4) normalize course‐codes ⇒ IDs
        conn = get_db_connection()
        completed_ids: List[int] = []
        in_progress_ids: List[int] = []

        for c in parsed.get("courses", []):
            code = f"{c.subject} {c.number}"
            cid = get_course_id(conn, code)
            if cid and c.grade != "INP":
                completed_ids.append(cid)

        for c in parsed.get("in_progress_courses", []):
            code = f"{c.subject} {c.number}"
            cid = get_course_id(conn, code)
            if cid:
                in_progress_ids.append(cid)

        conn.close()

        parsed["completed_course_ids"] = completed_ids
        parsed["in_progress_course_ids"] = in_progress_ids

        result = {"success": True, "dars_data": parsed, "stored_in_profile": False}

        if user_id:
            # 5) upsert the **full** `parsed` into profiles.dars_data
            update_data = {
                "dars_data": parsed,
                "completed_course_ids": completed_ids,
                "in_progress_course_ids": in_progress_ids,
                "processing_status": {
                    "dars": "completed",
                    "dars_processed_at": datetime.now(timezone.utc).isoformat()
                },
                "updated_at": datetime.now(timezone.utc).isoformat()
            }

            # preserve any existing CV status
            try:
                existing = (
                    self.supabase
                        .table("profiles")
                        .select("processing_status")
                        .eq("id", user_id)
                        .single()
                        .execute()
                ).data or {}
                status = existing.get("processing_status", {})
                for key in ("cv", "cv_processed_at"):
                    if key in status:
                        update_data["processing_status"][key] = status[key]
            except Exception:
                logger.warning("Could not fetch existing processing_status")

            # perform upsert
            try:
                self.supabase.table("profiles").upsert(
                    {"id": user_id, **update_data}
                ).execute()
                result["stored_in_profile"] = True
            except Exception as e:
                logger.error(f"DARS upsert failed: {e}")
                result["storage_error"] = str(e)

        return result

    def parse_text(self, text: str) -> Dict[str, Any]:
        """
        Only parse text (no storage).  Returns the raw parse tree + eligibility.
        """
        parsed = self.parser.parse_dars_report(text)
        parsed["certificate_eligible"] = validate_certificate_eligibility(parsed)
        return {"success": True, "dars_data": parsed}

    def get_user_data(self, user_id: str) -> Dict[str, Any]:
        """
        Fetches whatever is in profiles.dars_data.
        """
        record = (
            self.supabase
                .table("profiles")
                .select("dars_data, processing_status")
                .eq("id", user_id)
                .single()
                .execute()
        ).data
        if not record:
            raise KeyError("Profile not found")
        return {
            "success": True,
            "dars_data": record.get("dars_data"),
            "status": record.get("processing_status", {}).get("dars", "unknown"),
            "processed_at": record.get("processing_status", {}).get("dars_processed_at")
        }

    def validate_file(self, file) -> Dict[str, Any]:
        """
        Quickly checks whether a PDF _looks_ like DARS (before storing).
        """
        text = ""
        with pdfplumber.open(file.file) as pdf:
            for page in pdf.pages:
                text += (page.extract_text() or "") + "\n"
        try:
            self.parser._validate_dars_format(text)
            return {"is_valid": True, "errors": [], "warnings": []}
        except ValueError as ve:
            return {"is_valid": False, "errors": [str(ve)], "warnings": []}
