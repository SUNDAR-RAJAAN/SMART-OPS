import React from 'react';
import { Shield, Users, Database, Server, CheckCircle } from 'lucide-react';

export default function AdminView({ tasks }) {
  const seedUsers = [
    { id: 1, email: 'admin@smartops.io', role: 'admin', team: 'Core Infrastructure' },
    { id: 2, email: 'manager@smartops.io', role: 'manager', team: 'Product Management' },
    { id: 3, email: 'dev@smartops.io', role: 'employee', team: 'Backend Engineering' },
  ];

  return (
    <div style={{ padding: '24px 0' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>Workspace Settings & System Control</h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>System metrics, RBAC permissions, and database health.</p>
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
