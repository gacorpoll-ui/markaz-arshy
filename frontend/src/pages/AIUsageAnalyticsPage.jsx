import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LineChart, DollarSign, Cpu, Clock, Calendar, ChevronLeft, Download } from 'lucide-react';
import AIUsageChart from '../components/AIUsageChart';

/**
 * AI Usage Analytics Page - Menampilkan detail penggunaan API key tertentu
 */
export default function AIUsageAnalyticsPage({ user, token }) {
  const { id } = useParams(); // apiKeyId
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [apiKeyData, setApiKeyData] = useState(null);
  const [usageSummary, setUsageSummary] = useState(null);
  const [usageLogs, setUsageLogs] = useState([]);
  const [timeframe, setTimeframe] = useState('7d'); // 7d, 30d, all
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchUsageData();
  }, [id, timeframe, user]);

  const fetchUsageData = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch API Key details (optional, but good for context)
      const keyResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/ai-router/keys?id=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const keyData = await keyResponse.json();
      setApiKeyData(keyData[0] || null); // Assuming API returns an array, take the first

      // Calculate dates for timeframe
      const endDate = new Date();
      const startDate = new Date();
      if (timeframe === '7d') startDate.setDate(endDate.getDate() - 7);
      else if (timeframe === '30d') startDate.setDate(endDate.getDate() - 30);
      // 'all' means no startDate filter

      const params = new URLSearchParams({
        apiKeyId: id,
        ...(timeframe !== 'all' && { startDate: startDate.toISOString(), endDate: endDate.toISOString() }),
      });

      // Fetch Usage Summary
      const summaryResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/ai-router/usage/summary?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const summaryData = await summaryResponse.json();
      setUsageSummary(summaryData);

      // Fetch Usage Logs
      const logsResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/ai-router/usage/logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const logsData = await logsResponse.json();
      setUsageLogs(logsData);

    } catch (err) {
      console.error('Error fetching usage data:', err);
      setError('Failed to fetch usage data.');
    } finally {
      setLoading(false);
    }
  };

  const getPriceColor = (cost) => {
    if (cost > 7500) return '#ef4444'; // Red (lebih dari Rp 7.500)
    if (cost > 1500) return '#facc15'; // Yellow (lebih dari Rp 1.500)
    return '#22c55e'; // Green
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
        Loading usage data...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: '#ef4444' }}>
        <AlertCircle size={24} style={{ marginBottom: '16px' }} />
        <p>{error}</p>
        <button onClick={() => navigate(-1)} className="btn btn-primary" style={{ marginTop: '20px' }}>
          <ChevronLeft size={18} /> Back
        </button>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '60px' }}>
      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <button onClick={() => navigate(-1)} className="btn-text" style={{ marginBottom: '20px' }}>
          <ChevronLeft size={18} /> Back to My API Keys
        </button>
        <h1 style={{
          fontFamily: 'var(--font-title)',
          fontSize: '32px',
          fontWeight: '700',
          marginBottom: '8px',
        }}>
          Usage Analytics for "{apiKeyData?.keyName || 'API Key'}"
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          Monitor your AI model usage, costs, and request logs.
        </p>
      </div>

      {/* Timeframe Filter */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
        {['7d', '30d', 'all'].map(option => (
          <button
            key={option}
            onClick={() => setTimeframe(option)}
            className={timeframe === option ? 'btn btn-primary' : 'btn btn-secondary'}
            style={{ padding: '8px 20px', fontSize: '14px' }}
          >
            {option === '7d' ? 'Last 7 Days' : option === '30d' ? 'Last 30 Days' : 'All Time'}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      {usageSummary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
          {/* Total Requests */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <Cpu size={24} style={{ color: 'var(--color-primary)' }} />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Total Requests
              </span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--text-primary)' }}>
              {usageSummary.totalRequests.toLocaleString()}
            </div>
          </div>

          {/* Total Tokens */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <LineChart size={24} style={{ color: 'var(--color-secondary)' }} />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Total Tokens
              </span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: 'var(--text-primary)' }}>
              {usageSummary.totalTokens.toLocaleString()}
            </div>
          </div>

          {/* Total Cost */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <DollarSign size={24} style={{ color: 'var(--color-success)' }} />
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Total Biaya
              </span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: getPriceColor(usageSummary.totalCost) }}>
              Rp {Math.ceil(usageSummary.totalCost).toLocaleString('id-ID')}
            </div>
          </div>
        </div>
      )}

      {/* Usage Chart */}
      {usageSummary?.chartData?.length > 0 && (
        <div className="glass-card" style={{ padding: '20px', marginBottom: '40px' }}>
          <AIUsageChart data={usageSummary.chartData} title="Daily Usage Overview" />
        </div>
      )}

      {/* Recent Usage Logs */}
      <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '20px' }}>Recent Usage Logs</h2>
      {usageLogs.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: 'var(--text-muted)',
          background: 'rgba(255, 255, 255, 0.02)',
          borderRadius: 'var(--radius-md)',
        }}>
          <Clock size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
          <p>No usage logs found for the selected timeframe.</p>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '0', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '15px', textAlign: 'left', color: 'var(--text-muted)' }}>Tanggal</th>
                <th style={{ padding: '15px', textAlign: 'left', color: 'var(--text-muted)' }}>Model</th>
                <th style={{ padding: '15px', textAlign: 'left', color: 'var(--text-muted)' }}>Token</th>
                <th style={{ padding: '15px', textAlign: 'left', color: 'var(--text-muted)' }}>Biaya</th>
                <th style={{ padding: '15px', textAlign: 'left', color: 'var(--text-muted)' }}>Latensi</th>
                <th style={{ padding: '15px', textAlign: 'left', color: 'var(--text-muted)' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {usageLogs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '15px', color: 'var(--text-primary)' }}>{new Date(log.createdAt).toLocaleString()}</td>
                  <td style={{ padding: '15px', color: 'var(--text-primary)' }}>{log.model.name}</td>
                  <td style={{ padding: '15px', color: 'var(--text-primary)' }}>{log.totalTokens.toLocaleString()}</td>
                  <td style={{ padding: '15px', color: getPriceColor(log.totalCost) }}>
                    Rp {Math.ceil(log.totalCost).toLocaleString('id-ID')}
                  </td>
                  <td style={{ padding: '15px', color: 'var(--text-primary)' }}>{log.latencyMs} ms</td>
                  <td style={{ padding: '15px', color: log.statusCode >= 200 && log.statusCode < 300 ? '#22c55e' : '#ef4444' }}>
                    {log.statusCode} {log.errorMessage ? `(${log.errorMessage})` : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
