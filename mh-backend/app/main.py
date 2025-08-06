from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.routes.dars_routes import router as dars_router
from app.routes.cv_routes import router as cv_router
from app.routes.testing_routes import router as testing_router
from app.routes.profile_routes import router as profile_router
from app.routes.ra_routes import router as ra_router
from app.routes.prerequisite_routes import router as prerequisite_router
import logging
import os
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=getattr(logging, os.getenv('LOG_LEVEL', 'INFO').upper()),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app with enhanced configuration
app = FastAPI(
    title="MadHelp Backend API",
    description="Comprehensive DARS and CV parsing system with Supabase integration",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Next.js default
        "http://localhost:8080",  # Alternative frontend
        "https://your-frontend-domain.com",  # Add your production domain
        # Add more origins as needed
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Include routers
app.include_router(dars_router, prefix="/api/dars", tags=["DARS"])
app.include_router(cv_router, prefix="/api/cv", tags=["CV"])
app.include_router(testing_router, prefix="/testing", tags=["Testing"])
app.include_router(profile_router, prefix="/api/profile", tags=["Profile"])
app.include_router(ra_router, prefix="/api/ra", tags=["RA Finder"])
app.include_router(prerequisite_router, prefix="/api", tags=["Prerequisites"])

@app.get("/")
async def root():
    """
    Root endpoint with system information.
    """
    return {
        "message": "MadHelp Backend API is live! 🚀",
        "version": "2.0.0",
        "services": {
            "dars_parser": "active",
            "cv_parser": "active" if os.getenv('OPENAI_API_KEY') else "inactive",
            "supabase_integration": "active" if (os.getenv('SUPABASE_URL') and os.getenv('SUPABASE_SERVICE_KEY')) else "inactive"
        },
        "endpoints": {
            "dars": "/api/dars",
            "cv": "/api/cv", 
            "testing": "/testing",
            "profile": "/api/profile",
            "ra": "/api/ra",
            "prerequisites": "/api/prerequisites",
            "docs": "/docs",
            "health": "/health"
        },
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    """
    Comprehensive health check endpoint.
    """
    
    # Check environment variables
    openai_configured = bool(os.getenv('OPENAI_API_KEY'))
    supabase_configured = bool(os.getenv('SUPABASE_URL') and os.getenv('SUPABASE_SERVICE_KEY'))
    
    health_status = {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "2.0.0",
        "environment": os.getenv('ENVIRONMENT', 'development'),
        "services": {
            "dars_parser": {
                "status": "active",
                "version": "2.0.0"
            },
            "cv_parser": {
                "status": "active" if openai_configured else "inactive",
                "version": "1.0.0",
                "openai_configured": openai_configured
            },
            "testing_interface": {
                "status": "active",
                "version": "1.0.0"
            }
        },
        "dependencies": {
            "openai": "configured" if openai_configured else "missing",
            "supabase": "configured" if supabase_configured else "missing"
        }
    }
    
    # Test database connection if configured
    if supabase_configured:
        try:
            from supabase import create_client
            supabase = create_client(
                os.getenv('SUPABASE_URL'),
                os.getenv('SUPABASE_SERVICE_KEY')
            )
            # Test connection
            result = supabase.table('profiles').select('id').limit(1).execute()
            health_status["database"] = {
                "status": "connected",
                "profiles_table": "accessible"
            }
        except Exception as e:
            health_status["database"] = {
                "status": "error",
                "error": str(e)
            }
            health_status["status"] = "degraded"
    else:
        health_status["database"] = {
            "status": "not_configured"
        }
    
    # Overall health determination
    if not openai_configured or not supabase_configured:
        health_status["status"] = "degraded"
        health_status["warnings"] = []
        
        if not openai_configured:
            health_status["warnings"].append("OpenAI API key not configured - CV parsing disabled")
        if not supabase_configured:
            health_status["warnings"].append("Supabase not configured - profile storage disabled")
    
    return health_status

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Global exception handler for better error responses.
    """
    logger.error(f"Global exception on {request.url}: {str(exc)}")
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc) if os.getenv('DEBUG', 'false').lower() == 'true' else "An unexpected error occurred",
            "timestamp": datetime.now().isoformat(),
            "path": str(request.url)
        }
    )

# Startup event
@app.on_event("startup")
async def startup_event():
    """
    Application startup tasks.
    """
    logger.info("🚀 MadHelp Backend API starting up...")
    logger.info(f"Environment: {os.getenv('ENVIRONMENT', 'development')}")
    logger.info(f"OpenAI configured: {bool(os.getenv('OPENAI_API_KEY'))}")
    logger.info(f"Supabase configured: {bool(os.getenv('SUPABASE_URL') and os.getenv('SUPABASE_SERVICE_KEY'))}")
    logger.info("✅ MadHelp Backend API started successfully!")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """
    Application shutdown tasks.
    """
    logger.info("🛑 MadHelp Backend API shutting down...")
    logger.info("✅ Shutdown complete!")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=os.getenv('DEBUG', 'false').lower() == 'true',
        log_level=os.getenv('LOG_LEVEL', 'info').lower()
    )
