import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Command, Plus, X, AlertTriangle, ExternalLink, ShieldAlert, Sparkles } from 'lucide-react';

export default function CommandPalette({ isOpen, onClose, onTaskCreated, onSelectTaskID }) {
  const { token, user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [assigneeId, setAssigneeId] = useState('');
  const [parentTaskId, setParentTaskId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Smart Triage & Duplicate Detection state
  const [triageLoading, setTriageLoading] = useState(false);
  const [duplicateMatches, setDuplicateMatches] = useState([]);
  const [bypassDuplicate, setBypassDuplicate] = useState(false);

  const inputRef = useRef(null);
  const triageTimeoutRef = useRef(null);

  const usersList = [
    { id: 1, email: 'admin@smartops.io', role: 'Admin' },
    { id: 2, email: 'manager@smartops.io', role: 'Manager' },
    { id: 3, email: 'dev@smartops.io', role: 'Employee' },
  ];

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setTitle('');
      setDescription('');
      setAssigneeId('');
      setParentTaskId('');
      setDuplicateMatches([]);
      setBypassDuplicate(false);
    }
  }, [isOpen]);

  // Live Triage Check with 400ms debounce as user types title
  useEffect(() => {
    if (triageTimeoutRef.current) clearTimeout(triageTimeoutRef.current);
    if (!title.trim() || title.length < 5 || bypassDuplicate || !token) {
      setDuplicateMatches([]);
      return;
    }

    triageTimeoutRef.current = setTimeout(async () => {
      setTriageLoading(true);
      try {
        const res = await api.triageTask({
          title: title.trim(),
          desc: description.trim(),
          parent_task_id: parentTaskId ? parseInt(parentTaskId) : null,
        }, token);

        if (res.has_duplicates && res.matches?.length > 0) {
          setDuplicateMatches(res.matches);
        } else {
          setDuplicateMatches([]);
        }
      } catch (err) {
        console.error('Triage check error:', err);
      } finally {
        setTriageLoading(false);
      }
    }, 400);

    return () => clearTimeout(triageTimeoutRef.current);
  }, [title, description, parentTaskId, token, bypassDuplicate]);

  if (!isOpen) return null;

  const handleSubmit = async (e, forceCreate = false) => {
    if (e) e.preventDefault();
    if (!title.trim()) return;

    if (!forceCreate && duplicateMatches.length > 0 && !bypassDuplicate) {
      return; // Stop submission if duplicates found and user hasn't chosen force create
    }

    setSubmitting(true);
    try {
      const newTask = await api.createTask({
        title: title.trim(),
        desc: description.trim(),
        priority,
        status: 'todo',
        assignee_id: assigneeId ? parseInt(assigneeId) : null,
        reporter_id: user?.id || 1,
        parent_task_id: parentTaskId ? parseInt(parentTaskId) : null,
      }, token);

      setTitle('');
      setDescription('');
      setAssigneeId('');
      setParentTaskId('');
      setDuplicateMatches([]);
      setBypassDuplicate(false);
      onTaskCreated?.(newTask);
      onClose();
    } catch (err) {
      alert(`Failed to create task: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLinkToTask = (taskId) => {
    onClose();
    if (onSelectTaskID) {
      onSelectTaskID(taskId);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="card" 
        style={{ width: '100%', maxWidth: '580px', background: 'var(--bg-card)', padding: '24px', boxShadow: 'var(--shadow-modal)', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontWeight: 600 }}>
            <Command size={18} style={{ color: 'var(--accent-primary)' }} />
            <span>Create Task (Cmd+K)</span>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}><X size={18} /></button>
        </div>

        {/* Smart Triage & Duplicate Detection Banner (>80% similarity & same parent) */}
        {duplicateMatches.length > 0 && !bypassDuplicate && (
          <div 
            style={{ 
              marginBottom: '16px', 
              background: 'rgba(239, 68, 68, 0.12)', 
              border: '1px solid rgba(239, 68, 68, 0.4)', 
              padding: '14px', 
              borderRadius: 'var(--radius-md)' 
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fca5a5', fontWeight: 600, fontSize: '0.88rem', marginBottom: '8px' }}>
              <ShieldAlert size={18} />
              <span>Smart Triage: Duplicate Issue Detected (&gt;60% similarity)</span>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              A highly similar task already exists under the same parent ticket. Linking prevents board clutter:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
              {duplicateMatches.map((match) => (
                <div 
                  key={match.id} 
                  style={{ 
                    background: 'var(--bg-input)', 
                    padding: '10px 12px', 
                    borderRadius: 'var(--radius-sm)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between' 
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>#{match.id} - {match.title}</span>
                      <span className="badge badge-exact" style={{ fontSize: '0.7rem' }}>
                        {Math.round((match.similarity || 0.6) * 100)}% Match
                      </span>
                    </div>
                    {match.desc && <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>{match.desc}</p>}
                  </div>

                  <button 
                    type="button" 
                    className="btn-secondary" 
                    style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                    onClick={() => handleLinkToTask(match.id)}
                  >
                    <ExternalLink size={14} /> Link Task
                  </button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button 
                type="button" 
                className="btn-danger" 
                style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                onClick={() => setBypassDuplicate(true)}
              >
                Create Task Anyway
              </button>
            </div>
          </div>
        )}

        <form onSubmit={(e) => handleSubmit(e, false)}>
          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Task Title</label>
              {triageLoading && (
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-sparkle)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Sparkles size={12} /> Checking AI Triage...
                </span>
              )}
            </div>
            <input
              ref={inputRef}
              type="text"
              className="input-field"
              placeholder="Task title (e.g. Auth token validation handler)..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <textarea
              className="input-field"
              placeholder="Add task description or context (optional)..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Priority</span>
              <select
                className="input-field"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Assignee</span>
              <select
                className="input-field"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
              >
                <option value="">Unassigned</option>
                {usersList.map((u) => (
                  <option key={u.id} value={u.id}>{u.email}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={submitting || (duplicateMatches.length > 0 && !bypassDuplicate)}
            >
              <Plus size={16} />
              {submitting ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
