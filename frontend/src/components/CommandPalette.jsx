import React, { useState, useEffect, useRef } from 'react';
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
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import { 
  CloseRounded, 
  AutoAwesomeRounded, 
  WarningAmberRounded, 
  AddRounded
} from '@mui/icons-material';

export default function CommandPalette({ isOpen, onClose, onTaskCreated, onSelectTaskID }) {
  const { token } = useAuth();
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

  const triageTimeoutRef = useRef(null);

  const usersList = [
    { id: 1, email: 'admin@smartops.io', role: 'Admin' },
    { id: 2, email: 'manager@smartops.io', role: 'Manager' },
    { id: 3, email: 'dev@smartops.io', role: 'Employee' },
  ];

  useEffect(() => {
    if (!isOpen) {
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
        setDuplicateMatches([]);
      } finally {
        setTriageLoading(false);
      }
    }, 400);

    return () => {
      if (triageTimeoutRef.current) clearTimeout(triageTimeoutRef.current);
    };
  }, [title, description, parentTaskId, bypassDuplicate, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (duplicateMatches.length > 0 && !bypassDuplicate) {
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        desc: description.trim(),
        status: 'todo',
        priority,
        assignee_id: assigneeId ? parseInt(assigneeId) : null,
        parent_task_id: parentTaskId ? parseInt(parentTaskId) : null,
      };

      const newTask = await api.createTask(payload, token);
      onTaskCreated?.(newTask);
      onClose();
    } catch (err) {
      alert(`Failed to create task: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 3.5,
          p: 1,
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <Box
            sx={{
              p: 0.8,
              borderRadius: '10px',
              bgcolor: 'rgba(99, 102, 241, 0.2)',
              color: '#818CF8',
              display: 'flex',
            }}
          >
            <AutoAwesomeRounded fontSize="small" />
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#F8FAFC' }}>
            Fast Command Creation
          </Typography>
        </Box>

        <IconButton size="small" onClick={onClose} sx={{ color: '#94A3B8' }}>
          <CloseRounded />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        
        {/* Live Duplicate Alert */}
        {duplicateMatches.length > 0 && !bypassDuplicate && (
          <Alert
            severity="warning"
            icon={<WarningAmberRounded />}
            sx={{
              mb: 2.5,
              borderRadius: '12px',
              bgcolor: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              color: '#FBBF24',
              '& .MuiAlert-icon': { color: '#F59E0B' },
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#F8FAFC', mb: 0.5 }}>
              Potential Duplicate Task Detected!
            </Typography>
            <Typography variant="body2" sx={{ color: '#FDE68A', fontSize: '0.82rem', mb: 1.5 }}>
              ChromaDB semantic search found {duplicateMatches.length} matching ticket(s) with high similarity.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 1.5 }}>
              {duplicateMatches.map((match) => (
                <Box
                  key={match.id}
                  onClick={() => onSelectTaskID?.(match.id)}
                  sx={{
                    p: 1.2,
                    borderRadius: '8px',
                    bgcolor: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    '&:hover': { bgcolor: 'rgba(245, 158, 11, 0.15)' },
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#F8FAFC' }}>
                    #{match.id} - {match.title}
                  </Typography>
                  <Chip
                    label={`${(match.similarity * 100).toFixed(0)}% match`}
                    size="small"
                    sx={{ bgcolor: 'rgba(245, 158, 11, 0.25)', color: '#FBBF24', fontWeight: 700, fontSize: '0.7rem' }}
                  />
                </Box>
              ))}
            </Box>

            <Button
              size="small"
              variant="outlined"
              onClick={() => setBypassDuplicate(true)}
              sx={{
                borderColor: '#F59E0B',
                color: '#FBBF24',
                fontSize: '0.75rem',
                '&:hover': { bgcolor: 'rgba(245, 158, 11, 0.2)' },
              }}
            >
              Ignore & Create Anyway
            </Button>
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#94A3B8', display: 'block', mb: 0.5 }}>
              TASK TITLE *
            </Typography>
            <TextField
              fullWidth
              autoFocus
              placeholder="e.g. Implement OAuth2 Refresh Token Rotation"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              size="small"
            />
            {triageLoading && (
              <Typography variant="caption" sx={{ color: '#6366F1', display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                <CircularProgress size={12} color="inherit" /> Checking vector database for duplicate tickets...
              </Typography>
            )}
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#94A3B8', display: 'block', mb: 0.5 }}>
              DESCRIPTION
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Technical specs, expected behavior, or acceptance criteria..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              size="small"
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#94A3B8', display: 'block', mb: 0.5 }}>
                PRIORITY
              </Typography>
              <Select
                fullWidth
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                size="small"
              >
                <MenuItem value="low">Low Priority</MenuItem>
                <MenuItem value="medium">Medium Priority</MenuItem>
                <MenuItem value="high">High Priority</MenuItem>
              </Select>
            </Box>

            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#94A3B8', display: 'block', mb: 0.5 }}>
                ASSIGNEE
              </Typography>
              <Select
                fullWidth
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                size="small"
                displayEmpty
              >
                <MenuItem value="">Unassigned</MenuItem>
                {usersList.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.email} ({u.role})
                  </MenuItem>
                ))}
              </Select>
            </Box>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#94A3B8', display: 'block', mb: 0.5 }}>
              PARENT TASK ID (OPTIONAL)
            </Typography>
            <TextField
              fullWidth
              type="number"
              placeholder="Leave empty if top-level task"
              value={parentTaskId}
              onChange={(e) => setParentTaskId(e.target.value)}
              size="small"
            />
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
            <Button variant="outlined" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={submitting || (duplicateMatches.length > 0 && !bypassDuplicate)}
              startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <AddRounded />}
              sx={{ px: 3 }}
            >
              {submitting ? 'Creating...' : 'Create Task'}
            </Button>
          </Box>
        </form>

      </DialogContent>
    </Dialog>
  );
}
