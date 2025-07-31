from fastapi import FastAPI
from app.routes.dars_routes import router as dars_router

app = FastAPI()

app.include_router(dars_router, prefix="/api/dars", tags=["DARS"])

@app.get("/")
def root():
    return {"message": "MadHelp backend is live!"}
