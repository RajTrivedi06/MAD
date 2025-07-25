import re
from typing import List, Dict, Set, Optional, Union, Tuple
from dataclasses import dataclass, field
import logging

@dataclass
class Course:
    term: str
    department: str
    number: str
    credits: float
    grade: str
    title: str
    course_id: str
    is_transfer: bool = False
    symbols: List[str] = field(default_factory=list)
    section_context: str = ""  # Which requirement section this course fulfills

@dataclass
class RequirementSection:
    title: str
    status: str  # "OK", "NO", "IP", "COMPLETE", "INCOMPLETE"
    credits_needed: float = 0.0
    credits_earned: float = 0.0
    credits_in_progress: float = 0.0
    subsections: List['RequirementSection'] = field(default_factory=list)
    courses: List[Course] = field(default_factory=list)
    select_from_courses: List[str] = field(default_factory=list)
    additional_info: str = ""
    requirement_type: str = "general"  # "general_ed", "major", "minor", "certificate", "degree"

class UniversalDARSParser:
    def __init__(self):
        # Common grade patterns across universities
        self.completed_grades = {
            "A", "A+", "A-", "AB", "B", "B+", "B-", "BC", "C", "C+", "C-", 
            "CD", "D", "D+", "D-", "F", "CR", "T", "S", "SD", "P", "PASS"
        }
        self.in_progress_grades = {"INP", "IP", "P", "TI", "PROG", "CURRENT"}
        self.planned_grades = {"PL", "PLAN", "PLANNED", "REG", "REGISTERED"}
        self.transfer_grades = {"T", "TI", "TR", "TRAN", "TRANSFER"}
        
        # Common course symbols across different universities
        self.course_symbols = {
            ">D", ">R", ">S", ">X", "(R)", "(X)", "*", "^", "†", "‡", 
            "REQ", "OPT", "CORE", "ELEC"
        }
        
        # Common status indicators
        self.status_indicators = {
            "complete": ["OK", "COMPLETE", "SATISFIED", "MET", "+", "✓"],
            "incomplete": ["NO", "INCOMPLETE", "NOT MET", "NEEDED", "-", "✗"],
            "in_progress": ["IP", "IN-PROGRESS", "CURRENT", "PENDING"]
        }
        
        # Common requirement section patterns
        self.section_patterns = {
            "general_ed": [
                "general education", "gen ed", "core curriculum", "university requirements",
                "breadth", "distribution", "liberal arts", "foundation"
            ],
            "major": [
                "major", "concentration", "specialization", "program requirements"
            ],
            "minor": ["minor", "secondary"],
            "certificate": ["certificate", "cert"],
            "degree": [
                "degree requirements", "graduation requirements", "total credits",
                "residence", "quality of work", "gpa"
            ]
        }

        # Keywords that indicate legend/documentation sections to ignore
        self.legend_keywords = {
            "requirement not complete",
            "requirement uses in",
            "sub-requirement not complete", 
            "sub-requirement uses in",
            "optional sub-requirement",
            "dars is the document",
            "to be eligible for your degree",
            "confirms completion",
            "grade symbols",
            "course symbols", 
            "requirement/sub-requirement information",
            "exception symbols",
            "student please note",
            "memoranda",
            "legend",
            "end of analysis",
            "** course symbols **",
            "** grade symbols **",
            "** requirement/sub-requirement information **",
            "** exception symbols **"
        }

    def is_legend_section(self, title: str, content: str = "") -> bool:
        """Check if this is a legend/documentation section that should be ignored"""
        title_lower = title.lower().strip()
        content_lower = content.lower() if content else ""
        
        # Check for exact matches or partial matches with legend keywords
        for keyword in self.legend_keywords:
            if keyword in title_lower or keyword in content_lower[:100]:
                return True
        
        # Check for very short titles that are likely symbols/explanations
        if len(title_lower) < 5 and not any(char.isalnum() for char in title_lower):
            return True
            
        # Check for titles that are just symbols or status indicators
        if title_lower in ["=", "-", "+", "*", "ok", "no", "ip"]:
            return True
            
        # Check for titles that start with just symbols
        if re.match(r'^[=\-\+\*\s]{1,3}[^a-zA-Z]*$', title):
            return True
            
        return False

    def normalize_status(self, status_text: str) -> str:
        """Convert various status indicators to standard format"""
        status_text = status_text.upper().strip()
        
        for standard, variants in self.status_indicators.items():
            if any(variant.upper() in status_text for variant in variants):
                return standard.upper()
        
        return "UNKNOWN"

    def identify_requirement_type(self, title: str) -> str:
        """Identify what type of requirement this section represents"""
        title_lower = title.lower()
        
        for req_type, keywords in self.section_patterns.items():
            if any(keyword in title_lower for keyword in keywords):
                return req_type
        
        return "general"

    def extract_course_patterns(self, text: str) -> List[Dict]:
        """Extract courses using multiple flexible patterns"""
        courses = []
        
        # Pattern 1: Full format with term (most common)
        # Examples: FA22 COMP SCI 200 3.00 A Programming I
        pattern1 = re.compile(
            r'(FA|SP|SU|FALL|SPRING|SUMMER|WIN|WINTER)[\s]*(\d{2,4})\s+'
            r'([A-Z][A-Z\s&\-/]*?)\s*(\d{3,4}[A-Z]?)\s+'
            r'(\d+\.\d+)\s+([A-Z+\-]{1,4})\s+(.*?)(?=\n|$)', 
            re.IGNORECASE | re.MULTILINE
        )
        
        # Pattern 2: Without year (transfer courses, etc.)
        # Examples: MATH 221 5.00 T Calculus
        pattern2 = re.compile(
            r'^([A-Z][A-Z\s&\-/]*?)\s*(\d{3,4}[A-Z]?)\s+'
            r'(\d+\.\d+)\s+([A-Z+\-]{1,4})\s+(.*?)(?=\n|$)', 
            re.IGNORECASE | re.MULTILINE
        )
        
        # Pattern 3: Alternative term formats
        # Examples: 2022 Fall MATH 101 3.0 A Algebra
        pattern3 = re.compile(
            r'(\d{4})\s+(FALL|SPRING|SUMMER|WINTER)\s+'
            r'([A-Z][A-Z\s&\-/]*?)\s*(\d{3,4}[A-Z]?)\s+'
            r'(\d+\.\d+)\s+([A-Z+\-]{1,4})\s+(.*?)(?=\n|$)', 
            re.IGNORECASE | re.MULTILINE
        )
        
        patterns = [
            (pattern1, lambda m: (f"{m.group(1).upper()}{m.group(2)[-2:]}", m.group(3), m.group(4), m.group(5), m.group(6), m.group(7))),
            (pattern2, lambda m: ("UNKNOWN", m.group(1), m.group(2), m.group(3), m.group(4), m.group(5))),
            (pattern3, lambda m: (f"{m.group(2).upper()[:2]}{m.group(1)[-2:]}", m.group(3), m.group(4), m.group(5), m.group(6), m.group(7)))
        ]
        
        for pattern, extractor in patterns:
            matches = pattern.findall(text)
            for match_groups in matches:
                try:
                    if isinstance(match_groups, tuple):
                        # Handle findall returning tuples
                        match_obj = type('Match', (), {f'group': lambda self, i: match_groups[i-1] if i <= len(match_groups) else None})()
                        term, dept, number, credits, grade, title = extractor(match_obj)
                    else:
                        term, dept, number, credits, grade, title = extractor(match_groups)
                    
                    courses.append({
                        'term': term,
                        'department': dept.strip(),
                        'number': number.strip(),
                        'credits': float(credits),
                        'grade': grade.upper(),
                        'title': title.strip()
                    })
                except (ValueError, AttributeError, IndexError):
                    continue
        
        return courses

    def clean_title(self, title: str) -> str:
        """Clean course title by removing symbols"""
        cleaned = title
        for symbol in self.course_symbols:
            cleaned = cleaned.replace(symbol, "")
        return cleaned.strip()

    def extract_symbols(self, title: str) -> List[str]:
        """Extract symbols from course title"""
        symbols = []
        for symbol in self.course_symbols:
            if symbol in title:
                symbols.append(symbol)
        return symbols

    def parse_credits_info(self, text: str) -> Tuple[float, float, float]:
        """Extract credits information using flexible patterns"""
        earned = 0.0
        needed = 0.0
        in_progress = 0.0
        
        # Multiple patterns for different universities
        credit_patterns = [
            # "EARNED: 17.00 CREDITS"
            (r'EARNED:\s*(\d+\.?\d*)\s*CREDITS?', 'earned'),
            # "NEEDS: 3.00 CREDITS" 
            (r'NEEDS?:\s*(\d+\.?\d*)\s*CREDITS?', 'needed'),
            # "REQUIRED: 12 CREDITS"
            (r'REQUIRED:\s*(\d+\.?\d*)\s*CREDITS?', 'needed'),
            # "REMAINING: 6 CREDITS"
            (r'REMAINING:\s*(\d+\.?\d*)\s*CREDITS?', 'needed'),
            # "IN-PROGRESS 16.00 CREDITS"
            (r'IN-PROGRESS\s+(\d+\.?\d*)\s*CREDITS?', 'in_progress'),
            # "16.00 CREDITS ADDED"
            (r'(\d+\.?\d*)\s*CREDITS?\s*ADDED', 'earned'),
            # "Credits Required: 12"
            (r'CREDITS?\s+REQUIRED:\s*(\d+\.?\d*)', 'needed'),
            # "Credits Completed: 9"
            (r'CREDITS?\s+COMPLETED:\s*(\d+\.?\d*)', 'earned'),
        ]
        
        for pattern, credit_type in credit_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            if matches:
                try:
                    value = float(matches[-1])  # Take the last match
                    if credit_type == 'earned':
                        earned = max(earned, value)
                    elif credit_type == 'needed':
                        needed = max(needed, value)
                    elif credit_type == 'in_progress':
                        in_progress = max(in_progress, value)
                except ValueError:
                    continue
        
        return earned, needed, in_progress

    def extract_select_from_courses(self, text: str) -> List[str]:
        """Extract course selection requirements"""
        select_from = []
        
        patterns = [
            r'SELECT FROM:\s*([^\n]*)',
            r'CHOOSE FROM:\s*([^\n]*)',
            r'SELECT\s+(\d+)\s+FROM:\s*([^\n]*)',
            r'COURSES?\s+W/\s*[\'"]([^\'"]*)[\'"]\s*(?:BREADTH|ATTRIBUTE)',
            r'ELECTIVES?\s+FROM:\s*([^\n]*)',
            r'OPTIONS?:\s*([^\n]*)',
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            for match in matches:
                if isinstance(match, tuple):
                    select_from.extend([item.strip() for item in match if item.strip()])
                else:
                    select_from.append(match.strip())
        
        return [item for item in select_from if item and len(item) > 2]

    def identify_section_boundaries(self, text: str) -> List[Tuple[str, int, int]]:
        """Identify major section boundaries in the DARS text"""
        sections = []
        lines = text.split('\n')
        
        # Look for section headers with status indicators
        section_header_patterns = [
            r'^(OK|NO|IP|\+|\-)\s+(.+?)(?:\s*-\s*|\s*$)',
            r'^(.+?)\s*(?:COMPLETE|INCOMPLETE|SATISFIED|NOT\s+MET|NEEDED)',
            r'^=+\s*(.+?)\s*=+',
            r'^\*+\s*(.+?)\s*\*+',
            r'^-{3,}\s*(.+?)\s*-{3,}',
        ]
        
        for i, line in enumerate(lines):
            line = line.strip()
            if not line or len(line) < 5:
                continue
                
            for pattern in section_header_patterns:
                match = re.match(pattern, line, re.IGNORECASE)
                if match:
                    if len(match.groups()) == 2:
                        status, title = match.groups()
                        full_title = f"{status} {title}".strip()
                    else:
                        title = match.group(1)
                        full_title = title.strip()
                    
                    # Check if this is a legend section - look ahead for content
                    section_content = ""
                    if i + 1 < len(lines):
                        # Get next few lines to check content
                        end_idx = min(i + 10, len(lines))
                        section_content = '\n'.join(lines[i:end_idx])
                    
                    # Skip legend sections
                    if not self.is_legend_section(full_title, section_content):
                        sections.append((full_title, i, -1))
                    break
        
        # Set end positions
        for i in range(len(sections)):
            if i < len(sections) - 1:
                sections[i] = (sections[i][0], sections[i][1], sections[i+1][1])
            else:
                sections[i] = (sections[i][0], sections[i][1], len(lines))
        
        return sections

    def parse_section(self, section_text: str, title: str) -> RequirementSection:
        """Parse individual requirement section"""
        # Normalize status
        status = "UNKNOWN"
        original_title = title
        
        if title.upper().startswith(('OK ', 'COMPLETE', 'SATISFIED', '+ ')):
            status = "COMPLETE"
            title = re.sub(r'^(OK|COMPLETE|SATISFIED|\+)\s+', '', title, flags=re.IGNORECASE)
        elif title.upper().startswith(('NO ', 'INCOMPLETE', 'NOT MET', '- ')):
            status = "INCOMPLETE"
            title = re.sub(r'^(NO|INCOMPLETE|NOT\s+MET|\-)\s+', '', title, flags=re.IGNORECASE)
        elif title.upper().startswith(('IP ', 'IN-PROGRESS', 'PENDING')):
            status = "IN_PROGRESS"
            title = re.sub(r'^(IP|IN-PROGRESS|PENDING)\s+', '', title, flags=re.IGNORECASE)
        
        # Identify requirement type
        req_type = self.identify_requirement_type(title)
        
        # Parse credits
        earned, needed, in_progress = self.parse_credits_info(section_text)
        
        # Extract courses
        course_data = self.extract_course_patterns(section_text)
        courses = []
        seen_courses = set()
        
        for course_info in course_data:
            course_key = f"{course_info['department']} {course_info['number']}"
            if course_key not in seen_courses:
                seen_courses.add(course_key)
                
                course = Course(
                    term=course_info['term'],
                    department=course_info['department'],
                    number=course_info['number'],
                    credits=course_info['credits'],
                    grade=course_info['grade'],
                    title=self.clean_title(course_info['title']),
                    course_id=course_key,
                    is_transfer=course_info['grade'] in self.transfer_grades,
                    symbols=self.extract_symbols(course_info['title']),
                    section_context=title
                )
                courses.append(course)
        
        # Extract selection requirements
        select_from = self.extract_select_from_courses(section_text)
        
        return RequirementSection(
            title=title,
            status=status,
            credits_needed=needed,
            credits_earned=earned,
            credits_in_progress=in_progress,
            courses=courses,
            select_from_courses=select_from,
            additional_info=section_text[:200] + "..." if len(section_text) > 200 else section_text,
            requirement_type=req_type
        )

    def parse_subsections(self, section_text: str, parent_title: str) -> List[RequirementSection]:
        """Parse subsections within a main section"""
        subsections = []
        
        # Look for various subsection patterns
        subsection_patterns = [
            r'^([+\-IP]*\s*\d+\))\s*(.*?)(?=^\s*[+\-IP]*\s*\d+\)|$)',
            r'^([+\-IP]*\s*[a-zA-Z]\))\s*(.*?)(?=^\s*[+\-IP]*\s*[a-zA-Z]\)|$)',
            r'^([+\-IP]*\s*[IVX]+\.)\s*(.*?)(?=^\s*[+\-IP]*\s*[IVX]+\.|$)',
        ]
        
        for pattern in subsection_patterns:
            matches = re.findall(pattern, section_text, re.MULTILINE | re.DOTALL)
            
            for prefix, content in matches:
                if not content.strip():
                    continue
                    
                status = "COMPLETE"
                if prefix.strip().startswith('-'):
                    status = "INCOMPLETE"
                elif prefix.strip().startswith('IP'):
                    status = "IN_PROGRESS"
                elif 'NO ' in content[:50]:
                    status = "INCOMPLETE"
                
                title = content.split('\n')[0].strip()[:100]  # First line, truncated
                
                subsection = self.parse_section(content, title)
                subsection.status = status
                
                # Include subsection if incomplete or parent requested it
                if status in ["INCOMPLETE", "IN_PROGRESS"] or len(subsection.courses) > 0:
                    subsections.append(subsection)
        
        return subsections

    def extract_student_info(self, text: str) -> Dict:
        """Extract student information - flexible for different universities"""
        info = {}
        
        # Common patterns for student info
        patterns = {
            'name': [
                r'(\w+),\s*(\w+)', 
                r'Student:\s*(\w+)\s+(\w+)',
                r'Name:\s*([^\n]+)'
            ],
            'student_id': [
                r'ID:?\s*(\d+)',
                r'Student\s+ID:?\s*(\d+)',
                r'(\d{9,})'  # 9+ digit number likely to be student ID
            ],
            'major': [
                r'([A-Za-z\s]+)\s+major',
                r'Major:\s*([^\n]+)',
                r'Program:\s*([^\n]+)'
            ],
            'degree': [
                r'Bachelor\s+of\s+([^(]+)',
                r'(B\.?[AS]\.?)',
                r'Degree:\s*([^\n]+)'
            ],
            'catalog_year': [
                r'Catalog\s+Year:\s*(\d+)',
                r'Year:\s*(\d+)'
            ],
            'gpa': [
                r'CUMULATIVE GPA:?[\s]*([0-4]\.\d{2})',
                r'OVERALL GPA:?[\s]*([0-4]\.\d{2})',
                r'STUDENT GPA:?[\s]*([0-4]\.\d{2})'
                # Do NOT include generic 'GPA:' pattern to avoid capturing required minimum GPA
            ]
        }
        
        for field, field_patterns in patterns.items():
            for pattern in field_patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    if field == 'name' and len(match.groups()) == 2:
                        info[field] = f"{match.group(2)} {match.group(1)}"
                    else:
                        info[field] = match.group(1).strip()
                    break
        
        return info

    def parse_dars(self, text: str) -> Dict:
        """Main parsing function"""
        # Extract all courses first
        all_course_data = self.extract_course_patterns(text)
        
        # Categorize courses by status
        completed_courses = []
        in_progress_courses = []
        planned_courses = []
        
        seen_courses = set()
        
        for course_info in all_course_data:
            course_key = f"{course_info['department']} {course_info['number']}_{course_info['term']}"
            if course_key in seen_courses:
                continue
            seen_courses.add(course_key)
            
            course = Course(
                term=course_info['term'],
                department=course_info['department'],
                number=course_info['number'],
                credits=course_info['credits'],
                grade=course_info['grade'],
                title=self.clean_title(course_info['title']),
                course_id=f"{course_info['department']} {course_info['number']}",
                is_transfer=course_info['grade'] in self.transfer_grades,
                symbols=self.extract_symbols(course_info['title'])
            )
            
            if course.grade in self.completed_grades:
                completed_courses.append(course)
            elif course.grade in self.in_progress_grades:
                in_progress_courses.append(course)
            elif course.grade in self.planned_grades:
                planned_courses.append(course)
            else:
                completed_courses.append(course)  # Default
        
        # Parse requirement sections
        sections = self.identify_section_boundaries(text)
        incomplete_requirements = []
        
        lines = text.split('\n')
        
        for title, start, end in sections:
            section_text = '\n'.join(lines[start:end])
            
            # Double-check that this isn't a legend section
            if self.is_legend_section(title, section_text):
                continue
                
            section = self.parse_section(section_text, title)
            
            # Parse subsections
            section.subsections = self.parse_subsections(section_text, title)
            
            # Only include incomplete sections or those with incomplete subsections
            if (section.status in ["INCOMPLETE", "IN_PROGRESS"] or 
                any(sub.status in ["INCOMPLETE", "IN_PROGRESS"] for sub in section.subsections) or
                section.credits_needed > 0):
                incomplete_requirements.append(section)
        
        # Extract student information
        student_info = self.extract_student_info(text)
        
        return {
            "student_info": student_info,
            "completed_courses": completed_courses,
            "in_progress_courses": in_progress_courses,
            "planned_courses": planned_courses,
            "incomplete_requirements": incomplete_requirements
        }

# Main function for backward compatibility
def parse_dars_text(text: str) -> Dict:
    """Universal DARS parser function"""
    parser = UniversalDARSParser()
    return parser.parse_dars(text)

def print_parsed_results(parsed_data: Dict):
    """Helper function to display parsed results"""
    
    print("=== STUDENT INFORMATION ===")
    for key, value in parsed_data["student_info"].items():
        print(f"{key.replace('_', ' ').title()}: {value}")
    
    print(f"\n=== COURSE SUMMARY ===")
    print(f"Completed Courses: {len(parsed_data['completed_courses'])}")
    print(f"In-Progress Courses: {len(parsed_data['in_progress_courses'])}")
    print(f"Planned Courses: {len(parsed_data['planned_courses'])}")
    
    print(f"\n=== COMPLETED COURSES (First 10) ===")
    for course in parsed_data["completed_courses"][:10]:
        symbols_str = " ".join(course.symbols) if course.symbols else ""
        transfer_str = " [TRANSFER]" if course.is_transfer else ""
        print(f"{course.term} {course.course_id} ({course.credits} cr) - {course.grade} - {course.title}{transfer_str} {symbols_str}")
    
    if len(parsed_data["completed_courses"]) > 10:
        print(f"... and {len(parsed_data['completed_courses']) - 10} more courses")
    
    print(f"\n=== IN-PROGRESS COURSES ===")
    for course in parsed_data["in_progress_courses"]:
        print(f"{course.term} {course.course_id} ({course.credits} cr) - {course.grade} - {course.title}")
    
    print(f"\n=== INCOMPLETE REQUIREMENTS ===")
    for section in parsed_data["incomplete_requirements"]:
        print(f"\n[{section.status}] {section.title} ({section.requirement_type.upper()})")
        if section.credits_needed > 0:
            print(f"  Credits needed: {section.credits_needed}")
        if section.credits_earned > 0:
            print(f"  Credits earned: {section.credits_earned}")
        if section.credits_in_progress > 0:
            print(f"  Credits in progress: {section.credits_in_progress}")
        
        if section.select_from_courses:
            print(f"  Options: {', '.join(section.select_from_courses[:3])}{'...' if len(section.select_from_courses) > 3 else ''}")
        
        # Show incomplete subsections only
        incomplete_subsections = [sub for sub in section.subsections if sub.status in ["INCOMPLETE", "IN_PROGRESS"]]
        for subsection in incomplete_subsections[:5]:  # Limit display
            print(f"    └─ [{subsection.status}] {subsection.title}")
            if subsection.credits_needed > 0:
                print(f"       Credits needed: {subsection.credits_needed}")
            if subsection.select_from_courses:
                print(f"       Options: {', '.join(subsection.select_from_courses[:2])}")