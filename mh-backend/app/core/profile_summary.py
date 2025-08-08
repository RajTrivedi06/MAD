# app/services/profile_summary_service.py

import json
import logging
from datetime import datetime, UTC
from typing import Tuple

from supabase import create_client, Client

from app.core.config import get_settings, get_openai
from app.models.schemas import (
    ProfileSummarizeRequest,
    ProfileSummarizeResponse,
    ProfileSummary
)

logger = logging.getLogger(__name__)

class ProfileSummaryService:
    """
    Encapsulates all logic for generating and caching profile summaries.
    """
    def __init__(self):
        settings = get_settings()
        self.supabase: Client = create_client(
            settings["SUPABASE_URL"],
            settings["SUPABASE_SERVICE_ROLE_KEY"]
        )
        self.openai = get_openai()

        # Full system prompt for the AI summarization
        self.system_prompt = """
You are an expert academic advisor creating comprehensive research profiles for students. 
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

    def _fetch_cached(self, user_id: str) -> Tuple[dict, bool]:
        """
        Return (summary_json, True) if a cached summary exists in DB, else (None, False).
        """
        result = (
            self.supabase
                .table('profiles')
                .select('profile_summary')
                .eq('id', user_id)
                .single()
                .execute()
        ).data
        if result and result.get('profile_summary'):
            return result['profile_summary'], True
        return None, False

    def _save_summary(self, user_id: str, summary: dict):
        """Persist the new summary JSON back to Supabase."""
        self.supabase.table('profiles').update({
            'profile_summary': summary,
        'updated_at': datetime.now(UTC).isoformat()
        }).eq('id', user_id).execute()

    def summarize(self, request: ProfileSummarizeRequest) -> ProfileSummarizeResponse:
        # 1) Return cached if exists and not forcing regeneration
        if not request.force_regenerate:
            cached, is_cached = self._fetch_cached(request.user_id)
            if is_cached:
                return ProfileSummarizeResponse(
                    summary=ProfileSummary(**cached),
                    generated_at=cached['generated_at'],
                    cached=True
                )

        # 2) Fetch DARS and CV data
        record = (
            self.supabase
                .table('profiles')
                .select('dars_data, cv_data')
                .eq('id', request.user_id)
                .single()
                .execute()
        ).data or {}
        dars_data = record.get('dars_data', {})
        cv_data   = record.get('cv_data', {})
        if not (dars_data or cv_data):
            raise ValueError("No DARS or CV data found. Upload documents first.")

        # 3) Compute credit stats from DARS
        dars_courses = dars_data.get('courses', [])
        completed = [c for c in dars_courses if c.get('is_passing')]
        in_progress = [c for c in dars_courses if c.get('grade') == 'INP']
        completed_credits = sum(c.get('credits', 0) for c in completed)
        in_progress_credits = sum(c.get('credits', 0) for c in in_progress)

        # 4) Build prompts
        user_prompt = f"""
Analyze this student's profile:

Completed Credits: {completed_credits}
In-Progress Credits: {in_progress_credits}
DARS Data:
{json.dumps(dars_data, indent=2)}

CV Data:
{json.dumps(cv_data, indent=2)}

Generate a profile summary per the system instructions above. Return only the JSON object.
"""

        # 5) Call OpenAI
        resp = self.openai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system",  "content": self.system_prompt},
                {"role": "user",    "content": user_prompt}
            ],
            temperature=0.3,
            max_tokens=2500
        )
        content = resp.choices[0].message.content.strip()
        # strip code fences if any
        for fence in ('```json', '```'):
            content = content.replace(fence, '')
        summary_json = json.loads(content)
        summary_json['generated_at'] = datetime.now(UTC).isoformat()

        # 6) Validate and save
        validated = ProfileSummary(**summary_json)
        self._save_summary(request.user_id, summary_json)
        return ProfileSummarizeResponse(
            summary=validated,
            generated_at=summary_json['generated_at'],
            cached=False
        )
