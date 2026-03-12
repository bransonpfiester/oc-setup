import { useState } from 'react';
import { colors, fonts } from '../theme';

const tabs = [
  { id: 'provider', label: 'AI Provider' },
  { id: 'model', label: 'Model Config' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'security', label: 'Security' },
  { id: 'apikeys', label: 'API Keys' },
  { id: 'theme', label: 'Theme' },
];

interface ApiKey {
  id: number;
  name: string;
  prefix: string;
  created: string;
  lastUsed: string;
  status: 'active' | 'revoked';
}

const initialApiKeys: ApiKey[] = [
  { id: 1, name: 'Production API', prefix: 'sk-prod-8f...', created: '2024-01-15', lastUsed: '2024-03-10', status: 'active' },
  { id: 2, name: 'Development', prefix: 'sk-dev-3a7...', created: '2024-02-20', lastUsed: '2024-03-09', status: 'active' },
  { id: 3, name: 'Staging', prefix: 'sk-stag-7c...', created: '2024-01-28', lastUsed: '2024-03-08', status: 'active' },
  { id: 4, name: 'CI/CD Pipeline', prefix: 'sk-cicd-2e...', created: '2024-03-01', lastUsed: '2024-03-10', status: 'active' },
  { id: 5, name: 'Legacy System', prefix: 'sk-lega-9d...', created: '2023-11-10', lastUsed: '2024-02-15', status: 'revoked' },
];

const defaultSettings = {
  provider: 'openai',
  apiKey: '',
  showApiKey: false,
  baseUrl: 'https://api.openai.com/v1',
  providerModel: 'gpt-4',
  temperature: 0.7,
  maxTokens: 4096,
  defaultModel: 'gpt-4',
  contextWindow: 128000,
  streaming: true,
  responseFormat: 'text',
  systemPrompt: 'You are a helpful assistant.',
  topP: 1.0,
  frequencyPenalty: 0,
  presencePenalty: 0,
  emailEnabled: true,
  emailAddress: 'admin@openclaw.io',
  notifyErrors: true,
  notifyWarnings: true,
  notifyDeployments: true,
  notifySecurity: true,
  notifyUsage: false,
  weeklyDigest: true,
  slackWebhook: '',
  discordWebhook: '',
  quietStart: '22:00',
  quietEnd: '08:00',
  twoFactor: false,
  sessionTimeout: '1hr',
  ipWhitelist: '',
  allowedOrigins: 'https://openclaw.io\nhttps://api.openclaw.io',
  rateLimiting: true,
  maxRequestsPerMin: 60,
  corsEnabled: true,
  auditLogging: true,
  accentColor: '#f87171',
  fontSize: 'medium',
  sidebarPosition: 'left',
  compactMode: false,
  showAnimations: true,
  codeFont: 'JetBrains Mono',
};

type SettingsState = typeof defaultSettings;

export function Settings() {
  const [activeTab, setActiveTab] = useState('provider');
  const [settings, setSettings] = useState<SettingsState>({ ...defaultSettings });
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([...initialApiKeys]);

  const update = (key: keyof SettingsState, value: string | number | boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const revokeKey = (id: number) => {
    setApiKeys((prev) =>
      prev.map((k) => (k.id === id ? { ...k, status: 'revoked' as const } : k))
    );
  };

  const generateKey = () => {
    const newId = Math.max(...apiKeys.map((k) => k.id)) + 1;
    const rand = Math.random().toString(36).slice(2, 6);
    setApiKeys((prev) => [
      ...prev,
      {
        id: newId,
        name: `New Key ${newId}`,
        prefix: `sk-new-${rand}...`,
        created: new Date().toISOString().split('T')[0],
        lastUsed: 'Never',
        status: 'active' as const,
      },
    ]);
  };

  const resetToDefault = () => {
    setSettings({ ...defaultSettings });
  };

  const inputStyle: React.CSSProperties = {
    background: colors.bgElevated,
    border: `1px solid ${colors.border}`,
    borderRadius: 10,
    padding: '10px 14px',
    color: colors.text,
    fontFamily: fonts.sans,
    fontSize: '0.85rem',
    width: '100%',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    color: colors.textDim,
    fontSize: '0.85rem',
    fontWeight: 500,
    marginBottom: 6,
    display: 'block',
  };

  const cardStyle: React.CSSProperties = {
    background: colors.bgCard,
    border: `1px solid ${colors.border}`,
    padding: 24,
    borderRadius: 14,
    marginBottom: 20,
  };

  const fieldStyle: React.CSSProperties = {
    marginBottom: 18,
  };

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
  };

  const btnPrimary: React.CSSProperties = {
    padding: '10px 20px',
    borderRadius: 10,
    border: 'none',
    background: colors.accent,
    color: '#fff',
    fontWeight: 600,
    fontSize: '0.85rem',
    cursor: 'pointer',
    fontFamily: fonts.sans,
  };

  const btnSecondary: React.CSSProperties = {
    padding: '10px 20px',
    borderRadius: 10,
    border: `1px solid ${colors.border}`,
    background: colors.bgElevated,
    color: colors.textDim,
    fontWeight: 600,
    fontSize: '0.85rem',
    cursor: 'pointer',
    fontFamily: fonts.sans,
  };

  const renderToggle = (key: keyof SettingsState) => {
    const active = settings[key] as boolean;
    return (
      <div
        role="switch"
        tabIndex={0}
        aria-checked={active}
        onClick={() => update(key, !active)}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            update(key, !active);
          }
        }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          width: 48,
          height: 26,
          borderRadius: 13,
          background: active ? colors.accent : colors.bgElevated,
          border: `1px solid ${active ? colors.accent : colors.border}`,
          cursor: 'pointer',
          position: 'relative',
          transition: 'all 0.2s',
        }}
      >
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: active ? '#fff' : colors.textDim,
            position: 'absolute',
            left: active ? 24 : 3,
            transition: 'left 0.2s',
          }}
        />
      </div>
    );
  };

  const renderButtons = () => (
    <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
      <button style={btnPrimary}>Save Changes</button>
      <button style={btnSecondary} onClick={resetToDefault}>
        Reset to Default
      </button>
    </div>
  );

  const sectionHeading: React.CSSProperties = {
    color: colors.text,
    fontSize: '1.15rem',
    fontWeight: 600,
    margin: '0 0 20px 0',
  };

  return (
    <div style={{ padding: 0, fontFamily: fonts.sans }}>
      <div style={{ marginBottom: 20 }}>
        <h1
          style={{
            fontSize: '1.6rem',
            fontWeight: 700,
            color: colors.text,
            margin: 0,
            marginBottom: 6,
          }}
        >
          Settings
        </h1>
        <p style={{ color: colors.textDim, fontSize: '0.9rem', margin: 0 }}>
          Configure your OpenClaw dashboard
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 0,
          borderBottom: `1px solid ${colors.border}`,
          marginBottom: 24,
          overflowX: 'auto',
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 20px',
              background: 'none',
              border: 'none',
              borderBottom: `2px solid ${
                activeTab === tab.id ? colors.accent : 'transparent'
              }`,
              color: activeTab === tab.id ? colors.text : colors.textDim,
              fontWeight: activeTab === tab.id ? 600 : 400,
              fontSize: '0.9rem',
              cursor: 'pointer',
              fontFamily: fonts.sans,
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'provider' && (
        <div style={cardStyle}>
          <h2 style={sectionHeading}>AI Provider Configuration</h2>
          <div style={gridStyle}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Provider</label>
              <select
                value={settings.provider}
                onChange={(e) => update('provider', e.target.value)}
                style={inputStyle}
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="google">Google</option>
                <option value="ollama">Ollama</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Model</label>
              <select
                value={settings.providerModel}
                onChange={(e) => update('providerModel', e.target.value)}
                style={inputStyle}
              >
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-3.5">GPT-3.5</option>
                <option value="claude-3">Claude 3</option>
                <option value="gemini-pro">Gemini Pro</option>
              </select>
            </div>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>API Key</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type={settings.showApiKey ? 'text' : 'password'}
                value={settings.apiKey}
                onChange={(e) => update('apiKey', e.target.value)}
                placeholder="sk-..."
                style={{ ...inputStyle, flex: 1 }}
              />
              <button
                onClick={() => update('showApiKey', !settings.showApiKey)}
                style={{
                  ...btnSecondary,
                  padding: '10px 16px',
                  whiteSpace: 'nowrap',
                }}
              >
                {settings.showApiKey ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Base URL</label>
            <input
              type="text"
              value={settings.baseUrl}
              onChange={(e) => update('baseUrl', e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={gridStyle}>
            <div style={fieldStyle}>
              <label style={labelStyle}>
                Temperature: {settings.temperature.toFixed(1)}
              </label>
              <input
                type="range"
                min={0}
                max={2}
                step={0.1}
                value={settings.temperature}
                onChange={(e) =>
                  update('temperature', parseFloat(e.target.value))
                }
                style={{ width: '100%', accentColor: colors.accent }}
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Max Tokens</label>
              <input
                type="number"
                value={settings.maxTokens}
                onChange={(e) =>
                  update('maxTokens', parseInt(e.target.value) || 0)
                }
                style={inputStyle}
              />
            </div>
          </div>
          <button
            style={{
              ...btnSecondary,
              border: `1px solid ${colors.cyan}`,
              color: colors.cyan,
              marginTop: 4,
            }}
          >
            Test Connection
          </button>
          {renderButtons()}
        </div>
      )}

      {activeTab === 'model' && (
        <div style={cardStyle}>
          <h2 style={sectionHeading}>Model Configuration</h2>
          <div style={gridStyle}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Default Model</label>
              <select
                value={settings.defaultModel}
                onChange={(e) => update('defaultModel', e.target.value)}
                style={inputStyle}
              >
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-3.5">GPT-3.5 Turbo</option>
                <option value="claude-3">Claude 3 Opus</option>
                <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                <option value="gemini-pro">Gemini Pro</option>
              </select>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Context Window Size</label>
              <input
                type="number"
                value={settings.contextWindow}
                onChange={(e) =>
                  update('contextWindow', parseInt(e.target.value) || 0)
                }
                style={inputStyle}
              />
            </div>
          </div>
          <div style={gridStyle}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Streaming</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {renderToggle('streaming')}
                <span style={{ color: colors.textDim, fontSize: '0.85rem' }}>
                  {settings.streaming ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Response Format</label>
              <select
                value={settings.responseFormat}
                onChange={(e) => update('responseFormat', e.target.value)}
                style={inputStyle}
              >
                <option value="text">Text</option>
                <option value="json">JSON</option>
                <option value="markdown">Markdown</option>
              </select>
            </div>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>System Prompt</label>
            <textarea
              value={settings.systemPrompt}
              onChange={(e) => update('systemPrompt', e.target.value)}
              rows={4}
              style={{
                ...inputStyle,
                fontFamily: fonts.mono,
                resize: 'vertical',
              }}
            />
          </div>
          <div style={gridStyle}>
            <div style={fieldStyle}>
              <label style={labelStyle}>
                Top P: {(settings.topP as number).toFixed(2)}
              </label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={settings.topP}
                onChange={(e) => update('topP', parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: colors.accent }}
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>
                Frequency Penalty:{' '}
                {(settings.frequencyPenalty as number).toFixed(1)}
              </label>
              <input
                type="range"
                min={0}
                max={2}
                step={0.1}
                value={settings.frequencyPenalty}
                onChange={(e) =>
                  update('frequencyPenalty', parseFloat(e.target.value))
                }
                style={{ width: '100%', accentColor: colors.accent }}
              />
            </div>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>
              Presence Penalty:{' '}
              {(settings.presencePenalty as number).toFixed(1)}
            </label>
            <input
              type="range"
              min={0}
              max={2}
              step={0.1}
              value={settings.presencePenalty}
              onChange={(e) =>
                update('presencePenalty', parseFloat(e.target.value))
              }
              style={{ width: '100%', accentColor: colors.accent }}
            />
          </div>
          {renderButtons()}
        </div>
      )}

      {activeTab === 'notifications' && (
        <div style={cardStyle}>
          <h2 style={sectionHeading}>Notification Preferences</h2>
          <div style={gridStyle}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Email Notifications</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {renderToggle('emailEnabled')}
                <span style={{ color: colors.textDim, fontSize: '0.85rem' }}>
                  {settings.emailEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Email Address</label>
              <input
                type="email"
                value={settings.emailAddress}
                onChange={(e) => update('emailAddress', e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Notification Types</label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: 12,
                marginTop: 8,
              }}
            >
              {[
                { key: 'notifyErrors' as const, label: 'Errors' },
                { key: 'notifyWarnings' as const, label: 'Warnings' },
                { key: 'notifyDeployments' as const, label: 'Deployments' },
                { key: 'notifySecurity' as const, label: 'Security Alerts' },
                { key: 'notifyUsage' as const, label: 'Usage Reports' },
                { key: 'weeklyDigest' as const, label: 'Weekly Digest' },
              ].map(({ key, label }) => (
                <label
                  key={key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    color: colors.text,
                    fontSize: '0.85rem',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={settings[key] as boolean}
                    onChange={(e) => update(key, e.target.checked)}
                    style={{ accentColor: colors.accent, width: 16, height: 16 }}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
          <div style={gridStyle}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Slack Webhook URL</label>
              <input
                type="url"
                value={settings.slackWebhook}
                onChange={(e) => update('slackWebhook', e.target.value)}
                placeholder="https://hooks.slack.com/services/..."
                style={inputStyle}
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Discord Webhook URL</label>
              <input
                type="url"
                value={settings.discordWebhook}
                onChange={(e) => update('discordWebhook', e.target.value)}
                placeholder="https://discord.com/api/webhooks/..."
                style={inputStyle}
              />
            </div>
          </div>
          <div style={gridStyle}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Quiet Hours Start</label>
              <input
                type="time"
                value={settings.quietStart}
                onChange={(e) => update('quietStart', e.target.value)}
                style={inputStyle}
              />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Quiet Hours End</label>
              <input
                type="time"
                value={settings.quietEnd}
                onChange={(e) => update('quietEnd', e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>
          {renderButtons()}
        </div>
      )}

      {activeTab === 'security' && (
        <div style={cardStyle}>
          <h2 style={sectionHeading}>Security Settings</h2>
          <div style={gridStyle}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Two-Factor Authentication</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {renderToggle('twoFactor')}
                <span style={{ color: colors.textDim, fontSize: '0.85rem' }}>
                  {settings.twoFactor ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Session Timeout</label>
              <select
                value={settings.sessionTimeout}
                onChange={(e) => update('sessionTimeout', e.target.value)}
                style={inputStyle}
              >
                <option value="15min">15 minutes</option>
                <option value="30min">30 minutes</option>
                <option value="1hr">1 hour</option>
                <option value="4hr">4 hours</option>
                <option value="24hr">24 hours</option>
              </select>
            </div>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>IP Whitelist</label>
            <textarea
              value={settings.ipWhitelist}
              onChange={(e) => update('ipWhitelist', e.target.value)}
              rows={3}
              placeholder="Enter IP addresses, one per line..."
              style={{
                ...inputStyle,
                fontFamily: fonts.mono,
                resize: 'vertical',
              }}
            />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Allowed Origins</label>
            <textarea
              value={settings.allowedOrigins}
              onChange={(e) => update('allowedOrigins', e.target.value)}
              rows={3}
              placeholder="Enter allowed origins, one per line..."
              style={{
                ...inputStyle,
                fontFamily: fonts.mono,
                resize: 'vertical',
              }}
            />
          </div>
          <div style={gridStyle}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Rate Limiting</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {renderToggle('rateLimiting')}
                <span style={{ color: colors.textDim, fontSize: '0.85rem' }}>
                  {settings.rateLimiting ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Max Requests per Minute</label>
              <input
                type="number"
                value={settings.maxRequestsPerMin}
                onChange={(e) =>
                  update('maxRequestsPerMin', parseInt(e.target.value) || 0)
                }
                style={inputStyle}
              />
            </div>
          </div>
          <div style={gridStyle}>
            <div style={fieldStyle}>
              <label style={labelStyle}>CORS Enabled</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {renderToggle('corsEnabled')}
                <span style={{ color: colors.textDim, fontSize: '0.85rem' }}>
                  {settings.corsEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Audit Logging</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {renderToggle('auditLogging')}
                <span style={{ color: colors.textDim, fontSize: '0.85rem' }}>
                  {settings.auditLogging ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>
          {renderButtons()}
        </div>
      )}

      {activeTab === 'apikeys' && (
        <div style={cardStyle}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <h2 style={{ ...sectionHeading, margin: 0 }}>API Key Management</h2>
            <button style={btnPrimary} onClick={generateKey}>
              Generate New Key
            </button>
          </div>
          <div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr 0.8fr 0.8fr',
                gap: 0,
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: colors.textDim,
                fontWeight: 600,
                borderBottom: `1px solid ${colors.border}`,
              }}
            >
              <div style={{ padding: '10px 12px' }}>Name</div>
              <div style={{ padding: '10px 12px' }}>Key Prefix</div>
              <div style={{ padding: '10px 12px' }}>Created</div>
              <div style={{ padding: '10px 12px' }}>Last Used</div>
              <div style={{ padding: '10px 12px' }}>Status</div>
              <div style={{ padding: '10px 12px' }}></div>
            </div>
            {apiKeys.map((apiKey) => (
              <div
                key={apiKey.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr 0.8fr 0.8fr',
                  gap: 0,
                  fontSize: '0.85rem',
                  borderBottom: `1px solid ${colors.border}22`,
                  alignItems: 'center',
                }}
              >
                <div style={{ padding: '12px', color: colors.text }}>
                  {apiKey.name}
                </div>
                <div
                  style={{
                    padding: '12px',
                    color: colors.textDim,
                    fontFamily: fonts.mono,
                  }}
                >
                  {apiKey.prefix}
                </div>
                <div style={{ padding: '12px', color: colors.textDim }}>
                  {apiKey.created}
                </div>
                <div style={{ padding: '12px', color: colors.textDim }}>
                  {apiKey.lastUsed}
                </div>
                <div style={{ padding: '12px' }}>
                  <span
                    style={{
                      padding: '3px 10px',
                      borderRadius: 8,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background:
                        apiKey.status === 'active'
                          ? `${colors.green}20`
                          : `${colors.red}20`,
                      color:
                        apiKey.status === 'active' ? colors.green : colors.red,
                    }}
                  >
                    {apiKey.status}
                  </span>
                </div>
                <div style={{ padding: '12px' }}>
                  {apiKey.status === 'active' && (
                    <button
                      onClick={() => revokeKey(apiKey.id)}
                      style={{
                        padding: '4px 12px',
                        borderRadius: 6,
                        border: `1px solid ${colors.red}`,
                        background: 'transparent',
                        color: colors.red,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: fonts.sans,
                      }}
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {renderButtons()}
        </div>
      )}

      {activeTab === 'theme' && (
        <div style={cardStyle}>
          <h2 style={sectionHeading}>Theme Customization</h2>
          <div style={gridStyle}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Accent Color</label>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: 12 }}
              >
                <input
                  type="color"
                  value={settings.accentColor}
                  onChange={(e) => update('accentColor', e.target.value)}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    border: `1px solid ${colors.border}`,
                    background: colors.bgElevated,
                    cursor: 'pointer',
                    padding: 2,
                  }}
                />
                <div
                  style={{
                    width: 80,
                    height: 32,
                    borderRadius: 8,
                    background: settings.accentColor,
                  }}
                />
                <span
                  style={{
                    color: colors.textDim,
                    fontFamily: fonts.mono,
                    fontSize: '0.85rem',
                  }}
                >
                  {settings.accentColor}
                </span>
              </div>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Font Size</label>
              <select
                value={settings.fontSize}
                onChange={(e) => update('fontSize', e.target.value)}
                style={inputStyle}
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
          </div>
          <div style={gridStyle}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Sidebar Position</label>
              <select
                value={settings.sidebarPosition}
                onChange={(e) => update('sidebarPosition', e.target.value)}
                style={inputStyle}
              >
                <option value="left">Left</option>
                <option value="right">Right</option>
              </select>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Code Font</label>
              <select
                value={settings.codeFont}
                onChange={(e) => update('codeFont', e.target.value)}
                style={inputStyle}
              >
                <option value="JetBrains Mono">JetBrains Mono</option>
                <option value="Fira Code">Fira Code</option>
                <option value="Source Code Pro">Source Code Pro</option>
              </select>
            </div>
          </div>
          <div style={gridStyle}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Compact Mode</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {renderToggle('compactMode')}
                <span style={{ color: colors.textDim, fontSize: '0.85rem' }}>
                  {settings.compactMode ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Show Animations</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {renderToggle('showAnimations')}
                <span style={{ color: colors.textDim, fontSize: '0.85rem' }}>
                  {settings.showAnimations ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>
          {renderButtons()}
        </div>
      )}
    </div>
  );
}
