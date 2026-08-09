import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Sparkles, Paperclip, X, FileText, Loader2, MessageSquare, Send, AtSign, Trash2, Edit3, Check, UserCheck } from 'lucide-react';

export default function TaskDetailModal({ task, onClose, onTaskUpdated }) {
  const { token } = useAuth();
  const [currentTask, setCurrentTask] = useState(task);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPriority, setEditPriority] = useState('medium');
  const [editAssignee, setEditAssignee] = useState('');
  const [editReporter, setEditReporter] = useState('');

  // Draft sub-tasks for Issue #1 approval flow
  const [draftSubTasks, setDraftSubTasks] = useState([]);
  const [confirmedSubTasks, setConfirmedSubTasks] = useState([]);
  
  const [attachments, setAttachments] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [showMentionMenu, setShowMentionMenu] = useState(false);

  const [breakingDown, setBreakingDown] = useState(false);
  const [confirmingSubTasks, setConfirmingSubTasks] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [savingTask, setSavingTask] = useState(false);

  const usersList = [
    { id: 1, email: 'admin@smartops.io', handle: 'admin', role: 'Admin' },
    { id: 2, email: 'manager@smartops.io', handle: 'manager', role: 'Manager' },
    { id: 3, email: 'dev@smartops.io', handle: 'dev', role: 'Employee' },
  ];

  const fetchComments = async (taskId) => {
    if (!taskId || !token) return;
    try {
      const data = await api.getComments(taskId, token);
      setComments(data || []);
    } catch (e) {
      setComments([]);
    }
  };

  useEffect(() => {
    setCurrentTask(task);
    if (task) {
      setEditTitle(task.title || '');
      setEditDesc(task.desc || '');
      setEditPriority(task.priority || 'medium');
      setEditAssignee(task.assignee_id ? String(task.assignee_id) : '');
      setEditReporter(task.reporter_id ? String(task.reporter_id) : '');
    }
    setDraftSubTasks([]);
    setConfirmedSubTasks([]);
    setAttachments([]);
    setComments([]);
    setNewComment('');
    setIsEditing(false);

    if (task?.id) {
      fetchComments(task.id);
    }
  }, [task]);

  if (!task || !currentTask) return null;

  // --- Task Editing & Deletion ---
  const handleSaveEdit = async () => {
    if (!editTitle.trim()) return;
    setSavingTask(true);
    try {
      const updated = await api.updateTask(currentTask.id, {
        title: editTitle.trim(),
        desc: editDesc.trim(),
        priority: editPriority,
        assignee_id: editAssignee ? parseInt(editAssignee) : null,
        reporter_id: editReporter ? parseInt(editReporter) : null,
      }, token);

      setCurrentTask(updated);
      setIsEditing(false);
      onTaskUpdated?.();
    } catch (err) {
      alert(`Failed to save task: ${err.message}`);
    } finally {
      setSavingTask(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!window.confirm(`Are you sure you want to delete Task #${currentTask.id} ('${currentTask.title}')?`)) {
      return;
    }

    try {
      await api.deleteTask(currentTask.id, token);
      onTaskUpdated?.();
      onClose();
    } catch (err) {
      alert(`Failed to delete task: ${err.message}`);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setStatusUpdating(true);
    try {
      const updated = await api.updateTaskStatus(currentTask.id, newStatus, token);
      setCurrentTask(updated);
      onTaskUpdated?.();
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const newAttachment = await api.uploadAttachment(currentTask.id, file, token);
      setAttachments((prev) => [...prev, newAttachment]);
    } catch (err) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // --- Issue #1: Agentic Breakdown Draft Cards & Confirmation Flow ---
  const handleAgenticBreakdown = async () => {
    setBreakingDown(true);
    try {
      const suggestions = await api.agenticBreakdown(currentTask.id, token);
      // Load temporary draft cards into local state
      setDraftSubTasks(suggestions || []);
    } catch (err) {
      alert(`Agentic breakdown failed: ${err.message}`);
    } finally {
      setBreakingDown(false);
    }
  };

  const handleUpdateDraft = (index, field, val) => {
    setDraftSubTasks((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: val } : item))
    );
  };

  const handleDeleteDraft = (index) => {
    setDraftSubTasks((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleConfirmSubTasks = async () => {
    if (draftSubTasks.length === 0) return;

    setConfirmingSubTasks(true);
    try {
      const created = await api.confirmSubTasks(currentTask.id, draftSubTasks, token);
      setConfirmedSubTasks((prev) => [...prev, ...(created || [])]);
      setDraftSubTasks([]); // Clear temporary draft cards
      onTaskUpdated?.();
      alert(`Successfully created ${created.length} approved sub-tasks!`);
    } catch (err) {
      alert(`Failed confirming sub-tasks: ${err.message}`);
    } finally {
      setConfirmingSubTasks(false);
    }
  };

  // --- Issue #4: Comments with @Mention Autocomplete & Blue Pills ---
  const handleCommentInputChange = (e) => {
    const val = e.target.value;
    setNewComment(val);

    const lastChar = val.slice(-1);
    if (lastChar === '@') {
      setShowMentionMenu(true);
    } else if (val.endsWith(' ') || val === '') {
      setShowMentionMenu(false);
    }
  };

  const insertMention = (userObj) => {
    const parts = newComment.split('@');
    parts.pop();
    const prefix = parts.join('@');
    setNewComment(`${prefix}@${userObj.handle} `);
    setShowMentionMenu(false);
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const created = await api.addComment(currentTask.id, newComment.trim(), token);
      setComments((prev) => [...prev, created]);
      setNewComment('');
      setShowMentionMenu(false);
    } catch (err) {
      alert(`Failed posting comment: ${err.message}`);
    } finally {
      setSubmittingComment(false);
    }
  };

  // Helper to render comment text with styled blue mention pills
  const renderCommentContent = (content) => {
    const words = content.split(' ');
    return words.map((word, i) => {
      if (word.startsWith('@')) {
        return (
          <span key={i} className="mention-pill">
            <AtSign size={12} />
            {word.slice(1)}
          </span>
        );
      }
      return word + ' ';
    });
  };

  const currentAssigneeUser = usersList.find((u) => u.id === currentTask.assignee_id);
  const currentReporterUser = usersList.find((u) => u.id === currentTask.reporter_id);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="card" 
        style={{ width: '100%', maxWidth: '720px', background: 'var(--bg-card)', padding: '24px', boxShadow: 'var(--shadow-modal)', maxHeight: '92vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Controls: Task ID, Edit & Delete Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Task #{currentTask.id}</span>
            {!isEditing ? (
              <h2 style={{ fontSize: '1.3rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                {currentTask.title}
              </h2>
            ) : (
              <input
                type="text"
                className="input-field"
                style={{ marginTop: '4px', fontSize: '1.1rem', fontWeight: 600 }}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {!isEditing ? (
              <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={() => setIsEditing(true)}>
                <Edit3 size={14} /> Edit
              </button>
            ) : (
              <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={handleSaveEdit} disabled={savingTask}>
                <Check size={14} /> {savingTask ? 'Saving...' : 'Save'}
              </button>
            )}

            <button className="btn-danger" style={{ padding: '6px 12px', fontSize: '0.8rem' }} onClick={handleDeleteTask} title="Delete Task">
              <Trash2 size={14} /> Delete
            </button>

            <button onClick={onClose} style={{ color: 'var(--text-muted)', marginLeft: '8px' }}><X size={20} /></button>
          </div>
        </div>

        {/* Status & Priority Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Status:</span>
            {['todo', 'in_progress', 'code_review', 'done'].map((st) => (
              <button
                key={st}
                className={`badge badge-${st}`}
                style={{ 
                  opacity: currentTask.status === st ? 1 : 0.4, 
                  cursor: 'pointer',
                  padding: '4px 10px',
                  border: currentTask.status === st ? '2px solid var(--border-focus)' : '1px solid transparent'
                }}
                onClick={() => handleStatusChange(st)}
                disabled={statusUpdating}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>

          {isEditing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Priority:</span>
              <select className="input-field" style={{ width: 'auto', padding: '4px 8px' }} value={editPriority} onChange={(e) => setEditPriority(e.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          )}
        </div>

        {/* Jira Core Fields: Assignee & Reporter Pickers */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px', background: 'var(--bg-input)', padding: '12px 16px', borderRadius: 'var(--radius-sm)' }}>
          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Assignee</span>
            {!isEditing ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                <UserCheck size={14} style={{ color: 'var(--accent-primary)' }} />
                {currentAssigneeUser ? `${currentAssigneeUser.email} (${currentAssigneeUser.role})` : 'Unassigned'}
              </div>
            ) : (
              <select className="input-field" style={{ padding: '6px' }} value={editAssignee} onChange={(e) => setEditAssignee(e.target.value)}>
                <option value="">Unassigned</option>
                {usersList.map((u) => (
                  <option key={u.id} value={u.id}>{u.email} ({u.role})</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Reporter</span>
            {!isEditing ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                <UserCheck size={14} style={{ color: '#10b981' }} />
                {currentReporterUser ? `${currentReporterUser.email} (${currentReporterUser.role})` : 'System'}
              </div>
            ) : (
              <select className="input-field" style={{ padding: '6px' }} value={editReporter} onChange={(e) => setEditReporter(e.target.value)}>
                <option value="">Select Reporter</option>
                {usersList.map((u) => (
                  <option key={u.id} value={u.id}>{u.email} ({u.role})</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px' }}>Description</h4>
          {!isEditing ? (
            <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', background: 'var(--bg-input)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
              {currentTask.desc || 'No description provided for this task.'}
            </p>
          ) : (
            <textarea
              className="input-field"
              rows={3}
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
            />
          )}
        </div>

        {/* Action Toolbar: Attachments & Agentic Breakdown */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '12px' }}>
          <label className="btn-secondary" style={{ cursor: 'pointer' }}>
            <Paperclip size={16} />
            {uploading ? 'Uploading...' : 'Attach File'}
            <input type="file" style={{ display: 'none' }} onChange={handleFileUpload} disabled={uploading} />
          </label>

          <button 
            className="btn-sparkle" 
            onClick={handleAgenticBreakdown}
            disabled={breakingDown}
          >
            {breakingDown ? <Loader2 size={16} className="spin" /> : <Sparkles size={16} />}
            {breakingDown ? 'Generating AI Suggestions...' : '✨ Agentic Task Breakdown'}
          </button>
        </div>

        {/* Uploaded Attachments List */}
        {attachments.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Attachments</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {attachments.map((att) => (
                <a
                  key={att.id}
                  href={`http://localhost:8080${att.file_url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="badge badge-fuzzy"
                  style={{ textDecoration: 'none', padding: '6px 12px' }}
                >
                  <FileText size={12} />
                  {att.file_url.split('/').pop()}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Issue #1: Interactive Temporary Draft Sub-tasks (Approval Flow) */}
        {draftSubTasks.length > 0 && (
          <div style={{ marginBottom: '24px', background: 'rgba(124, 58, 237, 0.08)', border: '1px solid rgba(124, 58, 237, 0.3)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--accent-sparkle)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={16} /> Temporary AI Sub-task Draft Cards (Review & Approve)
              </h4>
              <span className="badge badge-semantic">Draft Mode</span>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              Review, edit, or delete draft sub-tasks below. Click confirm when ready to create tickets in the database.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              {draftSubTasks.map((draft, idx) => (
                <div key={idx} style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      className="input-field"
                      style={{ fontWeight: 600, fontSize: '0.9rem', padding: '4px 8px' }}
                      value={draft.title}
                      onChange={(e) => handleUpdateDraft(idx, 'title', e.target.value)}
                    />
                    <button type="button" onClick={() => handleDeleteDraft(idx)} style={{ color: '#fca5a5', padding: '4px' }} title="Delete Draft">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <textarea
                    className="input-field"
                    rows={2}
                    style={{ fontSize: '0.82rem', padding: '6px 8px' }}
                    value={draft.description}
                    onChange={(e) => handleUpdateDraft(idx, 'description', e.target.value)}
                  />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="btn-secondary" onClick={() => setDraftSubTasks([])}>
                Discard Drafts
              </button>
              <button type="button" className="btn-sparkle" onClick={handleConfirmSubTasks} disabled={confirmingSubTasks}>
                <Check size={16} />
                {confirmingSubTasks ? 'Creating Tickets...' : 'Confirm & Create Approved Sub-tasks'}
              </button>
            </div>
          </div>
        )}

        {/* Confirmed Created Sub-Tasks */}
        {confirmedSubTasks.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '0.85rem', color: '#10b981', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Check size={14} /> Created Approved Sub-tasks ({confirmedSubTasks.length})
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {confirmedSubTasks.map((sub) => (
                <div 
                  key={sub.id} 
                  style={{ 
                    background: 'var(--bg-input)', 
                    padding: '10px 14px', 
                    borderRadius: 'var(--radius-sm)', 
                    borderLeft: '3px solid #10b981',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>#{sub.id} - {sub.title}</span>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{sub.desc}</p>
                  </div>
                  <span className="badge badge-done">Created</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Issue #4: Comments & @Mentions Discussion Section */}
        <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={16} style={{ color: 'var(--accent-primary)' }} /> Task Discussion & Mentions ({comments.length})
          </h4>

          {/* Comments List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px', maxHeight: '200px', overflowY: 'auto' }}>
            {comments.length === 0 ? (
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No comments yet. Type @ in the comment box to select and mention team members!</p>
            ) : (
              comments.map((c) => (
                <div key={c.id} style={{ background: 'var(--bg-input)', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--accent-primary)' }}>{c.user_email}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                    {renderCommentContent(c.content)}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Floating @Mention Autocomplete Popover */}
          <div style={{ position: 'relative' }}>
            {showMentionMenu && (
              <div 
                className="card" 
                style={{ 
                  position: 'absolute', 
                  bottom: '48px', 
                  left: '0', 
                  width: '240px', 
                  background: 'var(--bg-card)', 
                  boxShadow: 'var(--shadow-modal)', 
                  padding: '6px', 
                  zIndex: 1200 
                }}
              >
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', padding: '4px 8px' }}>Select User to Mention</span>
                {usersList.map((u) => (
                  <div
                    key={u.id}
                    style={{ padding: '6px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.82rem', display: 'flex', justifyContent: 'space-between' }}
                    className="card-row"
                    onClick={() => insertMention(u)}
                  >
                    <span style={{ color: '#60a5fa', fontWeight: 600 }}>@{u.handle}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{u.role}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Comment Form */}
            <form onSubmit={handlePostComment} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="input-field"
                placeholder="Write a comment... (Type @ for user autocomplete menu)"
                value={newComment}
                onChange={handleCommentInputChange}
              />
              <button type="submit" className="btn-primary" disabled={submittingComment}>
                <Send size={14} />
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
