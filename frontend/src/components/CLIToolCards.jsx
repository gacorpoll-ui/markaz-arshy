import React, { useState, useEffect } from 'react';
import { Copy, Check, Terminal, Code, Cpu, ExternalLink, ChevronDown, ChevronUp, Zap } from 'lucide-react';

/**
 * CLI Tools Data — All AI coding tools available at Markaz-Arshy
 */
const CLI_TOOLS = [
  {
    id: 'claude-code',
    name: 'Claude Code',
    icon: '🧠',
    color: '#D97757',
    description: 'Anthropic Claude Code CLI — AI pair programmer di terminal',
    installCmd: 'npm install -g @anthropic-ai/claude-code',
    docsUrl: 'https://docs.anthropic.com/en/docs/claude-code',
    configType: 'env',
    configTemplate: `# Set environment variables
export ANTHROPIC_BASE_URL="{{BASE_URL}}/v1"
export ANTHROPIC_AUTH_TOKEN="{{API_KEY}}"

# Run Claude Code
claude`,
    envVars: [
      { key: 'ANTHROPIC_BASE_URL', value: '{{BASE_URL}}/v1' },
      { key: 'ANTHROPIC_AUTH_TOKEN', value: '{{API_KEY}}' },
    ],
    steps: [
      'Install Claude Code CLI',
      'Set environment variables di atas',
      'Jalankan perintah: claude',
      'Mulai coding dengan AI!',
    ],
  },
  {
    id: 'cursor',
    name: 'Cursor IDE',
    icon: '📝',
    color: '#000000',
    description: 'Cursor AI Code Editor — IDE dengan AI built-in',
    installCmd: 'Download dari https://cursor.sh',
    docsUrl: 'https://docs.cursor.sh',
    configType: 'guide',
    steps: [
      'Buka Cursor Settings (Settings → Models)',
      'Enable "OpenAI API key"',
      'Masukkan Base URL',
      'Masukkan API Key',
      'Tambahkan custom model',
    ],
    guideFields: [
      { label: 'Base URL', value: '{{BASE_URL}}' },
      { label: 'API Key', value: '{{API_KEY}}' },
      { label: 'Model', value: '{{MODEL}}' },
    ],
  },
  {
    id: 'cline',
    name: 'Cline',
    icon: '🔧',
    color: '#00D1B2',
    description: 'Cline AI Coding Assistant — VS Code extension',
    installCmd: 'Install dari VS Code Marketplace',
    docsUrl: 'https://github.com/cline/cline',
    configType: 'guide',
    steps: [
      'Buka panel Cline di VS Code',
      'Pilih API Provider: OpenAI Compatible',
      'Masukkan Base URL',
      'Masukkan API Key',
      'Masukkan Model ID',
    ],
    guideFields: [
      { label: 'Base URL', value: '{{BASE_URL}}' },
      { label: 'API Key', value: '{{API_KEY}}' },
      { label: 'Model ID', value: '{{MODEL}}' },
    ],
  },
  {
    id: 'copilot',
    name: 'GitHub Copilot',
    icon: '🤖',
    color: '#1F6FEB',
    description: 'GitHub Copilot — AI pair programming di VS Code & JetBrains',
    installCmd: 'Install GitHub Copilot extension',
    docsUrl: 'https://docs.github.com/en/copilot',
    configType: 'mitm',
    mitmNote: 'Requires MITM proxy configuration',
    steps: [
      'Install GitHub Copilot extension',
      'Configure proxy settings',
      'Masukkan API endpoint',
    ],
  },
  {
    id: 'kilo-code',
    name: 'Kilo Code',
    icon: '⚡',
    color: '#FF6B6B',
    description: 'Kilo Code — VS Code AI extension',
    installCmd: 'Install dari VS Code Marketplace',
    docsUrl: 'https://github.com/Kilo-Org/kilocode',
    configType: 'guide',
    steps: [
      'Buka Kilo Code settings',
      'Pilih provider: OpenAI Compatible',
      'Masukkan Base URL',
      'Masukkan API Key',
      'Pilih model',
    ],
    guideFields: [
      { label: 'Base URL', value: '{{BASE_URL}}' },
      { label: 'API Key', value: '{{API_KEY}}' },
      { label: 'Model', value: '{{MODEL}}' },
    ],
  },
  {
    id: 'continue',
    name: 'Continue',
    icon: '▶️',
    color: '#7C3AED',
    description: 'Continue AI Assistant — VS Code & JetBrains extension',
    installCmd: 'Install Continue extension',
    docsUrl: 'https://docs.continue.dev',
    configType: 'json',
    configTemplate: `{
  "apiBase": "{{BASE_URL}}",
  "title": "{{MODEL}}",
  "model": "{{MODEL}}",
  "provider": "openai",
  "apiKey": "{{API_KEY}}"
}`,
    steps: [
      'Buka Continue config',
      'Tambahkan model config di atas',
      'Save config',
    ],
  },
  {
    id: 'amp-cli',
    name: 'Amp CLI',
    icon: '🎵',
    color: '#F97316',
    description: 'Sourcegraph Amp — coding assistant CLI',
    installCmd: 'npm install -g @anthropic-ai/amp',
    docsUrl: 'https://sourcegraph.com/amp',
    configType: 'env',
    configTemplate: `export OPENAI_API_KEY="{{API_KEY}}"
export OPENAI_BASE_URL="{{BASE_URL}}"
amp --model "{{MODEL}}"`,
    steps: [
      'Install Amp CLI',
      'Set environment variables',
      'Jalankan: amp --model "model-name"',
    ],
  },
  {
    id: 'qwen-code',
    name: 'Qwen Code',
    icon: '🔮',
    color: '#10B981',
    description: 'Alibaba Qwen Code CLI — supports OpenAI, Anthropic & Gemini',
    installCmd: 'npm install -g @qwen-code/qwen-code',
    docsUrl: 'https://qwenlm.github.io/qwen-code-docs/',
    configType: 'json',
    configTemplate: `{
  "security": {
    "auth": {
      "selectedType": "openai",
      "apiKey": "{{API_KEY}}",
      "baseUrl": "{{BASE_URL}}"
    }
  },
  "model": {
    "name": "{{MODEL}}"
  }
}`,
    configPath: '~/.qwen/settings.json',
    steps: [
      'Install Qwen Code',
      'Buka settings.json',
      'Copy config di atas',
      'Paste ke settings.json',
      'Jalankan: qwen',
    ],
  },
  {
    id: 'codex-cli',
    name: 'OpenAI Codex CLI',
    icon: '💡',
    color: '#10A37F',
    description: 'OpenAI Codex CLI — official OpenAI coding tool',
    installCmd: 'npm install -g @openai/codex',
    docsUrl: 'https://github.com/openai/codex',
    configType: 'env',
    configTemplate: `export OPENAI_API_KEY="{{API_KEY}}"
export OPENAI_BASE_URL="{{BASE_URL}}"
codex "{{MODEL}}"`,
    steps: [
      'Install Codex CLI',
      'Set environment variables',
      'Jalankan: codex "model-name"',
    ],
  },
  {
    id: 'deepseek-tui',
    name: 'DeepSeek TUI',
    icon: '🔍',
    color: '#4D6BFE',
    description: 'DeepSeek Terminal Coding Agent — Rust TUI',
    installCmd: 'cargo install deepseek-tui',
    docsUrl: 'https://github.com/DeepSeek-TUI/DeepSeek-TUI',
    configType: 'env',
    configTemplate: `export DEEPSEEK_API_KEY="{{API_KEY}}"
export DEEPSEEK_BASE_URL="{{BASE_URL}}"
deepseek`,
    configPath: '~/.deepseek/config.toml',
    steps: [
      'Install DeepSeek TUI',
      'Set environment variables',
      'Jalankan: deepseek',
    ],
  },
  {
    id: 'universal',
    name: 'Universal (Any Tool)',
    icon: '🌐',
    color: '#6366F1',
    description: 'Gunakan config ini untuk SEMUA tool yang support OpenAI-compatible API',
    installCmd: 'Tidak perlu install',
    configType: 'env',
    configTemplate: `# Base URL (OpenAI Compatible)
BASE_URL={{BASE_URL}}

# API Key  
API_KEY={{API_KEY}}

# Model
MODEL={{MODEL}}`,
    steps: [
      'Masukkan Base URL',
      'Masukkan API Key',
      'Masukkan Model Name',
      'Gunakan di tool Anda',
    ],
  },
];

/**
 * CLIToolCard — Single tool card component
 */
function CLIToolCard({ tool, apiKey, baseUrl, onSelectModel, selectedModel }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateConfig = () => {
    let config = tool.configTemplate || '';
    config = config.replace(/\{\{BASE_URL\}\}/g, baseUrl);
    config = config.replace(/\{\{API_KEY\}\}/g, apiKey || 'YOUR_API_KEY');
    config = config.replace(/\{\{MODEL\}\}/g, selectedModel || 'gpt-4o-mini');
    return config;
  };

  const handleCopy = () => {
    const config = generateConfig();
    navigator.clipboard.writeText(config).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      className="glass-card"
      style={{
        padding: '24px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        border: expanded ? `2px solid ${tool.color}` : '2px solid transparent',
        boxShadow: expanded ? `0 0 20px ${tool.color}20` : 'none',
      }}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Card Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: expanded ? '16px' : '0' }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          background: `${tool.color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
        }}>
          {tool.icon}
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>
            {tool.name}
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
            {tool.description}
          </p>
        </div>
        <div style={{ color: 'var(--text-muted)' }}>
          {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div
          style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Steps */}
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Steps
            </h4>
            <ol style={{ fontSize: '13px', color: 'var(--text-secondary)', paddingLeft: '20px', lineHeight: '1.8' }}>
              {tool.steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>

          {/* Install Command */}
          {tool.installCmd && (
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Install
              </h4>
              <div style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '12px 16px',
                fontFamily: 'monospace',
                fontSize: '12px',
                color: '#e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <code>{tool.installCmd}</code>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(tool.installCmd);
                  }}
                  style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', padding: '4px' }}
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Guide Fields (for guide-type tools) */}
          {tool.guideFields && (
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Configuration
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {tool.guideFields.map((field, i) => {
                  const value = field.value
                    .replace('{{BASE_URL}}', baseUrl)
                    .replace('{{API_KEY}}', apiKey || 'YOUR_API_KEY')
                    .replace('{{MODEL}}', selectedModel || 'gpt-4o-mini');
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', minWidth: '80px' }}>{field.label}:</span>
                      <div style={{
                        flex: 1,
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        padding: '8px 12px',
                        fontFamily: 'monospace',
                        fontSize: '11px',
                        color: '#e2e8f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}>
                        <code style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</code>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(value);
                          }}
                          style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', padding: '4px', flexShrink: 0 }}
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Code Block (for env/json-type tools) */}
          {tool.configTemplate && (
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Config {tool.configPath && <span style={{ fontWeight: '400', textTransform: 'none' }}>({tool.configPath})</span>}
              </h4>
              <pre style={{
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '16px',
                fontSize: '12px',
                fontFamily: 'monospace',
                color: '#e2e8f0',
                overflowX: 'auto',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap',
              }}>
                {generateConfig()}
              </pre>
            </div>
          )}

          {/* Copy All Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCopy();
            }}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              background: copied ? '#22c55e' : tool.color,
              color: 'white',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
            }}
          >
            {copied ? (
              <>
                <Check size={16} />
                Copied!
              </>
            ) : (
              <>
                <Copy size={16} />
                Copy Config
              </>
            )}
          </button>

          {/* Docs Link */}
          {tool.docsUrl && (
            <a
              href={tool.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                marginTop: '8px',
                fontSize: '12px',
                color: 'var(--text-muted)',
                textDecoration: 'none',
              }}
            >
              <ExternalLink size={12} />
              Official Documentation
            </a>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Main CLI Tools Section Component
 */
export default function CLIToolCards({ apiKey }) {
  const baseUrl = import.meta.env.VITE_AI_ROUTER_PUBLIC_URL || 'https://ai.markaz-arshy.com/v1';
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [allModels, setAllModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userApiKey, setUserApiKey] = useState('');
  const [userApiKeys, setUserApiKeys] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchProviders(token);
      fetchUserApiKeys(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserApiKeys = async (token) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/ai-router/keys/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      const keys = Array.isArray(data) ? data : (data.keys || []);
      setUserApiKeys(keys);
      if (keys.length > 0 && keys[0].apiKey) {
        setUserApiKey(keys[0].apiKey);
      }
    } catch (error) {
      console.error('Error fetching API keys:', error);
    }
  };

  const fetchProviders = async (token) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/ai-router/providers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      // Set all active models
      const models = (Array.isArray(data) ? data : [])
        .filter(p => p.isActive)
        .flatMap(p =>
          (p.models || [])
            .filter(m => m.isActive)
            .map(m => ({
              id: m.modelId,
              name: m.name,
              provider: p.name,
            }))
        );
      setAllModels(models);
    } catch (error) {
      console.error('Error fetching providers:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Model Selector */}
      <div style={{ marginBottom: '30px' }}>
        <div style={{
          background: 'var(--glass-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <Zap size={18} style={{ color: '#f59e0b' }} />
            <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' }}>
              Pilih Model Default
            </h3>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Model ini akan digunakan secara default di semua tool. Anda bisa menggantinya nanti.
          </p>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              background: 'rgba(0,0,0,0.2)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '13px',
              fontFamily: 'monospace',
            }}
          >
            {loading ? (
              <option>Memuat model...</option>
            ) : allModels.length === 0 ? (
              <option>Tidak ada model aktif</option>
            ) : (
              allModels.map(m => (
                <option key={m.id} value={m.id}>
                  {m.provider} / {m.name} ({m.id})
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* API Key Selector */}
      {userApiKeys.length > 0 && (
        <div style={{
          background: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid rgba(34, 197, 94, 0.2)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '30px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <Check size={18} style={{ color: '#22c55e', flexShrink: 0 }} />
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#22c55e' }}>Pilih API Key:</span>
          </div>
          <select
            value={userApiKey}
            onChange={(e) => setUserApiKey(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              background: 'rgba(0,0,0,0.2)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '12px',
              fontFamily: 'monospace',
            }}
          >
            {userApiKeys.map(k => (
              <option key={k.id || k.apiKey} value={k.apiKey}>
                {k.keyName || k.name || 'API Key'} — {k.apiKey.substring(0, 25)}... (Saldo: Rp {(k.creditsBalance || 0).toLocaleString('id-ID')})
              </option>
            ))}
          </select>
        </div>
      )}

      {!userApiKey && !loading && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '30px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <span style={{ fontSize: '18px' }}>⚠️</span>
          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#ef4444' }}>Belum punya API Key?</span>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Buat API Key terlebih dahulu di <a href="/dashboard/ai-keys" style={{ color: 'var(--color-primary)' }}>Dashboard → AI Keys</a>
            </p>
          </div>
        </div>
      )}

      {/* Tools Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '20px',
      }}>
        {CLI_TOOLS.map(tool => (
          <CLIToolCard
            key={tool.id}
            tool={tool}
            apiKey={userApiKey}
            baseUrl={baseUrl}
            selectedModel={selectedModel}
          />
        ))}
      </div>
    </div>
  );
}
