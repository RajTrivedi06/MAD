# app/routes/cv_routes.py

from fastapi import APIRouter, UploadFile, File, HTTPException, status, Depends, Form
from fastapi.responses import JSONResponse
import logging
from typing import Dict, Any, Optional
from app.parsers.cv_parser import create_cv_parser, CVProcessingResult
from supabase import create_client, Client
import os
from datetime import datetime
import json

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter()

# Supabase client setup
def get_supabase_client() -> Client:
    """Get Supabase client instance"""
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_KEY')  # Use service key for server-side operations
    
    if not supabase_url or not supabase_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase configuration missing"
        )
    
    return create_client(supabase_url, supabase_key)

@router.post("/parse")
async def parse_cv(
    file: UploadFile = File(...),
    user_id: Optional[str] = Form(None)  # For now optional, will be required when auth is implemented
) -> Dict[str, Any]:
    """
    Parse CV/Resume PDF file and optionally store in user profile.
    
    Args:
        file: Uploaded PDF file containing CV/Resume
        user_id: Optional user ID to store parsed data in profile
        
    Returns:
        Dict containing parsed CV data and processing metadata
        
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
        # Parse CV
        logger.info(f"Processing CV file: {file.filename}")
        parser = create_cv_parser()
        result = parser.parse_cv(file.file, file.filename)
        
        # Prepare response data
        response_data = {
            'success': True,
            'structured_data': result.structured_data,
            'processing_metadata': result.processing_metadata,
            'warnings': result.warnings,
            'file_info': {
                'filename': file.filename,
                'content_type': file.content_type,
                'file_size': file.size
            }
        }
        
        # Store in Supabase if user_id provided
        if user_id:
            try:
                supabase = get_supabase_client()
                
                # Update user profile with CV data
                update_data = {
                    'cv_data': result.structured_data,
                    'processing_status': {
                        'cv': 'completed',
                        'cv_processed_at': datetime.now().isoformat()
                    },
                    'updated_at': datetime.now().isoformat()
                }
                
                # Get existing processing status to preserve DARS status
                try:
                    existing_profile = supabase.table('profiles').select('processing_status').eq('id', user_id).execute()
                    if existing_profile.data:
                        existing_status = existing_profile.data[0].get('processing_status', {})
                        # Merge the statuses properly
                        if isinstance(existing_status, dict):
                            # Keep existing DARS status if it exists
                            if 'dars' in existing_status:
                                update_data['processing_status']['dars'] = existing_status['dars']
                            if 'dars_processed_at' in existing_status:
                                update_data['processing_status']['dars_processed_at'] = existing_status['dars_processed_at']
                except Exception as e:
                    logger.warning(f"Could not fetch existing profile: {str(e)}")
                    # Continue with the update anyway
                
                # Upsert the profile data with proper error handling
                try:
                    logger.info(f"Attempting CV upsert for user {user_id}")
                    logger.info(f"Update data keys: {list(update_data.keys())}")
                    logger.info(f"CV data size: {len(str(update_data.get('cv_data', {})))} chars")
                    
                    result_db = supabase.table('profiles').upsert({
                        'id': user_id,
                        **update_data
                    }).execute()
                    
                    # Log the result for debugging
                    logger.info(f"CV upsert result: {result_db.data}")
                    
                    if not result_db.data:
                        raise Exception("No data returned from CV upsert operation")
                    
                    # Verify the update
                    verify = supabase.table('profiles').select('*').eq('id', user_id).single().execute()
                    logger.info(f"CV verification query result: {verify.data}")
                        
                except Exception as upsert_error:
                    logger.error(f"CV upsert failed: {str(upsert_error)}")
                    raise
                
                response_data['stored_in_profile'] = True
                logger.info(f"CV data stored for user: {user_id}")
                
            except Exception as db_error:
                logger.error(f"Failed to store CV data in database: {str(db_error)}")
                response_data['stored_in_profile'] = False
                response_data['storage_error'] = str(db_error)
        
        logger.info(f"Successfully parsed CV: {file.filename}")
        return response_data

    except ValueError as ve:
        logger.error(f"CV parsing validation error: {str(ve)}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"CV parsing failed: {str(ve)}"
        )
    except Exception as e:
        logger.error(f"Unexpected CV parsing error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"CV processing failed: {str(e)}"
        )

@router.post("/parse/text-only")
async def parse_cv_text_only(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Parse CV and return only the extracted and cleaned text (for debugging/testing).
    
    Args:
        file: Uploaded PDF file
        
    Returns:
        Dict containing raw text, cleaned text, and metadata
    """
    
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be a PDF"
        )
    
    try:
        parser = create_cv_parser()
        
        # Extract text only
        raw_text = parser.extract_text_from_pdf(file.file)
        cleaned_text, removed_pii = parser.remove_pii(raw_text)
        
        return {
            'success': True,
            'raw_text': raw_text,
            'cleaned_text': cleaned_text,
            'pii_removed': removed_pii,
            'text_stats': {
                'raw_length': len(raw_text),
                'cleaned_length': len(cleaned_text),
                'reduction_percentage': ((len(raw_text) - len(cleaned_text)) / len(raw_text)) * 100
            },
            'file_info': {
                'filename': file.filename,
                'size': file.size
            }
        }
        
    except Exception as e:
        logger.error(f"Text extraction failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Text extraction failed: {str(e)}"
        )

@router.post("/structure-text")
async def structure_cv_text(text_data: Dict[str, str]) -> Dict[str, Any]:
    """
    Structure already cleaned CV text using OpenAI (for testing).
    
    Args:
        text_data: Dict with 'text' key containing cleaned CV text
        
    Returns:
        Dict containing structured CV data
    """
    
    if 'text' not in text_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Request body must contain 'text' field"
        )
    
    text = text_data['text']
    if not text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text content cannot be empty"
        )
    
    try:
        parser = create_cv_parser()
        structured_data = parser.structure_with_openai(text)
        validation_warnings = parser.validate_cv_data(structured_data)
        
        return {
            'success': True,
            'structured_data': structured_data,
            'validation_warnings': validation_warnings,
            'input_stats': {
                'text_length': len(text),
                'processed_at': datetime.now().isoformat()
            }
        }
        
    except Exception as e:
        logger.error(f"Text structuring failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Text structuring failed: {str(e)}"
        )

@router.get("/profile/{user_id}")
async def get_user_cv_data(user_id: str) -> Dict[str, Any]:
    """
    Retrieve stored CV data for a user.
    
    Args:
        user_id: User ID to retrieve CV data for
        
    Returns:
        Dict containing user's CV data
    """
    
    try:
        supabase = get_supabase_client()
        
        result = supabase.table('profiles').select('cv_data, processing_status').eq('id', user_id).single().execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )
        
        cv_data = result.data.get('cv_data')
        processing_status = result.data.get('processing_status', {})
        
        if not cv_data:
            return {
                'success': True,
                'cv_data': None,
                'status': 'not_uploaded',
                'message': 'No CV data found for this user'
            }
        
        return {
            'success': True,
            'cv_data': cv_data,
            'status': processing_status.get('cv', 'unknown'),
            'processed_at': processing_status.get('cv_processed_at')
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to retrieve CV data: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve CV data: {str(e)}"
        )

@router.delete("/profile/{user_id}")
async def delete_user_cv_data(user_id: str) -> Dict[str, Any]:
    """
    Delete CV data for a user.
    
    Args:
        user_id: User ID to delete CV data for
        
    Returns:
        Dict containing deletion status
    """
    
    try:
        supabase = get_supabase_client()
        
        # Update profile to remove CV data
        update_data = {
            'cv_data': None,
            'processing_status': {
                'cv': 'not_uploaded'
            },
            'updated_at': datetime.now().isoformat()
        }
        
        result = supabase.table('profiles').update(update_data).eq('id', user_id).execute()
        
        return {
            'success': True,
            'message': 'CV data deleted successfully',
            'deleted_at': datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to delete CV data: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete CV data: {str(e)}"
        )

@router.post("/validate")
async def validate_cv_file(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Validate if an uploaded file can be processed as a CV.
    
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
        parser = create_cv_parser()
        
        # Try to extract text
        raw_text = parser.extract_text_from_pdf(file.file)
        
        validation_errors = []
        validation_warnings = []
        
        if len(raw_text) < 100:
            validation_warnings.append('CV text is very short, may be missing content')
        
        if len(raw_text) > 10000:
            validation_warnings.append('CV text is very long, processing may take longer')
        
        # Check for common CV indicators
        cv_indicators = ['experience', 'education', 'skills', 'resume', 'cv', 'work', 'university', 'college']
        found_indicators = sum(1 for indicator in cv_indicators if indicator.lower() in raw_text.lower())
        
        if found_indicators < 2:
            validation_warnings.append('Document may not be a standard CV/Resume format')
        
        return {
            'is_valid': True,
            'errors': validation_errors,
            'warnings': validation_warnings,
            'file_info': {
                'filename': file.filename,
                'size': file.size,
                'text_length': len(raw_text),
                'cv_indicators_found': found_indicators
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

@router.get("/health")
async def health_check() -> Dict[str, str]:
    """
    Health check endpoint for the CV parser service.
    
    Returns:
        Dict with service status
    """
    
    # Check OpenAI API key
    openai_status = "configured" if os.getenv('OPENAI_API_KEY') else "missing"
    
    # Check Supabase configuration
    supabase_status = "configured" if (os.getenv('SUPABASE_URL') and os.getenv('SUPABASE_SERVICE_KEY')) else "missing"
    
    return {
        'status': 'healthy',
        'service': 'CV Parser API',
        'version': '1.0.0',
        'dependencies': {
            'openai_api': openai_status,
            'supabase': supabase_status
        }
    }