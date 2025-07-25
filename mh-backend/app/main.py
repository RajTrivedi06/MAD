from fastapi import FastAPI
from app.routes.dars_routes import router as dars_router
from app.routes.resume_routes import router as resume_router

app = FastAPI()

app.include_router(dars_router, prefix="/api/dars", tags=["DARS"])
app.include_router(resume_router, prefix="/api/cv", tags=["Resume"])

@app.get("/")
def root():
    return {"message": "MadHelp backend is live!"}
