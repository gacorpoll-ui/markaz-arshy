import React, { useState, useEffect } from 'react';
import {
  Bot, Play, Pause, RefreshCw, FileText, BarChart3,
  Target, Zap, Clock, CheckCircle, XCircle, TrendingUp,
  Users, DollarSign, Activity, ChevronDown, ChevronUp,
  Settings, Key, Globe, Cpu, Save, TestTube,
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

const STATUS_COLORS = {
  PENDING: '#f59e0b', RUNNING: '#3b82f6', COMPLETED: '#10b981', FAILED: '#ef4444',
};

export default function AdminAgents({ token }) {
  const [tab, setTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [reports, setReports] = useState([]);
  const [content, setContent] = useState([]);
  const [socialPosts, setSocialPosts] = useState([]);
  const [kpi, setKpi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [runningAgent, setRunningAgent] = useState(null);

  // API Config states
  const [configs, setConfigs] = useState([]);
  const [editingConfig, setEditingConfig] = useState(null);
  const [configForm, setConfigForm] = useState({ baseUrl: '', apiKey: '', model: '', maxTokens: 4096, temperature: 0.7 });
  const [testResult, setTestResult] = useState(null);
  const [testingApi, setTestingApi] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);

  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [statsR, tasksR, schedR, repR, contentR, socialR, kpiR, confR] = await Promise.all([
        fetch(`${API}/api/admin/agents/stats`, { headers }),
        fetch(`${API}/api/admin/agents?limit=30`, { headers }),
        fetch(`${API}/api/admin/agents/schedules`, { headers }),
        fetch(`${API}/api/admin/agents/reports?limit=10`, { headers }),
        fetch(`${API}/api/admin/agents/content?limit=10`, { headers }),
        fetch(`${API}/api/admin/agents/social?limit=10`, { headers }),
        fetch(`${API}/api/admin/agents/kpi`, { headers }),
        fetch(`${API}/api/admin/agents/configs`, { headers }),
      ]);

      const [sD, tD, scD, rD, cD, soD, kD, coD] = await Promise.all([
        statsR.json(), tasksR.json(), schedR.json(), repR.json(),
        contentR.json(), socialR.json(), kpiR.json(), confR.json(),
      ]);

      setStats(sD);
      setTasks(tD.tasks || []);
      setSchedules(scD.schedules || []);
      setReports(rD.reports || []);
      setContent(cD.items || []);
      setSocialPosts(soD.posts || []);
      setKpi(kD.kpi);
      setConfigs(coD.configs || []);
    } catch (err) {
      console.error('Failed to fetch agent data:', err);
    }
    setLoading(false);
  };

  const runAgent = async (agentType) => {
    setRunningAgent(agentType);
    try {
      await fetch(`${API}/api/admin/agents/run/${agentType}`, { method: 'POST', headers });
      setTimeout(fetchAll, 2000);
    } catch (err) { console.error(err); }
    setRunningAgent(null);
  };

  const updateSchedule = async (id, data) => {
    await fetch(`${API}/api/admin/agents/schedules/${id}`, {
      method: 'PUT', headers, body: JSON.stringify(data),
    });
    fetchAll();
  };

  const updateContent = async (id, data) => {
    await fetch(`${API}/api/admin/agents/content/${id}`, {
      method: 'PUT', headers, body: JSON.stringify(data),
    });
    fetchAll();
  };

  /* ── API Config Functions ── */
  const fetchConfigs = async () => {
    try {
      const res = await fetch(`${API}/api/admin/agents/configs`, { headers });
      const data = await res.json();
      setConfigs(data.configs || []);
    } catch (err) { console.error('Failed to fetch configs:', err); }
  };

  const openEditConfig = (config) => {
    setEditingConfig(config);
    setConfigForm({
      baseUrl: config.baseUrl || '',
      apiKey: '', // Don't pre-fill masked key
      model: config.model || '',
      maxTokens: config.maxTokens || 4096,
      temperature: config.temperature ?? 0.7,
    });
    setTestResult(null);
  };

  const openNewConfig = () => {
    setEditingConfig({ agentType: '', isNew: true });
    setConfigForm({ baseUrl: 'https://api.openai.com/v1', apiKey: '', model: 'gpt-4o-mini', maxTokens: 4096, temperature: 0.7 });
    setTestResult(null);
  };

  const saveConfig = async () => {
    if (!editingConfig?.agentType) return;
    setSavingConfig(true);
    try {
      const body = { ...configForm };
      // Don't send empty apiKey (it means "keep existing")
      if (!body.apiKey) delete body.apiKey;
      const res = await fetch(`${API}/api/admin/agents/configs/${editingConfig.agentType}`, {
        method: 'PUT', headers, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setEditingConfig(null);
        fetchConfigs();
      } else {
        alert(data.error || 'Failed to save');
      }
    } catch (err) { alert('Error: ' + err.message); }
    setSavingConfig(false);
  };

  const testApi = async () => {
    setTestingApi(true);
    setTestResult(null);
    try {
      const res = await fetch(`${API}/api/admin/agents/configs/test`, {
        method: 'POST', headers, body: JSON.stringify(configForm),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err) { setTestResult({ success: false, error: err.message }); }
    setTestingApi(false);
  };

  const deleteConfig = async (agentType) => {
    if (!confirm(`Delete config for "${agentType}"?`)) return;
    await fetch(`${API}/api/admin/agents/configs/${agentType}`, { method: 'DELETE', headers });
    fetchConfigs();
  };

  /* ── Progress Bar ── */
  const ProgressBar = ({ value, max = 100, color = 'var(--accent-primary)' }) => (
    <div style={{ width: '100%', height: '8px', background: 'var(--bg-page)', borderRadius: '999px', overflow: 'hidden' }}>
      <div style={{ width: `${Math.min((value / max) * 100, 100)}%`, height: '100%', background: color, borderRadius: '999px', transition: 'width 0.8s ease' }} />
    </div>
  );

  /* ── Stat Card ── */
  const StatCard = ({ icon: Icon, label, value, sub, color = 'var(--accent-primary)' }) => (
    <div style={{ background: 'var(--bg-page)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        <Icon size={14} style={{ color }} />
        {label}
      </div>
      <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)' }}>{value}</div>
      {sub && <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{sub}</div>}
    </div>
  );

  /* ── Agent Card ── */
  const AgentCard = ({ agentType, schedule }) => {
    const taskForAgent = tasks.find(t => t.agentType === agentType);
    const isRunning = runningAgent === agentType;

    return (
      <div style={{ background: 'var(--bg-page)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>{AGENT_ICONS[agentType] || '🤖'}</span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>{AGENT_NAMES[agentType]}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {schedule?.cronExpression || 'No schedule'} | {schedule?.isActive ? '🟢 Active' : '🔴 Inactive'}
              </div>
            </div>
          </div>
          <button
            onClick={() => runAgent(agentType)}
            disabled={isRunning}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-default)', background: isRunning ? 'rgba(59,130,246,0.1)' : 'var(--accent-primary-light)', color: isRunning ? '#3b82f6' : 'var(--color-primary)', fontSize: '12px', fontWeight: '600', cursor: isRunning ? 'wait' : 'pointer' }}
          >
            {isRunning ? <RefreshCw size={12} className="spin" /> : <Play size={12} />}
            {isRunning ? 'Running...' : 'Run Now'}
          </button>
        </div>
        {taskForAgent && (
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', gap: '12px' }}>
            <span>Last: {taskForAgent.completedAt ? new Date(taskForAgent.completedAt).toLocaleString('id-ID') : 'Never'}</span>
            <span style={{ color: STATUS_COLORS[taskForAgent.status] || 'inherit' }}>{taskForAgent.status}</span>
          </div>
        )}
      </div>
    );
  };

  /* ── Tabs ── */
  const TABS = [
    { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { key: 'agents', label: 'Agents', icon: Bot },
    { key: 'schedules', label: 'Schedules', icon: Clock },
    { key: 'reports', label: 'Reports', icon: FileText },
    { key: 'content', label: 'Content', icon: FileText },
    { key: 'apiconfig', label: 'API Config', icon: Key },
  ];

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading agents...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bot size={22} style={{ color: 'var(--color-primary)' }} /> AI Agent Workers
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>12 otomatisasi agent untuk mencapai Rp 1 Miliar</p>
        </div>
        <button onClick={fetchAll} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-default)', background: 'var(--bg-page)', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-page)', borderRadius: '10px', padding: '4px', border: '1px solid var(--border-default)' }}>
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', borderRadius: '8px', border: 'none', background: tab === key ? 'var(--accent-primary-light)' : 'transparent', color: tab === key ? 'var(--color-primary)' : 'var(--text-secondary)', fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s' }}>
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* ═══ DASHBOARD TAB ═══ */}
      {tab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Revenue Progress */}
          <div style={{ background: 'var(--bg-page)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>Progress ke Rp 1 Miliar</span>
              <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-primary)' }}>{kpi?.targetProgress || '0'}%</span>
            </div>
            <ProgressBar value={parseFloat(kpi?.targetProgress || 0)} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <span>Rp {(kpi?.totalRevenue || 0).toLocaleString('id-ID')}</span>
              <span>Target: Rp 1.000.000.000</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <StatCard icon={Activity} label="Total Agent Runs" value={stats?.overview?.totalRuns || 0} sub={`${stats?.overview?.runsToday || 0} hari ini`} />
            <StatCard icon={CheckCircle} label="Success Rate" value={stats?.overview?.successRate || '0%'} color="#10b981" />
            <StatCard icon={DollarSign} label="Total Revenue" value={`Rp ${(kpi?.totalRevenue || 0).toLocaleString('id-ID')}`} sub={`${kpi?.totalOrders || 0} orders`} />
            <StatCard icon={Target} label="Avg Order Value" value={`Rp ${(kpi?.avgOrderValue || 0).toLocaleString('id-ID')}`} />
            <StatCard icon={Zap} label="LLM Tokens Used" value={(stats?.overview?.totalTokensUsed || 0).toLocaleString()} sub={`Cost: Rp ${(stats?.overview?.totalLLMCost || 0).toLocaleString('id-ID')}`} />
            <StatCard icon={Users} label="Remaining to Target" value={`Rp ${(kpi?.remainingToTarget || 0).toLocaleString('id-ID')}`} color="#f59e0b" />
          </div>

          {/* Recent Tasks */}
          <div style={{ background: 'var(--bg-page)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 12px' }}>Recent Agent Runs</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {tasks.slice(0, 10).map(task => (
                <div key={task.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-page)', fontSize: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{AGENT_ICONS[task.agentType] || '🤖'}</span>
                    <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{AGENT_NAMES[task.agentType] || task.agentType}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{task.taskName}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ color: STATUS_COLORS[task.status] || 'var(--text-secondary)', fontWeight: '600' }}>{task.status}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{task.createdAt ? new Date(task.createdAt).toLocaleString('id-ID') : ''}</span>
                  </div>
                </div>
              ))}
              {tasks.length === 0 && <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)', fontSize: '13px' }}>No agent runs yet. Trigger an agent to get started!</div>}
            </div>
          </div>
        </div>
      )}

      {/* ═══ AGENTS TAB ═══ */}
      {tab === 'agents' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
          {Object.keys(AGENT_NAMES).map(type => (
            <AgentCard key={type} agentType={type} schedule={schedules.find(s => s.agentType === type)} />
          ))}
        </div>
      )}

      {/* ═══ SCHEDULES TAB ═══ */}
      {tab === 'schedules' && (
        <div style={{ background: 'var(--bg-page)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 160px 80px 160px', gap: '12px', padding: '8px 12px', fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <span></span><span>Agent</span><span>Cron (UTC)</span><span>Status</span><span>Last Run</span>
            </div>
            {schedules.map(s => (
              <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 160px 80px 160px', gap: '12px', alignItems: 'center', padding: '10px 12px', borderRadius: '8px', background: 'var(--bg-page)', fontSize: '13px' }}>
                <span style={{ fontSize: '18px' }}>{AGENT_ICONS[s.agentType] || '🤖'}</span>
                <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{AGENT_NAMES[s.agentType] || s.agentType}</span>
                <code style={{ fontSize: '12px', color: 'var(--color-primary)', background: 'rgba(59, 130, 246,0.06)', padding: '2px 8px', borderRadius: '4px' }}>{s.cronExpression}</code>
                <button onClick={() => updateSchedule(s.id, { isActive: !s.isActive })} style={{ padding: '4px 8px', borderRadius: '6px', border: 'none', background: s.isActive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: s.isActive ? '#10b981' : '#ef4444', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>
                  {s.isActive ? 'ON' : 'OFF'}
                </button>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{s.lastRunAt ? new Date(s.lastRunAt).toLocaleString('id-ID') : 'Never'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ REPORTS TAB ═══ */}
      {tab === 'reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {reports.map(r => (
            <div key={r.id} style={{ background: 'var(--bg-page)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>{r.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {AGENT_ICONS[r.agentTask?.agentType] || '🤖'} {AGENT_NAMES[r.agentTask?.agentType] || r.agentTask?.agentType} | {r.reportType} | {new Date(r.createdAt).toLocaleString('id-ID')}
                  </div>
                </div>
              </div>
              <div style={{ marginTop: '10px', padding: '12px', background: 'var(--bg-page)', borderRadius: '8px', fontSize: '13px', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', maxHeight: '200px', overflow: 'auto' }}>
                {r.summary?.slice(0, 500)}
              </div>
            </div>
          ))}
          {reports.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>No reports generated yet.</div>}
        </div>
      )}

      {/* ═══ CONTENT TAB ═══ */}
      {tab === 'content' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {content.map(c => (
            <div key={c.id} style={{ background: 'var(--bg-page)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>{c.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {c.contentType} | {new Date(c.createdAt).toLocaleString('id-ID')}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {c.status !== 'PUBLISHED' && (
                    <button onClick={() => updateContent(c.id, { status: 'PUBLISHED' })} style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', background: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>Publish</button>
                  )}
                  {c.status !== 'ARCHIVED' && (
                    <button onClick={() => updateContent(c.id, { status: 'ARCHIVED' })} style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>Archive</button>
                  )}
                </div>
              </div>
              <div style={{ marginTop: '8px', padding: '10px', background: 'var(--bg-page)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', maxHeight: '120px', overflow: 'auto' }}>
                {c.body?.slice(0, 300)}
              </div>
              <div style={{ marginTop: '6px', display: 'flex', gap: '8px' }}>
                <span style={{ padding: '2px 8px', borderRadius: '4px', background: c.status === 'PUBLISHED' ? 'rgba(16,185,129,0.1)' : c.status === 'DRAFT' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)', color: c.status === 'PUBLISHED' ? '#10b981' : c.status === 'DRAFT' ? '#f59e0b' : '#ef4444', fontSize: '11px', fontWeight: '600' }}>{c.status}</span>
                {c.metaTitle && <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>SEO: {c.metaTitle}</span>}
              </div>
            </div>
          ))}
          {content.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>No content items yet. Run the SEO or Content Writer agent to generate content.</div>}
        </div>
      )}

      {/* ═══ API CONFIG TAB ═══ */}
      {tab === 'apiconfig' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings size={18} style={{ color: 'var(--color-primary)' }} /> LLM API Configuration
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                Atur Base URL, API Key, dan Model untuk semua agent. Config "global" dipakai jika agent tidak punya config sendiri.
              </p>
            </div>
            <button onClick={openNewConfig} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: '#000', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
              + Add Config
            </button>
          </div>

          {/* Config List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {configs.map(c => (
              <div key={c.agentType} style={{ background: 'var(--bg-page)', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: c.isActive ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Cpu size={16} style={{ color: c.isActive ? '#10b981' : '#ef4444' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', textTransform: 'uppercase' }}>
                        {c.agentType === 'global' ? '🌍 Global (Default)' : AGENT_ICONS[c.agentType] + ' ' + (AGENT_NAMES[c.agentType] || c.agentType)}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', gap: '12px', marginTop: '2px' }}>
                        <span><Globe size={10} style={{ marginRight: '3px' }} />{c.baseUrl}</span>
                        <span><Cpu size={10} style={{ marginRight: '3px' }} />{c.model}</span>
                        <span><Key size={10} style={{ marginRight: '3px' }} />{c.apiKey || 'No key'}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => openEditConfig(c)} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-default)', background: 'var(--bg-page)', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>Edit</button>
                    {c.agentType !== 'global' && (
                      <button onClick={() => deleteConfig(c.agentType)} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>Delete</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {configs.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>No API configs yet. Click "Add Config" to create one.</div>}
          </div>

          {/* Edit / New Config Form */}
          {editingConfig && (
            <div style={{ background: 'var(--bg-page)', border: '1px solid var(--color-primary)', borderRadius: '12px', padding: '24px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 16px' }}>
                {editingConfig.isNew ? 'Add New Config' : `Edit: ${editingConfig.agentType.toUpperCase()}`}
              </h4>

              {/* Agent Type (only for new) */}
              {editingConfig.isNew && (
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>Agent Type</label>
                  <select
                    value={editingConfig.agentType || ''}
                    onChange={e => setEditingConfig({ ...editingConfig, agentType: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-default)', background: 'var(--bg-page)', color: 'var(--text-primary)', fontSize: '13px' }}
                  >
                    <option value="">-- Select Agent Type --</option>
                    <option value="global">🌍 Global (Default)</option>
                    {Object.entries(AGENT_NAMES).map(([k, v]) => <option key={k} value={k}>{AGENT_ICONS[k]} {v}</option>)}
                  </select>
                </div>
              )}

              {/* Base URL */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>Base URL</label>
                <input
                  type="text"
                  value={configForm.baseUrl}
                  onChange={e => setConfigForm({ ...configForm, baseUrl: e.target.value })}
                  placeholder="https://api.openai.com/v1"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-default)', background: 'var(--bg-page)', color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'monospace' }}
                />
              </div>

              {/* API Key */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  API Key {editingConfig.isNew ? '' : '(leave empty to keep existing)'}
                </label>
                <input
                  type="password"
                  value={configForm.apiKey}
                  onChange={e => setConfigForm({ ...configForm, apiKey: e.target.value })}
                  placeholder={editingConfig.isNew ? 'sk-...' : '•••••••• (leave empty to keep)'}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-default)', background: 'var(--bg-page)', color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'monospace' }}
                />
              </div>

              {/* Model */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>Model</label>
                <input
                  type="text"
                  value={configForm.model}
                  onChange={e => setConfigForm({ ...configForm, model: e.target.value })}
                  placeholder="claude-sonnet-4-6 / gpt-4o-mini"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-default)', background: 'var(--bg-page)', color: 'var(--text-primary)', fontSize: '13px', fontFamily: 'monospace' }}
                />
              </div>

              {/* Max Tokens + Temperature */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>Max Tokens</label>
                  <input
                    type="number"
                    value={configForm.maxTokens}
                    onChange={e => setConfigForm({ ...configForm, maxTokens: parseInt(e.target.value) || 4096 })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-default)', background: 'var(--bg-page)', color: 'var(--text-primary)', fontSize: '13px' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '4px' }}>Temperature</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={configForm.temperature}
                    onChange={e => setConfigForm({ ...configForm, temperature: parseFloat(e.target.value) || 0.7 })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-default)', background: 'var(--bg-page)', color: 'var(--text-primary)', fontSize: '13px' }}
                  />
                </div>
              </div>

              {/* Test Result */}
              {testResult && (
                <div style={{ marginBottom: '12px', padding: '10px', borderRadius: '8px', background: testResult.success ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', fontSize: '12px', color: testResult.success ? '#10b981' : '#ef4444' }}>
                  {testResult.success ? `✅ Connected! Model: ${testResult.model}, Response: "${testResult.response}"` : `❌ Failed: ${testResult.error}`}
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={saveConfig} disabled={savingConfig} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 20px', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: '#000', fontSize: '12px', fontWeight: '700', cursor: savingConfig ? 'wait' : 'pointer' }}>
                  <Save size={14} /> {savingConfig ? 'Saving...' : 'Save'}
                </button>
                <button onClick={testApi} disabled={testingApi || !configForm.baseUrl || !configForm.apiKey || !configForm.model} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 20px', borderRadius: '8px', border: '1px solid var(--border-default)', background: 'var(--bg-page)', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600', cursor: testingApi ? 'wait' : 'pointer' }}>
                  <TestTube size={14} /> {testingApi ? 'Testing...' : 'Test Connection'}
                </button>
                <button onClick={() => setEditingConfig(null)} style={{ padding: '8px 20px', borderRadius: '8px', border: '1px solid var(--border-default)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          )}

          {/* Info Box */}
          {!editingConfig && (
            <div style={{ background: 'rgba(59, 130, 246,0.03)', border: '1px solid var(--accent-primary-light)', borderRadius: '12px', padding: '16px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-primary)', margin: '0 0 8px' }}>Cara Kerja</h4>
              <ul style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, paddingLeft: '16px', lineHeight: '1.8' }}>
                <li><strong>Global config</strong> dipakai sebagai default untuk semua agent.</li>
                <li><strong>Agent-specific config</strong> override global config untuk agent tertentu.</li>
                <li>API Key hanya ditampilkan dalam bentuk mask (••••••••xxxx) untuk keamanan.</li>
                <li>Perubahan berlaku pada agent run berikutnya (tidak perlu restart server).</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
