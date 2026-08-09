import React from 'react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import { Search, Plus, Shield, Users, User, LogOut, BarChart3 } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenCommandPalette, onOpenSearch, onSelectTaskID }) {
  const { user, logout, switchRole } = useAuth();

  const handleRoleChange = async (e) => {
    const roleEmailMap = {
      admin: 'admin@smartops.io',
      manager: 'manager@smartops.io',
      employee: 'dev@smartops.io',
    };
    const targetEmail = roleEmailMap[e.target.value];
    if (targetEmail) {
      await switchRole(targetEmail);
    }
  };

  return (
    <header style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)', padding: '12px 24px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        
        {/* Brand & Navigation Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '1.2rem', color: 'var(--text-primary)' }}>
            <span style={{ color: 'var(--accent-primary)', fontSize: '1.4rem' }}>⚡</span> SmartOps
          </div>

          <nav style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn-secondary"
              style={{ border: activeTab === 'my-tasks' ? '1px solid var(--accent-primary)' : '1px solid transparent' }}
              onClick={() => setActiveTab('my-tasks')}
            >
              <User size={15} /> My Tasks
            </button>

            <button
              className="btn-secondary"
              style={{ border: activeTab === 'team-board' ? '1px solid var(--accent-primary)' : '1px solid transparent' }}
              onClick={() => setActiveTab('team-board')}
            >
              <Users size={15} /> Team Board
            </button>

            <button
              className="btn-secondary"
              style={{ border: activeTab === 'analytics' ? '1px solid var(--accent-primary)' : '1px solid transparent' }}
              onClick={() => setActiveTab('analytics')}
            >
              <BarChart3 size={15} /> Analytics
            </button>

            <button
              className="btn-secondary"
              style={{ border: activeTab === 'workspace-settings' ? '1px solid var(--accent-primary)' : '1px solid transparent' }}
              onClick={() => setActiveTab('workspace-settings')}
            >
              <Shield size={15} /> Workspace Settings
            </button>
          </nav>
        </div>

        {/* Global Search, Command Palette, Notification Bell & User Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          
          {/* Quick Search trigger */}
          <button 
            className="input-field" 
            style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', cursor: 'pointer', width: '200px', padding: '6px 12px' }}
            onClick={onOpenSearch}
          >
            <Search size={14} />
            <span style={{ fontSize: '0.82rem' }}>Search (Cmd+K)...</span>
          </button>

          {/* Quick Create Task */}
          <button className="btn-primary" onClick={onOpenCommandPalette} style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
            <Plus size={16} /> New Task
          </button>

          {/* Notification Bell */}
          <NotificationBell onSelectTaskID={onSelectTaskID} />

          {/* Role selector & profile */}
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderLeft: '1px solid var(--border-color)', paddingLeft: '14px' }}>
              <select
                className="input-field"
                style={{ padding: '4px 10px', fontSize: '0.8rem', width: 'auto', textTransform: 'capitalize' }}
                value={user.role}
                onChange={handleRoleChange}
              >
                <option value="employee">Role: Employee</option>
                <option value="manager">Role: Manager</option>
                <option value="admin">Role: Admin</option>
              </select>

              <button onClick={logout} title="Logout" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
