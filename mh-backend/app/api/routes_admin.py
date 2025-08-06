from fastapi import APIRouter, Depends, HTTPException
from app.core.auth import get_current_user

router = APIRouter()

@router.get("/admin/healthcheck")
def healthcheck(user_id: str = Depends(get_current_user)):
    if user_id != "admin-user-id":  # Replace with real admin ID
        raise HTTPException(status_code=403, detail="Admins only")
    return {"status": "ok"}
