from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.core.auth import get_current_user
from app.core.config import get_db_connection

router = APIRouter(prefix="/courses", tags=["Courses"])

@router.get("/{course_id}/graph")
def get_course_graph(course_id: str):
    # Implement prerequisite graph logic
    return {"course_id": course_id, "graph": {"nodes": [], "edges": []}}


@router.post("/by_ids", dependencies=[Depends(get_current_user)])
def get_courses_by_ids(ids: List[int]):
    if not ids:
        return []
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT course_id, course_code, catalog_number, title, credits,
                       crosslisted, level, college, description, last_taught_term,
                       pre_requisites, learning_outcomes
                  FROM courses
                 WHERE course_id = ANY(%s)
                """,
                (ids,),
            )
            rows = cur.fetchall()
            cols = [d[0] for d in cur.description]
        return [dict(zip(cols, r)) for r in rows]
    finally:
        try:
            conn.close()
        except Exception:
            pass
