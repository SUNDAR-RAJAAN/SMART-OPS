import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Users, User, ArrowRight, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (email.trim()) {
      await login(email.trim());
    }
  };

  const handleQuickLogin = (presetEmail) => {
    setEmail(presetEmail);
    login(presetEmail);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)', padding: '20px' }}>
      <div className="card" style={{ width: '100%', maxWidth: '440px', padding: '32px', textAlign: 'center', boxShadow: 'var(--shadow-modal)' }}>
        
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.15)', color: 'var(--accent-primary)', marginBottom: '16px' }}>
          <Sparkles size={24} />
        </div>

        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
          Welcome to SmartOps
        </h1>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
          Identity & Role-Based Workflows powered by Go & SQLite
        </p>

        <form onSubmit={handleSubmit} style={{ marginBottom: '24px' }}>
          <input
            type="email"
            className="input-field"
            placeholder="Enter your email (e.g. dev@smartops.io)..."
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ marginBottom: '14px' }}
          />
          <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '10px' }} disabled={loading}>
            {loading ? 'Logging in...' : 'Sign In'} <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ position: 'relative', margin: '20px 0', borderBottom: '1px solid var(--border-color)' }}>
          <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'var(--bg-card)', padding: '0 10px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            DEMO ROLE PRESETS
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
          <button 
            type="button" 
            className="btn-secondary" 
            style={{ justifyContent: 'space-between', padding: '10px 14px' }}
            onClick={() => handleQuickLogin('dev@smartops.io')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <User size={16} style={{ color: '#38bdf8' }} />
              <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>Employee View</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>dev@smartops.io</span>
          </button>

          <button 
            type="button" 
            className="btn-secondary" 
            style={{ justifyContent: 'space-between', padding: '10px 14px' }}
            onClick={() => handleQuickLogin('manager@smartops.io')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Users size={16} style={{ color: '#fbbf24' }} />
              <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>Manager Board</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>manager@smartops.io</span>
          </button>

          <button 
            type="button" 
            className="btn-secondary" 
            style={{ justifyContent: 'space-between', padding: '10px 14px' }}
            onClick={() => handleQuickLogin('admin@smartops.io')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Shield size={16} style={{ color: '#4ade80' }} />
              <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>Admin Settings</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>admin@smartops.io</span>
          </button>
        </div>

      </div>
    </div>
  );
}
