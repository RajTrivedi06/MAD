# app/core/auth.py
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.services.supabase_client import supabase  # this should be a supabase.Client

security = HTTPBearer(auto_error=False)

def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    # Let preflight pass so CORS works
    if request.method == "OPTIONS":
        return None

    # Dev bypass if you want it
    if request.headers.get("X-Bypass-Auth", "").lower() == "true":
        return {"id": "aaf5c9f8-3439-4c45-8264-f92ca17726c9", "email": "rstrivedi2@wisc.edu"}

    if not credentials or credentials.scheme != "Bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    # ✅ Correct call for token verification in supabase-py v2:
    try:
        res = supabase.auth.get_user(token)  # NOT admin.get_user
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Handle SDK return shape (object or dict)
    user = getattr(res, "user", None)
    if user is None and isinstance(res, dict):
        user = res.get("user")

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user
