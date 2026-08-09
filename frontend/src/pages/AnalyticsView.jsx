import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle2, Clock, ShieldAlert } from 'lucide-react';

export default function AnalyticsView() {
  const { token } = useAuth();
  const [completionStats, setCompletionStats] = useState(null);
  const [overdueStats, setOverdueStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    setLoading(true);
    Promise.all([
      api.getCompletionRate(token).catch(() => null),
      api.getOverdueTasks(token).catch(() => null),
    ]).then(([comp, over]) => {
      setCompletionStats(comp);
      setOverdueStats(over);
    }).finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading Analytics Engine metrics...
      </div>
    );
  }

  const rate = completionStats?.completion_rate_percentage || 0;
  const statusCounts = completionStats?.status_counts || {};
  const priorityCounts = completionStats?.priority_counts || {};

  return (
    <div style={{ padding: '24px 0' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>Analytics & Performance Engine</h1>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Aggregated SQL throughput metrics powered by Go 5-minute in-memory TTL caching.</p>
      </div>

      {/* Top Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
        
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Completion Rate</span>
            <TrendingUp size={20} style={{ color: '#10b981' }} />
          </div>
          <span style={{ fontSize: '1.8rem', fontWeight: 700, color: '#10b981' }}>{rate.toFixed(1)}%</span>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {completionStats?.completed_tasks || 0} of {completionStats?.total_tasks || 0} tasks done
          </p>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Active Pending Tasks</span>
            <Clock size={20} style={{ color: '#3b82f6' }} />
          </div>
          <span style={{ fontSize: '1.8rem', fontWeight: 700, color: '#3b82f6' }}>{overdueStats?.pending_count || 0}</span>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Currently in pipeline</p>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>High Priority Load</span>
            <AlertTriangle size={20} style={{ color: '#ef4444' }} />
          </div>
          <span style={{ fontSize: '1.8rem', fontWeight: 700, color: '#ef4444' }}>{priorityCounts.high || 0}</span>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>High urgency tasks</p>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>TTL Cache Status</span>
            <BarChart3 size={20} style={{ color: '#8b5cf6' }} />
          </div>
          <span className="badge badge-semantic" style={{ fontSize: '0.9rem', marginTop: '6px' }}>5-min Active Cache</span>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>Bypasses DB query execution</p>
        </div>

      </div>

      {/* Progress Distribution Visualizations */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '28px' }}>
        
        {/* Status Distribution */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
            Workflow Status Distribution
          </h3>

          {[
            { key: 'todo', label: 'To Do', color: '#64748b' },
            { key: 'in_progress', label: 'In Progress', color: '#3b82f6' },
            { key: 'code_review', label: 'Code Review', color: '#f59e0b' },
            { key: 'done', label: 'Done', color: '#10b981' },
          ].map((item) => {
            const cnt = statusCounts[item.key] || 0;
            const pct = completionStats?.total_tasks ? ((cnt / completionStats.total_tasks) * 100).toFixed(0) : 0;

            return (
              <div key={item.key} style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cnt} ({pct}%)</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'var(--bg-input)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: item.color, transition: 'width 0.4s' }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Priority Distribution */}
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
            Task Priority Distribution
          </h3>

          {[
            { key: 'high', label: 'High Priority', color: '#ef4444' },
            { key: 'medium', label: 'Medium Priority', color: '#f59e0b' },
            { key: 'low', label: 'Low Priority', color: '#64748b' },
          ].map((item) => {
            const cnt = priorityCounts[item.key] || 0;
            const pct = completionStats?.total_tasks ? ((cnt / completionStats.total_tasks) * 100).toFixed(0) : 0;

            return (
              <div key={item.key} style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cnt} ({pct}%)</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'var(--bg-input)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: item.color, transition: 'width 0.4s' }} />
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Pending / Overdue Tasks Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', background: 'var(--bg-input)', borderBottom: '1px solid var(--border-color)', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Active Pipeline Tasks ({overdueStats?.tasks?.length || 0})
        </div>

        {(!overdueStats?.tasks || overdueStats.tasks.length === 0) ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No pending tasks. All clear!
          </div>
        ) : (
          overdueStats.tasks.map((t) => (
            <div
              key={t.id}
              style={{
                padding: '12px 20px',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.82rem' }}>#{t.id}</span>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{t.title}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className={`badge badge-${t.priority}`}>{t.priority}</span>
                <span className={`badge badge-${t.status}`}>{t.status.replace('_', ' ')}</span>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
