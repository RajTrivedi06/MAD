# app/parsers/cv_parser.py

import re
import pdfplumber
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from datetime import datetime
import logging
from openai import OpenAI
import json
import os

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
    
    def __init__(self, openai_api_key: str):
        self.openai_client = OpenAI(api_key=openai_api_key)
        
        # PII removal patterns
        self.pii_patterns = {
            'email': re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'),
            'phone': re.compile(r'(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})'),
            'address_line': re.compile(r'\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Court|Ct|Way|Circle|Cir)\b', re.IGNORECASE),
            'zip_code': re.compile(r'\b\d{5}(?:-\d{4})?\b'),
            'linkedin': re.compile(r'linkedin\.com/[^\s]+', re.IGNORECASE),
            'github': re.compile(r'github\.com/[^\s]+', re.IGNORECASE),
            'personal_website': re.compile(r'https?://(?:www\.)?[^\s]+\.(?:com|org|net|io|me|dev)[^\s]*', re.IGNORECASE),
            'social_media': re.compile(r'(?:twitter|instagram|facebook|tiktok)\.com/[^\s]+', re.IGNORECASE)
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
                            "relevant_coursework": {
                                "type": "array",
                                "items": {"type": "string"}
                            },
                            "honors": {
                                "type": "array",
                                "items": {"type": "string"}
                            }
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
                            "key_achievements": {
                                "type": "array",
                                "items": {"type": "string"}
                            },
                            "technologies_used": {
                                "type": "array",
                                "items": {"type": "string"}
                            }
                        },
                        "required": ["job_title", "company", "start_date"]
                    }
                },
                "skills": {
                    "type": "object",
                    "properties": {
                        "technical_skills": {
                            "type": "array",
                            "items": {"type": "string"}
                        },
                        "programming_languages": {
                            "type": "array",
                            "items": {"type": "string"}
                        },
                        "frameworks_tools": {
                            "type": "array",
                            "items": {"type": "string"}
                        },
                        "soft_skills": {
                            "type": "array",
                            "items": {"type": "string"}
                        },
                        "languages": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "language": {"type": "string"},
                                    "proficiency": {"type": "string"}
                                }
                            }
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
                            "technologies": {
                                "type": "array",
                                "items": {"type": "string"}
                            },
                            "duration": {"type": ["string", "null"]},
                            "key_features": {
                                "type": "array",
                                "items": {"type": "string"}
                            }
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
                        "volunteer_experience": {
                            "type": "array",
                            "items": {"type": "string"}
                        },
                        "awards": {
                            "type": "array",
                            "items": {"type": "string"}
                        },
                        "publications": {
                            "type": "array",
                            "items": {"type": "string"}
                        }
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
                        logger.warning(f"Failed to extract text from page {page_num}: {str(page_error)}")
                        continue
            
            if not text.strip():
                raise ValueError("No text could be extracted from the PDF")
            
            return text.strip()
            
        except Exception as e:
            logger.error(f"Failed to extract text from PDF: {str(e)}")
            raise ValueError(f"PDF text extraction failed: {str(e)}")

    def remove_pii(self, text: str) -> tuple[str, List[str]]:
        """Remove personally identifiable information from text"""
        cleaned_text = text
        removed_items = []
        
        for pii_type, pattern in self.pii_patterns.items():
            matches = pattern.findall(text)
            if matches:
                removed_items.extend([f"{pii_type}: {len(matches)} items"])
                # Replace with placeholder or remove entirely
                if pii_type in ['email', 'phone']:
                    cleaned_text = pattern.sub(f'[{pii_type.upper()}_REMOVED]', cleaned_text)
                else:
                    cleaned_text = pattern.sub('', cleaned_text)
        
        # Clean up extra whitespace and line breaks
        cleaned_text = re.sub(r'\n\s*\n', '\n\n', cleaned_text)
        cleaned_text = re.sub(r' +', ' ', cleaned_text)
        
        return cleaned_text.strip(), removed_items

    def structure_with_openai(self, cleaned_text: str) -> Dict[str, Any]:
        """Use OpenAI to structure the CV text into JSON format"""
        try:
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

            user_prompt = f"""
            Please parse the following resume text and structure it according to the JSON schema:

            RESUME TEXT:
            {cleaned_text}

            Return the structured data as valid JSON following the schema requirements.
            """

            response = self.openai_client.chat.completions.create(
                model="gpt-4o-mini",  # Using 4o-mini as requested
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={
                    "type": "json_schema",
                    "json_schema": {
                        "name": "cv_structure",
                        "schema": self.cv_schema
                    }
                },
                temperature=0.1  # Low temperature for consistent parsing
            )

            structured_data = json.loads(response.choices[0].message.content)
            
            # Validate the response contains required fields
            required_fields = ["personal_info", "education", "experience", "skills"]
            for field in required_fields:
                if field not in structured_data:
                    logger.warning(f"Missing required field: {field}")
                    structured_data[field] = {} if field == "personal_info" or field == "skills" else []

            return structured_data

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse OpenAI JSON response: {str(e)}")
            raise ValueError("OpenAI returned invalid JSON response")
        except Exception as e:
            logger.error(f"OpenAI API error: {str(e)}")
            raise ValueError(f"Failed to structure CV with OpenAI: {str(e)}")

    def parse_cv(self, pdf_file, filename: str = None) -> CVProcessingResult:
        """
        Main method to parse CV - extracts text, removes PII, and structures data
        
        Args:
            pdf_file: PDF file object
            filename: Optional filename for metadata
            
        Returns:
            CVProcessingResult with all processing stages
        """
        warnings = []
        processing_start = datetime.now()
        
        try:
            # Step 1: Extract text from PDF
            logger.info("Extracting text from CV PDF")
            raw_text = self.extract_text_from_pdf(pdf_file)
            
            if len(raw_text) < 100:
                warnings.append("CV text is unusually short - may be missing content")
            
            # Step 2: Remove PII
            logger.info("Removing PII from CV text")
            cleaned_text, removed_pii = self.remove_pii(raw_text)
            
            if removed_pii:
                warnings.append(f"Removed PII: {', '.join(removed_pii)}")
            
            # Step 3: Structure with OpenAI
            logger.info("Structuring CV data with OpenAI")
            structured_data = self.structure_with_openai(cleaned_text)
            
            # Validate structured data
            if not structured_data.get('personal_info', {}).get('name'):
                warnings.append("Could not extract name from CV")
            
            if not structured_data.get('experience'):
                warnings.append("No work experience found")
            
            processing_end = datetime.now()
            processing_time = (processing_end - processing_start).total_seconds()
            
            metadata = {
                'filename': filename,
                'processing_time_seconds': processing_time,
                'raw_text_length': len(raw_text),
                'cleaned_text_length': len(cleaned_text),
                'pii_removed': removed_pii,
                'processed_at': processing_end.isoformat(),
                'parser_version': '1.0.0'
            }
            
            return CVProcessingResult(
                raw_text=raw_text,
                cleaned_text=cleaned_text,
                structured_data=structured_data,
                processing_metadata=metadata,
                warnings=warnings
            )
            
        except Exception as e:
            logger.error(f"CV parsing failed: {str(e)}")
            raise ValueError(f"CV parsing failed: {str(e)}")

    def validate_cv_data(self, structured_data: Dict[str, Any]) -> List[str]:
        """Validate the structured CV data and return warnings"""
        warnings = []
        
        # Check for essential information
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
        
        # Check for data quality issues
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


# Helper functions for integration
def create_cv_parser() -> CVParser:
    """Create CV parser instance with OpenAI API key from environment"""
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        raise ValueError("OPENAI_API_KEY environment variable not set")
    
    return CVParser(api_key)

def parse_cv_file(pdf_file, filename: str = None) -> CVProcessingResult:
    """Convenience function to parse a CV file"""
    parser = create_cv_parser()
    return parser.parse_cv(pdf_file, filename)