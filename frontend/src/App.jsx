import { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Activity,
  RefreshCw,
  Send,
  Database,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:8000';

const INITIAL_FORM = {
  step: 215,
  type: 'TRANSFER',
  amount: 450000,
  oldbalanceOrg: 450000,
  newbalanceOrig: 450000,
  oldbalanceDest: 0,
  newbalanceDest: 0,
};

export default function App() {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [prediction, setPrediction] = useState(null);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({
    total_checked: 0,
    high_risk: 0,
    medium_risk: 0,
    low_risk: 0,
  });
  const [health, setHealth] = useState({ status: 'checking', model_version: '-' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchDashboardData = useCallback(async () => {
    try {
      const [healthRes, statsRes, historyRes] = await Promise.all([
        fetch(`${API_BASE_URL}/health`),
        fetch(`${API_BASE_URL}/api/v1/stats`),
        fetch(`${API_BASE_URL}/api/v1/history?limit=15`),
      ]);

      if (!healthRes.ok || !statsRes.ok || !historyRes.ok) {
        throw new Error('Gagal mengambil data dari server FastAPI.');
      }

      const [healthData, statsData, historyData] = await Promise.all([
        healthRes.json(),
        statsRes.json(),
        historyRes.json(),
      ]);

      setHealth(healthData);
      setStats(statsData);
      setHistory(historyData);
      setError('');
    } catch {
      setHealth({ status: 'offline', model_version: '-' });
      setError(
        'Tidak dapat terhubung ke backend FastAPI (http://127.0.0.1:8000). Pastikan server Uvicorn sedang menyala.'
      );
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'type' ? value : value,
    }));
  };

  const applyPreset = (presetType) => {
    setPrediction(null);
    if (presetType === 'FRAUD') {
      setFormData({
        step: 215,
        type: 'TRANSFER',
        amount: 450000,
        oldbalanceOrg: 450000,
        newbalanceOrig: 450000,
        oldbalanceDest: 0,
        newbalanceDest: 0,
      });
    } else {
      setFormData({
        step: 220,
        type: 'PAYMENT',
        amount: 25000,
        oldbalanceOrg: 150000,
        newbalanceOrig: 125000,
        oldbalanceDest: 10000,
        newbalanceDest: 35000,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const payload = {
      step: Number(formData.step),
      type: formData.type,
      amount: Number(formData.amount),
      oldbalanceOrg: Number(formData.oldbalanceOrg),
      newbalanceOrig: Number(formData.newbalanceOrig),
      oldbalanceDest: Number(formData.oldbalanceDest),
      newbalanceDest: Number(formData.newbalanceDest),
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Terjadi kesalahan saat memproses prediksi.');
      }

      setPrediction(data);
      await fetchDashboardData();
    } catch (err) {
      setError(err.message || 'Gagal mengirim transaksi ke API.');
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadge = (level) => {
    switch (level) {
      case 'HIGH':
        return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      default:
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    }
  };

  const formatNumber = (num) =>
    new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                Hybrid Fraud & Anomaly Detection
              </h1>
              <p className="text-xs text-slate-400">
                Supervised XGBoost + Unsupervised Isolation Forest • PostgreSQL Log
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-mono">
              Model: {health.model_version}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium ${
                health.status === 'healthy'
                  ? 'bg-emerald-950/60 border-emerald-700/50 text-emerald-400'
                  : 'bg-rose-950/60 border-rose-700/50 text-rose-400'
              }`}
            >
              {health.status === 'healthy' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" /> API Online
                </>
              ) : (
                <>
                  <XCircle className="w-3.5 h-3.5" /> API Offline
                </>
              )}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Error Banner */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-200 text-sm flex items-center justify-between gap-4">
            <span>{error}</span>
            <button
              onClick={fetchDashboardData}
              className="px-3 py-1.5 rounded-lg bg-rose-800 hover:bg-rose-700 text-white text-xs font-medium shrink-0"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* KPI Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-sm">
              <span>Total Diperiksa</span>
              <Database className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="mt-3 text-3xl font-bold text-white">{stats.total_checked}</p>
            <p className="mt-1 text-xs text-slate-500">Tersimpan di PostgreSQL</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-sm">
              <span>Risiko Tinggi (Fraud)</span>
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            </div>
            <p className="mt-3 text-3xl font-bold text-rose-400">{stats.high_risk}</p>
            <p className="mt-1 text-xs text-slate-500">Perlu pemblokiran / tinjauan</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-sm">
              <span>Risiko Sedang (Anomali)</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <p className="mt-3 text-3xl font-bold text-amber-400">{stats.medium_risk}</p>
            <p className="mt-1 text-xs text-slate-500">Pola perilaku tidak biasa</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 text-sm">
              <span>Risiko Rendah (Normal)</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="mt-3 text-3xl font-bold text-emerald-400">{stats.low_risk}</p>
            <p className="mt-1 text-xs text-slate-500">Transaksi wajar terverifikasi</p>
          </div>
        </section>

        {/* Form Simulasi + Hasil Deteksi */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form Input */}
          <div className="lg:col-span-7 p-6 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
              <div>
                <h2 className="text-base font-semibold text-white">Simulasi Transaksi Baru</h2>
                <p className="text-xs text-slate-400">
                  Masukkan parameter transaksi untuk dianalisis secara real-time
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset('FRAUD')}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 transition"
                >
                  Isi Contoh Fraud
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('NORMAL')}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition"
                >
                  Isi Contoh Normal
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Step (Jam ke-)
                  </label>
                  <input
                    type="number"
                    name="step"
                    min="1"
                    required
                    value={formData.step}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Tipe Transaksi
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="TRANSFER">TRANSFER</option>
                    <option value="CASH_OUT">CASH_OUT</option>
                    <option value="PAYMENT">PAYMENT</option>
                    <option value="CASH_IN">CASH_IN</option>
                    <option value="DEBIT">DEBIT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Nominal (Amount)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    name="amount"
                    required
                    value={formData.amount}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Saldo Awal Pengirim (oldbalanceOrg)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    name="oldbalanceOrg"
                    required
                    value={formData.oldbalanceOrg}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Saldo Akhir Pengirim (newbalanceOrig)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    name="newbalanceOrig"
                    required
                    value={formData.newbalanceOrig}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Saldo Awal Penerima (oldbalanceDest)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    name="oldbalanceDest"
                    required
                    value={formData.oldbalanceDest}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Saldo Akhir Penerima (newbalanceDest)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    name="newbalanceDest"
                    required
                    value={formData.newbalanceDest}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm inline-flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
                {loading ? 'Menganalisis Transaksi...' : 'Analisis & Simpan ke Database'}
              </button>
            </form>
          </div>

          {/* Hasil Analisis AI */}
          <div className="lg:col-span-5 p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-base font-semibold text-white">Hasil Deteksi Hybrid AI</h2>
                  <p className="text-xs text-slate-400">Output gabungan klasifikasi & anomali</p>
                </div>
                <Activity className="w-5 h-5 text-indigo-400" />
              </div>

              {prediction ? (
                <div className="space-y-5">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <span className="text-sm text-slate-400">Status Risiko</span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${getRiskBadge(
                        prediction.risk_level
                      )}`}
                    >
                      {prediction.risk_level} RISK
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                      <p className="text-xs text-slate-400">Probabilitas Fraud</p>
                      <p className="mt-1 text-2xl font-bold text-white">
                        {(prediction.fraud_probability * 100).toFixed(2)}%
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                      <p className="text-xs text-slate-400">Anomaly Score</p>
                      <p className="mt-1 text-2xl font-bold text-white">
                        {prediction.anomaly_score.toFixed(4)}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Deteksi Anomali Unsupervised:</span>
                      <span
                        className={`font-semibold ${
                          prediction.is_unsupervised_anomaly ? 'text-amber-400' : 'text-slate-300'
                        }`}
                      >
                        {prediction.is_unsupervised_anomaly ? 'Ya (Outlier)' : 'Tidak (Normal)'}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-slate-800">
                      <p className="text-xs text-slate-400 mb-1">Alasan Keputusan Model:</p>
                      <p className="text-sm text-slate-200 leading-relaxed">
                        {prediction.decision_reason}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-64 rounded-xl border border-dashed border-slate-800 flex flex-col items-center justify-center text-center p-6">
                  <ShieldCheck className="w-10 h-10 text-slate-600 mb-3" />
                  <p className="text-sm font-medium text-slate-300">Belum ada transaksi diuji</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Klik tombol contoh di sebelah kiri lalu tekan Analisis untuk melihat skor AI.
                  </p>
                </div>
              )}
            </div>

            <p className="mt-6 text-[11px] text-slate-500 text-right">
              Setiap hasil analisis otomatis dicatat ke tabel <code className="text-slate-400">prediction_logs</code>
            </p>
          </div>
        </section>

        {/* Tabel Riwayat PostgreSQL */}
        <section className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-indigo-400" />
              <div>
                <h2 className="text-base font-semibold text-white">
                  Riwayat Pemeriksaan Transaksi (PostgreSQL)
                </h2>
                <p className="text-xs text-slate-400">15 log prediksi terbaru dari database</p>
              </div>
            </div>
            <button
              onClick={fetchDashboardData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs uppercase text-slate-400">
                  <th className="py-3 px-3">ID</th>
                  <th className="py-3 px-3">Waktu</th>
                  <th className="py-3 px-3">Tipe</th>
                  <th className="py-3 px-3 text-right">Nominal</th>
                  <th className="py-3 px-3 text-right">Prob. Fraud</th>
                  <th className="py-3 px-3 text-right">Anomaly Score</th>
                  <th className="py-3 px-3">Risiko</th>
                  <th className="py-3 px-3">Alasan Keputusan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-sm">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-500 text-xs">
                      Belum ada riwayat transaksi di database.
                    </td>
                  </tr>
                ) : (
                  history.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3 font-mono text-xs text-slate-400">#{item.id}</td>
                      <td className="py-3 px-3 text-xs text-slate-300 whitespace-nowrap">
                        {new Date(item.created_at).toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-xs font-mono text-slate-200">
                          {item.transaction_type}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-200">
                        {formatNumber(item.amount)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-200">
                        {(item.fraud_probability * 100).toFixed(2)}%
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-300">
                        {item.anomaly_score.toFixed(4)}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getRiskBadge(
                            item.risk_level
                          )}`}
                        >
                          {item.risk_level}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-xs text-slate-300 max-w-xs truncate">
                        {item.decision_reason}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}