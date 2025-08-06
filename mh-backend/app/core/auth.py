# auth.py
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.services.supabase_client import supabase

security = HTTPBearer(auto_error=False)   # note auto_error=False

def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    # 1) Bypass header first
    if request.headers.get("X-Bypass-Auth", "").lower() == "true":
        return {"id": "bypass-user", "email": "test@example.com"}

    # 2) Then require a real Bearer token
    if not credentials or not credentials.scheme == "Bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    resp = supabase.auth.admin.get_user(jwt=token)
    if resp.error or resp.user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return resp.user
