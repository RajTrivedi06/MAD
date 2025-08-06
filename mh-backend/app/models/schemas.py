from pydantic import BaseModel
from typing import List, Optional, Literal, Dict, Any

class UploadDocRequest(BaseModel):
    cv_path: str
    dars_paths: List[str]

class Recommendation(BaseModel):
    course_code: str
    title: str
    one_liner: Optional[str] = None

class UserInterest(BaseModel):
    interest_text: str

class RecRequest(BaseModel):
    section: str
    subsection: str
    interest: Optional[str] = None
    mode: Literal["broad", "narrow"] = "broad"
    top_k: int = 8

class SectionGroup(BaseModel):
    lecture: Dict[str, Any]
    discussions: List[Dict[str, Any]]
    labs: List[Dict[str, Any]]

class SectionsResponse(BaseModel):
    course_avg_gpa: Optional[float]
    sections: List[SectionGroup]