# MadHelp Backend Deployment Guide

## 🚀 Quick Start Instructions for Cursor

### 1. Project Structure Overview

```
mh-backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # Enhanced main application
│   ├── parsers/
│   │   ├── __init__.py
│   │   ├── dars_parser.py      # Enhanced DARS parser
│   │   └── cv_parser.py        # NEW: CV parser with OpenAI integration
│   └── routes/
│       ├── __init__.py
│       ├── dars_routes.py      # Updated with Supabase integration
│       ├── cv_routes.py        # NEW: CV processing endpoints
│       └── testing_routes.py   # NEW: Comprehensive testing interface
├── requirements.txt            # Updated dependencies
├── env.template               # Environment configuration template
└── README.md                  # This file
```

### 2. Database Setup (Supabase)

**Your profiles table should have these columns:**

```sql
-- Run this SQL in your Supabase SQL editor
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS dars_data jsonb,
ADD COLUMN IF NOT EXISTS cv_data jsonb,
ADD COLUMN IF NOT EXISTS processing_status jsonb DEFAULT '{"dars": "not_uploaded", "cv": "not_uploaded"}'::jsonb,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_dars_data ON public.profiles USING gin (dars_data);
CREATE INDEX IF NOT EXISTS idx_profiles_cv_data ON public.profiles USING gin (cv_data);

-- Optional: Add a trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 3. Environment Configuration

**Create `.env` file from template:**

```bash
# Copy the template and fill in your values
cp env.template .env
```

**Required environment variables:**

- **OPENAI_API_KEY**: Get from [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- **SUPABASE_URL**: Your Supabase project URL
- **SUPABASE_SERVICE_KEY**: Your service role key from Supabase project settings → API

### 4. Installation Steps

```bash
# 1. Navigate to your backend directory
cd mh-backend

# 2. Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Set up environment variables
cp env.template .env
# Edit .env with your actual API keys

# 5. Run the application
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 5. Testing Your Setup

**Option 1: Use the Testing Dashboard (Recommended)**

1. Start your server: `uvicorn app.main:app --reload`
2. Open: http://localhost:8000/testing/
3. Upload test files and verify all functionality

**Option 2: API Testing**

```bash
# Check health
curl http://localhost:8000/health

# Test DARS parsing
curl -X POST "http://localhost:8000/api/dars/parse" \
     -H "accept: application/json" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@path/to/your/dars.pdf"

# Test CV parsing
curl -X POST "http://localhost:8000/api/cv/parse" \
     -H "accept: application/json" \
     -H "Content-Type: multipart/form-data" \
     -F "file=@path/to/your/resume.pdf"
```

**Option 3: Interactive API Documentation**

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 6. Key API Endpoints

| Endpoint                      | Method | Description                        |
| ----------------------------- | ------ | ---------------------------------- |
| `/`                           | GET    | Root endpoint with system info     |
| `/health`                     | GET    | System health check                |
| `/testing/`                   | GET    | Interactive testing dashboard      |
| **DARS Endpoints**            |
| `/api/dars/parse`             | POST   | Parse DARS PDF file                |
| `/api/dars/parse/text`        | POST   | Parse DARS text directly           |
| `/api/dars/parse/summary`     | POST   | Get summary only                   |
| `/api/dars/validate`          | POST   | Validate DARS file format          |
| `/api/dars/profile/{user_id}` | GET    | Get user's DARS data               |
| **CV Endpoints**              |
| `/api/cv/parse`               | POST   | Parse CV/Resume PDF file           |
| `/api/cv/parse/text-only`     | POST   | Extract and clean text only        |
| `/api/cv/structure-text`      | POST   | Structure cleaned text with OpenAI |
| `/api/cv/validate`            | POST   | Validate CV file format            |
| `/api/cv/profile/{user_id}`   | GET    | Get user's CV data                 |
| `/api/cv/profile/{user_id}`   | DELETE | Delete user's CV data              |
| **Testing Endpoints**         |
| `/testing/status`             | GET    | System status for monitoring       |
| `/testing/profiles`           | GET    | List test profiles                 |
| `/testing/profiles/{user_id}` | DELETE | Delete test profile                |

### 7. Data Flow Architecture

```
PDF Upload → Text Extraction → Processing → Supabase Storage
                                    ↓
DARS: Direct structured parsing → Store in dars_data
CV: Text cleaning → OpenAI structuring → Store in cv_data
```

### 8. Expected Response Formats

**DARS Response:**

```json
{
  "success": true,
  "dars_data": {
    "student_info": {
      "name": "John Doe",
      "student_id": "1234567890",
      "program_code": "COMP_SCI_BS"
    },
    "courses": [...],
    "requirements": [...],
    "gpa_info": {...}
  },
  "stored_in_profile": true
}
```

**CV Response:**

```json
{
  "success": true,
  "structured_data": {
    "personal_info": {
      "name": "Jane Smith",
      "professional_title": "Software Engineer"
    },
    "education": [...],
    "experience": [...],
    "skills": {
      "technical_skills": [...],
      "programming_languages": [...]
    }
  },
  "stored_in_profile": true
}
```

### 9. Features

#### DARS Parser Features

- ✅ Complete academic transcript parsing
- ✅ Course requirements analysis
- ✅ GPA calculation and tracking
- ✅ Degree completion status
- ✅ Certificate eligibility validation
- ✅ Comprehensive summary generation
- ✅ Supabase profile storage

#### CV Parser Features

- ✅ PDF text extraction with error handling
- ✅ PII (Personally Identifiable Information) removal
- ✅ OpenAI-powered structured data extraction
- ✅ Support for multiple CV formats
- ✅ Education, experience, and skills parsing
- ✅ Projects and certifications extraction
- ✅ Validation and quality checks
- ✅ Supabase profile storage

#### Testing Dashboard Features

- ✅ Interactive web interface
- ✅ Drag-and-drop file uploads
- ✅ Multiple testing modes for each parser
- ✅ Real-time results display
- ✅ JSON response inspection
- ✅ Metadata and validation analysis
- ✅ System status monitoring
- ✅ Profile management tools

### 10. Troubleshooting

**Common Issues:**

1. **OpenAI API Errors:**

   - Verify API key is correct and has credits
   - Check rate limits and account status
   - Monitor usage at platform.openai.com

2. **Supabase Connection Issues:**

   - Verify URL and service key are correct
   - Check database permissions and RLS policies
   - Ensure profiles table exists with correct schema

3. **PDF Processing Errors:**

   - Ensure files are valid, non-scanned PDFs
   - Check file size limits (10MB default)
   - Verify text can be extracted from the PDF

4. **CORS Issues:**

   - Update allowed origins in main.py
   - Add your frontend URL to CORS settings

5. **Missing Dependencies:**
   - Reinstall requirements: `pip install -r requirements.txt`
   - Check Python version compatibility (3.8+)

### 11. Production Deployment

**For production deployment:**

1. **Environment Variables:**

   ```bash
   ENVIRONMENT=production
   DEBUG=false
   LOG_LEVEL=WARNING
   ```

2. **Security:**

   - Use environment-specific API keys
   - Configure proper CORS origins
   - Enable HTTPS
   - Use secure service keys

3. **Performance:**

   - Use production ASGI server (Gunicorn + Uvicorn)
   - Enable database connection pooling
   - Configure proper logging and monitoring

4. **Example Production Command:**
   ```bash
   gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
   ```

### 12. Integration with Frontend

**For frontend integration:**

```javascript
// Example API calls
const uploadDars = async (file, userId) => {
  const formData = new FormData();
  formData.append("file", file);
  if (userId) formData.append("user_id", userId);

  const response = await fetch("/api/dars/parse", {
    method: "POST",
    body: formData,
  });

  return response.json();
};

const uploadCV = async (file, userId) => {
  const formData = new FormData();
  formData.append("file", file);
  if (userId) formData.append("user_id", userId);

  const response = await fetch("/api/cv/parse", {
    method: "POST",
    body: formData,
  });

  return response.json();
};
```

### 13. Development Workflow

1. **Start Development Server:**

   ```bash
   uvicorn app.main:app --reload
   ```

2. **Open Testing Dashboard:**
   http://localhost:8000/testing/

3. **Test Each Component:**

   - Upload sample DARS PDF
   - Upload sample CV PDF
   - Test with different user IDs
   - Verify data storage in Supabase

4. **Monitor Logs:**
   - Check console output for processing details
   - Verify OpenAI API calls
   - Monitor database operations

### 14. API Testing Examples

**Using the Testing Dashboard:**

1. Navigate to http://localhost:8000/testing/
2. Select parser type (DARS or CV)
3. Choose testing mode (Full Parse, Validate, etc.)
4. Upload file or paste text
5. Review results in multiple tabs

**Using cURL:**

```bash
# Test system health
curl http://localhost:8000/health

# Upload DARS with user storage
curl -X POST http://localhost:8000/api/dars/parse \
  -F "file=@sample_dars.pdf" \
  -F "user_id=test-user-123"

# Upload CV with OpenAI processing
curl -X POST http://localhost:8000/api/cv/parse \
  -F "file=@sample_resume.pdf" \
  -F "user_id=test-user-123"

# Get user profile data
curl http://localhost:8000/api/dars/profile/test-user-123
curl http://localhost:8000/api/cv/profile/test-user-123
```

This deployment guide provides everything needed to get your enhanced MadHelp backend running with comprehensive DARS and CV processing capabilities!
