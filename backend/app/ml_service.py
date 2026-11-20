import json
import warnings
from pathlib import Path
import joblib
import pandas as pd
from app.schemas import TransactionRequest, PredictionResponse

warnings.filterwarnings("ignore", category=UserWarning, module="sklearn")

BASE_DIR = Path(__file__).resolve().parent.parent
ARTIFACTS_DIR = BASE_DIR / "artifacts"

class FraudDetectionService:
    def __init__(self):
        self.lgb_pipeline = None
        self.iso_pipeline = None
        self.metadata = None

    def load_artifacts(self):
        with open(ARTIFACTS_DIR / "model_metadata.json", "r") as f:
            self.metadata = json.load(f)

        self.lgb_pipeline = joblib.load(ARTIFACTS_DIR / "fraud_lgb_pipeline.joblib")
        self.iso_pipeline = joblib.load(ARTIFACTS_DIR / "fraud_iso_pipeline.joblib")

    @staticmethod
    def add_domain_features(df: pd.DataFrame) -> pd.DataFrame:
        d = df.copy()
        d["hour_of_day"] = d["step"] % 24
        d["errorBalanceOrig"] = d["newbalanceOrig"] + d["amount"] - d["oldbalanceOrg"]
        d["errorBalanceDest"] = d["oldbalanceDest"] + d["amount"] - d["newbalanceDest"]
        d["is_orig_drained"] = ((d["oldbalanceOrg"] > 0) & (d["newbalanceOrig"] == 0)).astype(int)
        d["is_dest_unchanged"] = (
            (d["amount"] > 0) & (d["oldbalanceDest"] == 0) & (d["newbalanceDest"] == 0)
        ).astype(int)
        return d

    def predict(self, payload: TransactionRequest) -> PredictionResponse:
        allowed_types = self.metadata["allowed_transaction_types"]

        # Jalur cepat: transaksi di luar TRANSFER & CASH_OUT langsung dianggap aman
        if payload.type not in allowed_types:
            return PredictionResponse(
                model_version=self.metadata["model_version"],
                risk_level="LOW",
                fraud_probability=0.0,
                anomaly_score=-1.0,
                is_unsupervised_anomaly=False,
                decision_reason=f"Tipe transaksi {payload.type} berada di luar cakupan risiko tinggi."
            )

        df_raw = pd.DataFrame([payload.model_dump()])
        df_feat = self.add_domain_features(df_raw)

        fraud_prob = float(self.lgb_pipeline.predict_proba(df_feat)[0, 1])
        anomaly_score = float(-self.iso_pipeline.decision_function(df_feat)[0])

        thresholds = self.metadata["thresholds"]
        is_anomaly = anomaly_score >= thresholds["iso_anomaly_cutoff"]

        if fraud_prob >= thresholds["lgb_high_risk_prob"]:
            risk_level = "HIGH"
            reason = "Probabilitas fraud tinggi terdeteksi oleh model utama (LightGBM)."
        elif fraud_prob >= thresholds["lgb_medium_risk_prob"] or is_anomaly:
            risk_level = "MEDIUM"
            reason = (
                "Pola anomali terdeteksi oleh Isolation Forest meski probabilitas supervised moderat."
                if is_anomaly else "Probabilitas fraud berada pada ambang batas sedang."
            )
        else:
            risk_level = "LOW"
            reason = "Pola transaksi dan selisih saldo berada dalam batas normal."

        return PredictionResponse(
            model_version=self.metadata["model_version"],
            risk_level=risk_level,
            fraud_probability=round(fraud_prob, 4),
            anomaly_score=round(anomaly_score, 6),
            is_unsupervised_anomaly=is_anomaly,
            decision_reason=reason
        )

fraud_service = FraudDetectionService()