# main.py

import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

# your routers
from app.api.routes_docs import router as dars_router
from app.api.routes_courses import router as courses_router
from app.api.routes_sections import router as section_router
from app.api.routes_recs import router as recs_router
from app.api.routes_admin import router as admin_router
from app.core.study_group_poller import study_group_poller_loop
from app.api.routes_study_groups import router as sg_router
from app.api.routes_labs import router as labs_router

# import the poller coroutine
from app.core.section_poller import poller_loop

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

app = FastAPI(lifespan=lifespan)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# register routers
app.include_router(sg_router, prefix="/api")
app.include_router(labs_router, prefix="/api", tags=["Labs"])
app.include_router(courses_router, prefix="/api", tags=["Courses"])
app.include_router(section_router, prefix="/api", tags=["Sections"])
app.include_router(recs_router,    prefix="/api", tags=["Recommendations"])
app.include_router(admin_router,   prefix="/api", tags=["Admin"])
app.include_router(dars_router, prefix="/api/dars", tags=["DARS"])

@app.get("/")
def root():
    return {"message": "FastAPI backend running 🚀"}
