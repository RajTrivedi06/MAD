import os
import openai
from typing import Optional
import logging

logger = logging.getLogger(__name__)

def get_openai_client() -> openai.OpenAI:
    """Get OpenAI client instance with proper configuration"""
    api_key = os.getenv('OPENAI_API_KEY')
    
    if not api_key:
        raise ValueError("OpenAI API key not configured")
    
    return openai.OpenAI(api_key=api_key)

def is_openai_available() -> bool:
    """Check if OpenAI is properly configured"""
    return bool(os.getenv('OPENAI_API_KEY'))

def get_available_models() -> list:
    """Get list of available OpenAI models"""
    try:
        client = get_openai_client()
        models = client.models.list()
        return [model.id for model in models.data]
    except Exception as e:
        logger.error(f"Failed to get available models: {str(e)}")
        return []

def is_model_available(model_name: str) -> bool:
    """Check if a specific model is available"""
    try:
        available_models = get_available_models()
        return model_name in available_models
    except Exception:
        return False 