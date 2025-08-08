# app/parsers/cv_parser.py

import re
import pdfplumber
import json
import logging
from typing import Dict, Any, List
from dataclasses import dataclass
from datetime import datetime

from app.core.config import get_openai  # centralized config loader

logger = logging.getLogger(__name__)

@dataclass
class CVProcessingResult:
    """Result of CV processing including all stages"""
    raw_text: str
    cleaned_text: str
    structured_data: Dict[str, Any]
    processing_metadata: Dict[str, Any]
    warnings: List[str]

class CVParser:
    """
    CV Parser that extracts text from PDF, removes PII, and structures data using OpenAI
    """
    def __init__(self, openai_client=None):
        # if no client passed in, grab it from config.py
        self.openai_client = openai_client or get_openai()
        
        # PII removal patterns
        self.pii_patterns = {
            'email': re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'),
            'phone': re.compile(r'(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})'),
            'address_line': re.compile(
                r'\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|'
                r'Boulevard|Blvd|Court|Ct|Way|Circle|Cir)\b', re.IGNORECASE
            ),
            'zip_code': re.compile(r'\b\d{5}(?:-\d{4})?\b'),
            'linkedin': re.compile(r'linkedin\.com/[^\s]+', re.IGNORECASE),
            'github': re.compile(r'github\.com/[^\s]+', re.IGNORECASE),
            'personal_website': re.compile(
                r'https?://(?:www\.)?[^\s]+\.(?:com|org|net|io|me|dev)[^\s]*', re.IGNORECASE
            ),
            'social_media': re.compile(
                r'(?:twitter|instagram|facebook|tiktok)\.com/[^\s]+', re.IGNORECASE
            )
        }
        
        # CV Structure Schema for OpenAI
        self.cv_schema = {
            "type": "object",
            "properties": {
                "personal_info": {
                    "type": "object",
                    "properties": {
                        "name": {"type": "string"},
                        "professional_title": {"type": "string"}
                    },
                    "required": ["name"]
                },
                "education": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "institution": {"type": "string"},
                            "degree": {"type": "string"},
                            "field_of_study": {"type": "string"},
                            "graduation_year": {"type": ["string", "null"]},
                            "gpa": {"type": ["string", "null"]},
                            "relevant_coursework": {"type": "array", "items": {"type": "string"}},
                            "honors": {"type": "array", "items": {"type": "string"}}
                        },
                        "required": ["institution", "degree"]
                    }
                },
                "experience": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "job_title": {"type": "string"},
                            "company": {"type": "string"},
                            "location": {"type": ["string", "null"]},
                            "start_date": {"type": "string"},
                            "end_date": {"type": ["string", "null"]},
                            "is_current": {"type": "boolean"},
                            "description": {"type": "string"},
                            "key_achievements": {"type": "array", "items": {"type": "string"}},
                            "technologies_used": {"type": "array", "items": {"type": "string"}}
                        },
                        "required": ["job_title", "company", "start_date"]
                    }
                },
                "skills": {
                    "type": "object",
                    "properties": {
                        "technical_skills": {"type": "array", "items": {"type": "string"}},
                        "programming_languages": {"type": "array", "items": {"type": "string"}},
                        "frameworks_tools": {"type": "array", "items": {"type": "string"}},
                        "soft_skills": {"type": "array", "items": {"type": "string"}},
                        "languages": {
                            "type": "array",
                            "items": {"type": "object", "properties": {"language": {"type": "string"}, "proficiency": {"type": "string"}}}
                        }
                    }
                },
                "projects": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "description": {"type": "string"},
                            "technologies": {"type": "array", "items": {"type": "string"}},
                            "duration": {"type": ["string", "null"]},
                            "key_features": {"type": "array", "items": {"type": "string"}}
                        },
                        "required": ["name", "description"]
                    }
                },
                "certifications": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "issuer": {"type": "string"},
                            "date": {"type": ["string", "null"]},
                            "expiry_date": {"type": ["string", "null"]}
                        },
                        "required": ["name", "issuer"]
                    }
                },
                "additional_info": {
                    "type": "object",
                    "properties": {
                        "volunteer_experience": {"type": "array", "items": {"type": "string"}},
                        "awards": {"type": "array", "items": {"type": "string"}},
                        "publications": {"type": "array", "items": {"type": "string"}}
                    }
                }
            },
            "required": ["personal_info", "education", "experience", "skills"]
        }

    def extract_text_from_pdf(self, pdf_file) -> str:
        """Extract text content from PDF file"""
        try:
            text = ""
            with pdfplumber.open(pdf_file) as pdf:
                if not pdf.pages:
                    raise ValueError("PDF file appears to be empty")
                for page_num, page in enumerate(pdf.pages, 1):
                    try:
                        extracted = page.extract_text()
                        if extracted:
                            text += extracted + "\n"
                            logger.debug(f"Extracted text from page {page_num}")
                        else:
                            logger.warning(f"No text found on page {page_num}")
                    except Exception as page_error:
                        logger.warning(f"Failed to extract text from page {page_num}: {page_error}")
            if not text.strip():
                raise ValueError("No text could be extracted from the PDF")
            return text.strip()
        except Exception as e:
            logger.error(f"Failed to extract text from PDF: {e}")
            raise

    def remove_pii(self, text: str) -> (str, List[str]):
        """Remove personally identifiable information from text"""
        cleaned = text
        removed = []
        for kind, pattern in self.pii_patterns.items():
            matches = pattern.findall(text)
            if matches:
                removed.append(f"{kind}: {len(matches)} items")
                if kind in ('email', 'phone'):
                    cleaned = pattern.sub(f'[{kind.upper()}_REMOVED]', cleaned)
                else:
                    cleaned = pattern.sub('', cleaned)
        cleaned = re.sub(r'\n\s*\n', '\n\n', cleaned)
        cleaned = re.sub(r' +', ' ', cleaned)
        return cleaned.strip(), removed

    def structure_with_openai(self, cleaned_text: str) -> Dict[str, Any]:
        """Use OpenAI to structure the CV text into JSON format"""
        system_prompt = """
You are an expert CV/Resume parser. Your task is to extract structured information from resume text and format it according to the provided JSON schema.

Guidelines:
1. Extract information accurately without making assumptions
2. If information is not present, use null or empty arrays as appropriate
3. For dates, try to standardize format (YYYY-MM or YYYY)
4. Group similar skills together (technical vs soft skills)
5. Extract key achievements and quantifiable results when possible
6. Maintain company names but ignore any contact information
7. Focus on professional and educational information
8. If multiple degrees/jobs, list them chronologically (most recent first)

Be thorough but precise. Only include information that is clearly stated in the resume.
"""
        user_prompt = f"Please parse the following resume text:\n\n{cleaned_text}"
        try:
            response = self.openai_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={
                    "type": "json_schema",
                    "json_schema": {"name": "cv_structure", "schema": self.cv_schema}
                },
                temperature=0.1
            )
            structured = json.loads(response.choices[0].message.content)
            for fld in ("personal_info", "education", "experience", "skills"):
                if fld not in structured:
                    logger.warning(f"Missing {fld}, inserting default")
                    structured[fld] = {} if fld in ("personal_info", "skills") else []
            return structured
        except Exception as e:
            logger.error(f"OpenAI structuring error: {e}")
            raise

    def parse_cv(self, pdf_file, filename: str = None) -> CVProcessingResult:
        """Main method to parse CV - extracts text, removes PII, and structures data"""
        warnings = []
        start_time = datetime.now()
        raw_text = self.extract_text_from_pdf(pdf_file)
        if len(raw_text) < 100:
            warnings.append("CV text is unusually short - may be missing content")
        cleaned_text, removed_pii = self.remove_pii(raw_text)
        if removed_pii:
            warnings.append(f"Removed PII: {', '.join(removed_pii)}")
        structured_data = self.structure_with_openai(cleaned_text)
        if not structured_data.get('personal_info', {}).get('name'):
            warnings.append("Could not extract name from CV")
        if not structured_data.get('experience'):
            warnings.append("No work experience found")
        end_time = datetime.now()
        metadata = {
            'filename': filename,
            'processing_time_seconds': (end_time - start_time).total_seconds(),
            'raw_text_length': len(raw_text),
            'cleaned_text_length': len(cleaned_text),
            'pii_removed': removed_pii,
            'processed_at': end_time.isoformat(),
            'parser_version': '1.0.0'
        }
        return CVProcessingResult(
            raw_text=raw_text,
            cleaned_text=cleaned_text,
            structured_data=structured_data,
            processing_metadata=metadata,
            warnings=warnings
        )

    def validate_cv_data(self, structured_data: Dict[str, Any]) -> List[str]:
        """Validate the structured CV data and return warnings"""
        warnings = []
        personal_info = structured_data.get('personal_info', {})
        if not personal_info.get('name'):
            warnings.append("Missing name in personal information")
        education = structured_data.get('education', [])
        if not education:
            warnings.append("No education information found")
        experience = structured_data.get('experience', [])
        if not experience:
            warnings.append("No work experience found")
        skills = structured_data.get('skills', {})
        if not any(skills.values()):
            warnings.append("No skills information found")
        for edu in education:
            if not edu.get('institution'):
                warnings.append("Education entry missing institution")
            if not edu.get('degree'):
                warnings.append("Education entry missing degree")
        for exp in experience:
            if not exp.get('company'):
                warnings.append("Experience entry missing company")
            if not exp.get('job_title'):
                warnings.append("Experience entry missing job title")
        return warnings


def create_cv_parser() -> CVParser:
    """Helper to instantiate CVParser using centralized OpenAI config"""
    return CVParser()
