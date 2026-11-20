from typing import Literal
from pydantic import BaseModel, Field

class TransactionRequest(BaseModel):
    step: int = Field(..., ge=1, description="Jam simulasi transaksi (>= 1)")
    type: Literal["TRANSFER", "CASH_OUT", "PAYMENT", "CASH_IN", "DEBIT"]
    amount: float = Field(..., gt=0, description="Nominal transaksi harus lebih dari 0")
    oldbalanceOrg: float = Field(..., ge=0)
    newbalanceOrig: float = Field(..., ge=0)
    oldbalanceDest: float = Field(..., ge=0)
    newbalanceDest: float = Field(..., ge=0)

    model_config = {
        "json_schema_extra": {
            "example": {
                "step": 215,
                "type": "TRANSFER",
                "amount": 450000.0,
                "oldbalanceOrg": 450000.0,
                "newbalanceOrig": 450000.0,
                "oldbalanceDest": 0.0,
                "newbalanceDest": 0.0
            }
        }
    }

class PredictionResponse(BaseModel):
    model_config = {"protected_namespaces": ()}

    model_version: str
    risk_level: Literal["LOW", "MEDIUM", "HIGH"]
    fraud_probability: float
    anomaly_score: float
    is_unsupervised_anomaly: bool
    decision_reason: str