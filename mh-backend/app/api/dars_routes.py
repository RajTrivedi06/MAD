from fastapi import APIRouter, UploadFile, File, HTTPException, status, Form
from fastapi.responses import JSONResponse
import pdfplumber
import logging
from typing import Dict, Any, Optional
from app.parsers.dars_parser import EnhancedDarsParser, parse_dars_file, validate_certificate_eligibility, generate_degree_audit_summary
from supabase import create_client, Client
import tempfile
import os
from pathlib import Path
from datetime import datetime

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize the enhanced parser
dars_parser = EnhancedDarsParser()

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

@router.post("/parse")
async def parse_dars(
    file: UploadFile = File(...), 
    user_id: Optional[str] = Form(None)
) -> Dict[str, Any]:
    """
    Parse DARS PDF and optionally store in user profile.
    
    Args:
        file: Uploaded PDF file containing DARS report
        user_id: Optional user ID to store parsed data in profile
        
    Returns:
        Dict containing parsed DARS data
        
    Raises:
        HTTPException: For various error conditions
    """
    # Validate file
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file provided"
        )
    
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be a PDF"
        )
    
    # Check file size (limit to 10MB)
    if file.size and file.size > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File size too large. Maximum size is 10MB"
        )
    
    try:
        # Extract text from PDF
        text = ""
        logger.info(f"Processing DARS file: {file.filename}")
        
        with pdfplumber.open(file.file) as pdf:
            if not pdf.pages:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="PDF file appears to be empty or corrupted"
                )
            
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
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No text could be extracted from the PDF. Please ensure it's a valid DARS report."
            )
        
        # Parse the extracted text using enhanced parser
        logger.info("Parsing extracted DARS text")
        parsed_data = dars_parser.parse_dars_report(text)
        
        # Add file metadata
        parsed_data['file_metadata'] = {
            'filename': file.filename,
            'content_type': file.content_type,
            'file_size': file.size,
            'pages_processed': len(pdf.pages) if 'pdf' in locals() else 0
        }
        
        # Validate certificate eligibility (from original logic)
        parsed_data['certificate_eligible'] = validate_certificate_eligibility(parsed_data)
        
        # Generate summary
        parsed_data['summary'] = generate_degree_audit_summary(parsed_data)
        
        # Prepare response
        response_data = {
            'success': True,
            'dars_data': parsed_data,
            'stored_in_profile': False
        }
        
        # Store in Supabase if user_id provided
        if user_id:
            try:
                supabase = get_supabase_client()
                
                # Extract key information for easier querying
                dars_summary = {
                    'student_info': {
                        'name': parsed_data['student_info'].name,
                        'student_id': parsed_data['student_info'].student_id,
                        'catalog_year': parsed_data['student_info'].catalog_year,
                        'program_code': parsed_data['student_info'].program_code
                    },
                    'academic_progress': {
                        'total_credits_earned': parsed_data['credits_summary']['total_earned'],
                        'total_credits_in_progress': parsed_data['credits_summary']['total_in_progress'],
                        'current_gpa': parsed_data['gpa_info'].gpa,
                        'completion_status': parsed_data['completion_status']
                    },
                    'courses': [
                        {
                            'term': course.term,
                            'subject': course.subject,
                            'number': course.number,
                            'credits': course.credits,
                            'grade': course.grade,
                            'title': course.title,
                            'is_passing': course.is_passing_grade
                        }
                        for course in parsed_data['courses']
                    ],
                    'requirements': [
                        {
                            'name': req.name,
                            'status': req.status.value,
                            'credits_needed': req.credits_needed,
                            'credits_earned': req.credits_earned,
                            'credits_remaining': req.credits_remaining,
                            'completion_percentage': req.completion_percentage
                        }
                        for req in parsed_data['requirements']
                    ]
                }
                
                # Update user profile with DARS data
                update_data = {
                    'dars_data': dars_summary,
                    'processing_status': {
                        'dars': 'completed',
                        'dars_processed_at': datetime.now().isoformat()
                    },
                    'updated_at': datetime.now().isoformat()
                }
                
                # Get existing processing status to preserve CV status
                try:
                    existing_profile = supabase.table('profiles').select('processing_status').eq('id', user_id).execute()
                    if existing_profile.data:
                        existing_status = existing_profile.data[0].get('processing_status', {})
                        # Merge the statuses properly
                        if isinstance(existing_status, dict):
                            # Keep existing CV status if it exists
                            if 'cv' in existing_status:
                                update_data['processing_status']['cv'] = existing_status['cv']
                            if 'cv_processed_at' in existing_status:
                                update_data['processing_status']['cv_processed_at'] = existing_status['cv_processed_at']
                except Exception as e:
                    logger.warning(f"Could not fetch existing profile: {str(e)}")
                    # Continue with the update anyway
                
                # Upsert the profile data with proper error handling
                try:
                    logger.info(f"Attempting upsert for user {user_id}")
                    logger.info(f"Update data keys: {list(update_data.keys())}")
                    logger.info(f"DARS data size: {len(str(update_data.get('dars_data', {})))} chars")
                    
                    result = supabase.table('profiles').upsert({
                        'id': user_id,
                        **update_data
                    }).execute()
                    
                    # Log the result for debugging
                    logger.info(f"Upsert result: {result.data}")
                    
                    if not result.data:
                        raise Exception("No data returned from upsert operation")
                    
                    # Verify the update
                    verify = supabase.table('profiles').select('*').eq('id', user_id).single().execute()
                    logger.info(f"Verification query result: {verify.data}")
                        
                except Exception as upsert_error:
                    logger.error(f"Upsert failed: {str(upsert_error)}")
                    raise
                
                response_data['stored_in_profile'] = True
                logger.info(f"DARS data stored for user: {user_id}")
                
            except Exception as db_error:
                logger.error(f"Failed to store DARS data in database: {str(db_error)}")
                response_data['storage_error'] = str(db_error)
        
        logger.info(f"Successfully parsed DARS for student: {parsed_data['student_info'].name}")
        
        return response_data

    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except ValueError as ve:
        logger.error(f"Validation error parsing DARS: {str(ve)}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid DARS format: {str(ve)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error parsing DARS file {file.filename}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse DARS file: {str(e)}"
        )

@router.post("/parse/text")
async def parse_dars_text(text_content: Dict[str, str]) -> Dict[str, Any]:
    """
    Parse DARS text directly without file upload.
    
    Args:
        text_content: Dictionary with 'text' key containing DARS report text
        
    Returns:
        Dict containing parsed DARS data
    """
    if 'text' not in text_content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Request body must contain 'text' field"
        )
    
    text = text_content['text']
    if not text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text content cannot be empty"
        )
    
    try:
        logger.info("Parsing DARS text content")
        parsed_data = dars_parser.parse_dars_report(text)
        
        # Add metadata
        parsed_data['file_metadata'] = {
            'source': 'direct_text',
            'text_length': len(text)
        }
        
        # Validate certificate eligibility
        parsed_data['certificate_eligible'] = validate_certificate_eligibility(parsed_data)
        
        # Generate summary
        parsed_data['summary'] = generate_degree_audit_summary(parsed_data)
        
        logger.info(f"Successfully parsed DARS text for student: {parsed_data['student_info'].name}")
        
        return parsed_data
        
    except ValueError as ve:
        logger.error(f"Validation error parsing DARS text: {str(ve)}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid DARS format: {str(ve)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error parsing DARS text: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse DARS text: {str(e)}"
        )

@router.post("/parse/summary")
async def parse_dars_summary_only(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Parse DARS file and return only a summary of key information.
    Useful for quick overviews without full detailed parsing.
    
    Args:
        file: Uploaded PDF file containing DARS report
        
    Returns:
        Dict containing summarized DARS data
    """
    # Reuse the main parsing logic but return only summary
    full_data = await parse_dars(file)
    
    # Return only essential summary information
    return {
        'student_overview': full_data['dars_data']['summary']['student_overview'],
        'academic_progress': full_data['dars_data']['summary']['academic_progress'],
        'requirements_status': full_data['dars_data']['summary']['requirements_status'],
        'next_steps': full_data['dars_data']['summary']['next_steps'][:5],  # Limit to 5 most important
        'completion_status': full_data['dars_data']['completion_status'],
        'certificate_eligible': full_data['dars_data']['certificate_eligible'],
        'warnings': full_data['dars_data']['parsing_metadata']['warnings'],
        'file_metadata': full_data['dars_data']['file_metadata']
    }

@router.post("/validate")
async def validate_dars_file(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Validate if an uploaded file is a properly formatted DARS report.
    
    Args:
        file: Uploaded PDF file to validate
        
    Returns:
        Dict containing validation results
    """
    if not file.filename.lower().endswith('.pdf'):
        return {
            'is_valid': False,
            'errors': ['File must be a PDF'],
            'warnings': []
        }
    
    try:
        # Extract text
        text = ""
        with pdfplumber.open(file.file) as pdf:
            for page in pdf.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
        
        # Try to validate format
        dars_parser._validate_dars_format(text)
        
        return {
            'is_valid': True,
            'errors': [],
            'warnings': [],
            'file_info': {
                'filename': file.filename,
                'size': file.size,
                'pages': len(pdf.pages),
                'text_length': len(text)
            }
        }
        
    except ValueError as ve:
        return {
            'is_valid': False,
            'errors': [str(ve)],
            'warnings': [],
            'file_info': {
                'filename': file.filename,
                'size': file.size
            }
        }
    except Exception as e:
        return {
            'is_valid': False,
            'errors': [f'Failed to process file: {str(e)}'],
            'warnings': [],
            'file_info': {
                'filename': file.filename,
                'size': file.size
            }
        }

@router.get("/profile/{user_id}")
async def get_user_dars_data(user_id: str) -> Dict[str, Any]:
    """
    Retrieve stored DARS data for a user.
    
    Args:
        user_id: User ID to retrieve DARS data for
        
    Returns:
        Dict containing user's DARS data
    """
    
    try:
        supabase = get_supabase_client()
        
        result = supabase.table('profiles').select('dars_data, processing_status').eq('id', user_id).single().execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )
        
        dars_data = result.data.get('dars_data')
        processing_status = result.data.get('processing_status', {})
        
        if not dars_data:
            return {
                'success': True,
                'dars_data': None,
                'status': 'not_uploaded',
                'message': 'No DARS data found for this user'
            }
        
        return {
            'success': True,
            'dars_data': dars_data,
            'status': processing_status.get('dars', 'unknown'),
            'processed_at': processing_status.get('dars_processed_at')
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to retrieve DARS data: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve DARS data: {str(e)}"
        )

@router.post("/parse/text")
async def parse_dars_text(text_content: Dict[str, str]) -> Dict[str, Any]:
    """
    Parse DARS text directly without file upload.
    
    Args:
        text_content: Dictionary with 'text' key containing DARS report text
        
    Returns:
        Dict containing parsed DARS data
    """
    if 'text' not in text_content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Request body must contain 'text' field"
        )
    
    text = text_content['text']
    if not text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text content cannot be empty"
        )
    
    try:
        logger.info("Parsing DARS text content")
        parsed_data = dars_parser.parse_dars_report(text)
        
        # Add metadata
        parsed_data['file_metadata'] = {
            'source': 'direct_text',
            'text_length': len(text)
        }
        
        # Validate certificate eligibility
        parsed_data['certificate_eligible'] = validate_certificate_eligibility(parsed_data)
        
        # Generate summary
        parsed_data['summary'] = generate_degree_audit_summary(parsed_data)
        
        logger.info(f"Successfully parsed DARS text for student: {parsed_data['student_info'].name}")
        
        return {
            'success': True,
            'dars_data': parsed_data
        }
        
    except ValueError as ve:
        logger.error(f"Validation error parsing DARS text: {str(ve)}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid DARS format: {str(ve)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error parsing DARS text: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse DARS text: {str(e)}"
        )

@router.get("/health")
async def health_check() -> Dict[str, str]:
    """
    Health check endpoint for the DARS parser service.
    
    Returns:
        Dict with service status
    """
    supabase_status = "configured" if (os.getenv('SUPABASE_URL') and os.getenv('SUPABASE_SERVICE_KEY')) else "missing"
    
    return {
        'status': 'healthy',
        'service': 'DARS Parser API',
        'version': '2.0.0',
        'dependencies': {
            'supabase': supabase_status
        }
    }

# Error handler for better error responses
from fastapi import Request
from fastapi.responses import JSONResponse

async def dars_exception_handler(request: Request, exc: Exception):
    """Custom exception handler for DARS parsing errors"""
    logger.error(f"DARS parsing error on {request.url}: {str(exc)}")
    
    return JSONResponse(
        status_code=500,
        content={
            'error': 'DARS parsing failed',
            'detail': str(exc),
            'type': type(exc).__name__
        }
    )