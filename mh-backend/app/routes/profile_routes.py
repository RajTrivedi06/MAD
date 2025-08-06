from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
import openai
import json
import os
from datetime import datetime
from supabase import create_client, Client
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# Pydantic models
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
    force_regenerate: bool = Field(default=False, description="Force regeneration even if summary exists")

class ProfileSummarizeResponse(BaseModel):
    summary: ProfileSummary
    generated_at: str
    cached: bool

# Supabase client factory
def get_supabase_client() -> Client:
    """Get Supabase client instance"""
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_KEY')
    
    if not supabase_url or not supabase_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase configuration missing"
        )
    
    return create_client(supabase_url, supabase_key)

@router.post("/summarize", response_model=ProfileSummarizeResponse)
async def summarize_profile(request: ProfileSummarizeRequest) -> ProfileSummarizeResponse:
    """
    Generate or retrieve AI-powered profile summary.
    Uses OpenAI GPT-4o to analyze DARS and CV data.
    """
    supabase = get_supabase_client()
    
    try:
        # Check if summary exists and not forcing regeneration
        if not request.force_regenerate:
            profile_result = supabase.table('profiles').select('profile_summary').eq('id', request.user_id).single().execute()
            if profile_result.data and profile_result.data.get('profile_summary'):
                logger.info(f"Returning cached profile summary for user {request.user_id}")
                return ProfileSummarizeResponse(
                    summary=ProfileSummary(**profile_result.data['profile_summary']),
                    generated_at=profile_result.data['profile_summary'].get('generated_at', ''),
                    cached=True
                )
        
        # Fetch user's DARS and CV data
        logger.info(f"Fetching profile data for user {request.user_id}")
        profile_data = supabase.table('profiles').select('dars_data, cv_data').eq('id', request.user_id).single().execute()
        
        if not profile_data.data:
            raise HTTPException(status_code=404, detail="Profile not found")
        
        dars_data = profile_data.data.get('dars_data', {})
        cv_data = profile_data.data.get('cv_data', {})
        
        if not dars_data and not cv_data:
            raise HTTPException(
                status_code=400, 
                detail="No DARS or CV data found. Please upload your documents first."
            )
        
        # Generate summary using OpenAI
        logger.info(f"Generating AI summary for user {request.user_id}")
        client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        
        system_prompt = """You are an expert academic advisor creating comprehensive research profiles for students. 
        Analyze the provided DARS (academic records) and CV data to create a structured JSON summary that will be used 
        to match students with research opportunities.
        
        IMPORTANT: Return ONLY valid JSON matching this exact structure (no markdown, no extra text):
        {
            "academic_profile": {
                "major": "extracted major(s) - be specific (e.g., 'Computer Science and Data Science')",
                "expected_graduation": "Month Year format (e.g., 'May 2026')",
                "gpa": numeric_value_with_decimal,
                "academic_standing": "Good Standing/Dean's List/Probation/etc",
                "completed_credits": integer_number,
                "in_progress_credits": integer_number
            },
            "technical_expertise": {
                "programming_languages": {
                    "proficient": ["languages used in multiple projects/courses with strong evidence"],
                    "familiar": ["languages with basic exposure or single use"]
                },
                "frameworks_tools": {
                    "frontend": ["React", "Vue", etc.],
                    "backend": ["Django", "Express", etc.],
                    "data_science": ["NumPy", "Pandas", etc.],
                    "development": ["Git", "Docker", etc.]
                },
                "specialized_skills": ["specific technical competencies demonstrated through projects or coursework"]
            },
            "academic_strengths": {
                "core_competencies": ["5-7 key academic strengths based on coursework performance and patterns"],
                "coursework_highlights": {
                    "advanced_cs": ["list advanced CS courses completed or in progress"],
                    "machine_learning": ["list ML/AI related courses"],
                    "data_science": ["list data science courses"],
                    "interdisciplinary": ["list valuable non-CS courses that add unique perspective"]
                }
            },
            "research_interests": ["5-8 specific research areas inferred from coursework, projects, and experience"],
            "professional_experience": {
                "current_roles": [
                    {
                        "title": "exact position title at company",
                        "focus": "main responsibilities in one sentence",
                        "impact": "key achievement or value added"
                    }
                ],
                "project_highlights": [
                    {
                        "name": "project name",
                        "type": "category (e.g., 'Web Application', 'Research Tool', 'Mobile App')",
                        "technologies": ["specific tech stack used"],
                        "relevance": "why this project demonstrates research potential"
                    }
                ]
            },
            "unique_value_proposition": "2-3 sentence summary highlighting what makes this student uniquely valuable for research positions",
            "ideal_research_areas": ["5-7 specific types of research labs that would be excellent matches based on the complete profile"]
        }
        
        Rules:
        1. Extract GPA from DARS data if available, otherwise estimate based on grades
        2. Infer research interests from combination of advanced coursework, projects, and stated interests
        3. Focus on concrete evidence from the data, not generic statements
        4. For ideal_research_areas, be specific (e.g., "Human-Computer Interaction labs focusing on accessibility" not just "HCI labs")
        5. Ensure all arrays have at least 3 items where specified
        6. Make the unique_value_proposition compelling and specific to this student"""
        
        # Calculate grade statistics from DARS if needed
        dars_courses = dars_data.get('courses', [])
        completed_courses = [c for c in dars_courses if c.get('is_passing', False)]
        in_progress_courses = [c for c in dars_courses if c.get('grade') == 'INP']
        
        completed_credits = sum(c.get('credits', 0) for c in completed_courses)
        in_progress_credits = sum(c.get('credits', 0) for c in in_progress_courses)
        
        user_prompt = f"""Analyze this student's academic and professional profile:

DARS Data (Academic Records):
Total Completed Credits: {completed_credits}
Total In-Progress Credits: {in_progress_credits}
Course Data:
{json.dumps(dars_data, indent=2)}

CV Data (Experience & Skills):
{json.dumps(cv_data, indent=2)}

Create a comprehensive profile summary following the exact JSON structure provided. Focus on:
1. Identifying patterns in coursework that suggest research interests
2. Highlighting technical skills relevant to research
3. Connecting academic performance with potential research areas
4. Emphasizing unique combinations of skills/interests
5. Suggesting specific types of research labs that would be good matches

Remember to return ONLY the JSON object, no markdown formatting."""

        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.3,  # Lower temperature for consistent structure
            max_tokens=2500
        )
        
        # Parse the response
        response_content = response.choices[0].message.content.strip()
        # Remove markdown code blocks if present
        if response_content.startswith("```json"):
            response_content = response_content[7:]
        if response_content.startswith("```"):
            response_content = response_content[3:]
        if response_content.endswith("```"):
            response_content = response_content[:-3]
        
        try:
            summary_json = json.loads(response_content.strip())
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse OpenAI response: {response_content}")
            raise HTTPException(
                status_code=500, 
                detail=f"Failed to parse AI response. Please try again. Error: {str(e)}"
            )
        
        # Add timestamp
        summary_json['generated_at'] = datetime.utcnow().isoformat()
        
        # Validate the response structure
        try:
            validated_summary = ProfileSummary(**summary_json)
        except Exception as e:
            logger.error(f"Invalid summary structure: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"AI generated invalid summary structure. Please try again."
            )
        
        # Save to database
        update_result = supabase.table('profiles').update({
            'profile_summary': summary_json,
            'updated_at': datetime.utcnow().isoformat()
        }).eq('id', request.user_id).execute()
        
        logger.info(f"Successfully generated and saved profile summary for user {request.user_id}")
        
        return ProfileSummarizeResponse(
            summary=validated_summary,
            generated_at=summary_json['generated_at'],
            cached=False
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in profile summarization: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Profile summarization failed: {str(e)}"
        )