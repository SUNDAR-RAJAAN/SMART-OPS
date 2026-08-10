import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Shield, Users, Database, Server, CheckCircle, MessageSquare, Send, Save, AlertCircle, Sparkles } from 'lucide-react';

export default function AdminView({ tasks }) {
  const { token, user } = useAuth();
  const [webhookUrl, setWebhookUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const seedUsers = [
    { id: 1, email: 'admin@smartops.io', role: 'admin', team: 'Core Infrastructure' },
    { id: 2, email: 'manager@smartops.io', role: 'manager', team: 'Product Management' },
    { id: 3, email: 'dev@smartops.io', role: 'employee', team: 'Backend Engineering' },
  ];

  // Fetch current user settings
  useEffect(() => {
    if (!token) return;
    api.getProfile(token)
      .then((profile) => {
        if (profile?.teams_webhook_url) {
          setWebhookUrl(profile.teams_webhook_url);
        }
      })
      .catch((err) => console.error('Failed loading profile settings:', err));
  }, [token]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback({ type: '', message: '' });

    try {
      await api.updateUserSettings({ teams_webhook_url: webhookUrl.trim() }, token);
      setFeedback({ type: 'success', message: 'Teams Webhook URL saved successfully!' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed saving settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl.trim()) {
      setFeedback({ type: 'error', message: 'Please enter a valid Teams Webhook URL first.' });
      return;
    }

    setTesting(true);
    setFeedback({ type: '', message: '' });

    try {
      const res = await api.testTeamsWebhook(webhookUrl.trim(), token);
      setFeedback({ type: 'success', message: res.message || 'Sample test message sent to Microsoft Teams successfully!' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed sending test message to Teams.' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div style={{ padding: '24px 0' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>Workspace Settings & System Control</h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>System metrics, RBAC permissions, and Microsoft Teams integration.</p>
      </div>

      {/* Microsoft Teams Webhook Integration Card */}
      <div 
        className="card" 
        style={{ 
          padding: '24px', 
          marginBottom: '28px', 
          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(79, 70, 229, 0.04) 100%)',
          border: '1px solid rgba(59, 130, 246, 0.3)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', background: 'rgba(59, 130, 246, 0.2)', color: 'var(--accent-primary)' }}>
              <MessageSquare size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Microsoft Teams Channel Webhook</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Receive real-time channel notifications whenever task status changes, @mentions, or assignments occur.</p>
            </div>
          </div>
          <span className="badge badge-fuzzy" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Sparkles size={12} /> Real-Time Push
          </span>
        </div>

        {feedback.message && (
          <div 
            style={{ 
              marginBottom: '16px', 
              padding: '10px 14px', 
              borderRadius: 'var(--radius-sm)', 
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: feedback.type === 'success' ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
              color: feedback.type === 'success' ? '#6ee7b7' : '#fca5a5',
            }}
          >
            {feedback.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            <span>{feedback.message}</span>
          </div>
        )}

        <form onSubmit={handleSaveSettings}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              Teams Webhook Connector URL
            </label>
            <input
              type="url"
              className="input-field"
              placeholder="https://outlook.office.com/webhook/... or Azure Logic App URL"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn-secondary"
              disabled={testing || !webhookUrl.trim()}
              onClick={handleTestWebhook}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
            >
              <Send size={15} />
              {testing ? 'Sending Sample...' : 'Test Teams Webhook'}
            </button>

            <button
              type="submit"
              className="btn-primary"
              disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
            >
              <Save size={15} />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>

      {/* System Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--accent-primary)', marginBottom: '8px' }}>
            <Database size={20} />
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Database Driver</span>
          </div>
          <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>SQLite3 (smartops.db)</span>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Zero-config local relational storage mode</p>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#10b981', marginBottom: '8px' }}>
            <Server size={20} />
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Backend Server</span>
          </div>
          <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>Go 1.26 HTTP Engine</span>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Listening on http://localhost:8080</p>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#f59e0b', marginBottom: '8px' }}>
            <Shield size={20} />
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Total Tasks Managed</span>
          </div>
          <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{tasks.length} Active Records</span>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Indexed in 3-tier search pipeline</p>
        </div>
      </div>

      {/* User RBAC Directory */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', background: 'var(--bg-input)', borderBottom: '1px solid var(--border-color)', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          User & Role Assignments (RBAC)
        </div>

        {seedUsers.map((u) => (
          <div 
            key={u.id}
            style={{ 
              padding: '14px 20px', 
              borderBottom: '1px solid var(--border-color)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between' 
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                {u.email[0].toUpperCase()}
              </div>
              <div>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.92rem' }}>{u.email}</span>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Team: {u.team}</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className={`badge badge-${u.role === 'admin' ? 'done' : u.role === 'manager' ? 'code_review' : 'in_progress'}`}>
                {u.role}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle size={14} /> Active
              </span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
