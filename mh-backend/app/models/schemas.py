# app/models/schemas.py

from pydantic import BaseModel, Field
from typing import List, Optional, Literal, Dict, Any, Union

# ----- Document Upload & Recommendation Schemas -----
class UploadDocRequest(BaseModel):
    cv_path: str
    dars_paths: List[str]

class Recommendation(BaseModel):
    course_code: str
    title: str
    one_liner: Optional[str] = None


class MajorPopularityRequest(BaseModel):
    selected_section: str
    college: str
    user_id: Optional[str] = Field(None, description="(Test only) override auth user")

class MajorInterestRequest(BaseModel):
    selected_section: str
    college: str
    interest_text: str
    scope: Literal["broad", "narrow"] = "broad"
    user_id: Optional[str] = Field(None, description="(Test only) override auth user")


class UserInterest(BaseModel):
    interest_text: str

class RecRequest(BaseModel):
    section: str
    subsection: str
    interest: Optional[str] = None
    mode: Literal["broad", "narrow"] = "broad"
    top_k: int = 8
    user_id: Optional[str] = Field(
        None,
        description="(Testing only) override authenticated user ID"
    )
    
class RecResponse(BaseModel):
    course_id: int
    course_code: Optional[str] = None
    catalog_number: Optional[str] = None
    title: Optional[str] = None
    similarity: Optional[float] = None

    class Config:
        orm_mode = True

class SectionGroup(BaseModel):
    lecture: Dict[str, Any]
    discussions: List[Dict[str, Any]]
    labs: List[Dict[str, Any]]

class SectionsResponse(BaseModel):
    course_avg_gpa: Optional[float]
    sections: List[SectionGroup]


# ----- Profile Summarization Schemas -----
class ProfileSummaryAcademicProfile(BaseModel):
    major: str
    expected_graduation: str
    gpa: float
    academic_standing: str
    completed_credits: int
    in_progress_credits: int

class ProgrammingLanguages(BaseModel):
    proficient: List[str]
    familiar: List[str]

class FrameworksTools(BaseModel):
    frontend: List[str]
    backend: List[str]
    data_science: List[str]
    development: List[str]

class TechnicalExpertise(BaseModel):
    programming_languages: ProgrammingLanguages
    frameworks_tools: FrameworksTools
    specialized_skills: List[str]

class CourseworkHighlights(BaseModel):
    advanced_cs: List[str]
    machine_learning: List[str]
    data_science: List[str]
    interdisciplinary: List[str]

class AcademicStrengths(BaseModel):
    core_competencies: List[str]
    coursework_highlights: CourseworkHighlights

class CurrentRole(BaseModel):
    title: str
    focus: str
    impact: str

class ProjectHighlight(BaseModel):
    name: str
    type: str
    technologies: List[str]
    relevance: str

class ProfessionalExperience(BaseModel):
    current_roles: List[CurrentRole]
    project_highlights: List[ProjectHighlight]

class ProfileSummary(BaseModel):
    academic_profile: ProfileSummaryAcademicProfile
    technical_expertise: TechnicalExpertise
    academic_strengths: AcademicStrengths
    research_interests: List[str]
    professional_experience: ProfessionalExperience
    unique_value_proposition: str
    ideal_research_areas: List[str]
    generated_at: Optional[str] = None

class ProfileSummarizeRequest(BaseModel):
    user_id: str = Field(..., description="User ID from Supabase auth")
    force_regenerate: bool = Field(
        default=False,
        description="Force regeneration even if summary exists"
    )

class ProfileSummarizeResponse(BaseModel):
    summary: ProfileSummary
    generated_at: str
    cached: bool
