from typing import List
from fastapi import APIRouter, Depends, HTTPException
from app.core.config import get_db_connection
from app.core.auth import get_current_user
from app.core.live_section_info import fetch_sections
from app.models.schemas import SectionsResponse

router = APIRouter(prefix="/course", tags=["sections"])

@router.get(
    "/{course_id}/sections",
    response_model=SectionsResponse,
    dependencies=[Depends(get_current_user)]
)
def get_course_sections(
    course_id: str,
    db = Depends(get_db_connection),
):
    """
    Lookup the stored section_url for `course_id`, then fetch and return
    live section data via the Enroll API.
    """
    cur = db.cursor()
    cur.execute(
        "SELECT section_url FROM courses WHERE course_id = %s",
        (course_id,)
    )
    row = cur.fetchone()
    cur.close()
    if not row:
        raise HTTPException(status_code=404, detail="Course not found")

    section_url = row[0]
    parts = section_url.rstrip("/").split("/")
    if len(parts) < 3:
        raise HTTPException(status_code=400, detail="Invalid section URL stored")

    term, subj, cat = parts[-3], parts[-2], parts[-1]
    result = fetch_sections(term, subj, cat)
    if not isinstance(result, dict) or "sections" not in result:
        # sanity check
        raise HTTPException(500, "Unexpected data from section fetcher")

    return SectionsResponse(**result)
