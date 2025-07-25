from fastapi import APIRouter, UploadFile, File
import pdfplumber
from app.parsers.dars_parser import parse_dars_text

router = APIRouter()

@router.post("/parse")
async def parse_dars(file: UploadFile = File(...)):
    """
    Extracts text from a DARS PDF and returns parsed course data.
    """
    try:
        text = ""
        with pdfplumber.open(file.file) as pdf:
            for page in pdf.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
        
        parsed = parse_dars_text(text)
        return parsed

    except Exception as e:
        return {"error": f"Failed to parse DARS file: {str(e)}"}
