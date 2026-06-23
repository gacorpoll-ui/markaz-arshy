import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LineChart, DollarSign, Cpu, Clock, ChevronLeft, ChevronDown, Download, Filter, Activity, Zap, TrendingUp, Info, X } from 'lucide-react';
import AIUsageChart from '../components/AIUsageChart';
import { useAISSE } from '../hooks/useAISSE';

// ═══════════════════════════════════════
// Utility functions (stable)
// ═══════════════════════════════════════
const formatNumber = (n) => (n || 0).toLocaleString();
const formatCost = (cost) => `Rp ${Math.ceil(cost || 0).toLocaleString('id-ID')}`;
const formatTime = (date) => new Date(date).toLocaleString('id-ID');
const formatLatency = (ms) => ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;

const getPriceColor = (cost) => {
  if (cost > 7500) return '#ef4444';
  if (cost > 1500) return '#facc15';
  return '#22c55e';
};

const getStatusColor = (code) => code >= 200 && code < 300 ? '#22c55e' : code >= 400 ? '#ef4444' : '#f59e0b';

// ═══════════════════════════════════════
// Skeleton Loading
// ═══════════════════════════════════════
function UsageSkeleton() {
  const s = {
    background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 75%)',
    backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', borderRadius: 'var(--radius-sm)',
  };
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '30px' }}>
        {[1,2,3,4].map(i => (
          <div key={i} className="glass-card" style={{ padding: '20px' }}>
            <div style={{ ...s, width: '60px', height: '12px', marginBottom: '12px' }} />
            <div style={{ ...s, width: '100px', height: '28px', marginBottom: '8px' }} />
            <div style={{ ...s, width: '80px', height: '10px' }} />
          </div>
        ))}
      </div>
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ ...s, width: '150px', height: '18px', marginBottom: '20px' }} />
        {[1,2,3,4,5].map(i => <div key={i} style={{ ...s, width: '100%', height: '40px', marginBottom: '8px' }} />)}
      </div>
      <style>{`@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`}</style>
    </div>
  );
}

// ═══════════════════════════════════════
// Cost Breakdown Modal (uses snapshot pricing)
// ═══════════════════════════════════════
function CostBreakdown({ log, onClose }) {
  const p = log.pricing;
  if (!p) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', padding: '28px', maxWidth: '480px', width: '100%', border: '1px solid var(--border-color)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>Rincian Biaya</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{log.requestedModel || log.actualModel || log.model?.modelId} — {formatTime(log.createdAt)}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}><X size={20} /></button>
        </div>

        {/* Pricing Formula */}
        <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-sm)', padding: '14px', marginBottom: '20px', fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.8, wordBreak: 'break-all' }}>
          <div style={{ color: 'var(--text-muted)', marginBottom: '6px', fontFamily: 'var(--font-primary)', fontSize: '10px', textTransform: 'uppercase', fontWeight: '600' }}>Formula Perhitungan</div>
          <div><span style={{ color: 'var(--color-secondary)' }}>Input:</span> {formatNumber(log.inputTokens)} tokens x Rp{formatNumber(p.inputPricePer1K)}/1K</div>
          <div><span style={{ color: '#a855f7' }}>Output:</span> {formatNumber(log.outputTokens)} tokens x Rp{formatNumber(p.outputPricePer1K)}/1K</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(79,172,254,0.06)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(79,172,254,0.1)' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-secondary)' }}>Input Tokens</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{formatNumber(log.inputTokens)} tokens x Rp{formatNumber(p.inputPricePer1K)}/1K</div>
            </div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-secondary)' }}>{formatCost(p.calculatedInputCost)}</div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(168,85,247,0.06)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(168,85,247,0.1)' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#a855f7' }}>Output Tokens</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{formatNumber(log.outputTokens)} tokens x Rp{formatNumber(p.outputPricePer1K)}/1K</div>
            </div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#a855f7' }}>{formatCost(p.calculatedOutputCost)}</div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', margin: '4px 0' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(16,185,129,0.06)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16,185,129,0.1)' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>Total Biaya</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{formatNumber(log.totalTokens)} total tokens</div>
            </div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: getPriceColor(log.totalCost) }}>{formatCost(log.totalCost)}</div>
          </div>
        </div>

        <div style={{ marginTop: '16px', padding: '10px 14px', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          <div>Harga saat request: Input Rp{formatNumber(p.inputPricePer1K)}/1K | Output Rp{formatNumber(p.outputPricePer1K)}/1K</div>
          <div>Latency: {formatLatency(log.latencyMs)} | Status: {log.statusCode}</div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// Log Row (memoized)
// ═══════════════════════════════════════
const LogRow = React.memo(function LogRow({ log, index, onShowBreakdown }) {
  return (
    <tr style={{ borderBottom: '1px solid var(--border-color)', background: index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(79,172,254,0.04)'}
      onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)'}
    >
      <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', fontSize: '12px' }}>{formatTime(log.createdAt)}</td>
      <td style={{ padding: '12px 14px' }}>
        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', background: 'rgba(79,172,254,0.1)', color: 'var(--color-secondary)', fontFamily: 'monospace', fontSize: '11px' }}>
          {log.apiKey?.keyName || log.keyName || '-'}
        </span>
      </td>
      <td style={{ padding: '12px 14px', color: 'var(--text-primary)' }}>
        <div style={{ fontWeight: '600', fontSize: '13px' }}>{log.requestedModel || log.actualModel || log.model?.modelId || '-'}</div>
        {log.actualModel && log.actualModel !== log.requestedModel && (
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>via {log.model?.name || log.model?.modelId}</div>
        )}
      </td>
      <td style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '12px' }}>
        <div>{formatNumber(log.inputTokens || 0)}</div>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>down {formatNumber(log.outputTokens || 0)}</div>
      </td>
      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
        <button onClick={() => onShowBreakdown(log)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'none'} title="Lihat rincian biaya">
          <span style={{ fontWeight: '600', color: getPriceColor(log.totalCost), fontSize: '13px' }}>{formatCost(log.totalCost)}</span>
          <Info size={12} style={{ color: 'var(--text-muted)' }} />
        </button>
      </td>
      <td style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--text-muted)', fontSize: '12px' }}>{formatLatency(log.latencyMs)}</td>
      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: '600', background: getStatusColor(log.statusCode) === '#22c55e' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: getStatusColor(log.statusCode) }}>
          {log.statusCode}
        </span>
      </td>
    </tr>
  );
});

// ═══════════════════════════════════════
// Summary Card (memoized)
// ═══════════════════════════════════════
const SummaryCard = React.memo(function SummaryCard({ icon: Icon, label, value, subValue, color, subColor }) {
  return (
    <div className="glass-card" style={{ padding: '20px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: `linear-gradient(90deg, ${color}, transparent)`, opacity: 0.6 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <Icon size={16} style={{ color }} />
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>{label}</span>
      </div>
      <div style={{ fontSize: '26px', fontWeight: '700', color: 'var(--text-primary)', lineHeight: 1.2 }}>{value}</div>
      {subValue && <div style={{ fontSize: '11px', color: subColor || 'var(--text-muted)', marginTop: '4px' }}>{subValue}</div>}
    </div>
  );
});

// ═══════════════════════════════════════
// Main Component
// ═══════════════════════════════════════
export default function AIUsageAnalyticsPage({ user, token }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [apiKeys, setApiKeys] = useState([]);
  const [selectedKeyId, setSelectedKeyId] = useState(location.state?.selectedKeyId || '');
  const [timeframe, setTimeframe] = useState('7d');
  const [summary, setSummary] = useState(null);
  const [logs, setLogs] = useState([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsOffset, setLogsOffset] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [sseStatus, setSseStatus] = useState('disconnected');
  const [breakdownLog, setBreakdownLog] = useState(null);
  const LOGS_LIMIT = 50;

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchKeys();
  }, [user]);

  // Real-time: handle incoming usage events via SSE
  const handleUsage = useCallback((usage) => {
    setLogs(prev => [{ ...usage, _isNew: true }, ...prev].slice(0, 200));
    setSummary(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        totalRequests: prev.totalRequests + 1,
        totalTokens: prev.totalTokens + (usage.totalTokens || 0),
        inputTokens: prev.inputTokens + (usage.inputTokens || 0),
        outputTokens: prev.outputTokens + (usage.outputTokens || 0),
        totalCost: prev.totalCost + (usage.totalCost || 0),
      };
    });
  }, []);

  // Real-time: handle balance updates via SSE
  const handleBalance = useCallback((balanceUpdate) => {
    // balanceUpdate.balance = new User.balance (unified wallet)
    setApiKeys(prev => prev.map(k => ({ ...k, balance: balanceUpdate.balance })));
  }, []);

  const handleSseStatus = useCallback((status) => setSseStatus(status), []);

  useAISSE({ token, onUsage: handleUsage, onBalance: handleBalance, onConnectionChange: handleSseStatus });

  // ═══ Data fetching ═══
  const fetchKeys = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/ai-router/keys`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setApiKeys(await res.json());
    } catch (err) {
      console.error('Error fetching keys:', err);
    }
  };

  const fetchUsageData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
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
        fetch(`${import.meta.env.VITE_API_BASE_URL}/api/ai-router/usage/logs?${params}&limit=${LOGS_LIMIT}&offset=0`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setSummary(await summaryRes.json());
      const logsData = await logsRes.json();
      // Handle both old (array) and new ({logs, total}) response formats
      if (Array.isArray(logsData)) {
        setLogs(logsData);
        setLogsTotal(logsData.length);
      } else {
        setLogs(logsData.logs || []);
        setLogsTotal(logsData.total || 0);
      }
      setLogsOffset(0);
    } catch (err) {
      console.error('Error fetching usage:', err);
      if (!silent) setError('Gagal memuat data usage');
    } finally {
      setLoading(false);
    }
  }, [selectedKeyId, timeframe, token]);

  // Load more logs
  const loadMoreLogs = useCallback(async () => {
    if (loadingMore || logs.length >= logsTotal) return;
    setLoadingMore(true);
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
      const newOffset = logsOffset + LOGS_LIMIT;
      params.set('limit', String(LOGS_LIMIT));
      params.set('offset', String(newOffset));

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/ai-router/usage/logs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      const newLogs = Array.isArray(data) ? data : (data.logs || []);
      setLogs(prev => [...prev, ...newLogs]);
      setLogsOffset(newOffset);
    } catch (err) {
      console.error('Error loading more logs:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, logs.length, logsTotal, logsOffset, selectedKeyId, timeframe, token]);

  useEffect(() => {
    if (user) fetchUsageData();
  }, [fetchUsageData, user]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => fetchUsageData(true), 120000);
    return () => clearInterval(interval);
  }, [fetchUsageData, user]);

  // Reset offset when filters change
  useEffect(() => { setLogsOffset(0); }, [selectedKeyId, timeframe]);

  // ═══ Export CSV ═══
  const exportCSV = useCallback(() => {
    if (!logs.length) return;
    const headers = ['Waktu', 'Key', 'Model', 'Input Tokens', 'Output Tokens', 'Total Tokens', 'Biaya (Rp)', 'Latency (ms)', 'Status'];
    const rows = logs.map(log => [
      formatTime(log.createdAt),
      log.apiKey?.keyName || '-',
      log.requestedModel || log.actualModel || log.model?.modelId || '-',
      log.inputTokens, log.outputTokens, log.totalTokens,
      Math.ceil(log.totalCost),
      log.latencyMs, log.statusCode,
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usage-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [logs]);

  const stats = useMemo(() => {
    if (!summary) return null;
    return {
      avgCostPerRequest: summary.totalRequests > 0 ? summary.totalCost / summary.totalRequests : 0,
      avgTokensPerRequest: summary.totalRequests > 0 ? summary.totalTokens / summary.totalRequests : 0,
    };
  }, [summary]);

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '60px', maxWidth: '1200px' }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <button onClick={() => navigate('/dashboard/ai-keys')} className="btn-text" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ChevronLeft size={18} /> Kembali ke API Keys
        </button>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-title)', fontSize: '28px', fontWeight: '700', marginBottom: '6px' }}>Usage Analytics</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Pantau penggunaan AI secara real-time. Semua biaya dari Saldo Wallet.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button onClick={exportCSV} disabled={!logs.length}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: 'var(--radius-sm)', fontSize: '12px', fontWeight: '600', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', color: logs.length ? 'var(--text-secondary)' : 'var(--text-muted)', cursor: logs.length ? 'pointer' : 'not-allowed' }}>
              <Download size={14} /> Export CSV
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '999px', fontSize: '11px', fontWeight: '600', background: sseStatus === 'connected' ? 'rgba(34,197,94,0.12)' : sseStatus === 'connecting' ? 'rgba(250,204,21,0.12)' : 'rgba(239,68,68,0.12)', color: sseStatus === 'connected' ? '#22c55e' : sseStatus === 'connecting' ? '#facc15' : '#ef4444' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor', animation: sseStatus === 'connected' ? 'pulse 2s infinite' : 'none' }} />
              {sseStatus === 'connected' ? 'Live' : sseStatus === 'connecting' ? 'Connecting...' : 'Offline'}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '28px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={14} style={{ color: 'var(--text-muted)' }} />
          <select value={selectedKeyId} onChange={(e) => setSelectedKeyId(e.target.value)}
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', color: 'var(--text-primary)', fontSize: '13px', cursor: 'pointer', minWidth: '180px', outline: 'none' }}>
            <option value="">Semua API Keys</option>
            {apiKeys.map(k => <option key={k.id} value={k.id}>{k.keyName}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: 'var(--radius-sm)' }}>
          {[{ val: '7d', label: '7H' }, { val: '30d', label: '30H' }, { val: 'all', label: 'Semua' }].map(opt => (
            <button key={opt.val} onClick={() => setTimeframe(opt.val)}
              style={{ padding: '6px 14px', fontSize: '12px', fontWeight: '600', borderRadius: '6px', border: 'none', cursor: 'pointer', background: timeframe === opt.val ? 'var(--grad-primary)' : 'transparent', color: timeframe === opt.val ? '#fff' : 'var(--text-muted)' }}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? <UsageSkeleton /> : error ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#ef4444', background: 'rgba(239,68,68,0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239,68,68,0.1)' }}>
          <p style={{ fontSize: '15px', fontWeight: '600' }}>{error}</p>
          <button onClick={() => fetchUsageData()} className="btn btn-secondary" style={{ marginTop: '12px', padding: '8px 16px', fontSize: '12px' }}>Coba Lagi</button>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '28px' }}>
            <SummaryCard icon={Cpu} label="Requests" value={formatNumber(summary?.totalRequests)} color="var(--color-primary)" />
            <SummaryCard icon={Activity} label="Tokens" value={formatNumber(summary?.totalTokens)}
              subValue={`In: ${formatNumber(summary?.inputTokens)} / Out: ${formatNumber(summary?.outputTokens)}`} color="var(--color-secondary)" />
            <SummaryCard icon={DollarSign} label="Biaya" value={formatCost(summary?.totalCost)} color={getPriceColor(summary?.totalCost || 0)} />
            <SummaryCard icon={Zap} label="Models" value={summary?.byModel?.length || 0} color="#f59e0b" />
          </div>

          {/* Quick Stats */}
          {stats && stats.avgCostPerRequest > 0 && (
            <div style={{ display: 'flex', gap: '16px', marginBottom: '28px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: 'var(--radius-sm)', background: 'rgba(79,172,254,0.06)', border: '1px solid rgba(79,172,254,0.1)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <TrendingUp size={14} style={{ color: 'var(--color-secondary)' }} />
                Rata-rata: <strong style={{ color: 'var(--text-primary)' }}>{formatNumber(Math.round(stats.avgTokensPerRequest))}</strong> tokens/request
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: 'var(--radius-sm)', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.1)', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <DollarSign size={14} style={{ color: 'var(--color-success)' }} />
                Rata-rata: <strong style={{ color: 'var(--text-primary)' }}>{formatCost(stats.avgCostPerRequest)}</strong>/request
              </div>
            </div>
          )}

          {/* Per-Model Breakdown */}
          {summary?.byModel?.length > 0 && (
            <div className="glass-card" style={{ padding: '24px', marginBottom: '28px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} style={{ color: 'var(--color-primary)' }} /> Usage per Model
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
                {summary.byModel.map((m, i) => (
                  <div key={i} style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '14px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px' }}>{m.model.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>{m.requestCount} req | {formatNumber(m.totalTokens)} tok</div>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: getPriceColor(m.totalCost) }}>{formatCost(m.totalCost)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chart */}
          {summary?.chartData?.length > 0 && (
            <div className="glass-card" style={{ padding: '24px', marginBottom: '28px' }}>
              <AIUsageChart data={summary.chartData} title="Daily Usage Overview" />
            </div>
          )}

          {/* Logs Table */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} style={{ color: 'var(--color-primary)' }} /> Recent Requests
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{logsTotal} entries</span>
          </div>

          {logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)' }}>
              <Activity size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
              <p style={{ fontSize: '14px', fontWeight: '500' }}>Belum ada usage data.</p>
              <p style={{ fontSize: '12px', marginTop: '4px' }}>Buat request AI untuk mulai melihat data.</p>
            </div>
          ) : (
            <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)' }}>
                      {['Waktu', 'Key', 'Model', 'In / Out', 'Biaya', 'Latency', 'Status'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: h === 'Biaya' || h === 'In / Out' || h === 'Latency' || h === 'Status' ? 'right' : 'left', color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, i) => (
                      <LogRow key={log.id || `log-${i}`} log={log} index={i} onShowBreakdown={setBreakdownLog} />
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Load More */}
              {logs.length < logsTotal && (
                <div style={{ padding: '16px', textAlign: 'center', borderTop: '1px solid var(--border-color)' }}>
                  <button onClick={loadMoreLogs} disabled={loadingMore}
                    className="btn btn-secondary"
                    style={{ padding: '8px 24px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    {loadingMore ? 'Memuat...' : <><ChevronDown size={14} /> Load More ({logsTotal - logs.length} remaining)</>}
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Cost Breakdown Modal */}
      {breakdownLog && <CostBreakdown log={breakdownLog} onClose={() => setBreakdownLog(null)} />}

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @media (max-width: 768px) { .container { padding-left: 16px !important; padding-right: 16px !important; } }
      `}</style>
    </div>
  );
}
