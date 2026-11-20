from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from app.database import Base

class PredictionLog(Base):
    __tablename__ = "prediction_logs"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Data input transaksi
    step = Column(Integer, nullable=False)
    transaction_type = Column(String(20), nullable=False)
    amount = Column(Float, nullable=False)
    oldbalance_org = Column(Float, nullable=False)
    newbalance_orig = Column(Float, nullable=False)
    oldbalance_dest = Column(Float, nullable=False)
    newbalance_dest = Column(Float, nullable=False)

    # Hasil deteksi model hybrid
    model_version = Column(String(50), nullable=False)
    risk_level = Column(String(10), index=True, nullable=False)
    fraud_probability = Column(Float, nullable=False)
    anomaly_score = Column(Float, nullable=False)
    is_unsupervised_anomaly = Column(Boolean, nullable=False)
    decision_reason = Column(String(255), nullable=False)