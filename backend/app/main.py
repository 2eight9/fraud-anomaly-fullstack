from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.schemas import TransactionRequest, PredictionResponse
from app.ml_service import fraud_service

@asynccontextmanager
async def lifespan(app: FastAPI):
    fraud_service.load_artifacts()
    yield

app = FastAPI(
    title="Hybrid Fraud & Anomaly Detection API",
    version="2.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "model_version": fraud_service.metadata["model_version"]
    }

@app.post("/api/v1/predict", response_model=PredictionResponse)
def predict_transaction(transaction: TransactionRequest):
    try:
        return fraud_service.predict(transaction)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")