from fastapi import FastAPI
from routes.dars_routes import router as dars_router
from routes.resume_routes import router as resume_router

app = FastAPI()

app.include_router(dars_router, prefix="/api/dars")
app.include_router(resume_router, prefix="/api/cv")

@app.get("/")
def root():
    return {"message": "MadHelp backend is live!"}
