import React from 'react';
import { useThemeMode } from '../context/ThemeModeContext';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { 
  AccessTimeRounded, 
  CodeRounded, 
  FactCheckRounded, 
  CheckCircleOutlineRounded,
  AutoAwesomeRounded,
  ArrowForwardIosRounded
} from '@mui/icons-material';

export default function EmployeeView({ tasks, onSelectTask, onUpdateStatus, onOpenCommandPalette }) {
  const { mode } = useThemeMode();
  const isLight = mode === 'light';

  const getTasksByStatus = (status) => tasks.filter((t) => t.status === status);

  const metricCards = [
    { 
      label: 'To Do', 
      count: getTasksByStatus('todo').length, 
      color: isLight ? '#7C3AED' : '#C084FC', 
      numColor: isLight ? '#6D28D9' : '#E9D5FF',
      icon: AccessTimeRounded, 
      gradient: isLight
        ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.14) 0%, rgba(243, 232, 255, 0.85) 100%)'
        : 'linear-gradient(135deg, rgba(168, 85, 247, 0.28) 0%, rgba(147, 51, 234, 0.1) 100%)',
      border: isLight ? 'rgba(139, 92, 246, 0.35)' : 'rgba(168, 85, 247, 0.5)',
      glow: isLight ? 'rgba(139, 92, 246, 0.15)' : 'rgba(168, 85, 247, 0.45)',
      iconBg: isLight ? 'rgba(139, 92, 246, 0.15)' : 'rgba(12, 7, 24, 0.45)',
    },
    { 
      label: 'In Progress', 
      count: getTasksByStatus('in_progress').length, 
      color: isLight ? '#0284C7' : '#38BDF8', 
      numColor: isLight ? '#0369A1' : '#BAE6FD',
      icon: CodeRounded, 
      gradient: isLight
        ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.14) 0%, rgba(224, 242, 254, 0.85) 100%)'
        : 'linear-gradient(135deg, rgba(56, 189, 248, 0.24) 0%, rgba(168, 85, 247, 0.1) 100%)',
      border: isLight ? 'rgba(6, 182, 212, 0.35)' : 'rgba(56, 189, 248, 0.5)',
      glow: isLight ? 'rgba(6, 182, 212, 0.15)' : 'rgba(56, 189, 248, 0.4)',
      iconBg: isLight ? 'rgba(6, 182, 212, 0.15)' : 'rgba(12, 7, 24, 0.45)',
    },
    { 
      label: 'Code Review', 
      count: getTasksByStatus('code_review').length, 
      color: isLight ? '#D97706' : '#FBBF24', 
      numColor: isLight ? '#B45309' : '#FEF08A',
      icon: FactCheckRounded, 
      gradient: isLight
        ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.14) 0%, rgba(254, 243, 199, 0.85) 100%)'
        : 'linear-gradient(135deg, rgba(245, 158, 11, 0.24) 0%, rgba(236, 72, 153, 0.1) 100%)',
      border: isLight ? 'rgba(245, 158, 11, 0.35)' : 'rgba(245, 158, 11, 0.5)',
      glow: isLight ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.4)',
      iconBg: isLight ? 'rgba(245, 158, 11, 0.15)' : 'rgba(12, 7, 24, 0.45)',
    },
    { 
      label: 'Done', 
      count: getTasksByStatus('done').length, 
      color: isLight ? '#059669' : '#34D399', 
      numColor: isLight ? '#047857' : '#A7F3D0',
      icon: CheckCircleOutlineRounded, 
      gradient: isLight
        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.14) 0%, rgba(209, 250, 229, 0.85) 100%)'
        : 'linear-gradient(135deg, rgba(16, 185, 129, 0.24) 0%, rgba(168, 85, 247, 0.1) 100%)',
      border: isLight ? 'rgba(16, 185, 129, 0.35)' : 'rgba(16, 185, 129, 0.5)',
      glow: isLight ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.4)',
      iconBg: isLight ? 'rgba(16, 185, 129, 0.15)' : 'rgba(12, 7, 24, 0.45)',
    },
  ];

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'high': 
        return { 
          color: isLight ? '#E11D48' : '#FB7185', 
          bg: isLight ? 'rgba(244, 63, 94, 0.12)' : 'linear-gradient(90deg, rgba(244, 63, 94, 0.3) 0%, rgba(225, 29, 72, 0.15) 100%)', 
          border: isLight ? 'rgba(244, 63, 94, 0.35)' : 'rgba(244, 63, 94, 0.55)' 
        };
      case 'medium': 
        return { 
          color: isLight ? '#D97706' : '#FBBF24', 
          bg: isLight ? 'rgba(245, 158, 11, 0.12)' : 'linear-gradient(90deg, rgba(245, 158, 11, 0.3) 0%, rgba(217, 119, 6, 0.15) 100%)', 
          border: isLight ? 'rgba(245, 158, 11, 0.35)' : 'rgba(245, 158, 11, 0.55)' 
        };
      default: 
        return { 
          color: isLight ? '#64748B' : '#C4B5FD', 
          bg: isLight ? 'rgba(100, 116, 139, 0.1)' : 'linear-gradient(90deg, rgba(168, 85, 247, 0.25) 0%, rgba(139, 92, 246, 0.15) 100%)', 
          border: isLight ? 'rgba(100, 116, 139, 0.3)' : 'rgba(168, 85, 247, 0.45)' 
        };
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'done': 
        return { color: isLight ? '#059669' : '#34D399', bg: isLight ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.2)', border: isLight ? 'rgba(16, 185, 129, 0.35)' : 'rgba(16, 185, 129, 0.55)', glow: '#10B981' };
      case 'code_review': 
        return { color: isLight ? '#D97706' : '#FBBF24', bg: isLight ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.2)', border: isLight ? 'rgba(245, 158, 11, 0.35)' : 'rgba(245, 158, 11, 0.55)', glow: '#F59E0B' };
      case 'in_progress': 
        return { color: isLight ? '#0284C7' : '#38BDF8', bg: isLight ? 'rgba(6, 182, 212, 0.12)' : 'rgba(56, 189, 248, 0.2)', border: isLight ? 'rgba(6, 182, 212, 0.35)' : 'rgba(56, 189, 248, 0.55)', glow: '#38BDF8' };
      default: 
        return { color: isLight ? '#7C3AED' : '#C084FC', bg: isLight ? 'rgba(139, 92, 246, 0.12)' : 'rgba(168, 85, 247, 0.2)', border: isLight ? 'rgba(139, 92, 246, 0.35)' : 'rgba(168, 85, 247, 0.55)', glow: '#A855F7' };
    }
  };

  return (
    <Box sx={{ py: 1 }}>
      
      {/* Header Info */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3.5, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography 
            variant="h4" 
            sx={{ 
              fontFamily: "'Outfit', sans-serif", 
              fontWeight: 900, 
              color: isLight ? '#0F172A' : '#FFFFFF', 
              letterSpacing: '-0.03em',
              mb: 0.5
            }}
          >
            Developer Command Dashboard
          </Typography>
          <Typography variant="body2" sx={{ color: isLight ? '#64748B' : '#C4B5FD', display: 'flex', alignItems: 'center', gap: 1 }}>
            <span className="live-dot live-dot-green" /> High-velocity engineering queue. Press <strong style={{ color: isLight ? '#7C3AED' : '#E9D5FF' }}>⌘K</strong> anywhere to spawn new tickets.
          </Typography>
        </Box>

        <Button
          variant="contained"
          onClick={onOpenCommandPalette}
          startIcon={<AutoAwesomeRounded />}
          sx={{
            background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
            boxShadow: isLight ? '0 4px 18px rgba(139, 92, 246, 0.35)' : '0 4px 20px rgba(168, 85, 247, 0.5)',
            borderRadius: '12px',
            px: 2.5,
            py: 1,
            fontWeight: 800,
            fontFamily: "'Outfit', sans-serif",
            fontSize: '0.92rem',
            '&:hover': {
              background: 'linear-gradient(135deg, #7C3AED 0%, #DB2777 100%)',
              boxShadow: isLight ? '0 8px 25px rgba(236, 72, 153, 0.45)' : '0 8px 30px rgba(236, 72, 153, 0.7)',
              transform: 'translateY(-2px)',
            },
          }}
        >
          Fast Create (⌘K)
        </Button>
      </Box>

      {/* 4 RADIANT COLORFUL METRIC WIDGETS */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          gap: 2.5,
          mb: 4,
        }}
      >
        {metricCards.map((m) => {
          const Icon = m.icon;
          return (
            <Card
              key={m.label}
              sx={{
                p: 2.8,
                borderRadius: '18px',
                background: m.gradient,
                backdropFilter: 'blur(20px)',
                border: '1px solid',
                borderColor: m.border,
                boxShadow: isLight ? '0 8px 25px rgba(99, 102, 241, 0.08)' : `0 8px 30px rgba(0,0,0,0.4), 0 0 22px ${m.glow}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.25s ease',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: isLight ? '0 12px 30px rgba(99, 102, 241, 0.15)' : `0 12px 36px rgba(0,0,0,0.5), 0 0 32px ${m.glow}`,
                },
              }}
            >
              <Box>
                <Typography 
                  variant="h3" 
                  sx={{ 
                    fontFamily: "'Outfit', sans-serif", 
                    fontWeight: 900, 
                    color: m.numColor, 
                    lineHeight: 1,
                    mb: 0.6
                  }}
                >
                  {m.count}
                </Typography>
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    color: isLight ? '#475569' : '#E9D5FF', 
                    fontWeight: 800,
                    fontFamily: "'Outfit', sans-serif",
                    letterSpacing: '0.02em',
                  }}
                >
                  {m.label}
                </Typography>
              </Box>

              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: '14px',
                  bgcolor: m.iconBg,
                  border: `1px solid ${m.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: m.color,
                  boxShadow: `0 0 16px ${m.glow}`,
                }}
              >
                <Icon sx={{ fontSize: 28 }} />
              </Box>
            </Card>
          );
        })}
      </Box>

      {/* DENSE COLORFUL TASK QUEUE TABLE */}
      <Card 
        sx={{ 
          p: 0, 
          overflow: 'hidden', 
          borderRadius: '18px',
          border: isLight ? '1px solid rgba(139, 92, 246, 0.18)' : '1px solid rgba(168, 85, 247, 0.22)',
          background: isLight 
            ? 'rgba(255, 255, 255, 0.95)' 
            : 'linear-gradient(160deg, rgba(26, 17, 46, 0.95) 0%, rgba(15, 9, 28, 0.98) 100%)',
          boxShadow: isLight ? '0 10px 30px rgba(99, 102, 241, 0.08)' : '0 12px 40px rgba(0, 0, 0, 0.6)',
        }}
      >
        
        {/* Table Header */}
        <Box
          sx={{
            py: 1.8,
            px: 3,
            bgcolor: isLight ? 'rgba(248, 250, 252, 0.95)' : 'rgba(20, 13, 36, 0.9)',
            borderBottom: isLight ? '1px solid rgba(139, 92, 246, 0.12)' : '1px solid rgba(168, 85, 247, 0.18)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography 
            variant="caption" 
            sx={{ 
              fontWeight: 800, 
              color: isLight ? '#7C3AED' : '#C084FC', 
              fontSize: '0.78rem',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            ACTIVE TASK QUEUE ({tasks.length})
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              fontWeight: 800, 
              color: isLight ? '#7C3AED' : '#C084FC', 
              fontSize: '0.78rem',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            STATUS & ACTIONS
          </Typography>
        </Box>

        {/* Task Rows */}
        {tasks.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <Typography variant="body1" sx={{ color: isLight ? '#64748B' : '#8B5CF6', fontWeight: 600 }}>
              No tasks found in queue. Press ⌘K to spawn your first ticket!
            </Typography>
          </Box>
        ) : (
          tasks.map((task) => {
            const pStyle = getPriorityStyle(task.priority);
            const sConf = getStatusConfig(task.status);

            return (
              <Box
                key={task.id}
                onClick={() => onSelectTask(task)}
                sx={{
                  py: 2,
                  px: 3,
                  borderBottom: isLight ? '1px solid rgba(0, 0, 0, 0.05)' : '1px solid rgba(168, 85, 247, 0.1)',
                  borderLeft: `4px solid ${sConf.glow}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    bgcolor: isLight ? 'rgba(139, 92, 246, 0.05)' : 'rgba(168, 85, 247, 0.12)',
                    transform: 'translateX(4px)',
                  },
                  '&:last-child': {
                    borderBottom: 'none',
                  },
                }}
              >
                {/* Left: ID + Title + Desc */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.2 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 900,
                      color: isLight ? '#94A3B8' : '#8B5CF6',
                      width: 38,
                      fontFamily: 'monospace',
                      fontSize: '0.9rem',
                    }}
                  >
                    #{task.id}
                  </Typography>

                  <Box>
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        fontFamily: "'Outfit', sans-serif",
                        fontWeight: 800, 
                        color: isLight ? '#0F172A' : '#F8FAFC', 
                        fontSize: '1rem',
                        lineHeight: 1.3
                      }}
                    >
                      {task.title}
                    </Typography>
                    {task.desc && (
                      <Typography variant="caption" sx={{ color: isLight ? '#64748B' : '#C4B5FD', display: 'block', mt: 0.3, fontSize: '0.82rem' }}>
                        {task.desc}
                      </Typography>
                    )}
                  </Box>
                </Box>

                {/* Right: Priority Gradient Pill + Status Dropdown */}
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 1.8 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Chip
                    label={task.priority}
                    size="small"
                    sx={{
                      height: 24,
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      fontFamily: "'Outfit', sans-serif",
                      background: pStyle.bg,
                      color: pStyle.color,
                      border: `1px solid ${pStyle.border}`,
                    }}
                  />

                  <Select
                    value={task.status}
                    onChange={(e) => onUpdateStatus(task.id, e.target.value)}
                    size="small"
                    sx={{
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      fontFamily: "'Outfit', sans-serif",
                      color: sConf.color,
                      bgcolor: sConf.bg,
                      border: `1px solid ${sConf.border}`,
                      borderRadius: '10px',
                      boxShadow: isLight ? 'none' : `0 0 12px ${sConf.glow}40`,
                      '& .MuiSelect-select': { py: 0.6, px: 1.4 },
                    }}
                  >
                    <MenuItem value="todo" sx={{ color: isLight ? '#7C3AED' : '#C084FC', fontWeight: 700 }}>To Do</MenuItem>
                    <MenuItem value="in_progress" sx={{ color: isLight ? '#0284C7' : '#38BDF8', fontWeight: 700 }}>In Progress</MenuItem>
                    <MenuItem value="code_review" sx={{ color: isLight ? '#D97706' : '#FBBF24', fontWeight: 700 }}>Code Review</MenuItem>
                    <MenuItem value="done" sx={{ color: isLight ? '#059669' : '#34D399', fontWeight: 700 }}>Done</MenuItem>
                  </Select>

                  <ArrowForwardIosRounded sx={{ color: isLight ? '#CBD5E1' : '#8B5CF6', fontSize: 15 }} />
                </Box>

              </Box>
            );
          })
        )}

      </Card>

    </Box>
  );
}
