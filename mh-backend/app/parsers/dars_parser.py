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
        return f"{self.subject} {self.number}"
    
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
    # advisors: List[str] = None

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
            r'([A-Z]{2}\d{2})\s+([A-Z\s&]+?)(\d{3,4}[A-Z]*)\s+(\d+\.\d+)\s+([A-Z]+|INP)\s*(.*?)(?=\n|$)',
            re.IGNORECASE
        )
        self.requirement_patterns = {
            'complete': re.compile(r'^\s*OK\s*(.+)', re.IGNORECASE | re.MULTILINE),
            'incomplete': re.compile(r'^\s*NO\s*(.+)', re.IGNORECASE | re.MULTILINE),
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
                'breadth_requirements': self._extract_breadth_requirements(text),
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
            r'DEGREE AUDIT REPORTING SYSTEM|DARS'
        ]
        
        for pattern in required_patterns:
            if not re.search(pattern, text, re.IGNORECASE):
                raise ValueError(f"DARS report missing required pattern: {pattern}")
    
    def _extract_student_info(self, text: str) -> StudentInfo:
        """Extract comprehensive student information"""
        # Extract student name - look for pattern "., [Name]" or "[LastName], [FirstName]" before "Catalog Year"
        name_match = re.search(r'([^,\n]*),\s*([A-Za-z]+)\s+Catalog Year:', text)
        if name_match:
            last_name = name_match.group(1).strip()
            first_name = name_match.group(2).strip()
            
            # Handle cases where last name is just a period or hyphen
            if last_name in ['.', '-']:
                name = first_name  # Only first name
            else:
                name = f"{first_name} {last_name}"  # First Last format
        else:
            name = "Unknown"
        
        # Extract student ID from filename or document
        student_id_match = re.search(r'(\d{10})', text)
        student_id = student_id_match.group(1) if student_id_match else ""
        
        # Extract catalog year
        catalog_year_match = re.search(r'Catalog Year:\s*(\d{4,5})', text)
        catalog_year = catalog_year_match.group(1) if catalog_year_match else ""
        
        # Extract program code
        program_code_match = re.search(r'Program Code:\s*([A-Z0-9\s]+)', text)
        program_code = program_code_match.group(1).strip() if program_code_match else ""
        
        # Extract alternate catalog year
        alt_catalog_match = re.search(r'Alternate Catalog Year:\s*(\d{4,5})', text)
        alt_catalog_year = alt_catalog_match.group(1) if alt_catalog_match else ""
        
        # Extract admit type
        admit_type_match = re.search(r'Admit Type:\s*([A-Z]+)', text)
        admit_type = admit_type_match.group(1) if admit_type_match else ""
        
        # # Extract advisors - look for the actual advisor section in the document
        # advisors = []
        # # Find the Advisors section by looking for the pattern in the left column
        # advisor_section = re.search(r'Advisors:\s*(.*?)(?=HS Units|Language|$)', text, re.DOTALL | re.IGNORECASE)
        # if advisor_section:
        #     advisor_text = advisor_section.group(1).strip()
        #     # Split by newlines and clean up each advisor name
        #     advisor_lines = advisor_text.split('\n')
        #     for line in advisor_lines:
        #         line = line.strip()
        #         # Skip empty lines and lines that don't look like names
        #         if line and not line.startswith('-') and ',' in line:
        #             # Clean up the advisor name (remove extra whitespace)
        #             advisor_name = ' '.join(line.split())
        #             advisors.append(advisor_name)
        
        return StudentInfo(
            name=name,
            student_id=student_id,
            catalog_year=catalog_year,
            program_code=program_code,
            alternate_catalog_year=alt_catalog_year,
            admit_type=admit_type,
            # advisors=advisors
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
            'primary_program': None,
            'degree_type': '',
            'college': ''
        }
        
        # Extract college and degree type from header
        college_match = re.search(r'College of ([^-]+) - (.+)', text)
        if college_match:
            programs['college'] = college_match.group(1).strip()
            programs['degree_type'] = college_match.group(2).strip()
        
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
        """Extract comprehensive GPA information - specifically the University GPA"""
        
        # Look specifically for the University GPA section
        university_gpa_pattern = r'2\.000 University GPA\s+(\d+\.\d+)\s+GPA CRED\.\s+EARNED\s+(\d+\.\d+)\s+POINTS\s+(\d+\.\d+)\s+GPA'
        gpa_match = re.search(university_gpa_pattern, text)
        
        if gpa_match:
            gpa_credits = float(gpa_match.group(1))
            total_points = float(gpa_match.group(2))
            gpa = float(gpa_match.group(3))
            
            return GpaInfo(
                credits_earned=gpa_credits,
                gpa_credits=gpa_credits,
                total_points=total_points,
                gpa=gpa
            )
        
        # Fallback: if the specific pattern isn't found, look for any University GPA mention
        fallback_pattern = r'University GPA.*?(\d+\.\d+)\s+GPA CRED.*?(\d+\.\d+)\s+POINTS\s+(\d+\.\d+)\s+GPA'
        fallback_match = re.search(fallback_pattern, text, re.DOTALL)
        
        if fallback_match:
            gpa_credits = float(fallback_match.group(1))
            total_points = float(fallback_match.group(2))
            gpa = float(fallback_match.group(3))
            
            return GpaInfo(
                credits_earned=gpa_credits,
                gpa_credits=gpa_credits,
                total_points=total_points,
                gpa=gpa
            )
        
        return GpaInfo(0.0, 0.0, 0.0, 0.0)
    
    def _extract_credits_summary(self, text: str) -> Dict[str, float]:
        """Extract credit summary information from Total Credits for the Degree section"""
        summary = {
            'total_earned': 0.0,
            'total_in_progress': 0.0,
            'credits_needed': 0.0,
            'advanced_standing': 0.0,
            'resident_credits': 0.0
        }
        
        # Look for "Total Credits for the Degree" section (can be NO or OK)
        total_credits_section = re.search(r'(NO|OK) Total Credits for the Degree\s+EARNED:\s*(\d+\.\d+)\s+CREDITS\s+IN-PROGRESS\s+(\d+\.\d+)\s+CREDITS(?:\s+-->\s+NEEDS:\s*(\d+\.\d+)\s+CREDITS)?', text, re.DOTALL)
        
        if total_credits_section:
            summary['total_earned'] = float(total_credits_section.group(2))
            summary['total_in_progress'] = float(total_credits_section.group(3))
            if total_credits_section.group(4):
                summary['credits_needed'] = float(total_credits_section.group(4))
        else:
            # Fallback to individual matches
            earned_match = re.search(r'EARNED:\s*(\d+\.\d+)\s+CREDITS', text)
            if earned_match:
                summary['total_earned'] = float(earned_match.group(1))
            
            in_progress_match = re.search(r'IN-PROGRESS\s+(\d+\.\d+)\s+CREDITS', text)
            if in_progress_match:
                summary['total_in_progress'] = float(in_progress_match.group(1))
            
            needs_match = re.search(r'NEEDS:\s*(\d+\.\d+)\s+CREDITS', text)
            if needs_match:
                summary['credits_needed'] = float(needs_match.group(1))
        
        # Extract resident credits
        resident_match = re.search(r'Resident degree credits\s+(\d+\.\d+)\s+CREDITS ADDED', text)
        if resident_match:
            summary['resident_credits'] = float(resident_match.group(1))
        
        # Extract advanced standing credits
        advanced_match = re.search(r'ADVANCED STANDING CREDITS.*?\*\*TOTALS\*\*\s+(\d+)\s+(\d+)', text, re.DOTALL)
        if advanced_match:
            summary['advanced_standing'] = float(advanced_match.group(1))
        
        return summary
    
    def _extract_all_courses(self, text: str) -> List[Course]:
        """Extract all courses from the transcript with improved pattern matching"""
        courses = []
        
        # Updated pattern to better match the DARS format
        # FA22 COMP SCI300 3.00 A Programming II
        course_pattern = r'([A-Z]{2}\d{2})\s+([A-Z\s&]+?)(\d{3,4}[A-Z]*)\s+(\d+\.\d+)\s+([A-Z]+|INP)\s*(.*?)(?=\n|$)'
        
        for match in re.finditer(course_pattern, text, re.MULTILINE):
            term = match.group(1)
            subject_raw = match.group(2).strip()
            course_num = match.group(3)
            credits = float(match.group(4))
            grade = match.group(5)
            title = match.group(6).strip() if match.group(6) else ""
            
            # Clean up subject (remove extra spaces)
            subject = ' '.join(subject_raw.split())
            
            # Check for special course markers in title
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
    
    def _extract_breadth_requirements(self, text: str) -> Dict[str, Any]:
        """Extract breadth requirements with their courses and credit totals"""
        breadth_reqs = {}
        
        # Look for breadth sections
        breadth_patterns = [
            (r'(OK|NO) Breadth in the Degree: Natural Sciences(.*?)(?=-{5,}|OK |NO |$)', 'Natural Sciences'),
            (r'(OK|NO) Breadth in the Degree: Humanities(.*?)(?=-{5,}|OK |NO |$)', 'Humanities'), 
            (r'(OK|NO) Breadth in the Degree: Social Sciences(.*?)(?=-{5,}|OK |NO |$)', 'Social Sciences'),
            (r'OK University General Education: Breadth(.*?)(?=-{5,}|OK |NO |$)', 'General Education Breadth')
        ]
        
        for pattern, breadth_name in breadth_patterns:
            match = re.search(pattern, text, re.DOTALL)
            if match:
                status = match.group(1) if len(match.groups()) > 1 else 'OK'
                content = match.group(2) if len(match.groups()) > 1 else match.group(1)
                
                breadth_info = {
                    'name': breadth_name,
                    'status': 'complete' if status == 'OK' else 'incomplete',
                    'credits_earned': 0.0,
                    'credits_needed': 0.0,
                    'credits_in_progress': 0.0,
                    'sub_categories': {},
                    'courses': []
                }
                
                # Extract earned credits
                earned_match = re.search(r'EARNED:\s*(\d+\.\d+)\s+CREDITS', content)
                if earned_match:
                    breadth_info['credits_earned'] = float(earned_match.group(1))
                
                # Extract needed credits  
                needs_match = re.search(r'NEEDS:\s*(\d+\.\d+)\s+CREDITS', content)
                if needs_match:
                    breadth_info['credits_needed'] = breadth_info['credits_earned'] + float(needs_match.group(1))
                else:
                    breadth_info['credits_needed'] = breadth_info['credits_earned']
                
                # Extract in-progress credits
                in_progress_match = re.search(r'IN-PROGRESS\s+(\d+\.\d+)\s+CREDITS', content)
                if in_progress_match:
                    breadth_info['credits_in_progress'] = float(in_progress_match.group(1))
                
                # Extract sub-categories (like Biological Science, Physical Science)
                sub_category_patterns = [
                    r'\+ (\d+\)) (.+?)(?:\n|\d+\.\d+\s+CREDITS)',
                    r'- (\d+\)) (.+?)(?:\n|\d+\.\d+\s+CREDITS)'
                ]
                
                for sub_pattern in sub_category_patterns:
                    for sub_match in re.finditer(sub_pattern, content):
                        sub_number = sub_match.group(1)
                        sub_name = sub_match.group(2).strip()
                        
                        # Find courses for this sub-category
                        sub_courses = []
                        sub_credits = 0.0
                        
                        # Look for courses after this sub-category
                        sub_section_start = sub_match.end()
                        next_sub_match = re.search(r'[+-] \d+\)', content[sub_section_start:])
                        sub_section_end = sub_section_start + next_sub_match.start() if next_sub_match else len(content)
                        sub_section = content[sub_section_start:sub_section_end]
                        
                        # Extract courses from this sub-section
                        course_pattern = r'([A-Z]{2}\d{2})\s+([A-Z\s&]+?)(\d{3,4}[A-Z]*)\s+(\d+\.\d+)\s+([A-Z]+|INP)\s*(.*?)(?=\n|$)'
                        for course_match in re.finditer(course_pattern, sub_section, re.MULTILINE):
                            term = course_match.group(1)
                            subject_raw = course_match.group(2).strip()
                            subject = ' '.join(subject_raw.split())
                            number = course_match.group(3)
                            credits = float(course_match.group(4))
                            grade = course_match.group(5)
                            title = course_match.group(6).strip() if course_match.group(6) else ""
                            
                            course = Course(
                                term=term,
                                subject=subject,
                                number=number,
                                credits=credits,
                                grade=grade,
                                title=title
                            )
                            sub_courses.append(course)
                            sub_credits += credits
                        
                        breadth_info['sub_categories'][sub_name] = {
                            'courses': sub_courses,
                            'credits': sub_credits,
                            'status': 'complete' if sub_pattern.startswith(r'\+') else 'incomplete'
                        }
                
                # Extract all courses in this breadth requirement
                all_courses = []
                course_pattern = r'([A-Z]{2}\d{2})\s+([A-Z\s&]+?)(\d{3,4}[A-Z]*)\s+(\d+\.\d+)\s+([A-Z]+|INP)\s*(.*?)(?=\n|$)'
                for course_match in re.finditer(course_pattern, content, re.MULTILINE):
                    term = course_match.group(1)
                    subject_raw = course_match.group(2).strip()
                    subject = ' '.join(subject_raw.split())
                    number = course_match.group(3)
                    credits = float(course_match.group(4))
                    grade = course_match.group(5)
                    title = course_match.group(6).strip() if course_match.group(6) else ""
                    
                    course = Course(
                        term=term,
                        subject=subject,
                        number=number,
                        credits=credits,
                        grade=grade,
                        title=title
                    )
                    all_courses.append(course)
                
                breadth_info['courses'] = all_courses
                breadth_reqs[breadth_name.lower().replace(' ', '_')] = breadth_info
        
        return breadth_reqs
    
    def _extract_in_progress_courses(self, text: str) -> List[Course]:
        """Extract specifically in-progress courses with term information"""
        in_progress_courses = []
        
        # Find the specific in-progress section at the top
        in_progress_section = re.search(r'Courses currently in-progress.*?EARNED:\s*(\d+\.\d+)\s+CREDITS\s+IP\s+(.*?)\s+(\d+\.\d+)\s+CREDITS ADDED(.*?)(?=-{5,})', text, re.DOTALL)
        
        if not in_progress_section:
            return in_progress_courses
        
        section_text = in_progress_section.group(4)  # The course listing part
        
        # Extract individual course lines
        course_lines = section_text.strip().split('\n')
        for line in course_lines:
            line = line.strip()
            if not line:
                continue
            
            # Match course format: FA25 COMP SCI544 3.00 INP Intro Big Data Systems
            course_match = re.match(r'([A-Z]{2}\d{2})\s+([A-Z\s&]+?)(\d{3,4}[A-Z]*)\s+(\d+\.\d+)\s+INP\s*(.*)', line)
            if course_match:
                term = course_match.group(1)
                subject_raw = course_match.group(2).strip()
                subject = ' '.join(subject_raw.split())  # Clean up spacing
                number = course_match.group(3)
                credits = float(course_match.group(4))
                title = course_match.group(5).strip() if course_match.group(5) else ""
                
                course = Course(
                    term=term,
                    subject=subject,
                    number=number,
                    credits=credits,
                    grade='INP',
                    title=title,
                    is_repeatable='>R' in line,
                    is_duplicate='>D' in line
                )
                
                in_progress_courses.append(course)
        
        return in_progress_courses
    
    def _extract_requirements(self, text: str) -> List[Requirement]:
        """Extract degree requirements with detailed status based on actual DARS format."""
        requirements = []
        lines = text.split('\n')
        i = 0
        
        while i < len(lines):
            line = lines[i].strip()
            
            # This regex now only matches requirement headers that don't look like sub-requirements
            req_match = re.match(r'^(OK|NO|IP)\s+([A-Za-z].*)', line)
            if req_match:
                status_text = req_match.group(1)
                req_name = req_match.group(2).strip()
                
                # Skip known non-requirement sections
                if any(skip in req_name.lower() for skip in ['courses currently in-progress', 'information for advising', 'legend', 'student please note']):
                    i += 1
                    continue
                
                # --- FIX: Smarter content gathering loop ---
                req_content = []
                i += 1
                while i < len(lines):
                    next_line_stripped = lines[i].strip()
                    # Check if the next line is a new MAIN requirement. A main requirement does NOT start with a numbered list.
                    is_new_main_req = re.match(r'^(OK|NO|IP)\s+', next_line_stripped) and not re.match(r'^(?:[+NO-]|IP\+)\s*\d+\)', next_line_stripped)
                    
                    if is_new_main_req or next_line_stripped.startswith(('-', '*')) and len(next_line_stripped) > 4:
                        break
                        
                    req_content.append(lines[i])
                    i += 1
                
                content_text = '\n'.join(req_content)
                
                requirement = self._parse_requirement_details(
                    req_name, 
                    content_text, 
                    status_text.upper() == 'OK',
                    status_text.upper() == 'IP'
                )
                
                if requirement:
                    requirements.append(requirement)
            else:
                i += 1
        
        return requirements
    
    def _parse_requirement_details(self, req_name: str, req_content: str, is_complete: bool, is_in_progress: bool = False) -> Optional[Requirement]:
        """Parse detailed requirement information from content"""
        try:
            credits_earned = 0.0
            credits_needed = 0.0
            credits_in_progress = 0.0
            
            # Look for specific credit patterns in content
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
                additional_needed = float(needs_match.group(1))
                credits_needed = credits_earned + credits_in_progress + additional_needed
            elif credits_earned > 0:
                # If we have earned credits but no explicit needs, assume requirement is satisfied
                credits_needed = credits_earned + credits_in_progress
            
            # Look for course requirements (like "NEEDS: 1 COURSE")
            course_needs_match = re.search(r'NEEDS:\s*(\d+)\s+COURSE', req_content)
            if course_needs_match:
                courses_needed = int(course_needs_match.group(1))
                # Note this but don't estimate credits since course credits vary
            
            # Look for credit requirements in the format "X credits and Y courses"
            credit_course_match = re.search(r'(\d+)\s+credits?\s+and\s+(\d+)\s+courses?', req_content)
            if credit_course_match and credits_needed == 0:
                credits_needed = float(credit_course_match.group(1))
            
            # Extract available course options and notes
            notes = self._extract_requirement_notes(req_content)
            
            # Extract courses from this requirement
            courses = self._extract_courses_from_requirement(req_content)
            
            # Determine status
            if is_complete:
                status = RequirementStatus.COMPLETE
            elif is_in_progress or credits_in_progress > 0:
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
                notes=notes
            )
            
        except Exception as e:
            # Return None for failed parsing rather than breaking the entire process
            return None
    
    def _extract_courses_from_requirement(self, req_content: str) -> List[Course]:
        """Extract courses listed within a requirement section"""
        courses = []
        
        # Look for course lines within the requirement
        course_pattern = r'([A-Z]{2}\d{2})\s+([A-Z\s&]+?)(\d{3,4}[A-Z]*)\s+(\d+\.\d+)\s+([A-Z]+|INP)\s*(.*?)(?=\n|$)'
        
        for match in re.finditer(course_pattern, req_content, re.MULTILINE):
            term = match.group(1)
            subject_raw = match.group(2).strip()
            subject = ' '.join(subject_raw.split())
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
        """Extract course options and special notes for requirements"""
        notes = []
        
        # Look for course selection options
        select_from_match = re.search(r'SELECT FROM:\s*([^\n]+)', req_content, re.IGNORECASE)
        if select_from_match:
            course_options = select_from_match.group(1).strip()
            notes.append(f"Available courses: {course_options}")
        
        # Look for exclusions
        not_from_match = re.search(r'NOT FROM\s+([^\n]+)', req_content, re.IGNORECASE)
        if not_from_match:
            excluded_courses = not_from_match.group(1).strip()
            notes.append(f"Excluded courses: {excluded_courses}")
        
        # Look for breadth requirements
        breadth_match = re.search(r'COURSES W/\s+\'([^\']+)\'\s+Breadth', req_content, re.IGNORECASE)
        if breadth_match:
            breadth_type = breadth_match.group(1)
            notes.append(f"Must have '{breadth_type}' breadth designation")
        
        # Look for other specific requirements
        requirement_patterns = [
            r'Complete\s+the\s+([^.]+\.)',
            r'Must\s+([^.]+\.)',
            r'Note:\s*([^.]+\.)',
            r'maximum\s+(\d+\s+course[s]?\s+may\s+apply)',
            r'(\d+\s+credits?\s+and\s+\d+\s+courses?)'
        ]
        
        for pattern in requirement_patterns:
            matches = re.findall(pattern, req_content, re.IGNORECASE)
            for match in matches:
                if isinstance(match, str):
                    notes.append(match.strip())
        
        return ' | '.join(notes) if notes else ""
    
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
        
        advanced_section = re.search(r'ADVANCED STANDING CREDITS(.*?)\*\*TOTALS\*\*', text, re.DOTALL)
        if advanced_section:
            content = advanced_section.group(1)
            
            # Parse advanced standing entries
            for line in content.split('\n'):
                line = line.strip()
                if not line or line.startswith('DATE') or line.startswith('**'):
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
            'completion_message': '',
            'graduation_eligible': False
        }
        
        # Check for completion indicators
        if 'AT LEAST ONE REQUIREMENT HAS NOT BEEN SATISFIED' in text:
            status['has_unsatisfied_requirements'] = True
            status['completion_message'] = 'At least one requirement has not been satisfied'
        elif 'ALL REQUIREMENTS COMPLETE' in text:
            status['is_complete'] = True
            status['requirements_satisfied'] = True
            status['completion_message'] = 'All requirements complete'
            status['graduation_eligible'] = True
        
        # Check for graduation readiness messages
        if 'You are nearing the minimum credits to graduate' in text:
            status['completion_message'] = 'Nearing minimum credits to graduate'
        
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

def parse_dars_text(text: str) -> Dict[str, Any]:
    """Parse DARS text content and return structured data"""
    parser = EnhancedDarsParser()
    return parser.parse_dars_report(text)

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
            'primary_program': parsed_data['degree_program']['primary_program']['name'] if parsed_data['degree_program']['primary_program'] else 'Unknown',
            'college': parsed_data['degree_program']['college'],
            'degree_type': parsed_data['degree_program']['degree_type']
        },
        'academic_progress': {
            'total_credits_earned': parsed_data['credits_summary']['total_earned'],
            'total_credits_in_progress': parsed_data['credits_summary']['total_in_progress'],
            'credits_needed_to_graduate': parsed_data['credits_summary']['credits_needed'],
            'current_gpa': parsed_data['gpa_info'].gpa,
            'graduation_status': parsed_data['completion_status']['completion_message']
        },
        'requirements_status': {
            'total_requirements': len(parsed_data['requirements']),
            'completed_requirements': len([r for r in parsed_data['requirements'] if r.status == RequirementStatus.COMPLETE]),
            'in_progress_requirements': len([r for r in parsed_data['requirements'] if r.status == RequirementStatus.IN_PROGRESS]),
            'remaining_requirements': len([r for r in parsed_data['requirements'] if r.status == RequirementStatus.INCOMPLETE])
        },
        'incomplete_requirements': [
            {
                'name': req.name,
                'credits_remaining': req.credits_remaining,
                'notes': req.notes
            }
            for req in parsed_data['requirements'] 
            if req.status == RequirementStatus.INCOMPLETE and req.credits_remaining > 0
        ],
        'warnings': parsed_data['parsing_metadata']['warnings']
    }
    
    return summary