import React from 'react';
import { useThemeMode } from '../context/ThemeModeContext';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { 
  AddRounded, 
  ArrowBackRounded, 
  ArrowForwardRounded,
  FiberManualRecordRounded
} from '@mui/icons-material';

export default function ManagerView({ tasks, onSelectTask, onUpdateStatus, onOpenCommandPalette }) {
  const { mode } = useThemeMode();
  const isLight = mode === 'light';

  const columns = [
    { 
      key: 'todo', 
      label: 'To Do', 
      color: isLight ? '#7C3AED' : '#C084FC', 
      numColor: isLight ? '#6D28D9' : '#E9D5FF',
      bg: isLight 
        ? 'linear-gradient(180deg, rgba(139, 92, 246, 0.08) 0%, rgba(255, 255, 255, 0.9) 100%)' 
        : 'linear-gradient(180deg, rgba(139, 92, 246, 0.18) 0%, rgba(26, 17, 46, 0.95) 100%)', 
      border: isLight ? 'rgba(139, 92, 246, 0.25)' : 'rgba(168, 85, 247, 0.4)',
      glow: isLight ? 'rgba(139, 92, 246, 0.15)' : 'rgba(168, 85, 247, 0.35)' 
    },
    { 
      key: 'in_progress', 
      label: 'In Progress', 
      color: isLight ? '#0284C7' : '#38BDF8', 
      numColor: isLight ? '#0369A1' : '#BAE6FD',
      bg: isLight 
        ? 'linear-gradient(180deg, rgba(6, 182, 212, 0.08) 0%, rgba(255, 255, 255, 0.9) 100%)' 
        : 'linear-gradient(180deg, rgba(6, 182, 212, 0.18) 0%, rgba(26, 17, 46, 0.95) 100%)', 
      border: isLight ? 'rgba(6, 182, 212, 0.25)' : 'rgba(6, 182, 212, 0.4)',
      glow: isLight ? 'rgba(6, 182, 212, 0.15)' : 'rgba(6, 182, 212, 0.35)' 
    },
    { 
      key: 'code_review', 
      label: 'Code Review', 
      color: isLight ? '#D97706' : '#FBBF24', 
      numColor: isLight ? '#B45309' : '#FEF08A',
      bg: isLight 
        ? 'linear-gradient(180deg, rgba(245, 158, 11, 0.08) 0%, rgba(255, 255, 255, 0.9) 100%)' 
        : 'linear-gradient(180deg, rgba(245, 158, 11, 0.18) 0%, rgba(26, 17, 46, 0.95) 100%)', 
      border: isLight ? 'rgba(245, 158, 11, 0.25)' : 'rgba(245, 158, 11, 0.4)',
      glow: isLight ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.35)' 
    },
    { 
      key: 'done', 
      label: 'Done', 
      color: isLight ? '#059669' : '#34D399', 
      numColor: isLight ? '#047857' : '#A7F3D0',
      bg: isLight 
        ? 'linear-gradient(180deg, rgba(16, 185, 129, 0.08) 0%, rgba(255, 255, 255, 0.9) 100%)' 
        : 'linear-gradient(180deg, rgba(16, 185, 129, 0.18) 0%, rgba(26, 17, 46, 0.95) 100%)', 
      border: isLight ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.4)',
      glow: isLight ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.35)' 
    },
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

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'high': 
        return { 
          color: isLight ? '#E11D48' : '#FB7185', 
          bg: isLight ? 'rgba(244, 63, 94, 0.12)' : 'linear-gradient(90deg, rgba(244, 63, 94, 0.3) 0%, rgba(225, 29, 72, 0.15) 100%)', 
          border: isLight ? 'rgba(244, 63, 94, 0.35)' : 'rgba(244, 63, 94, 0.5)' 
        };
      case 'medium': 
        return { 
          color: isLight ? '#D97706' : '#FBBF24', 
          bg: isLight ? 'rgba(245, 158, 11, 0.12)' : 'linear-gradient(90deg, rgba(245, 158, 11, 0.3) 0%, rgba(217, 119, 6, 0.15) 100%)', 
          border: isLight ? 'rgba(245, 158, 11, 0.35)' : 'rgba(245, 158, 11, 0.5)' 
        };
      default: 
        return { 
          color: isLight ? '#64748B' : '#C4B5FD', 
          bg: isLight ? 'rgba(100, 116, 139, 0.1)' : 'linear-gradient(90deg, rgba(168, 85, 247, 0.25) 0%, rgba(139, 92, 246, 0.15) 100%)', 
          border: isLight ? 'rgba(100, 116, 139, 0.3)' : 'rgba(168, 85, 247, 0.45)' 
        };
    }
  };

  return (
    <Box sx={{ py: 1 }}>
      
      {/* Header */}
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
            Team Kanban Board
          </Typography>
          <Typography variant="body2" sx={{ color: isLight ? '#64748B' : '#C4B5FD' }}>
            Multi-stage agile workflow pipeline with real-time optimistic state sync.
          </Typography>
        </Box>

        <Button
          variant="contained"
          onClick={onOpenCommandPalette}
          startIcon={<AddRounded />}
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
          Add Task
        </Button>
      </Box>

      {/* 4-Column Kanban Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
          gap: 2.5,
          alignItems: 'start',
        }}
      >
        {columns.map((col) => {
          const colTasks = getTasksByStatus(col.key);

          return (
            <Box
              key={col.key}
              sx={{
                background: col.bg,
                backdropFilter: 'blur(20px)',
                border: '1px solid',
                borderColor: col.border,
                borderRadius: '20px',
                p: 2.2,
                minHeight: 580,
                display: 'flex',
                flexDirection: 'column',
                boxShadow: isLight ? '0 8px 25px rgba(99, 102, 241, 0.06)' : `0 8px 30px rgba(0,0,0,0.35), 0 0 15px ${col.glow}`,
              }}
            >
              {/* Column Header */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                  pb: 1.5,
                  borderBottom: `2.5px solid ${col.color}`,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FiberManualRecordRounded sx={{ color: col.color, fontSize: 14 }} />
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      fontFamily: "'Outfit', sans-serif",
                      fontWeight: 800, 
                      color: isLight ? '#0F172A' : '#FFFFFF',
                      fontSize: '1rem'
                    }}
                  >
                    {col.label}
                  </Typography>
                </Box>

                <Chip
                  label={colTasks.length}
                  size="small"
                  sx={{
                    bgcolor: isLight ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.4)',
                    color: col.numColor,
                    fontWeight: 900,
                    fontSize: '0.8rem',
                    fontFamily: "'Outfit', sans-serif",
                    border: `1.5px solid ${col.border}`,
                    boxShadow: isLight ? '0 2px 6px rgba(0,0,0,0.05)' : `0 0 10px ${col.glow}`,
                  }}
                />
              </Box>

              {/* Task Cards Column */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flex: 1 }}>
                {colTasks.map((task) => {
                  const prev = getPrevStatus(task.status);
                  const next = getNextStatus(task.status);
                  const pStyle = getPriorityStyle(task.priority);

                  return (
                    <Card
                      key={task.id}
                      onClick={() => onSelectTask(task)}
                      sx={{
                        p: 2.2,
                        cursor: 'pointer',
                        borderRadius: '14px',
                        background: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(22, 14, 40, 0.95)',
                        border: isLight ? '1px solid rgba(139, 92, 246, 0.15)' : '1px solid rgba(168, 85, 247, 0.18)',
                        borderLeft: `4px solid ${col.color}`,
                        boxShadow: isLight ? '0 4px 15px rgba(0, 0, 0, 0.04)' : '0 4px 15px rgba(0, 0, 0, 0.4)',
                        transition: 'all 0.22s ease',
                        '&:hover': {
                          transform: 'translateY(-3px)',
                          borderColor: col.color,
                          boxShadow: isLight 
                            ? `0 8px 25px rgba(99, 102, 241, 0.15)` 
                            : `0 10px 25px -4px ${col.color}40`,
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.2 }}>
                        <Typography variant="caption" sx={{ fontWeight: 900, color: isLight ? '#94A3B8' : '#8B5CF6', fontFamily: 'monospace' }}>
                          #{task.id}
                        </Typography>

                        <Chip
                          label={task.priority}
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            fontFamily: "'Outfit', sans-serif",
                            background: pStyle.bg,
                            color: pStyle.color,
                            border: `1px solid ${pStyle.border}`,
                          }}
                        />
                      </Box>

                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontFamily: "'Outfit', sans-serif",
                          fontWeight: 800,
                          color: isLight ? '#0F172A' : '#FFFFFF',
                          mb: 0.8,
                          fontSize: '0.98rem',
                          lineHeight: 1.35,
                        }}
                      >
                        {task.title}
                      </Typography>

                      {task.desc && (
                        <Typography
                          variant="body2"
                          sx={{
                            color: isLight ? '#64748B' : '#C4B5FD',
                            fontSize: '0.8rem',
                            mb: 1.8,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {task.desc}
                        </Typography>
                      )}

                      {/* Card Footer with Quick Move Buttons */}
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          pt: 1.2,
                          borderTop: isLight ? '1px solid rgba(0, 0, 0, 0.06)' : '1px solid rgba(168, 85, 247, 0.15)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Box>
                          {prev && (
                            <Tooltip title={`Move back to ${prev.replace('_', ' ')}`}>
                              <IconButton
                                size="small"
                                onClick={() => onUpdateStatus(task.id, prev)}
                                sx={{
                                  p: 0.6,
                                  bgcolor: isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.05)',
                                  border: isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.1)',
                                  color: isLight ? '#64748B' : '#C4B5FD',
                                  '&:hover': { color: '#8B5CF6', bgcolor: 'rgba(139, 92, 246, 0.1)' },
                                }}
                              >
                                <ArrowBackRounded sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>

                        <Box>
                          {next && (
                            <Tooltip title={`Advance to ${next.replace('_', ' ')}`}>
                              <IconButton
                                size="small"
                                onClick={() => onUpdateStatus(task.id, next)}
                                sx={{
                                  p: 0.6,
                                  bgcolor: `${col.color}20`,
                                  border: `1px solid ${col.color}50`,
                                  color: col.color,
                                  '&:hover': { color: '#FFFFFF', bgcolor: col.color },
                                }}
                              >
                                <ArrowForwardRounded sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </Box>

                    </Card>
                  );
                })}
              </Box>

            </Box>
          );
        })}
      </Box>

    </Box>
  );
}
