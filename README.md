# Hybrid Fraud & Anomaly Detection System

Sistem deteksi penipuan (*fraud*) dan anomali transaksi keuangan secara *real-time* berbasis **Full-Stack Machine Learning**. Proyek ini menggabungkan pendekatan **Supervised Learning** (klasifikasi pola *fraud* yang diketahui) dan **Unsupervised Learning** (deteksi *outlier* atau perilaku tidak biasa yang belum pernah terlihat sebelumnya), dilengkapi penyimpanan riwayat ke **PostgreSQL**, antarmuka **React + Tailwind CSS**, serta pengujian otomatis **GitHub Actions CI/CD**.

---

## Fitur Utama

* **Hybrid AI Detection Engine (`paysim_hybrid_v2`)**: Menghitung probabilitas *fraud* sekaligus skor anomali (*anomaly score*) untuk mengklasifikasikan transaksi ke dalam tiga tingkat risiko: **LOW**, **MEDIUM**, dan **HIGH**.
* **Interactive Real-Time Dashboard**: Antarmuka modern untuk menyimulasikan parameter transaksi, melihat alasan keputusan model (*explainable decision reason*), serta memantau ringkasan statistik KPI secara langsung.
* **PostgreSQL Audit Trail**: Setiap transaksi yang dianalisis otomatis dicatat ke dalam database relasional PostgreSQL (`prediction_logs`) lengkap dengan stempel waktu dan skor prediksi.
* **RESTful API & Swagger UI**: Dokumentasi API interaktif bawaan FastAPI (`/docs`) dengan validasi skema ketat menggunakan Pydantic.
* **Automated CI/CD Pipeline**: Pengujian otomatis menggunakan `pytest` melalui GitHub Actions setiap kali terjadi `push` atau `pull request` ke repositori.

---

##  Tech Stack

| Layer | Teknologi |
| :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS, Lucide Icons |
| **Backend** | Python 3.11, FastAPI, Uvicorn, Pydantic |
| **Machine Learning** | Scikit-Learn, XGBoost, Pandas, NumPy, Joblib |
| **Database** | PostgreSQL 17/18, SQLAlchemy ORM (dengan *fallback* SQLite untuk CI) |
| **DevOps & Testing** | GitHub Actions, Pytest, HTTPX |

---

## 📁 Struktur Direktori

```text
fraud-anomaly-fullstack/
├── .github/
│   └── workflows/
│       └── backend-ci.yml      # Pipeline CI/CD otomatis (Pytest)
├── backend/
│   ├── app/
│   │   ├── database.py         # Konfigurasi koneksi PostgreSQL & SQLAlchemy
│   │   ├── main.py             # Entrypoint aplikasi & routing API FastAPI
│   │   ├── ml_service.py       # Logika inferensi model Hybrid ML
│   │   ├── models.py           # Definisi tabel database (prediction_logs)
│   │   └── schemas.py          # Skema validasi request & response Pydantic
│   ├── artifacts/              # File model & scaler terlatih (.joblib / .json)
│   ├── requirements.txt        # Daftar dependensi Python
│   └── test_api.py             # Unit & integration test untuk endpoint API
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Komponen utama dashboard & integrasi API
│   │   └── index.css           # Konfigurasi Tailwind CSS
│   ├── package.json            # Dependensi Node.js & skrip Vite
│   └── vite.config.js          # Konfigurasi bundler Vite & Tailwind
├── notebooks/                  # Eksplorasi data & pelatihan model ML (PaySim)
├── .gitignore
└── README.md
```

---

##  Cara Menjalankan Proyek Secara Lokal

### 1. Prasyarat
* **Python 3.11+**
* **Node.js 20+**
* **PostgreSQL** aktif di port `5432` dengan database bernama `fraud_anomaly_db`

### 2. Menjalankan Backend (FastAPI + PostgreSQL)
Buka terminal dan masuk ke folder `backend`:

```bash
cd backend
```

Aktifkan *virtual environment* dan instal dependensi:

```bash
# Windows (PowerShell)
..\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Buat file `.env` di dalam folder `backend/` dan sesuaikan kredensial PostgreSQL Anda:

```env
DATABASE_URL=postgresql://postgres:PASSWORD_ANDA@localhost:5432/fraud_anomaly_db
```

Jalankan server FastAPI:

```bash
uvicorn app.main:app --reload
```
* Server berjalan di: `http://127.0.0.1:8000`
* Dokumentasi Swagger UI: `http://127.0.0.1:8000/docs`

### 3. Menjalankan Frontend (React + Tailwind CSS)
Buka tab terminal baru, masuk ke folder `frontend`, instal paket, dan jalankan server pengembangan:

```bash
cd frontend
npm install
npm run dev
```
* Buka dashboard di browser: `http://localhost:5173`

---

## 📡 Daftar Endpoint API

| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| `GET` | `/health` | Memeriksa status server API dan versi model aktif |
| `POST` | `/api/v1/predict` | Menganalisis transaksi baru dan menyimpan hasilnya ke PostgreSQL |
| `GET` | `/api/v1/history` | Mengambil riwayat pemeriksaan transaksi terbaru dari database |
| `GET` | `/api/v1/stats` | Mengambil agregasi jumlah transaksi berdasarkan tingkat risiko |

### Contoh Payload `POST /api/v1/predict`
```json
{
  "step": 215,
  "type": "TRANSFER",
  "amount": 450000.0,
  "oldbalanceOrg": 450000.0,
  "newbalanceOrig": 450000.0,
  "oldbalanceDest": 0.0,
  "newbalanceDest": 0.0
}
```

---

## 🧪 Pengujian Otomatis (Testing)

Untuk menjalankan pengujian endpoint API secara lokal menggunakan `pytest`:

```bash
cd backend
pytest
```