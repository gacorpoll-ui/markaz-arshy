import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LineChart, DollarSign, Cpu, Clock, ChevronLeft, Download, Filter } from 'lucide-react';
import AIUsageChart from '../components/AIUsageChart';

/**
 * AI Usage Analytics Page — Global usage dashboard with per-key filter
 */
export default function AIUsageAnalyticsPage({ user, token }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [apiKeys, setApiKeys] = useState([]);
  const [selectedKeyId, setSelectedKeyId] = useState(location.state?.selectedKeyId || '');
  const [timeframe, setTimeframe] = useState('7d');
  const [summary, setSummary] = useState(null);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchKeys();
  }, [user]);

  // Auto-refresh usage data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (user && !loading) fetchUsageData();
    }, 30000);
    return () => clearInterval(interval);
  }, [user, loading, selectedKeyId, timeframe]);

  useEffect(() => {
    if (user) fetchUsageData();
  }, [selectedKeyId, timeframe, user]);

  const fetchKeys = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/ai-router/keys`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setApiKeys(data);
    } catch (err) {
      console.error('Error fetching keys:', err);
    }
  };

  const fetchUsageData = async () => {
    setLoading(true);
    setError('');
    try {
      const endDate = new Date();
      const startDate = new Date();
      if (timeframe === '7d') startDate.setDate(endDate.getDate() - 7);
      else if (timeframe === '30d') startDate.setDate(endDate.getDate() - 30);

      const params = new URLSearchParams();
      if (selectedKeyId) params.set('apiKeyId', selectedKeyId);
      if (timeframe !== 'all') {
        params.set('startDate', startDate.toISOString());
        params.set('endDate', endDate.toISOString());
      }

      const [summaryRes, logsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_BASE_URL}/api/ai-router/usage/summary?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${import.meta.env.VITE_API_BASE_URL}/api/ai-router/usage/logs?${params}&limit=100`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setSummary(await summaryRes.json());
      setLogs(await logsRes.json());
    } catch (err) {
      console.error('Error fetching usage:', err);
      setError('Gagal memuat data usage');
    } finally {
      setLoading(false);
    }
  };

  const getPriceColor = (cost) => {
    if (cost > 7500) return '#ef4444';
    if (cost > 1500) return '#facc15';
    return '#22c55e';
  };

  const formatNumber = (n) => (n || 0).toLocaleString();

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <button onClick={() => navigate('/dashboard/ai-keys')} className="btn-text" style={{ marginBottom: '20px' }}>
          <ChevronLeft size={18} /> Kembali ke API Keys
        </button>
        <h1 style={{ fontFamily: 'var(--font-title)', fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>
          📊 Usage Analytics
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          Pantau penggunaan AI secara global atau filter per API key.
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '30px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Key Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} style={{ color: 'var(--text-muted)' }} />
          <select
            value={selectedKeyId}
            onChange={(e) => setSelectedKeyId(e.target.value)}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px',
              color: 'var(--text-primary)',
              fontSize: '14px',
              cursor: 'pointer',
              minWidth: '200px',
            }}
          >
            <option value="">Semua API Keys</option>
            {apiKeys.map(k => (
              <option key={k.id} value={k.id}>{k.keyName} ({k.apiKey.slice(0, 15)}...)</option>
            ))}
          </select>
        </div>

        {/* Timeframe */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { val: '7d', label: '7 Hari' },
            { val: '30d', label: '30 Hari' },
            { val: 'all', label: 'Semua' },
          ].map(opt => (
            <button
              key={opt.val}
              onClick={() => setTimeframe(opt.val)}
              className={timeframe === opt.val ? 'btn btn-primary' : 'btn btn-secondary'}
              style={{ padding: '10px 18px', fontSize: '13px' }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          Loading usage data...
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#ef4444' }}>{error}</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '30px' }}>
            <div className="glass-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Cpu size={18} style={{ color: 'var(--color-primary)' }} />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Requests</span>
              </div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)' }}>
                {formatNumber(summary?.totalRequests)}
              </div>
            </div>

            <div className="glass-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <LineChart size={18} style={{ color: 'var(--color-secondary)' }} />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Tokens</span>
              </div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)' }}>
                {formatNumber(summary?.totalTokens)}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                In: {formatNumber(summary?.inputTokens)} / Out: {formatNumber(summary?.outputTokens)}
              </div>
            </div>

            <div className="glass-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <DollarSign size={18} style={{ color: 'var(--color-success)' }} />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Biaya</span>
              </div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: getPriceColor(summary?.totalCost || 0) }}>
                Rp {Math.ceil(summary?.totalCost || 0).toLocaleString('id-ID')}
              </div>
            </div>

            <div className="glass-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Clock size={18} style={{ color: '#f59e0b' }} />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Models</span>
              </div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-primary)' }}>
                {summary?.byModel?.length || 0}
              </div>
            </div>
          </div>

          {/* Per-Model Breakdown */}
          {summary?.byModel?.length > 0 && (
            <div className="glass-card" style={{ padding: '24px', marginBottom: '30px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Usage per Model</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
                {summary.byModel.map((m, i) => (
                  <div key={i} style={{
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '16px',
                  }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
                      {m.model.name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      {m.requestCount} requests · {formatNumber(m.totalTokens)} tokens
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: getPriceColor(m.totalCost) }}>
                      Rp {Math.ceil(m.totalCost).toLocaleString('id-ID')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chart */}
          {summary?.chartData?.length > 0 && (
            <div className="glass-card" style={{ padding: '24px', marginBottom: '30px' }}>
              <AIUsageChart data={summary.chartData} title="Daily Usage Overview" />
            </div>
          )}

          {/* Logs Table */}
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px' }}>Recent Requests</h2>
          {logs.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '40px', color: 'var(--text-muted)',
              background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)',
            }}>
              <Clock size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
              <p>Belum ada usage data.</p>
            </div>
          ) : (
            <div className="glass-card" style={{ padding: '0', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '12px 14px', textAlign: 'left', color: 'var(--text-muted)' }}>Waktu</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left', color: 'var(--text-muted)' }}>Key</th>
                    <th style={{ padding: '12px 14px', textAlign: 'left', color: 'var(--text-muted)' }}>Model</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--text-muted)' }}>Tokens</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--text-muted)' }}>Biaya</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--text-muted)' }}>Latency</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--text-muted)' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 14px', color: 'var(--text-primary)' }}>
                        {new Date(log.createdAt).toLocaleString('id-ID')}
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '12px' }}>
                        {log.apiKey?.keyName || '-'}
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-primary)' }}>
                        <span style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontWeight: '600' }}>{log.actualModel || log.model?.modelId || '-'}</span>
                          {log.actualModel && log.actualModel !== log.model?.modelId && (
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>via {log.model?.name || log.model?.modelId}</span>
                          )}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--text-primary)' }}>
                        {formatNumber(log.totalTokens)}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', color: getPriceColor(log.totalCost) }}>
                        Rp {Math.ceil(log.totalCost).toLocaleString('id-ID')}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--text-muted)' }}>
                        {log.latencyMs}ms
                      </td>
                      <td style={{
                        padding: '12px 14px', textAlign: 'right',
                        color: log.statusCode >= 200 && log.statusCode < 300 ? '#22c55e' : '#ef4444',
                      }}>
                        {log.statusCode}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
