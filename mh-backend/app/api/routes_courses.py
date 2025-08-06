from fastapi import APIRouter

router = APIRouter()

@router.get("/course/{course_id}/graph")
def get_course_graph(course_id: str):
    # Implement prerequisite graph logic
    return {"course_id": course_id, "graph": {"nodes": [], "edges": []}}
