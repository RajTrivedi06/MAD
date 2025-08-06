from fastapi import APIRouter, UploadFile, File, HTTPException, status
from fastapi.responses import JSONResponse
import pdfplumber
import logging
from typing import Dict, Any, Optional
from app.core.dars_parser import EnhancedDarsParser, parse_dars_file, validate_certificate_eligibility, generate_degree_audit_summary
import tempfile
import os
from pathlib import Path

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize the enhanced parser
dars_parser = EnhancedDarsParser()

@router.post("/parse")
async def parse_dars(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Extracts text from a DARS PDF and returns comprehensive parsed data.
    
    Args:
        file: Uploaded PDF file containing DARS report
        
    Returns:
        Dict containing parsed DARS data including student info, courses, requirements, etc.
        
    Raises:
        HTTPException: For various error conditions (invalid file, parsing errors, etc.)
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
        
        logger.info(f"Successfully parsed DARS for student: {parsed_data['student_info'].name}")
        
        return parsed_data

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
        'student_overview': full_data['summary']['student_overview'],
        'academic_progress': full_data['summary']['academic_progress'],
        'requirements_status': full_data['summary']['requirements_status'],
        'next_steps': full_data['summary']['next_steps'][:5],  # Limit to 5 most important
        'completion_status': full_data['completion_status'],
        'certificate_eligible': full_data['certificate_eligible'],
        'warnings': full_data['parsing_metadata']['warnings'],
        'file_metadata': full_data['file_metadata']
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