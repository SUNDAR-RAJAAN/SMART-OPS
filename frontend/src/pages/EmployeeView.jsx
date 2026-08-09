import React from 'react';
import { CheckCircle2, Clock, FileCode, CheckSquare, Sparkles } from 'lucide-react';

export default function EmployeeView({ tasks, onSelectTask, onUpdateStatus, onOpenCommandPalette }) {
  const getTasksByStatus = (status) => tasks.filter((t) => t.status === status);

  return (
    <div style={{ padding: '24px 0' }}>
      
      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>My Command Dashboard</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Dense developer task focus view. Press Cmd+K anywhere to create tasks.</p>
        </div>

        <button className="btn-sparkle" onClick={onOpenCommandPalette}>
          <Sparkles size={16} /> Fast Create Task (Cmd+K)
        </button>
      </div>

      {/* Task Summary Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'To Do', count: getTasksByStatus('todo').length, color: '#64748b', icon: Clock },
          { label: 'In Progress', count: getTasksByStatus('in_progress').length, color: '#3b82f6', icon: FileCode },
          { label: 'Code Review', count: getTasksByStatus('code_review').length, color: '#f59e0b', icon: CheckSquare },
          { label: 'Done', count: getTasksByStatus('done').length, color: '#10b981', icon: CheckCircle2 },
        ].map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="card" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${m.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: m.color }}>
                <Icon size={20} />
              </div>
              <div>
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>{m.count}</span>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{m.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dense Task Table / List */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', background: 'var(--bg-input)', borderBottom: '1px solid var(--border-color)', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
          <span>Active Task Queue ({tasks.length})</span>
          <span>Actions & Status</span>
        </div>

        {tasks.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No active tasks found. Press Cmd+K to create your first task!
          </div>
        ) : (
          tasks.map((task) => (
            <div 
              key={task.id} 
              style={{ 
                padding: '14px 20px', 
                borderBottom: '1px solid var(--border-color)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                transition: 'background 0.15s',
                cursor: 'pointer'
              }}
              className="card-row"
              onClick={() => onSelectTask(task)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.85rem', width: '40px' }}>#{task.id}</span>
                <div>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{task.title}</span>
                  {task.desc && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{task.desc}</p>}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} onClick={(e) => e.stopPropagation()}>
                <span className={`badge badge-${task.priority}`}>
                  {task.priority}
                </span>

                <select
                  className={`badge badge-${task.status}`}
                  style={{ cursor: 'pointer', outline: 'none', background: 'transparent' }}
                  value={task.status}
                  onChange={(e) => onUpdateStatus(task.id, e.target.value)}
                >
                  <option value="todo" style={{ background: '#131924', color: '#cbd5e1' }}>To Do</option>
                  <option value="in_progress" style={{ background: '#131924', color: '#93c5fd' }}>In Progress</option>
                  <option value="code_review" style={{ background: '#131924', color: '#fde68a' }}>Code Review</option>
                  <option value="done" style={{ background: '#131924', color: '#6ee7b7' }}>Done</option>
                </select>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
