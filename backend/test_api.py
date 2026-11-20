from fastapi.testclient import TestClient
from app.main import app


def test_health_check():
    with TestClient(app) as client:
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


def test_predict_high_risk():
    payload = {
        "step": 215,
        "type": "TRANSFER",
        "amount": 450000.0,
        "oldbalanceOrg": 450000.0,
        "newbalanceOrig": 450000.0,
        "oldbalanceDest": 0.0,
        "newbalanceDest": 0.0
    }
    with TestClient(app) as client:
        response = client.post("/api/v1/predict", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["risk_level"] == "HIGH"