import React, { useState, useEffect } from 'react';
import {
  Bot, Play, RefreshCw, FileText, BarChart3,
  Target, Zap, Clock, CheckCircle, XCircle, TrendingUp,
  Users, DollarSign, Activity, ChevronDown, ChevronUp,
  Settings, Key, Globe, Cpu, Save, TestTube, Plus, Trash2,
} from 'lucide-react';

const API = import.meta.env.VITE_API_BASE_URL;

const AGENT_ICONS = {
  seo: '🔍', social_media: '📱', email: '📧', whatsapp: '💬',
  competitor: '🕵️', dynamic_pricing: '💰', analytics: '📊',
  reseller: '🤝', retention: '🔄', upsell: '⬆️',
  content_writer: '✍️', review_request: '⭐',
};

const AGENT_NAMES = {
  seo: 'SEO Content', social_media: 'Social Media', email: 'Email Campaign',
  whatsapp: 'WhatsApp Broadcast', competitor: 'Competitor Intel',
  dynamic_pricing: 'Dynamic Pricing', analytics: 'Analytics',
  reseller: 'Reseller Recruitment', retention: 'Customer Retention',
  upsell: 'Upsell', content_writer: 'Content Writer', review_request: 'Review Request',
};

const STATUS_COLORS = { PENDING: '#f59e0b', RUNNING: '#3b82f6', COMPLETED: '#10b981', FAILED: '#ef4444' };
const TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { key: 'agents', label: 'Agents', icon: Bot },
  { key: 'schedules', label: 'Schedules', icon: Clock },
  { key: 'reports', label: 'Reports', icon: FileText },
  { key: 'content', label: 'Content', icon: FileText },
  { key: 'apiconfig', label: 'API Config', icon: Key },
];

export default function AdminAgents({ token }) {
  const [tab, setTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [reports, setReports] = useState([]);
  const [content, setContent] = useState([]);
  const [kpi, setKpi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [runningAgent, setRunningAgent] = useState(null);
  const [configs, setConfigs] = useState([]);
  const [editingConfig, setEditingConfig] = useState(null);
  const [configForm, setConfigForm] = useState({ baseUrl: '', apiKey: '', model: '', maxTokens: 4096, temperature: 0.7 });
  const [testResult, setTestResult] = useState(null);
  const [testingApi, setTestingApi] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [statsR, tasksR, schedR, repR, contentR, kpiR, confR] = await Promise.all([
        fetch(`${API}/api/admin/agents/stats`, { headers }),
        fetch(`${API}/api/admin/agents?limit=30`, { headers }),
        fetch(`${API}/api/admin/agents/schedules`, { headers }),
        fetch(`${API}/api/admin/agents/reports?limit=10`, { headers }),
        fetch(`${API}/api/admin/agents/content?limit=10`, { headers }),
        fetch(`${API}/api/admin/agents/kpi`, { headers }),
        fetch(`${API}/api/admin/agents/configs`, { headers }),
      ]);
      const [sD, tD, scD, rD, cD, kD, coD] = await Promise.all([
        statsR.json(), tasksR.json(), schedR.json(), repR.json(),
        contentR.json(), kpiR.json(), confR.json(),
      ]);
      setStats(sD); setTasks(tD.tasks || []); setSchedules(scD.schedules || []);
      setReports(rD.reports || []); setContent(cD.items || []); setKpi(kD.kpi);
      setConfigs(coD.configs || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const runAgent = async (agentType) => {
    setRunningAgent(agentType);
    try { await fetch(`${API}/api/admin/agents/run/${agentType}`, { method: 'POST', headers }); setTimeout(fetchAll, 2000); } catch {}
    setRunningAgent(null);
  };

  const updateSchedule = async (id, data) => { await fetch(`${API}/api/admin/agents/schedules/${id}`, { method: 'PUT', headers, body: JSON.stringify(data) }); fetchAll(); };
  const updateContent = async (id, data) => { await fetch(`${API}/api/admin/agents/content/${id}`, { method: 'PUT', headers, body: JSON.stringify(data) }); fetchAll(); };

  const openEditConfig = (config) => {
    setEditingConfig(config);
    setConfigForm({ baseUrl: config.baseUrl || '', apiKey: '', model: config.model || '', maxTokens: config.maxTokens || 4096, temperature: config.temperature ?? 0.7 });
    setTestResult(null);
  };

  const openNewConfig = () => {
    setEditingConfig({ agentType: '', isNew: true });
    setConfigForm({ baseUrl: 'https://api.openai.com/v1', apiKey: '', model: 'gpt-4o-mini', maxTokens: 4096, temperature: 0.7 });
    setTestResult(null);
  };

  const saveConfig = async () => {
    if (!editingConfig?.agentType || !editingConfig.agentType.trim()) { alert('Pilih agent type terlebih dahulu.'); return; }
    setSavingConfig(true);
    try {
      const body = { ...configForm };
      if (!body.apiKey) delete body.apiKey;
      const res = await fetch(`${API}/api/admin/agents/configs/${editingConfig.agentType}`, { method: 'PUT', headers, body: JSON.stringify(body) });
      const data = await res.json();
      if (res.ok) { setEditingConfig(null); fetchConfigs(); }
      else alert(data.error || 'Gagal menyimpan');
    } catch (err) { alert('Error: ' + err.message); }
    setSavingConfig(false);
  };

  const fetchConfigs = async () => {
    try { const res = await fetch(`${API}/api/admin/agents/configs`, { headers }); const d = await res.json(); setConfigs(d.configs || []); } catch {}
  };

  const testApi = async () => {
    if (!configForm.baseUrl || !configForm.apiKey || !configForm.model) { alert('Isi Base URL, API Key, dan Model terlebih dahulu.'); return; }
    setTestingApi(true); setTestResult(null);
    try { const res = await fetch(`${API}/api/admin/agents/configs/test`, { method: 'POST', headers, body: JSON.stringify(configForm) }); setTestResult(await res.json()); }
    catch (err) { setTestResult({ success: false, error: err.message }); }
    setTestingApi(false);
  };

  const deleteConfig = async (agentType) => { if (!confirm(`Hapus config untuk "${agentType}"?`)) return; await fetch(`${API}/api/admin/agents/configs/${agentType}`, { method: 'DELETE', headers }); fetchConfigs(); };

  const ProgressBar = ({ value, max = 100, color = 'var(--accent-primary)' }) => (
    <div className="adm-dist-bar"><div className="adm-dist-fill" style={{ width: `${Math.min((value / max) * 100, 100)}%`, background: color }} /></div>
  );

  if (loading) return <div className="adm-loading"><RefreshCw size={28} className="spin" /> Loading agents...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div className="adm-page-header">
        <div>
          <div className="adm-page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Bot size={22} style={{ color: 'var(--accent-primary)' }} /> AI Agent Workers</div>
          <div className="adm-page-sub">12 otomatisasi agent untuk mencapai Rp 1 Miliar</div>
        </div>
        <button onClick={fetchAll} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '12px' }}><RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh</button>
      </div>

      {/* Tabs */}
      <div className="adm-tabs">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} className={`adm-tab ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* ═══ DASHBOARD ═══ */}
      {tab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="adm-card-nest">
            <div className="adm-card-header-row">
              <span style={{ fontSize: 14, fontWeight: 700 }}>Progress ke Rp 1 Miliar</span>
              <span className="adm-stat-value" style={{ fontSize: 20 }}>{kpi?.targetProgress || '0'}%</span>
            </div>
            <ProgressBar value={parseFloat(kpi?.targetProgress || 0)} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
              <span>Rp {(kpi?.totalRevenue || 0).toLocaleString('id-ID')}</span>
              <span>Target: Rp 1.000.000.000</span>
            </div>
          </div>

          <div className="adm-stat-grid">
            {[
              { icon: Activity, label: 'Total Runs', value: (stats?.overview?.totalRuns || 0).toLocaleString(), sub: `${stats?.overview?.runsToday || 0} hari ini` },
              { icon: CheckCircle, label: 'Success Rate', value: stats?.overview?.successRate || '0%', color: '#10b981' },
              { icon: DollarSign, label: 'Revenue', value: `Rp ${(kpi?.totalRevenue || 0).toLocaleString('id-ID')}`, sub: `${kpi?.totalOrders || 0} orders`, color: '#10b981' },
              { icon: Target, label: 'Rata-rata Order', value: `Rp ${(kpi?.avgOrderValue || 0).toLocaleString('id-ID')}` },
              { icon: Zap, label: 'LLM Tokens', value: (stats?.overview?.totalTokensUsed || 0).toLocaleString(), sub: `Rp ${(stats?.overview?.totalLLMCost || 0).toLocaleString('id-ID')}` },
              { icon: Users, label: 'Sisa Target', value: `Rp ${(kpi?.remainingToTarget || 0).toLocaleString('id-ID')}`, color: '#f59e0b' },
            ].map((s, i) => (
              <div key={i} className="adm-stat-card">
                <div className="adm-stat-card-top">
                  <div className="adm-stat-icon" style={{ background: `${s.color || 'var(--accent-primary)'}10`, color: s.color || 'var(--accent-primary)' }}><s.icon size={22} /></div>
                  <TrendingUp size={14} className="arrow" style={{ color: s.color || 'var(--accent-primary)' }} />
                </div>
                <div className="adm-stat-label">{s.label}</div>
                <div className="adm-stat-value" style={{ color: s.color || 'inherit' }}>{s.value}</div>
                {s.sub && <div className="adm-stat-sub">{s.sub}</div>}
              </div>
            ))}
          </div>

          <div className="adm-card-nest">
            <div className="adm-card-header-row"><span style={{ fontSize: 14, fontWeight: 700 }}>Recent Agent Runs</span></div>
            <table className="adm-table">
              <thead><tr><th>Agent</th><th>Task</th><th>Status</th><th>Waktu</th></tr></thead>
              <tbody>
                {tasks.slice(0, 10).map(task => (
                  <tr key={task.id}>
                    <td className="td-name"><span style={{ marginRight: 6 }}>{AGENT_ICONS[task.agentType] || '🤖'}</span>{AGENT_NAMES[task.agentType] || task.agentType}</td>
                    <td>{task.taskName}</td>
                    <td><span className="adm-badge" style={{ background: `${STATUS_COLORS[task.status]}15`, color: STATUS_COLORS[task.status] }}>{task.status}</span></td>
                    <td>{task.createdAt ? new Date(task.createdAt).toLocaleString('id-ID') : '-'}</td>
                  </tr>
                ))}
                {tasks.length === 0 && <tr><td colSpan={4} className="adm-empty">No agent runs yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ AGENTS ═══ */}
      {tab === 'agents' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
          {Object.keys(AGENT_NAMES).map(type => {
            const task = tasks.find(t => t.agentType === type);
            const isRunning = runningAgent === type;
            return (
              <div key={type} className="adm-card-nest" style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 22 }}>{AGENT_ICONS[type] || '🤖'}</span>
                    <div>
                      <div className="td-name">{AGENT_NAMES[type]}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                        {schedules.find(s => s.agentType === type)?.cronExpression || 'No schedule'} | {schedules.find(s => s.agentType === type)?.isActive ? '🟢 Active' : '🔴 Inactive'}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => runAgent(type)} disabled={isRunning}
                    className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>
                    {isRunning ? <><RefreshCw size={12} className="spin" /> Running</> : <><Play size={12} /> Run</>}
                  </button>
                </div>
                {task && <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8, display: 'flex', gap: 12 }}>
                  <span>Last: {task.completedAt ? new Date(task.completedAt).toLocaleString() : 'Never'}</span>
                  <span style={{ color: STATUS_COLORS[task.status] }}>{task.status}</span>
                </div>}
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ SCHEDULES ═══ */}
      {tab === 'schedules' && (
        <div className="adm-card-nest" style={{ padding: 20 }}>
          <table className="adm-table">
            <thead><tr><th></th><th>Agent</th><th>Cron (UTC)</th><th>Status</th><th>Last Run</th></tr></thead>
            <tbody>
              {schedules.map(s => (
                <tr key={s.id}>
                  <td style={{ fontSize: 18 }}>{AGENT_ICONS[s.agentType] || '🤖'}</td>
                  <td className="td-name">{AGENT_NAMES[s.agentType] || s.agentType}</td>
                  <td><code style={{ fontSize: 12, color: 'var(--accent-primary)', background: 'rgba(59,130,246,0.06)', padding: '2px 8px', borderRadius: 4 }}>{s.cronExpression}</code></td>
                  <td><button onClick={() => updateSchedule(s.id, { isActive: !s.isActive })} className={`adm-badge ${s.isActive ? 'adm-badge-success' : 'adm-badge-danger'}`} style={{ border: 'none', cursor: 'pointer' }}>{s.isActive ? 'ON' : 'OFF'}</button></td>
                  <td>{s.lastRunAt ? new Date(s.lastRunAt).toLocaleString() : 'Never'}</td>
                </tr>
              ))}
              {schedules.length === 0 && <tr><td colSpan={5} className="adm-empty">No schedules yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══ REPORTS ═══ */}
      {tab === 'reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {reports.map(r => (
            <div key={r.id} className="adm-card-nest" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <div className="td-name">{r.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                    {AGENT_ICONS[r.agentTask?.agentType] || '🤖'} {AGENT_NAMES[r.agentTask?.agentType] || r.agentTask?.agentType} | {r.reportType} | {new Date(r.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 8, padding: 12, background: 'var(--bg-page)', borderRadius: 8, fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', maxHeight: 200, overflow: 'auto' }}>
                {r.summary?.slice(0, 500)}
              </div>
            </div>
          ))}
          {reports.length === 0 && <div className="adm-empty">No reports generated yet.</div>}
        </div>
      )}

      {/* ═══ CONTENT ═══ */}
      {tab === 'content' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {content.map(c => (
            <div key={c.id} className="adm-card-nest" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div className="td-name">{c.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{c.contentType} | {new Date(c.createdAt).toLocaleString()}</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {c.status !== 'PUBLISHED' && <button onClick={() => updateContent(c.id, { status: 'PUBLISHED' })} className="adm-badge adm-badge-success" style={{ border: 'none', cursor: 'pointer' }}>Publish</button>}
                  {c.status !== 'ARCHIVED' && <button onClick={() => updateContent(c.id, { status: 'ARCHIVED' })} className="adm-badge adm-badge-danger" style={{ border: 'none', cursor: 'pointer' }}>Archive</button>}
                </div>
              </div>
              <div style={{ marginTop: 6, padding: 10, background: 'var(--bg-page)', borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', maxHeight: 120, overflow: 'auto' }}>
                {c.body?.slice(0, 300)}
              </div>
              <div style={{ marginTop: 6, display: 'flex', gap: 8 }}>
                <span className={`adm-badge ${c.status === 'PUBLISHED' ? 'adm-badge-success' : c.status === 'DRAFT' ? 'adm-badge-pending' : 'adm-badge-danger'}`}>{c.status}</span>
                {c.metaTitle && <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>SEO: {c.metaTitle}</span>}
              </div>
            </div>
          ))}
          {content.length === 0 && <div className="adm-empty">No content yet.</div>}
        </div>
      )}

      {/* ═══ API CONFIG ═══ */}
      {tab === 'apiconfig' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="adm-page-header">
            <div>
              <div className="adm-page-title" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 18 }}>
                <Settings size={18} style={{ color: 'var(--accent-primary)' }} /> LLM API Configuration
              </div>
              <div className="adm-page-sub">Atur Base URL, API Key, dan Model untuk semua agent</div>
            </div>
            <button onClick={openNewConfig} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: 12 }}>
              <Plus size={14} /> Add Config
            </button>
          </div>

          {configs.length === 0 && <div className="adm-empty">No API configs yet. Click "Add Config" to create one.</div>}
          <div className="adm-form-grid-3" style={{ marginBottom: 0 }}>
            {configs.map(c => (
              <div key={c.agentType} className="adm-card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: c.isActive ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Cpu size={16} style={{ color: c.isActive ? '#10b981' : '#ef4444' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="td-name" style={{ textTransform: 'uppercase' }}>{c.agentType === 'global' ? '🌍 Global (Default)' : `${AGENT_ICONS[c.agentType] || ''} ${AGENT_NAMES[c.agentType] || c.agentType}`}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                      <Globe size={10} style={{ marginRight: 2 }} />{c.baseUrl}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                  <button onClick={() => openEditConfig(c)} className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: 11, flex: 1 }}><Settings size={12} /> Edit</button>
                  {c.agentType !== 'global' && <button onClick={() => deleteConfig(c.agentType)} className="btn btn-danger" style={{ padding: '5px 10px', fontSize: 11 }}><Trash2 size={12} /> Delete</button>}
                </div>
              </div>
            ))}
          </div>

          {editingConfig && (
            <div className="adm-card" style={{ border: '2px solid var(--accent-primary)' }}>
              <div className="adm-card-header-sm" style={{ fontSize: 14, fontWeight: 700 }}>
                {editingConfig.isNew ? 'Add New Config' : `Edit: ${editingConfig.agentType.toUpperCase()}`}
              </div>
              <div className="adm-form-grid-3" style={{ marginBottom: 0 }}>
                {editingConfig.isNew && (
                  <div className="adm-form-full form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Agent Type</label>
                    <select value={editingConfig.agentType || ''} onChange={e => setEditingConfig({ ...editingConfig, agentType: e.target.value })}
                      className="form-input">
                      <option value="">-- Select Agent --</option>
                      <option value="global">🌍 Global (Default)</option>
                      {Object.entries(AGENT_NAMES).map(([k, v]) => <option key={k} value={k}>{AGENT_ICONS[k]} {v}</option>)}
                    </select>
                  </div>
                )}
                <div className="adm-form-full form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Base URL</label>
                  <input type="text" className="form-input" style={{ fontFamily: 'monospace' }}
                    value={configForm.baseUrl} onChange={e => setConfigForm({ ...configForm, baseUrl: e.target.value })}
                    placeholder="https://api.openai.com/v1" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">API Key {!editingConfig.isNew && '(kosongkan untuk tetap)'}</label>
                  <input type="password" className="form-input" style={{ fontFamily: 'monospace' }}
                    value={configForm.apiKey} onChange={e => setConfigForm({ ...configForm, apiKey: e.target.value })}
                    placeholder={editingConfig.isNew ? 'sk-...' : '••••••••'} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Model</label>
                  <input type="text" className="form-input" style={{ fontFamily: 'monospace' }}
                    value={configForm.model} onChange={e => setConfigForm({ ...configForm, model: e.target.value })}
                    placeholder="gpt-4o-mini" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Max Tokens</label>
                  <input type="number" className="form-input"
                    value={configForm.maxTokens} onChange={e => setConfigForm({ ...configForm, maxTokens: parseInt(e.target.value) || 4096 })} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Temperature</label>
                  <input type="number" step="0.1" min="0" max="2" className="form-input"
                    value={configForm.temperature} onChange={e => setConfigForm({ ...configForm, temperature: parseFloat(e.target.value) || 0.7 })} />
                </div>
              </div>

              {testResult && (
                <div className={`adm-alert ${testResult.success ? 'adm-alert-success' : ''}`} style={{ marginBottom: 12, background: testResult.success ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: testResult.success ? '#10b981' : '#ef4444', border: 'none' }}>
                  {testResult.success ? `✅ Connected! Model: ${testResult.model}` : `❌ ${testResult.error}`}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={saveConfig} disabled={savingConfig} className="btn btn-primary" style={{ padding: '8px 20px' }}>
                  <Save size={14} /> {savingConfig ? 'Saving...' : 'Save'}
                </button>
                <button onClick={testApi} disabled={testingApi || !configForm.baseUrl || !configForm.apiKey || !configForm.model} className="btn btn-secondary" style={{ padding: '8px 20px' }}>
                  <TestTube size={14} /> {testingApi ? 'Testing...' : 'Test'}
                </button>
                <button onClick={() => setEditingConfig(null)} className="btn btn-secondary" style={{ padding: '8px 20px' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {!editingConfig && (
            <div className="adm-card" style={{ background: 'rgba(59,130,246,0.02)', border: '1px solid var(--accent-primary-light)' }}>
              <div className="adm-card-header-sm" style={{ color: 'var(--accent-primary)' }}>💡 Cara Kerja</div>
              <ul style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, paddingLeft: 16, lineHeight: 1.8 }}>
                <li><strong>Global config</strong> dipakai sebagai default untuk semua agent.</li>
                <li><strong>Agent-specific config</strong> override global config.</li>
                <li>API Key disimpan aman (tidak ditampilkan penuh).</li>
                <li>Perubahan berlaku pada agent run berikutnya.</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
