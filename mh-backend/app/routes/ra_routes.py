from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Tuple
import json
import aiohttp
import asyncio
import openai
import os
import re
from datetime import datetime
from supabase import create_client, Client
import logging
from ..services.openai_service import get_openai_client, is_openai_available
from ..services.web_search_service import WebSearchService
# from ..parsers.cv_parser import CVParser
# from ..parsers.dars_parser import DARSParser

router = APIRouter(tags=["RA Finder"])

logger = logging.getLogger(__name__)

class RASearchRequest(BaseModel):
    keywords: Optional[str] = None
    useProfile: Optional[bool] = False
    userId: Optional[str] = None
    profile: Optional[Dict[str, Any]] = None

class Citation(BaseModel):
    source: str
    url: str
    accessed: str
    info_used: str

class LabMatch(BaseModel):
    id: str
    labTitle: str
    piName: str
    department: str
    fitScore: int
    blurb: str
    contactEmail: str
    whyMatch: str
    researchAreas: List[str]
    labUrl: Optional[str] = None
    openings: Optional[bool] = None
    learningResources: Optional[List[Dict[str, Any]]] = None
    approachTips: Optional[List[str]] = None
    relatedResearch: Optional[List[Dict[str, Any]]] = None
    citations: Optional[List[Citation]] = None
    emailTemplateData: Optional[Dict[str, Any]] = None

class RASearchResponse(BaseModel):
    matches: List[LabMatch]
    totalCount: int
    searchType: str

class ClarifyingQuestion(BaseModel):
    question: str
    context: str

class DeepResearchRequest(BaseModel):
    user_id: str
    interest_statement: Optional[str] = None
    clarification_answers: Optional[Dict[str, str]] = None
    max_results: int = Field(default=10, ge=1, le=20)

class DeepResearchResponse(BaseModel):
    labs: List[LabMatch]
    clarifying_questions: Optional[List[ClarifyingQuestion]] = None
    needs_clarification: bool = False
    search_metadata: Dict[str, Any]

@router.post("/search", response_model=RASearchResponse)
async def search_ra_opportunities(request: RASearchRequest):
    """
    Search for RA opportunities based on keywords or user profile
    """
    try:
        if request.useProfile and request.userId:
            # Profile-based search
            matches = await search_by_profile(request.userId, request.profile)
            search_type = "profile"
        elif request.keywords:
            # Keyword-based search
            matches = await search_by_keywords(request.keywords)
            search_type = "keywords"
        else:
            raise HTTPException(status_code=400, detail="Either keywords or useProfile with userId must be provided")
        
        return RASearchResponse(
            matches=matches,
            totalCount=len(matches),
            searchType=search_type
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

async def search_by_profile(user_id: str, profile_data: Optional[Dict[str, Any]] = None):
    """
    Search for RA opportunities based on user's academic profile
    """
    # TODO: Implement actual profile-based search logic
    # This would involve:
    # 1. Fetching user's DARS and CV data from database
    # 2. Analyzing courses, skills, and experience
    # 3. Matching against lab requirements
    # 4. Calculating fit scores
    
    # For now, return mock data with profile-aware scoring
    mock_labs = get_mock_labs()
    
    if profile_data:
        # Calculate fit scores based on profile data
        for lab in mock_labs:
            lab.fitScore = calculate_profile_fit_score(lab, profile_data)
    
    return mock_labs

async def search_by_keywords(keywords: str):
    """
    Search for RA opportunities based on keywords
    """
    # TODO: Implement keyword-based search logic
    # This would involve:
    # 1. Searching lab descriptions, research areas, and PI interests
    # 2. Using semantic search or keyword matching
    # 3. Ranking results by relevance
    
    mock_labs = get_mock_labs()
    
    # Simple keyword filtering for demo
    filtered_labs = []
    keywords_lower = keywords.lower()
    
    for lab in mock_labs:
        # Check if keywords match lab title, research areas, or description
        if (keywords_lower in lab.labTitle.lower() or
            any(keywords_lower in area.lower() for area in lab.researchAreas) or
            keywords_lower in lab.blurb.lower()):
            filtered_labs.append(lab)
    
    return filtered_labs if filtered_labs else mock_labs

def calculate_profile_fit_score(lab: LabMatch, profile: Dict[str, Any]) -> int:
    """
    Calculate fit score between lab and user profile
    """
    score = 0
    
    # Check course relevance
    if profile.get("courses"):
        for course in profile["courses"]:
            course_name = course.get("name", "").lower()
            course_dept = course.get("department", "").lower()
            
            # Check if course matches lab department or research areas
            if (course_dept in lab.department.lower() or
                any(area.lower() in course_name for area in lab.researchAreas)):
                score += 20
    
    # Check skills relevance
    if profile.get("skills"):
        for skill in profile["skills"]:
            skill_name = skill.get("name", "").lower()
            if any(area.lower() in skill_name for area in lab.researchAreas):
                score += 15
    
    # Check research interests
    if profile.get("preferences", {}).get("researchInterests"):
        interests = profile["preferences"]["researchInterests"]
        for interest in interests:
            if any(area.lower() in interest.lower() for area in lab.researchAreas):
                score += 25
    
    # Ensure score is between 0-100
    return min(100, max(0, score))

@router.get("/profile/{user_id}")
async def get_user_profile_for_ra(user_id: str):
    """
    Get user profile data specifically formatted for RA matching
    """
    try:
        # TODO: Fetch from database
        # This would return the user's profile with DARS and CV data
        # formatted specifically for RA matching
        
        return {
            "userId": user_id,
            "profile": {
                "courses": [],  # From DARS data
                "skills": [],   # From CV data
                "experience": [], # From CV data
                "researchInterests": [] # From preferences
            }
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch profile: {str(e)}")

def get_mock_labs() -> List[LabMatch]:
    """
    Mock lab data for testing and fallback scenarios
    """
    return [
        LabMatch(
            id="hci-lab-001",
            labTitle="Human-Computer Interaction Lab",
            piName="Dr. Sarah Johnson",
            department="Computer Sciences",
            fitScore=92,
            blurb="Focuses on accessible computing interfaces and user experience design for diverse populations.",
            contactEmail="sjohnson@cs.wisc.edu",
            whyMatch="Strong alignment with HCI coursework and accessibility focus matches your UI/UX projects.",
            researchAreas=["Human-Computer Interaction", "Accessibility", "User Experience", "Interface Design"],
            labUrl="https://hci.cs.wisc.edu",
            openings=True,
            learningResources=[
                {
                    "title": "Introduction to HCI Research Methods",
                    "type": "video",
                    "url": "https://example.com/hci-methods",
                    "description": "Comprehensive overview of HCI research methodologies",
                    "duration": "45 min"
                }
            ],
            approachTips=[
                "Highlight your experience with user testing",
                "Mention specific accessibility projects you've worked on",
                "Show understanding of design thinking principles"
            ],
            relatedResearch=[
                {
                    "title": "Accessible Web Design for Screen Readers",
                    "authors": ["Dr. Sarah Johnson", "Alex Chen"],
                    "url": "https://example.com/paper1",
                    "year": 2024,
                    "summary": "Novel approaches to improving screen reader compatibility"
                }
            ]
        ),
        LabMatch(
            id="ml-lab-002",
            labTitle="Machine Learning Systems Lab",
            piName="Dr. Michael Chen",
            department="Computer Sciences",
            fitScore=88,
            blurb="Develops scalable machine learning systems and algorithms for large-scale data processing.",
            contactEmail="mchen@cs.wisc.edu",
            whyMatch="Your data structures background and Python experience align well with ML systems work.",
            researchAreas=["Machine Learning", "Distributed Systems", "Big Data", "Neural Networks"],
            labUrl="https://ml.cs.wisc.edu",
            openings=None,
            learningResources=[
                {
                    "title": "Scalable ML Systems Course",
                    "type": "course",
                    "url": "https://example.com/ml-course",
                    "description": "Graduate-level course on ML systems design",
                    "duration": "16 weeks"
                }
            ],
            approachTips=[
                "Demonstrate understanding of distributed computing concepts",
                "Show experience with large datasets",
                "Highlight any cloud computing experience"
            ],
            relatedResearch=[
                {
                    "title": "Efficient Neural Network Training at Scale",
                    "authors": ["Dr. Michael Chen", "Lisa Wang"],
                    "url": "https://example.com/paper2",
                    "year": 2024,
                    "summary": "Optimization techniques for large-scale neural network training"
                }
            ]
        )
    ]

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

@router.get("/test-o4-mini-access")
async def test_o4_mini_access():
    """Test if o4-mini-deep-research is accessible"""
    
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        return {"error": "OpenAI API key not configured"}
    
    try:
        headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
        
        # Simple test query
        payload = {
            'model': 'o4-mini-deep-research',
            'input': [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "input_text",
                            "text": "What is 2+2?"
                        }
                    ]
                }
            ],
            'tools': [
                {
                    'type': 'web_search_preview'
                }
            ]
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                'https://api.openai.com/v1/responses',
                headers=headers,
                json=payload,
                timeout=aiohttp.ClientTimeout(total=30)
            ) as response:
                if response.status == 200:
                            return {
            "status": "success",
            "message": "o4-mini-deep-research is accessible",
            "model": "o4-mini-deep-research"
        }
                else:
                    error_text = await response.text()
                    return {
                        "status": "error",
                        "message": f"o4-mini-deep-research not accessible: {error_text}",
                        "status_code": response.status
                    }
                    
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to test o4-mini-deep-research: {str(e)}"
        }


@router.post("/deep-research", response_model=DeepResearchResponse)
async def deep_research_labs(request: DeepResearchRequest) -> DeepResearchResponse:
    """
    Enhanced deep research with actual web search for real UW-Madison labs.
    This endpoint handles the complete flow including clarifications and web search.
    """
    supabase = get_supabase_client()
    
    if not is_openai_available():
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="OpenAI API key not configured"
        )
    
    try:
        # Initialize services
        openai_client = get_openai_client()
        search_service = WebSearchService()
        
        # Step 1: Get user's profile summary
        profile_result = supabase.table('profiles').select('profile_summary').eq('id', request.user_id).single().execute()
        
        if not profile_result.data or not profile_result.data.get('profile_summary'):
            raise HTTPException(
                status_code=400,
                detail="Profile summary not found. Please generate your profile summary first."
            )
        
        profile_summary = profile_result.data['profile_summary']
        
        # Step 2: If no clarification answers provided, generate clarifying questions
        if not request.clarification_answers:
            questions = await generate_clarifying_questions(
                profile_summary, 
                request.interest_statement,
                openai_client
            )
            
            if questions:
                return DeepResearchResponse(
                    labs=[],
                    clarifying_questions=[
                        ClarifyingQuestion(question=q, context="Help us find the best research matches")
                        for q in questions
                    ],
                    needs_clarification=True,
                    search_metadata={"stage": "clarification"}
                )
        
        # Step 3: Extract research interests for web search
        research_interests = extract_research_interests(
            profile_summary, 
            request.interest_statement,
            request.clarification_answers
        )
        
        # Step 4: Perform actual web searches for each interest area
        all_search_results = []
        if search_service.is_search_available():
            logger.info(f"Performing web search for interests: {research_interests}")
            for interest in research_interests[:3]:  # Limit to top 3 interests
                search_results = await search_service.search_uw_madison_labs(interest)
                all_search_results.extend(search_results)
                await asyncio.sleep(0.5)  # Rate limiting
        else:
            logger.warning("Web search not available - using AI-only approach")
        
        # Step 5: Process search results to extract lab information
        verified_labs = await process_search_results(all_search_results, openai_client)
        
        # Step 6: Match labs to user profile
        matched_labs = await match_labs_to_profile(
            verified_labs, 
            profile_summary, 
            research_interests,
            openai_client
        )
        
        # Step 7: If no real labs found, fallback to AI-only approach
        if not matched_labs and search_service.is_search_available():
            logger.info("No real labs found via web search, falling back to AI-only approach")
            matched_labs = await fallback_ai_only_search(
                profile_summary,
                research_interests,
                request.max_results,
                openai_client
            )
        
        # Step 8: Format and return results
        search_metadata = {
            "total_results": len(matched_labs),
            "model_used": "web-search-with-ai" if search_service.is_search_available() else "ai-only",
            "model_status": "success",
            "search_provider": search_service.get_search_provider(),
            "web_search_available": search_service.is_search_available(),
            "research_interests_searched": len(research_interests),
            "verified_sources": True if matched_labs else False
        }
        
        return DeepResearchResponse(
            labs=matched_labs[:request.max_results],
            needs_clarification=False,
            search_metadata=search_metadata
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Deep research error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Deep research failed: {str(e)}"
        )

async def generate_clarifying_questions(
    profile_summary: Dict[str, Any],
    interest_statement: Optional[str],
    openai_client: openai.OpenAI
) -> List[str]:
    """Generate clarifying questions using GPT-4"""
    
    prompt = f"""Based on this student profile and their interest, generate 3-5 clarifying questions that would help find the best research lab matches.

Profile Summary:
- Major: {profile_summary.get('academic_profile', {}).get('major')}
- Research Interests: {', '.join(profile_summary.get('research_interests', [])[:5])}
- Technical Skills: {', '.join(profile_summary.get('technical_expertise', {}).get('specialized_skills', [])[:5])}

Interest Statement: {interest_statement or 'No specific interest provided'}

Generate questions that:
- Are specific and actionable
- Help differentiate between potential labs
- Can be answered in 1-2 sentences
- Focus on preferences not clear from the profile

Return ONLY a JSON array of question strings."""

    response = openai_client.chat.completions.create(
        model="gpt-4-turbo-preview",
        messages=[
            {"role": "system", "content": "You are helping match students with research opportunities."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.7,
        max_tokens=500
    )
    
    try:
        questions = json.loads(response.choices[0].message.content)
        return questions[:5]  # Limit to 5 questions
    except:
        return []

async def enhance_research_prompt(
    profile_summary: Dict[str, Any],
    interest_statement: Optional[str],
    clarifications: Optional[Dict[str, str]],
    openai_client: openai.OpenAI
) -> str:
    """Enhance the research prompt for better results"""
    
    clarification_text = ""
    if clarifications:
        clarification_text = "\n\nClarifications:\n" + "\n".join([
            f"Q: {q}\nA: {a}" for q, a in clarifications.items()
        ])
    
    prompt = f"""Create a detailed research brief for finding UW-Madison research labs for this student:

Profile:
{json.dumps(profile_summary, indent=2)}

Interest: {interest_statement or 'Open to recommendations based on profile'}
{clarification_text}

Generate a comprehensive 2-3 paragraph research prompt that:
1. Highlights the student's unique strengths
2. Specifies types of labs to prioritize
3. Includes any constraints or preferences
4. Emphasizes match criteria"""

    response = openai_client.chat.completions.create(
        model="gpt-4-turbo-preview",
        messages=[
            {"role": "system", "content": "You are preparing research briefs for academic matching."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.5,
        max_tokens=800
    )
    
    return response.choices[0].message.content

async def execute_deep_research(
    enhanced_prompt: str,
    profile_summary: Dict[str, Any],
    max_results: int,
    openai_client: openai.OpenAI
) -> Tuple[List[LabMatch], Dict[str, Any]]:
    """Execute deep research using o4-mini-deep-research model with CORRECT API format"""
    
    # System prompt with clear instructions
    system_prompt = """You are a research assistant helping students find REAL research opportunities at UW-Madison.

CRITICAL REQUIREMENTS:
1. Search for and return ONLY REAL, VERIFIABLE UW-Madison research labs
2. Each lab MUST exist and have a real faculty page on wisc.edu
3. Include REAL contact emails (must end in @wisc.edu)
4. Provide citations with exact URLs for every piece of information

You will search the web to find actual labs, not generate fictional ones."""

    # User query with specific instructions
    user_query = f"""{enhanced_prompt}

Find exactly {max_results} REAL UW-Madison research labs matching this student's profile.

For each lab you find through web search, return in this JSON format:
```json
[
  {{
    "id": "unique-id",
    "labTitle": "Exact lab name from website",
    "piName": "Real faculty name",
    "department": "Official department",
    "fitScore": 0-100,
    "blurb": "Description from lab website",
    "contactEmail": "real@wisc.edu",
    "whyMatch": "Why this matches the student",
    "researchAreas": ["area1", "area2"],
    "labUrl": "https://actual.wisc.edu/lab/url",
    "citations": [
      {{
        "source": "Source name",
        "url": "https://wisc.edu/...",
        "accessed": "2024-01-15",
        "info_used": "What info came from this source"
      }}
    ]
  }}
]
```

Focus on labs in: {', '.join(profile_summary.get('ideal_research_areas', [])[:3])}"""

    start_time = datetime.utcnow()
    
    # Get the API key
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        raise ValueError("OpenAI API key not configured")
    
    try:
        # CORRECT o4-mini-deep-research API call format
        headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
        
        # CORRECT payload structure for Responses API
        payload = {
            'model': 'o4-mini-deep-research',
            'input': [
                {
                    "role": "developer",
                    "content": [
                        {
                            "type": "input_text",
                            "text": system_prompt
                        }
                    ]
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "input_text",
                            "text": user_query
                        }
                    ]
                }
            ],
            'tools': [
                {
                    'type': 'web_search_preview'  # Enable web search
                }
            ],
            'reasoning': {
                'summary': 'auto'
            }
        }
        
        logger.info("Calling o4-mini-deep-research with web search enabled")
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                'https://api.openai.com/v1/responses',
                headers=headers,
                json=payload,
                timeout=aiohttp.ClientTimeout(total=300)  # 5 minute timeout for deep research
            ) as response:
                if response.status != 200:
                    error_text = await response.text()
                    logger.error(f"o4-mini-deep-research API error: Status {response.status}, Error: {error_text}")
                    raise Exception(f"o4-mini-deep-research API error: {error_text}")
                
                result = await response.json()
                logger.info(f"o4-mini-deep-research response received, processing...")
        
        # Extract the output from the CORRECT response format
        output_text = None
        web_searches = []
        
        # The response has an 'output' array with different types
        if 'output' in result:
            for item in result['output']:
                if item.get('type') == 'message':
                    # Extract text from the message content
                    if 'content' in item and len(item['content']) > 0:
                        output_text = item['content'][0].get('text', '')
                elif item.get('type') == 'web_search_call':
                    web_searches.append(item)
        
        if not output_text:
            logger.error("No text output from o4-mini-deep-research")
            raise Exception("o4-mini-deep-research returned no text output")
        
        logger.info(f"o4-mini-deep-research performed {len(web_searches)} web searches")
        
        # Parse the JSON from the output
        json_match = re.search(r'```json\s*(\[.*?\])\s*```', output_text, re.DOTALL)
        if not json_match:
            logger.warning(f"No JSON found in o4-mini response")
            raise Exception("o4-mini-deep-research did not return labs in expected format")
        
        labs_data = json.loads(json_match.group(1))
        
        # Convert to LabMatch objects
        labs = []
        for lab_data in labs_data[:max_results]:
            try:
                # Parse citations
                citations = []
                for citation_data in lab_data.get('citations', []):
                    citation = Citation(
                        source=citation_data.get('source', ''),
                        url=citation_data.get('url', ''),
                        accessed=citation_data.get('accessed', ''),
                        info_used=citation_data.get('info_used', '')
                    )
                    citations.append(citation)
                
                lab = LabMatch(
                    id=lab_data.get('id'),
                    labTitle=lab_data.get('labTitle'),
                    piName=lab_data.get('piName'),
                    department=lab_data.get('department'),
                    fitScore=lab_data.get('fitScore', 70),
                    blurb=lab_data.get('blurb'),
                    contactEmail=lab_data.get('contactEmail'),
                    whyMatch=lab_data.get('whyMatch'),
                    researchAreas=lab_data.get('researchAreas', []),
                    labUrl=lab_data.get('labUrl'),
                    openings=lab_data.get('openings'),
                    learningResources=lab_data.get('learningResources', []),
                    approachTips=lab_data.get('approachTips', []),
                    relatedResearch=lab_data.get('relatedResearch', []),
                    citations=citations
                )
                labs.append(lab)
            except Exception as e:
                logger.warning(f"Failed to parse lab: {str(e)}")
                continue
        
        search_metadata = {
            "total_results": len(labs),
            "processing_time": (datetime.utcnow() - start_time).total_seconds(),
            "model_used": "o4-mini-deep-research",
            "model_status": "primary_success",
            "web_searches_performed": len(web_searches),
            "o4_mini_deep_research_available": True
        }
        
        return labs, search_metadata
        
    except Exception as e:
        logger.error(f"o4-mini-deep-research failed: {str(e)}")
        # Fallback to GPT-4o
        return await fallback_to_gpt4o_with_message(profile_summary, max_results, str(e))


async def fallback_to_gpt4o_with_message(profile_summary: Dict, max_results: int, error_reason: str) -> Tuple[List[LabMatch], Dict[str, Any]]:
    """Fallback that returns a message about unavailability instead of fake data"""
    
    # Return empty labs with informative metadata
    return [], {
        "total_results": 0,
        "model_used": "none",
        "model_status": "all_models_failed",
        "fallback_reason": error_reason,
        "o4_mini_deep_research_available": False,
        "message": "Real-time lab search is temporarily unavailable. Please try again later or contact support.",
        "suggestions": [
            "Visit https://grad.wisc.edu/research/ for UW-Madison research opportunities",
            "Check department websites directly for lab information",
            "Contact the Graduate School for assistance"
        ]
    }


def extract_research_interests(
    profile_summary: Dict[str, Any],
    interest_statement: Optional[str],
    clarification_answers: Optional[Dict[str, str]]
) -> List[str]:
    """Extract research interests from profile and user input"""
    interests = []
    
    # Add interests from profile
    if profile_summary.get('research_interests'):
        interests.extend(profile_summary['research_interests'])
    
    # Add interests from ideal research areas
    if profile_summary.get('ideal_research_areas'):
        interests.extend(profile_summary['ideal_research_areas'])
    
    # Add user-provided interest statement
    if interest_statement:
        interests.append(interest_statement)
    
    # Add interests from clarification answers
    if clarification_answers:
        for answer in clarification_answers.values():
            if answer and len(answer.strip()) > 10:  # Only meaningful answers
                interests.append(answer.strip())
    
    # Remove duplicates and clean up
    unique_interests = list(set(interests))
    cleaned_interests = []
    
    for interest in unique_interests:
        if interest and len(interest.strip()) > 3:
            cleaned_interests.append(interest.strip())
    
    return cleaned_interests[:5]  # Limit to top 5 interests

async def process_search_results(search_results: List[Dict], openai_client: openai.OpenAI) -> List[Dict]:
    """Process search results to extract verified lab information"""
    
    verified_labs = []
    
    for result in search_results:
        # Extract information from search result
        url = result.get("link", "")
        title = result.get("title", "")
        snippet = result.get("snippet", "")
        
        # Skip non-wisc.edu domains
        if "wisc.edu" not in url:
            continue
        
        # Use GPT to extract structured information from the search result
        extraction_prompt = f"""
        Extract research lab information from this search result.
        ONLY extract information that is EXPLICITLY stated in the snippet.
        If information is not available, mark it as null.
        
        URL: {url}
        Title: {title}
        Snippet: {snippet}
        
        Extract:
        1. Lab name
        2. Principal Investigator name
        3. Department
        4. Research areas (list)
        5. Contact email (if visible)
        
        Return as JSON. Mark any field as null if not found.
        """
        
        try:
            response = openai_client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "user", "content": extraction_prompt}],
                response_format={"type": "json_object"},
                max_tokens=300
            )
            
            extracted_info = json.loads(response.choices[0].message.content)
            
            # Only add if we have minimum required information
            if extracted_info.get("lab_name") and extracted_info.get("pi_name"):
                verified_labs.append({
                    **extracted_info,
                    "source_url": url,
                    "source_title": title,
                    "source_snippet": snippet,
                    "extraction_timestamp": datetime.now().isoformat()
                })
        except Exception as e:
            logger.warning(f"Failed to extract info from search result: {str(e)}")
            continue
    
    return verified_labs

async def match_labs_to_profile(verified_labs: List[Dict], profile_summary: Dict, 
                               research_interests: List[str], openai_client: openai.OpenAI) -> List[LabMatch]:
    """Match verified labs to user profile and format results"""
    
    matched_labs = []
    
    for lab in verified_labs:
        # Calculate fit score based on profile matching
        fit_score = calculate_fit_score(lab, profile_summary, research_interests)
        
        # Generate personalized match explanation
        match_explanation = await generate_match_explanation(
            lab, profile_summary, research_interests, openai_client
        )
        
        # Create LabMatch object with verified data
        lab_match = LabMatch(
            id=f"verified-{hash(lab['source_url'])}",
            labTitle=lab.get("lab_name", "Unknown Lab"),
            piName=lab.get("pi_name", "Unknown PI"),
            department=lab.get("department", "Unknown Department"),
            fitScore=fit_score,
            blurb=lab.get("source_snippet", ""),
            contactEmail=lab.get("contact_email", "Check lab website"),
            whyMatch=match_explanation,
            researchAreas=lab.get("research_areas", []),
            labUrl=lab.get("source_url"),
            openings=None,  # Not available from search results
            learningResources=[],  # Not available from search results
            approachTips=[],  # Not available from search results
            relatedResearch=[],  # Not available from search results
            citations=[{
                "source": "UW-Madison Official Website",
                "url": lab.get("source_url"),
                "accessed": lab.get("extraction_timestamp"),
                "info_used": "Lab name, PI, research areas, and contact information"
            }]
        )
        
        matched_labs.append(lab_match)
    
    # Sort by fit score
    matched_labs.sort(key=lambda x: x.fitScore, reverse=True)
    
    return matched_labs

def calculate_fit_score(lab: Dict, profile: Dict, interests: List[str]) -> int:
    """Calculate fit score based on profile and interests alignment"""
    score = 50  # Base score
    
    # Check research area alignment
    lab_areas = set(area.lower() for area in lab.get("research_areas", []))
    user_interests = set(interest.lower() for interest in interests)
    
    overlap = lab_areas.intersection(user_interests)
    if overlap:
        score += min(30, len(overlap) * 10)
    
    # Check technical skills alignment
    if profile.get("technical_expertise"):
        tech_skills = profile["technical_expertise"].get("programming_languages", {}).get("proficient", [])
        for skill in tech_skills:
            if any(skill.lower() in area.lower() for area in lab.get("research_areas", [])):
                score += 5
    
    # Check major alignment
    user_major = profile.get("academic_profile", {}).get("major", "").lower()
    lab_dept = lab.get("department", "").lower()
    if user_major in lab_dept or lab_dept in user_major:
        score += 10
    
    # Ensure score is between 0 and 100
    return min(100, max(0, score))

async def generate_match_explanation(lab: Dict, profile: Dict, 
                                    interests: List[str], openai_client: openai.OpenAI) -> str:
    """Generate personalized explanation for why this lab is a good match"""
    
    prompt = f"""
    Explain why this research lab is a good match for the student.
    Be specific and reference actual skills and interests.
    
    Lab: {lab.get('lab_name')}
    Research Areas: {lab.get('research_areas')}
    Department: {lab.get('department')}
    
    Student Interests: {interests}
    Student Skills: {profile.get('technical_expertise', {}).get('programming_languages', {})}
    Student Major: {profile.get('academic_profile', {}).get('major')}
    
    Write a 2-3 sentence explanation focusing on the strongest matches.
    """
    
    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=150
        )
        
        return response.choices[0].message.content
    except Exception as e:
        logger.warning(f"Failed to generate match explanation: {str(e)}")
        return "This lab appears to align with your research interests and background."

async def fallback_ai_only_search(profile_summary: Dict, research_interests: List[str], 
                                 max_results: int, openai_client: openai.OpenAI) -> List[LabMatch]:
    """Fallback to AI-only search when web search fails or returns no results"""
    
    # Use the existing AI-only approach as fallback
    enhanced_prompt = await enhance_research_prompt(
        profile_summary,
        research_interests[0] if research_interests else None,
        None,  # No clarifications
        openai_client
    )
    
    labs, search_metadata = await execute_deep_research(
        enhanced_prompt,
        profile_summary,
        max_results,
        openai_client
    )
    
    return labs 