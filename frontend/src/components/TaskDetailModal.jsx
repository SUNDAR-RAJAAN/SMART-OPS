import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import { 
  AutoAwesomeRounded, 
  AttachFileRounded, 
  CloseRounded, 
  InsertDriveFileRounded, 
  SendRounded, 
  AlternateEmailRounded, 
  DeleteOutlineRounded, 
  EditRounded, 
  CheckRounded, 
  AssignmentIndRounded,
  ChatBubbleOutlineRounded
} from '@mui/icons-material';

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
      setDraftSubTasks([]);
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

  const renderCommentContent = (content) => {
    const words = content.split(' ');
    return words.map((word, i) => {
      if (word.startsWith('@')) {
        return (
          <span key={i} className="mention-pill">
            <AlternateEmailRounded sx={{ fontSize: 13 }} />
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
    <Dialog
      open={Boolean(task)}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: 3.5,
          p: 1.5,
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pb: 1.5 }}>
        <Box sx={{ flex: 1, pr: 2 }}>
          <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B', fontFamily: 'monospace' }}>
            TASK #{currentTask.id}
          </Typography>

          {!isEditing ? (
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#F8FAFC', mt: 0.3 }}>
              {currentTask.title}
            </Typography>
          ) : (
            <TextField
              fullWidth
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              size="small"
              sx={{ mt: 1 }}
            />
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {!isEditing ? (
            <Button
              variant="outlined"
              size="small"
              onClick={() => setIsEditing(true)}
              startIcon={<EditRounded />}
              sx={{ borderRadius: '8px' }}
            >
              Edit
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={handleSaveEdit}
              disabled={savingTask}
              startIcon={savingTask ? <CircularProgress size={14} color="inherit" /> : <CheckRounded />}
              sx={{ borderRadius: '8px' }}
            >
              {savingTask ? 'Saving...' : 'Save'}
            </Button>
          )}

          <IconButton size="small" onClick={handleDeleteTask} sx={{ color: '#FB7185', '&:hover': { bgcolor: 'rgba(244, 63, 94, 0.15)' } }}>
            <DeleteOutlineRounded />
          </IconButton>

          <IconButton size="small" onClick={onClose} sx={{ color: '#94A3B8' }}>
            <CloseRounded />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        
        {/* Status & Priority Row */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1.5,
            mb: 2.5,
            pb: 2,
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#94A3B8' }}>
              STATUS:
            </Typography>
            {[
              { key: 'todo', label: 'To Do', color: '#6366F1' },
              { key: 'in_progress', label: 'In Progress', color: '#06B6D4' },
              { key: 'code_review', label: 'Code Review', color: '#F59E0B' },
              { key: 'done', label: 'Done', color: '#10B981' },
            ].map((st) => (
              <Chip
                key={st.key}
                label={st.label}
                size="small"
                onClick={() => handleStatusChange(st.key)}
                disabled={statusUpdating}
                sx={{
                  fontWeight: 700,
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  opacity: currentTask.status === st.key ? 1 : 0.4,
                  bgcolor: currentTask.status === st.key ? `${st.color}25` : 'transparent',
                  color: st.color,
                  border: currentTask.status === st.key ? `2px solid ${st.color}` : '1px solid rgba(255, 255, 255, 0.1)',
                  '&:hover': { opacity: 0.9 },
                }}
              />
            ))}
          </Box>

          {isEditing && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#94A3B8' }}>
                PRIORITY:
              </Typography>
              <Select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value)}
                size="small"
                sx={{ fontSize: '0.8rem', height: 32 }}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </Select>
            </Box>
          )}
        </Box>

        {/* Assignee & Reporter Cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2.5 }}>
          <Paper sx={{ p: 1.8, bgcolor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#94A3B8', display: 'block', mb: 0.5 }}>
              ASSIGNEE
            </Typography>
            {!isEditing ? (
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: 1 }}>
                <AssignmentIndRounded sx={{ color: '#06B6D4', fontSize: 18 }} />
                {currentAssigneeUser ? `${currentAssigneeUser.email} (${currentAssigneeUser.role})` : 'Unassigned'}
              </Typography>
            ) : (
              <Select
                fullWidth
                value={editAssignee}
                onChange={(e) => setEditAssignee(e.target.value)}
                size="small"
                displayEmpty
              >
                <MenuItem value="">Unassigned</MenuItem>
                {usersList.map((u) => (
                  <MenuItem key={u.id} value={u.id}>{u.email} ({u.role})</MenuItem>
                ))}
              </Select>
            )}
          </Paper>

          <Paper sx={{ p: 1.8, bgcolor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#94A3B8', display: 'block', mb: 0.5 }}>
              REPORTER
            </Typography>
            {!isEditing ? (
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: 1 }}>
                <AssignmentIndRounded sx={{ color: '#10B981', fontSize: 18 }} />
                {currentReporterUser ? `${currentReporterUser.email} (${currentReporterUser.role})` : 'System'}
              </Typography>
            ) : (
              <Select
                fullWidth
                value={editReporter}
                onChange={(e) => setEditReporter(e.target.value)}
                size="small"
              >
                {usersList.map((u) => (
                  <MenuItem key={u.id} value={u.id}>{u.email} ({u.role})</MenuItem>
                ))}
              </Select>
            )}
          </Paper>
        </Box>

        {/* Description */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#94A3B8', display: 'block', mb: 0.8 }}>
            DESCRIPTION
          </Typography>
          {!isEditing ? (
            <Paper sx={{ p: 2, bgcolor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <Typography variant="body2" sx={{ color: '#CBD5E1', lineHeight: 1.6 }}>
                {currentTask.desc || 'No description provided for this task.'}
              </Typography>
            </Paper>
          ) : (
            <TextField
              fullWidth
              multiline
              rows={3}
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              size="small"
            />
          )}
        </Box>

        {/* Action Toolbar: Attachments & Agentic Breakdown */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <Button
            component="label"
            variant="outlined"
            startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : <AttachFileRounded />}
            disabled={uploading}
            sx={{ borderRadius: '10px' }}
          >
            {uploading ? 'Uploading...' : 'Attach File'}
            <input type="file" hidden onChange={handleFileUpload} />
          </Button>

          <Button
            variant="contained"
            onClick={handleAgenticBreakdown}
            disabled={breakingDown}
            startIcon={breakingDown ? <CircularProgress size={16} color="inherit" /> : <AutoAwesomeRounded />}
            sx={{
              background: 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)',
              boxShadow: '0 4px 16px rgba(139, 92, 246, 0.4)',
              borderRadius: '10px',
              px: 2.5,
              '&:hover': {
                background: 'linear-gradient(135deg, #7C3AED 0%, #0891B2 100%)',
              },
            }}
          >
            {breakingDown ? 'Generating AI Suggestions...' : '✨ Agentic Task Breakdown'}
          </Button>
        </Box>

        {/* Uploaded Attachments */}
        {attachments.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#94A3B8', display: 'block', mb: 1 }}>
              ATTACHMENTS
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {attachments.map((att) => (
                <Chip
                  key={att.id}
                  icon={<InsertDriveFileRounded sx={{ fontSize: 16 }} />}
                  label={att.file_url.split('/').pop()}
                  component="a"
                  href={`http://localhost:8080${att.file_url}`}
                  target="_blank"
                  clickable
                  color="secondary"
                  variant="outlined"
                  sx={{ borderRadius: '8px', fontWeight: 600 }}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* AI Breakdown Draft Cards */}
        {draftSubTasks.length > 0 && (
          <Paper
            sx={{
              p: 2.5,
              mb: 3,
              bgcolor: 'rgba(139, 92, 246, 0.08)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '14px',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#C084FC', display: 'flex', alignItems: 'center', gap: 1 }}>
                <AutoAwesomeRounded fontSize="small" /> Temporary AI Sub-Task Suggestions
              </Typography>
              <Chip label="Draft Mode" size="small" sx={{ bgcolor: 'rgba(139, 92, 246, 0.2)', color: '#C084FC', fontWeight: 700 }} />
            </Box>

            <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mb: 2 }}>
              Review or adjust draft sub-tasks below. Click confirm to commit them into the database.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
              {draftSubTasks.map((draft, idx) => (
                <Paper key={idx} sx={{ p: 1.8, bgcolor: 'rgba(19, 25, 36, 0.9)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 1 }}>
                    <TextField
                      fullWidth
                      size="small"
                      value={draft.title}
                      onChange={(e) => handleUpdateDraft(idx, 'title', e.target.value)}
                    />
                    <IconButton size="small" onClick={() => handleDeleteDraft(idx)} sx={{ color: '#FB7185' }}>
                      <DeleteOutlineRounded fontSize="small" />
                    </IconButton>
                  </Box>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    size="small"
                    value={draft.description}
                    onChange={(e) => handleUpdateDraft(idx, 'description', e.target.value)}
                  />
                </Paper>
              ))}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
              <Button size="small" variant="outlined" onClick={() => setDraftSubTasks([])}>
                Discard
              </Button>
              <Button
                size="small"
                variant="contained"
                onClick={handleConfirmSubTasks}
                disabled={confirmingSubTasks}
                startIcon={confirmingSubTasks ? <CircularProgress size={14} color="inherit" /> : <CheckRounded />}
                sx={{
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)',
                }}
              >
                {confirmingSubTasks ? 'Creating Tickets...' : 'Confirm & Create Sub-tasks'}
              </Button>
            </Box>
          </Paper>
        )}

        {/* Confirmed Created Sub-Tasks */}
        {confirmedSubTasks.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#10B981', display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
              <CheckRounded sx={{ fontSize: 16 }} /> CREATED APPROVED SUB-TASKS ({confirmedSubTasks.length})
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {confirmedSubTasks.map((sub) => (
                <Paper
                  key={sub.id}
                  sx={{
                    p: 1.5,
                    bgcolor: 'rgba(16, 185, 129, 0.08)',
                    borderLeft: '4px solid #10B981',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#F8FAFC' }}>
                      #{sub.id} - {sub.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94A3B8' }}>{sub.desc}</Typography>
                  </Box>
                  <Chip label="Created" size="small" color="success" sx={{ fontWeight: 700 }} />
                </Paper>
              ))}
            </Box>
          </Box>
        )}

        <Divider sx={{ my: 2.5 }} />

        {/* Comments & Mentions Discussion */}
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <ChatBubbleOutlineRounded sx={{ color: '#6366F1', fontSize: 18 }} />
            Task Discussion & Mentions ({comments.length})
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2, mb: 2, maxHeight: 220, overflowY: 'auto' }}>
            {comments.length === 0 ? (
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                No comments yet. Type @ in the comment box to select and mention teammates!
              </Typography>
            ) : (
              comments.map((c) => (
                <Paper key={c.id} sx={{ p: 1.5, bgcolor: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#818CF8' }}>
                      {c.user_email}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>
                      {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: '#F8FAFC' }}>
                    {renderCommentContent(c.content)}
                  </Typography>
                </Paper>
              ))
            )}
          </Box>

          {/* Comment input with floating mention popup */}
          <Box sx={{ position: 'relative' }}>
            {showMentionMenu && (
              <Paper
                elevation={6}
                sx={{
                  position: 'absolute',
                  bottom: 50,
                  left: 0,
                  width: 260,
                  p: 1,
                  zIndex: 1200,
                  bgcolor: 'rgba(19, 25, 36, 0.95)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(99, 102, 241, 0.4)',
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#94A3B8', px: 1, display: 'block', mb: 0.5 }}>
                  Select Teammate to Mention
                </Typography>
                {usersList.map((u) => (
                  <Box
                    key={u.id}
                    onClick={() => insertMention(u)}
                    sx={{
                      p: 0.8,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      '&:hover': { bgcolor: 'rgba(99, 102, 241, 0.15)' },
                    }}
                  >
                    <Typography variant="body2" sx={{ color: '#818CF8', fontWeight: 600 }}>
                      @{u.handle}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748B' }}>
                      {u.role}
                    </Typography>
                  </Box>
                ))}
              </Paper>
            )}

            <form onSubmit={handlePostComment} style={{ display: 'flex', gap: '8px' }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Write a comment... (Type @ to mention teammates)"
                value={newComment}
                onChange={handleCommentInputChange}
              />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={submittingComment}
                sx={{ minWidth: 48, px: 1.5 }}
              >
                {submittingComment ? <CircularProgress size={16} color="inherit" /> : <SendRounded fontSize="small" />}
              </Button>
            </form>
          </Box>

        </Box>

      </DialogContent>
    </Dialog>
  );
}
