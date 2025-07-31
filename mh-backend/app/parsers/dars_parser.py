# app/parsers/enhanced_dars_parser.py

import re
from datetime import datetime
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from enum import Enum

class RequirementStatus(Enum):
    COMPLETE = "complete"
    INCOMPLETE = "incomplete"
    IN_PROGRESS = "in_progress"
    PLANNED = "planned"

class CourseGrade(Enum):
    A = "A"
    AB = "AB"
    B = "B"
    BC = "BC"
    C = "C"
    D = "D"
    F = "F"
    P = "P"
    S = "S"
    U = "U"
    I = "I"
    INP = "INP"  # In Progress
    T = "T"    # Transfer
    CR = "CR"  # Credit
    N = "N"    # No Credit

@dataclass
class Course:
    term: str
    subject: str
    number: str
    credits: float
    grade: str
    title: str
    is_repeatable: bool = False
    is_duplicate: bool = False
    
    @property
    def full_course_code(self) -> str:
        return f"{self.subject}{self.number}"
    
    @property
    def is_passing_grade(self) -> bool:
        """Check if grade is passing (C or better for most purposes)"""
        passing_grades = {'A', 'AB', 'B', 'BC', 'C', 'P', 'S', 'CR', 'T'}
        return self.grade in passing_grades

@dataclass
class Requirement:
    name: str
    status: RequirementStatus
    credits_needed: float
    credits_earned: float
    credits_in_progress: float
    courses: List[Course]
    sub_requirements: List['Requirement'] = None
    notes: str = ""
    
    @property
    def credits_remaining(self) -> float:
        return max(0, self.credits_needed - self.credits_earned - self.credits_in_progress)
    
    @property
    def completion_percentage(self) -> float:
        if self.credits_needed == 0:
            return 100.0
        return min(100.0, ((self.credits_earned + self.credits_in_progress) / self.credits_needed) * 100)

@dataclass
class StudentInfo:
    name: str
    student_id: str
    catalog_year: str
    program_code: str
    alternate_catalog_year: str = ""
    admit_type: str = ""
    advisors: List[str] = None

@dataclass
class GpaInfo:
    credits_earned: float
    gpa_credits: float
    total_points: float
    gpa: float
    
    def __post_init__(self):
        if self.gpa_credits > 0 and abs(self.gpa - (self.total_points / self.gpa_credits)) > 0.001:
            # Recalculate GPA if there's a mismatch
            self.gpa = round(self.total_points / self.gpa_credits, 3)

class EnhancedDarsParser:
    """Enhanced DARS parser with improved error handling and data validation"""
    
    def __init__(self):
        self.course_pattern = re.compile(
            r'([A-Z]{2}\d{2})\s+([A-Z\s&]+?)(\d{3,4}[A-Z]*)\s+(\d+\.\d+)\s+([A-Z]+)\s*(.*?)(?=\n|$)',
            re.IGNORECASE
        )
        self.requirement_patterns = {
            'complete': re.compile(r'^\s*\+\s*(.+?)(?:satisfied|complete)', re.IGNORECASE | re.MULTILINE),
            'incomplete': re.compile(r'^\s*-\s*(.+?)(?:NEEDS?|not\s+satisfied)', re.IGNORECASE | re.MULTILINE),
            'in_progress': re.compile(r'^\s*IP\+?\s*(.+)', re.IGNORECASE | re.MULTILINE)
        }
    
    def parse_dars_report(self, text: str) -> Dict[str, Any]:
        """Main parsing method that orchestrates the entire parsing process"""
        try:
            self._validate_dars_format(text)
            
            result = {
                'student_info': self._extract_student_info(text),
                'preparation_info': self._extract_preparation_info(text),
                'degree_program': self._extract_degree_program_info(text),
                'gpa_info': self._extract_gpa_info(text),
                'credits_summary': self._extract_credits_summary(text),
                'courses': self._extract_all_courses(text),
                'in_progress_courses': self._extract_in_progress_courses(text),
                'requirements': self._extract_requirements(text),
                'high_school_units': self._extract_high_school_units(text),
                'advanced_standing': self._extract_advanced_standing(text),
                'completion_status': self._determine_completion_status(text),
                'parsing_metadata': {
                    'parsed_at': datetime.now().isoformat(),
                    'parser_version': '2.0.0',
                    'warnings': []
                }
            }
            
            # Add validation warnings
            result['parsing_metadata']['warnings'] = self._validate_parsed_data(result)
            
            return result
            
        except Exception as e:
            raise ValueError(f"Failed to parse DARS report: {str(e)}")
    
    def _validate_dars_format(self, text: str) -> None:
        """Validate that the text is a properly formatted DARS report"""
        if not text.strip():
            raise ValueError("Empty DARS report provided")
        
        # Check for key DARS identifiers
        required_patterns = [
            r'Prepared:\s*\d{2}/\d{2}/\d{2}',
            r'DEGREE AUDIT REPORTING SYSTEM',
            r'DARS'
        ]
        
        for pattern in required_patterns:
            if not re.search(pattern, text, re.IGNORECASE):
                raise ValueError(f"DARS report missing required pattern: {pattern}")
    
    def _extract_student_info(self, text: str) -> StudentInfo:
        """Extract comprehensive student information"""
        # Extract student name (more robust pattern)
        name_match = re.search(r'(\w+),(\w+)', text)
        name = f"{name_match.group(2)} {name_match.group(1)}" if name_match else "Unknown"
        
        # Extract student ID from filename or document
        student_id_match = re.search(r'(\d{10})', text)
        student_id = student_id_match.group(1) if student_id_match else ""
        
        # Extract catalog year
        catalog_year_match = re.search(r'Catalog Year:\s*(\d{4,5})', text)
        catalog_year = catalog_year_match.group(1) if catalog_year_match else ""
        
        # Extract program code
        program_code_match = re.search(r'Program Code:\s*([A-Z0-9]+)', text)
        program_code = program_code_match.group(1) if program_code_match else ""
        
        # Extract alternate catalog year
        alt_catalog_match = re.search(r'Alternate Catalog Year:\s*(\d{4,5})', text)
        alt_catalog_year = alt_catalog_match.group(1) if alt_catalog_match else ""
        
        # Extract admit type
        admit_type_match = re.search(r'Admit Type:\s*([A-Z]+)', text)
        admit_type = admit_type_match.group(1) if admit_type_match else ""
        
        # Extract advisors
        advisors = []
        advisor_section = re.search(r'ADVISORS:(.*?)(?=HS UNITS:|$)', text, re.DOTALL)
        if advisor_section:
            advisor_lines = advisor_section.group(1).strip().split('\n')
            for line in advisor_lines:
                line = line.strip()
                if line and not line.startswith('-'):
                    # Parse "Last,First Middle" format
                    advisors.append(line)
        
        return StudentInfo(
            name=name,
            student_id=student_id,
            catalog_year=catalog_year,
            program_code=program_code,
            alternate_catalog_year=alt_catalog_year,
            admit_type=admit_type,
            advisors=advisors
        )
    
    def _extract_preparation_info(self, text: str) -> Dict[str, str]:
        """Extract report preparation information"""
        prep_match = re.search(r'Prepared:\s*(\d{2}/\d{2}/\d{2})\s*-\s*(\d{2}:\d{2})\s*(\d+)', text)
        
        if prep_match:
            date_str, time_str, report_id = prep_match.groups()
            # Convert to full year (assuming 20xx for years 00-99)
            year = "20" + date_str.split('/')[2]
            full_date = date_str.replace(date_str.split('/')[2], year)
            
            return {
                'date': full_date,
                'time': time_str,
                'report_id': report_id,
                'full_timestamp': f"{full_date} {time_str}"
            }
        
        return {}
    
    def _extract_degree_program_info(self, text: str) -> Dict[str, Any]:
        """Extract degree program information including majors and certificates"""
        programs = {
            'majors': [],
            'certificates': [],
            'minors': [],
            'primary_program': None
        }
        
        # Look for major/certificate declarations
        major_pattern = r'MAJOR:\s*(\d{2}/\d{2}/\d{2})\s*(\d+)\s*(.+)'
        cert_pattern = r'CERTIF:\s*(\d{2}/\d{2}/\d{2})\s*(\d+)\s*(.+)'
        
        for match in re.finditer(major_pattern, text):
            date, code, name = match.groups()
            programs['majors'].append({
                'date_declared': date,
                'code': code,
                'name': name.strip(),
                'type': 'major'
            })
        
        for match in re.finditer(cert_pattern, text):
            date, code, name = match.groups()
            programs['certificates'].append({
                'date_declared': date,
                'code': code,
                'name': name.strip(),
                'type': 'certificate'
            })
        
        # Identify primary program (usually the first or most recent)
        if programs['majors']:
            programs['primary_program'] = programs['majors'][0]
        elif programs['certificates']:
            programs['primary_program'] = programs['certificates'][0]
        
        return programs
    
    def _extract_gpa_info(self, text: str) -> GpaInfo:
        """Extract comprehensive GPA information"""
        # Look for GPA information in the earned credits section
        gpa_pattern = r'(\d+\.\d+)\s+GPA CRED\.\s+EARNED\s+(\d+\.\d+)\s+POINTS\s+(\d+\.\d+)\s+GPA'
        gpa_match = re.search(gpa_pattern, text)
        
        if gpa_match:
            credits_earned = float(gpa_match.group(1))
            total_points = float(gpa_match.group(2))
            gpa = float(gpa_match.group(3))
            
            return GpaInfo(
                credits_earned=credits_earned,
                gpa_credits=credits_earned,  # Assuming all earned credits count toward GPA
                total_points=total_points,
                gpa=gpa
            )
        
        return GpaInfo(0.0, 0.0, 0.0, 0.0)
    
    def _extract_credits_summary(self, text: str) -> Dict[str, float]:
        """Extract credit summary information"""
        summary = {
            'total_earned': 0.0,
            'total_in_progress': 0.0,
            'total_planned': 0.0,
            'advanced_standing': 0.0,
            'residency_credits': 0.0
        }
        
        # Extract earned credits
        earned_match = re.search(r'EARNED:\s*(\d+\.\d+)\s+CREDITS', text)
        if earned_match:
            summary['total_earned'] = float(earned_match.group(1))
        
        # Extract in-progress credits
        in_progress_match = re.search(r'IN-PROGRESS\s+(\d+\.\d+)\s+CREDITS', text)
        if in_progress_match:
            summary['total_in_progress'] = float(in_progress_match.group(1))
        
        # Extract advanced standing credits
        advanced_match = re.search(r'ADVANCED STANDING CREDITS.*?TOTALS\*\*\s+(\d+)\s+(\d+)', text, re.DOTALL)
        if advanced_match:
            summary['advanced_standing'] = float(advanced_match.group(1))
        
        return summary
    
    def _extract_all_courses(self, text: str) -> List[Course]:
        """Extract all courses from the transcript"""
        courses = []
        
        # Pattern to match course lines
        course_pattern = r'([A-Z]{2}\d{2})\s+([A-Z\s&]+?)(\d{3,4}[A-Z]*)\s+(\d+\.\d+)\s+([A-Z]+)\s*(.*?)(?=\n|$)'
        
        for match in re.finditer(course_pattern, text, re.MULTILINE):
            term = match.group(1)
            subject_parts = match.group(2).strip().split()
            course_num = match.group(3)
            credits = float(match.group(4))
            grade = match.group(5)
            title = match.group(6).strip() if match.group(6) else ""
            
            # Reconstruct subject code
            subject = " ".join(subject_parts)
            
            # Check for special course markers
            is_repeatable = '>R' in title
            is_duplicate = '>D' in title
            
            # Clean title of special markers
            title = re.sub(r'>R|>D|>S|>X', '', title).strip()
            
            course = Course(
                term=term,
                subject=subject,
                number=course_num,
                credits=credits,
                grade=grade,
                title=title,
                is_repeatable=is_repeatable,
                is_duplicate=is_duplicate
            )
            
            courses.append(course)
        
        return courses
    
    def _extract_in_progress_courses(self, text: str) -> List[Course]:
        """Extract specifically in-progress courses with term information"""
        in_progress_courses = []
        
        # Find the IN-PROGRESS section
        in_progress_section = re.search(r'IN-PROGRESS courses(.*?)(?=-{5,}|$)', text, re.DOTALL)
        if not in_progress_section:
            return in_progress_courses
        
        section_text = in_progress_section.group(1)
        current_term = None
        
        for line in section_text.split('\n'):
            line = line.strip()
            if not line:
                continue
            
            # Check for term headers
            term_match = re.match(r'IP\s+(.*?)\s+\(([A-Z]{2}\d{2})\)', line)
            if term_match:
                current_term = term_match.group(2)
                continue
            
            # Check for course lines
            course_match = re.match(r'([A-Z]{2}\d{2})\s+([A-Z\s&]+?)(\d{3,4}[A-Z]*)\s+(\d+\.\d+)\s+INP\s*(.*)', line)
            if course_match and current_term:
                subject_parts = course_match.group(2).strip().split()
                subject = " ".join(subject_parts)
                
                course = Course(
                    term=current_term,
                    subject=subject,
                    number=course_match.group(3),
                    credits=float(course_match.group(4)),
                    grade='INP',
                    title=course_match.group(5).strip() if course_match.group(5) else "",
                    is_repeatable='>R' in line,
                    is_duplicate='>D' in line
                )
                
                in_progress_courses.append(course)
        
        return in_progress_courses
    
    def _extract_requirements(self, text: str) -> List[Requirement]:
        """Extract degree requirements with detailed status"""
        requirements = []
        
        # Find requirements sections (could be multiple degree programs)
        req_sections = re.findall(r'(NO|YES)\s+([^\n]+?)\n(.*?)(?=(?:NO|YES)\s+[^\n]+?\n|\*{5,}|$)', text, re.DOTALL)
        
        for completion_status, req_name, req_content in req_sections:
            # Skip if this looks like a course listing rather than requirement
            if any(pattern in req_name.lower() for pattern in ['other courses', 'courses taken']):
                continue
            
            requirement = self._parse_single_requirement(req_name, req_content, completion_status == 'YES')
            if requirement:
                requirements.append(requirement)
        
        return requirements
    
    def _parse_single_requirement(self, req_name: str, req_content: str, is_complete: bool) -> Optional[Requirement]:
        """Parse a single requirement section"""
        try:
            # Extract credit information
            credits_needed = 0.0
            credits_earned = 0.0
            credits_in_progress = 0.0
            
            # Look for credit requirements
            credit_match = re.search(r'(\d+)\s+crs', req_content, re.IGNORECASE)
            if credit_match:
                credits_needed = float(credit_match.group(1))
            
            # Look for earned credits
            earned_match = re.search(r'EARNED:\s*(\d+\.\d+)\s+CREDITS', req_content)
            if earned_match:
                credits_earned = float(earned_match.group(1))
            
            # Look for in-progress credits
            in_progress_match = re.search(r'IN-PROGRESS\s+(\d+\.\d+)\s+CREDITS', req_content)
            if in_progress_match:
                credits_in_progress = float(in_progress_match.group(1))
            
            # Look for remaining credits needed
            needs_match = re.search(r'NEEDS:\s*(\d+\.\d+)\s+CREDITS', req_content)
            if needs_match:
                credits_needed = credits_earned + credits_in_progress + float(needs_match.group(1))
            
            # Extract courses associated with this requirement
            courses = self._extract_courses_from_requirement(req_content)
            
            # Determine status
            if is_complete:
                status = RequirementStatus.COMPLETE
            elif credits_in_progress > 0:
                status = RequirementStatus.IN_PROGRESS
            else:
                status = RequirementStatus.INCOMPLETE
            
            return Requirement(
                name=req_name.strip(),
                status=status,
                credits_needed=credits_needed,
                credits_earned=credits_earned,
                credits_in_progress=credits_in_progress,
                courses=courses,
                notes=self._extract_requirement_notes(req_content)
            )
            
        except Exception as e:
            # Log warning but don't fail parsing
            return None
    
    def _extract_courses_from_requirement(self, req_content: str) -> List[Course]:
        """Extract courses listed within a requirement section"""
        courses = []
        
        # Look for course lines within the requirement
        course_pattern = r'([A-Z]{2}\d{2})\s+([A-Z\s&]+?)(\d{3,4}[A-Z]*)\s+(\d+\.\d+)\s+([A-Z]+)\s*(.*?)(?=\n|$)'
        
        for match in re.finditer(course_pattern, req_content, re.MULTILINE):
            term = match.group(1)
            subject = match.group(2).strip()
            number = match.group(3)
            credits = float(match.group(4))
            grade = match.group(5)
            title = match.group(6).strip() if match.group(6) else ""
            
            course = Course(
                term=term,
                subject=subject,
                number=number,
                credits=credits,
                grade=grade,
                title=title
            )
            courses.append(course)
        
        return courses
    
    def _extract_requirement_notes(self, req_content: str) -> str:
        """Extract any special notes or conditions for a requirement"""
        notes = []
        
        # Look for common note patterns
        note_patterns = [
            r'Complete\s+([^.]+\.)',
            r'Must\s+([^.]+\.)',
            r'Note:\s*([^.]+\.)',
            r'See\s+GUIDE\s+for\s+([^.]+\.)'
        ]
        
        for pattern in note_patterns:
            matches = re.findall(pattern, req_content, re.IGNORECASE)
            notes.extend(matches)
        
        return ' '.join(notes)
    
    def _extract_high_school_units(self, text: str) -> Dict[str, float]:
        """Extract high school unit information"""
        hs_units = {}
        
        hs_section = re.search(r'HS UNITS:(.*?)(?=ADVANCED STANDING|$)', text, re.DOTALL)
        if hs_section:
            content = hs_section.group(1)
            
            # Parse different subject areas
            unit_pattern = r'([A-Z]+):\s*([A-Z\s]+)\s+([\d\.]+)'
            for match in re.finditer(unit_pattern, content):
                subject = match.group(1)
                unit_type = match.group(2).strip()
                units = float(match.group(3))
                
                key = f"{subject}_{unit_type}".replace(' ', '_')
                hs_units[key] = units
        
        return hs_units
    
    def _extract_advanced_standing(self, text: str) -> List[Dict[str, Any]]:
        """Extract advanced standing credit information"""
        advanced_credits = []
        
        advanced_section = re.search(r'ADVANCED STANDING CREDITS(.*?)TOTALS', text, re.DOTALL)
        if advanced_section:
            content = advanced_section.group(1)
            
            # Parse advanced standing entries
            for line in content.split('\n'):
                line = line.strip()
                if not line or line.startswith('DATE'):
                    continue
                
                parts = line.split()
                if len(parts) >= 4:
                    advanced_credits.append({
                        'date': parts[0],
                        'type': parts[1],
                        'degree': parts[2] if len(parts) > 3 else '',
                        'credits': float(parts[-1]) if parts[-1].replace('.', '').isdigit() else 0.0
                    })
        
        return advanced_credits
    
    def _determine_completion_status(self, text: str) -> Dict[str, Any]:
        """Determine overall degree completion status"""
        status = {
            'is_complete': False,
            'requirements_satisfied': False,
            'has_unsatisfied_requirements': False,
            'completion_message': ''
        }
        
        # Check for completion indicators
        if 'AT LEAST ONE REQUIREMENT HAS NOT BEEN SATISFIED' in text:
            status['has_unsatisfied_requirements'] = True
            status['completion_message'] = 'At least one requirement has not been satisfied'
        elif 'ALL REQUIREMENTS COMPLETE' in text:
            status['is_complete'] = True
            status['requirements_satisfied'] = True
            status['completion_message'] = 'All requirements complete'
        
        return status
    
    def _validate_parsed_data(self, data: Dict[str, Any]) -> List[str]:
        """Validate parsed data and return list of warnings"""
        warnings = []
        
        # Check for missing critical information
        if not data['student_info'].name or data['student_info'].name == 'Unknown':
            warnings.append('Student name could not be determined')
        
        if not data['student_info'].student_id:
            warnings.append('Student ID could not be determined')
        
        if not data['degree_program']['majors'] and not data['degree_program']['certificates']:
            warnings.append('No degree programs found')
        
        # Validate GPA calculation
        gpa_info = data['gpa_info']
        if gpa_info.gpa_credits > 0:
            calculated_gpa = gpa_info.total_points / gpa_info.gpa_credits
            if abs(calculated_gpa - gpa_info.gpa) > 0.01:
                warnings.append(f'GPA calculation mismatch: reported {gpa_info.gpa}, calculated {calculated_gpa:.3f}')
        
        # Check for reasonable credit totals
        total_credits = data['credits_summary']['total_earned'] + data['credits_summary']['total_in_progress']
        if total_credits > 200:  # Unusually high for undergraduate
            warnings.append(f'Unusually high total credits: {total_credits}')
        
        return warnings

# Example usage and helper functions
def parse_dars_file(file_path: str) -> Dict[str, Any]:
    """Parse a DARS file and return structured data"""
    parser = EnhancedDarsParser()
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    return parser.parse_dars_report(content)

def validate_certificate_eligibility(parsed_data: Dict[str, Any]) -> bool:
    """Check if student is eligible for certificate programs"""
    # Based on the original parser's logic
    degree_programs = parsed_data['degree_program']
    
    for cert in degree_programs['certificates']:
        if 'Certificate' in cert['name']:
            return False  # Certificates not accepted per original logic
    
    return True

def generate_degree_audit_summary(parsed_data: Dict[str, Any]) -> Dict[str, Any]:
    """Generate a comprehensive summary of the degree audit"""
    summary = {
        'student_overview': {
            'name': parsed_data['student_info'].name,
            'id': parsed_data['student_info'].student_id,
            'primary_program': parsed_data['degree_program']['primary_program']['name'] if parsed_data['degree_program']['primary_program'] else 'Unknown'
        },
        'academic_progress': {
            'total_credits_earned': parsed_data['credits_summary']['total_earned'],
            'total_credits_in_progress': parsed_data['credits_summary']['total_in_progress'],
            'current_gpa': parsed_data['gpa_info'].gpa,
            'completion_percentage': 0.0  # Would need degree requirements to calculate
        },
        'requirements_status': {
            'total_requirements': len(parsed_data['requirements']),
            'completed_requirements': len([r for r in parsed_data['requirements'] if r.status == RequirementStatus.COMPLETE]),
            'in_progress_requirements': len([r for r in parsed_data['requirements'] if r.status == RequirementStatus.IN_PROGRESS]),
            'remaining_requirements': len([r for r in parsed_data['requirements'] if r.status == RequirementStatus.INCOMPLETE])
        },
        'next_steps': [],
        'warnings': parsed_data['parsing_metadata']['warnings']
    }
    
    # Generate next steps based on incomplete requirements
    for req in parsed_data['requirements']:
        if req.status == RequirementStatus.INCOMPLETE and req.credits_remaining > 0:
            summary['next_steps'].append(f"Complete {req.credits_remaining} credits for {req.name}")
    
    return summary