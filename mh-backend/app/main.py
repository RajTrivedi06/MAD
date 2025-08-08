# main.py

import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from contextlib import asynccontextmanager

# your routers
from app.api.routes_dars import router as dars_router
from app.api.routes_courses import router as courses_router
from app.api.routes_sections import router as section_router
from app.core.study_group_poller import study_group_poller_loop
from app.api.routes_study_groups import router as sg_router
from app.api.routes_labs import router as labs_router
from app.api.routes_cv import router as cv_router
from app.api.routes_profile import router as profile_router
from app.api.routes_recs import router as recs_router


# import the poller coroutine
from app.core.section_poller import poller_loop
import logging

# this must come before any other imports that log!
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s %(levelname)5s %(name)s: %(message)s",
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # start background poller
    sg_task  = asyncio.create_task(study_group_poller_loop())
    task = asyncio.create_task(poller_loop())
    try:
        yield
    finally:
        # on shutdown, cancel it
        task.cancel()
        with __import__("contextlib").suppress(asyncio.CancelledError):
            await task

app = FastAPI(lifespan=lifespan, debug=True)


settings = get_settings()
raw_origins = settings.get("CORS_ORIGINS", "http://localhost:3000")

allowed_origins: list[str] | None = None
allow_origin_regex: str | None = None

if isinstance(raw_origins, str):
    s = raw_origins.strip()
    if s == "*" or s.lower() == "true":  # some people set TRUE for “all”
        # When you need credentials, prefer regex that echoes the Origin instead of "*"
        allow_origin_regex = r".*"
    else:
        allowed_origins = [o.strip() for o in s.split(",") if o.strip()]
elif isinstance(raw_origins, (list, tuple)):
    allowed_origins = list(raw_origins)

if not allowed_origins and not allow_origin_regex:
    allowed_origins = ["http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],  # covers Authorization, Content-Type, etc.
)


# register routers
app.include_router(sg_router, prefix="/api")
app.include_router(recs_router, prefix="/api", tags=["Recommendations"])

app.include_router(labs_router, prefix="/api", tags=["Labs"])
app.include_router(courses_router, prefix="/api", tags=["Courses"])
app.include_router(section_router, prefix="/api", tags=["Sections"])
app.include_router(dars_router, prefix="/api", tags=["DARS"])
app.include_router(cv_router,        prefix="/api",  tags=["CV"])
app.include_router(profile_router,   prefix="/api/profile", tags=["Profile"])

@app.get("/")
def root():
    return {"message": "FastAPI backend running 🚀"}
