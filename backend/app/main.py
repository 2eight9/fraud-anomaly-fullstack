from contextlib import asynccontextmanager
from typing import List
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.schemas import TransactionRequest, PredictionResponse, PredictionLogOut
from app.ml_service import fraud_service
from app.database import engine, Base, get_db
from app.models import PredictionLog

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
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
def predict_transaction(transaction: TransactionRequest, db: Session = Depends(get_db)):
    try:
        result = fraud_service.predict(transaction)

        log_entry = PredictionLog(
            step=transaction.step,
            transaction_type=transaction.type,
            amount=transaction.amount,
            oldbalance_org=transaction.oldbalanceOrg,
            newbalance_orig=transaction.newbalanceOrig,
            oldbalance_dest=transaction.oldbalanceDest,
            newbalance_dest=transaction.newbalanceDest,
            model_version=result.model_version,
            risk_level=result.risk_level,
            fraud_probability=result.fraud_probability,
            anomaly_score=result.anomaly_score,
            is_unsupervised_anomaly=result.is_unsupervised_anomaly,
            decision_reason=result.decision_reason
        )
        db.add(log_entry)
        db.commit()

        return result
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Inference/DB error: {str(e)}")

@app.get("/api/v1/history", response_model=List[PredictionLogOut])
def get_prediction_history(limit: int = 20, db: Session = Depends(get_db)):
    logs = (
        db.query(PredictionLog)
        .order_by(PredictionLog.created_at.desc())
        .limit(limit)
        .all()
    )
    return logs

@app.get("/api/v1/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    total = db.query(func.count(PredictionLog.id)).scalar() or 0
    high_risk = db.query(func.count(PredictionLog.id)).filter(PredictionLog.risk_level == "HIGH").scalar() or 0
    medium_risk = db.query(func.count(PredictionLog.id)).filter(PredictionLog.risk_level == "MEDIUM").scalar() or 0
    low_risk = db.query(func.count(PredictionLog.id)).filter(PredictionLog.risk_level == "LOW").scalar() or 0

    return {
        "total_checked": total,
        "high_risk": high_risk,
        "medium_risk": medium_risk,
        "low_risk": low_risk
    }