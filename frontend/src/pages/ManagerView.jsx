import React from 'react';
import { Sparkles, Plus, FileText, ArrowRight, ArrowLeft } from 'lucide-react';

export default function ManagerView({ tasks, onSelectTask, onUpdateStatus, onOpenCommandPalette }) {
  const columns = [
    { key: 'todo', label: 'To Do', color: '#64748b' },
    { key: 'in_progress', label: 'In Progress', color: '#3b82f6' },
    { key: 'code_review', label: 'Code Review', color: '#f59e0b' },
    { key: 'done', label: 'Done', color: '#10b981' },
  ];

  const getTasksByStatus = (statusKey) => tasks.filter((t) => t.status === statusKey);

  const getNextStatus = (current) => {
    const flow = ['todo', 'in_progress', 'code_review', 'done'];
    const idx = flow.indexOf(current);
    return idx < flow.length - 1 ? flow[idx + 1] : null;
  };

  const getPrevStatus = (current) => {
    const flow = ['todo', 'in_progress', 'code_review', 'done'];
    const idx = flow.indexOf(current);
    return idx > 0 ? flow[idx - 1] : null;
  };

  return (
    <div style={{ padding: '24px 0' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>Team Kanban Board</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Macroscopic team workflow overview with optimistic state sync.</p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-primary" onClick={onOpenCommandPalette}>
            <Plus size={16} /> Add Card
          </button>
        </div>
      </div>

      {/* Kanban Board Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', alignItems: 'start' }}>
        {columns.map((col) => {
          const colTasks = getTasksByStatus(col.key);

          return (
            <div 
              key={col.key} 
              style={{ 
                background: 'rgba(19, 25, 36, 0.6)', 
                border: '1px solid var(--border-color)', 
                borderRadius: 'var(--radius-md)', 
                padding: '14px',
                minHeight: '520px' 
              }}
            >
              {/* Column Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', paddingBottom: '10px', borderBottom: `2px solid ${col.color}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{col.label}</span>
                  <span className="badge" style={{ background: `${col.color}25`, color: col.color }}>{colTasks.length}</span>
                </div>
              </div>

              {/* Task Cards Container */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {colTasks.map((task) => {
                  const prev = getPrevStatus(task.status);
                  const next = getNextStatus(task.status);

                  return (
                    <div 
                      key={task.id} 
                      className="card"
                      style={{ padding: '14px', cursor: 'pointer', position: 'relative' }}
                      onClick={() => onSelectTask(task)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>#{task.id}</span>
                        <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                      </div>

                      <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                        {task.title}
                      </h4>

                      {task.desc && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {task.desc}
                        </p>
                      )}

                      {/* Card Footer with Quick Move Controls */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {prev && (
                            <button 
                              className="btn-secondary" 
                              style={{ padding: '2px 8px', fontSize: '0.75rem' }} 
                              onClick={() => onUpdateStatus(task.id, prev)}
                              title={`Move back to ${prev}`}
                            >
                              <ArrowLeft size={12} />
                            </button>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '4px' }}>
                          {next && (
                            <button 
                              className="btn-secondary" 
                              style={{ padding: '2px 8px', fontSize: '0.75rem' }} 
                              onClick={() => onUpdateStatus(task.id, next)}
                              title={`Move forward to ${next}`}
                            >
                              <ArrowRight size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
