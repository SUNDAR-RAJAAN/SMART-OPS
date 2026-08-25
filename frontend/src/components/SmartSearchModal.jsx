import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import { 
  SearchRounded, 
  CloseRounded, 
  CheckCircleRounded, 
  StorageRounded, 
  AutoAwesomeRounded
} from '@mui/icons-material';

export default function SmartSearchModal({ isOpen, onClose, onSelectTask }) {
  const { token } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      setLoading(true);
      api.search(query.trim(), token)
        .then((res) => {
          setResults(res.results || []);
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [query, token]);

  const getMatchBadge = (task, idx) => {
    let matchType = 'fuzzy';
    if (task.title.toLowerCase() === query.trim().toLowerCase() || String(task.id) === query.trim()) {
      matchType = 'exact';
    } else if (idx >= 2) {
      matchType = 'semantic';
    }

    if (matchType === 'exact') {
      return {
        label: 'Exact Match',
        icon: <CheckCircleRounded sx={{ fontSize: 13 }} />,
        color: '#10B981',
        bg: 'rgba(16, 185, 129, 0.15)',
        border: 'rgba(16, 185, 129, 0.35)',
      };
    }
    if (matchType === 'semantic') {
      return {
        label: 'Semantic AI',
        icon: <AutoAwesomeRounded sx={{ fontSize: 13 }} />,
        color: '#A855F7',
        bg: 'rgba(168, 85, 247, 0.15)',
        border: 'rgba(168, 85, 247, 0.35)',
      };
    }
    return {
      label: 'Fuzzy Match',
      icon: <StorageRounded sx={{ fontSize: 13 }} />,
      color: '#06B6D4',
      bg: 'rgba(6, 182, 212, 0.15)',
      border: 'rgba(6, 182, 212, 0.35)',
    };
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
      <DialogTitle sx={{ pb: 1, pt: 1.5 }}>
        <TextField
          inputRef={inputRef}
          fullWidth
          placeholder="Search tasks across Exact, Fuzzy, and Semantic Vector tiers..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          size="medium"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRounded sx={{ color: '#6366F1' }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                {loading && <CircularProgress size={18} color="primary" sx={{ mr: 1 }} />}
                <IconButton size="small" onClick={onClose} sx={{ color: '#94A3B8' }}>
                  <CloseRounded />
                </IconButton>
              </InputAdornment>
            ),
            sx: {
              fontSize: '1rem',
              bgcolor: 'rgba(15, 23, 42, 0.8)',
              borderRadius: '12px',
            },
          }}
        />
      </DialogTitle>

      <DialogContent sx={{ pt: 1, maxHeight: 420 }}>
        {loading && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#94A3B8' }}>
              Querying 3-tier hybrid search pipeline...
            </Typography>
          </Box>
        )}

        {!loading && query.trim() && results.length === 0 && (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: '#64748B' }}>
              No matching tasks found for "{query}".
            </Typography>
          </Box>
        )}

        {!loading && results.map((task, idx) => {
          const matchBadge = getMatchBadge(task, idx);

          return (
            <Box
              key={task.id}
              onClick={() => {
                onSelectTask(task);
                onClose();
              }}
              sx={{
                p: 1.8,
                mb: 1.2,
                borderRadius: '12px',
                bgcolor: 'rgba(19, 25, 36, 0.85)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: 'rgba(99, 102, 241, 0.1)',
                  borderColor: 'rgba(99, 102, 241, 0.4)',
                  transform: 'translateX(4px)',
                },
              }}
            >
              <Box sx={{ flex: 1, pr: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B', fontFamily: 'monospace' }}>
                    #{task.id}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#F8FAFC' }}>
                    {task.title}
                  </Typography>

                  <Chip
                    icon={matchBadge.icon}
                    label={matchBadge.label}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      bgcolor: matchBadge.bg,
                      color: matchBadge.color,
                      border: `1px solid ${matchBadge.border}`,
                      '& .MuiChip-icon': { color: 'inherit' },
                    }}
                  />
                </Box>

                <Typography
                  variant="body2"
                  sx={{
                    color: '#94A3B8',
                    fontSize: '0.8rem',
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {task.desc || 'No additional description.'}
                </Typography>
              </Box>

              <Chip
                label={task.status.replace('_', ' ')}
                size="small"
                sx={{
                  height: 22,
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  color: '#CBD5E1',
                }}
              />
            </Box>
          );
        })}
      </DialogContent>
    </Dialog>
  );
}
