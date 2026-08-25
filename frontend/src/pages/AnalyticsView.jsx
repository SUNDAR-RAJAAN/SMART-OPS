import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useThemeMode } from '../context/ThemeModeContext';
import { api } from '../api/client';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';
import { 
  TrendingUpRounded, 
  QueryBuilderRounded, 
  WarningAmberRounded, 
  CachedRounded
} from '@mui/icons-material';

export default function AnalyticsView() {
  const { token } = useAuth();
  const { mode } = useThemeMode();
  const isLight = mode === 'light';

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
      <Box sx={{ p: 8, textAlign: 'center' }}>
        <CircularProgress color="primary" />
        <Typography variant="body2" sx={{ color: isLight ? '#64748B' : '#94A3B8', mt: 2 }}>
          Loading high-performance analytics metrics...
        </Typography>
      </Box>
    );
  }

  const rate = completionStats?.completion_rate_percentage || 0;
  const statusCounts = completionStats?.status_counts || {};
  const priorityCounts = completionStats?.priority_counts || {};

  return (
    <Box sx={{ py: 1 }}>
      
      {/* Header */}
      <Box sx={{ mb: 3 }}>
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
          Analytics & Performance Engine
        </Typography>
        <Typography variant="body2" sx={{ color: isLight ? '#64748B' : '#C4B5FD' }}>
          Real-time aggregated SQL throughput metrics powered by Go 5-minute in-memory TTL caching.
        </Typography>
      </Box>

      {/* 4 Top Metric Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
          gap: 2.5,
          mb: 3.5,
        }}
      >
        <Card sx={{ p: 2.8, borderRadius: '18px', border: isLight ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(16, 185, 129, 0.4)' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: isLight ? '#059669' : '#34D399', textTransform: 'uppercase', fontFamily: "'Outfit', sans-serif" }}>
              Completion Rate
            </Typography>
            <Box sx={{ p: 0.8, borderRadius: '10px', bgcolor: 'rgba(16, 185, 129, 0.15)', color: isLight ? '#059669' : '#34D399' }}>
              <TrendingUpRounded fontSize="small" />
            </Box>
          </Box>
          <Typography variant="h3" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, color: isLight ? '#059669' : '#34D399', mb: 0.5 }}>
            {rate.toFixed(1)}%
          </Typography>
          <Typography variant="caption" sx={{ color: isLight ? '#64748B' : '#94A3B8' }}>
            {completionStats?.completed_tasks || 0} of {completionStats?.total_tasks || 0} tasks resolved
          </Typography>
        </Card>

        <Card sx={{ p: 2.8, borderRadius: '18px', border: isLight ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid rgba(6, 182, 212, 0.4)' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: isLight ? '#0284C7' : '#22D3EE', textTransform: 'uppercase', fontFamily: "'Outfit', sans-serif" }}>
              Active Pipeline
            </Typography>
            <Box sx={{ p: 0.8, borderRadius: '10px', bgcolor: 'rgba(6, 182, 212, 0.15)', color: isLight ? '#0284C7' : '#22D3EE' }}>
              <QueryBuilderRounded fontSize="small" />
            </Box>
          </Box>
          <Typography variant="h3" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, color: isLight ? '#0284C7' : '#22D3EE', mb: 0.5 }}>
            {overdueStats?.pending_count || 0}
          </Typography>
          <Typography variant="caption" sx={{ color: isLight ? '#64748B' : '#94A3B8' }}>
            Tasks in ongoing development
          </Typography>
        </Card>

        <Card sx={{ p: 2.8, borderRadius: '18px', border: isLight ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid rgba(244, 63, 94, 0.4)' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: isLight ? '#E11D48' : '#FB7185', textTransform: 'uppercase', fontFamily: "'Outfit', sans-serif" }}>
              High Priority Load
            </Typography>
            <Box sx={{ p: 0.8, borderRadius: '10px', bgcolor: 'rgba(244, 63, 94, 0.15)', color: isLight ? '#E11D48' : '#FB7185' }}>
              <WarningAmberRounded fontSize="small" />
            </Box>
          </Box>
          <Typography variant="h3" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, color: isLight ? '#E11D48' : '#FB7185', mb: 0.5 }}>
            {priorityCounts.high || 0}
          </Typography>
          <Typography variant="caption" sx={{ color: isLight ? '#64748B' : '#94A3B8' }}>
            Critical / urgent workload
          </Typography>
        </Card>

        <Card sx={{ p: 2.8, borderRadius: '18px', border: isLight ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid rgba(139, 92, 246, 0.4)' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: isLight ? '#7C3AED' : '#C084FC', textTransform: 'uppercase', fontFamily: "'Outfit', sans-serif" }}>
              Cache Architecture
            </Typography>
            <Box sx={{ p: 0.8, borderRadius: '10px', bgcolor: 'rgba(139, 92, 246, 0.15)', color: isLight ? '#7C3AED' : '#C084FC' }}>
              <CachedRounded fontSize="small" />
            </Box>
          </Box>
          <Chip
            label="5-Min In-Memory TTL"
            size="small"
            sx={{ bgcolor: isLight ? 'rgba(139, 92, 246, 0.12)' : 'rgba(139, 92, 246, 0.2)', color: isLight ? '#7C3AED' : '#C084FC', fontWeight: 800, mt: 0.5 }}
          />
          <Typography variant="caption" sx={{ color: isLight ? '#64748B' : '#94A3B8', display: 'block', mt: 1 }}>
            Optimized query performance
          </Typography>
        </Card>
      </Box>

      {/* Visual Distributions */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5, mb: 3.5 }}>
        
        {/* Status Distribution */}
        <Card sx={{ p: 3, borderRadius: '18px' }}>
          <Typography variant="subtitle1" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: isLight ? '#0F172A' : '#FFFFFF', mb: 2.5 }}>
            Workflow Status Distribution
          </Typography>

          {[
            { key: 'todo', label: 'To Do', color: '#8B5CF6' },
            { key: 'in_progress', label: 'In Progress', color: '#06B6D4' },
            { key: 'code_review', label: 'Code Review', color: '#F59E0B' },
            { key: 'done', label: 'Done', color: '#10B981' },
          ].map((item) => {
            const cnt = statusCounts[item.key] || 0;
            const pct = completionStats?.total_tasks ? ((cnt / completionStats.total_tasks) * 100).toFixed(0) : 0;

            return (
              <Box key={item.key} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.6 }}>
                  <Typography variant="body2" sx={{ color: isLight ? '#475569' : '#C4B5FD', fontWeight: 600 }}>
                    {item.label}
                  </Typography>
                  <Typography variant="body2" sx={{ color: isLight ? '#0F172A' : '#FFFFFF', fontWeight: 700 }}>
                    {cnt} ({pct}%)
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Number(pct)}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.06)',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: item.color,
                      borderRadius: 4,
                    },
                  }}
                />
              </Box>
            );
          })}
        </Card>

        {/* Priority Distribution */}
        <Card sx={{ p: 3, borderRadius: '18px' }}>
          <Typography variant="subtitle1" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: isLight ? '#0F172A' : '#FFFFFF', mb: 2.5 }}>
            Task Priority Distribution
          </Typography>

          {[
            { key: 'high', label: 'High Priority', color: '#F43F5E' },
            { key: 'medium', label: 'Medium Priority', color: '#F59E0B' },
            { key: 'low', label: 'Low Priority', color: '#64748B' },
          ].map((item) => {
            const cnt = priorityCounts[item.key] || 0;
            const pct = completionStats?.total_tasks ? ((cnt / completionStats.total_tasks) * 100).toFixed(0) : 0;

            return (
              <Box key={item.key} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.6 }}>
                  <Typography variant="body2" sx={{ color: isLight ? '#475569' : '#C4B5FD', fontWeight: 600 }}>
                    {item.label}
                  </Typography>
                  <Typography variant="body2" sx={{ color: isLight ? '#0F172A' : '#FFFFFF', fontWeight: 700 }}>
                    {cnt} ({pct}%)
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Number(pct)}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.06)',
                    '& .MuiLinearProgress-bar': {
                      bgcolor: item.color,
                      borderRadius: 4,
                    },
                  }}
                />
              </Box>
            );
          })}
        </Card>

      </Box>

      {/* Active Pipeline Table */}
      <Card sx={{ p: 0, overflow: 'hidden', borderRadius: '18px' }}>
        <Box sx={{ py: 1.8, px: 3, bgcolor: isLight ? 'rgba(248, 250, 252, 0.95)' : 'rgba(20, 13, 36, 0.9)', borderBottom: isLight ? '1px solid rgba(139, 92, 246, 0.12)' : '1px solid rgba(168, 85, 247, 0.18)' }}>
          <Typography variant="caption" sx={{ fontWeight: 800, color: isLight ? '#7C3AED' : '#C084FC', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'Outfit', sans-serif" }}>
            ACTIVE PIPELINE TASKS ({overdueStats?.tasks?.length || 0})
          </Typography>
        </Box>

        {(!overdueStats?.tasks || overdueStats.tasks.length === 0) ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: isLight ? '#64748B' : '#8B5CF6' }}>
              No active pending tasks. All clear!
            </Typography>
          </Box>
        ) : (
          overdueStats.tasks.map((t) => (
            <Box
              key={t.id}
              sx={{
                py: 1.5,
                px: 3,
                borderBottom: isLight ? '1px solid rgba(0, 0, 0, 0.05)' : '1px solid rgba(168, 85, 247, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                '&:last-child': { borderBottom: 'none' },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="caption" sx={{ fontWeight: 900, color: isLight ? '#94A3B8' : '#8B5CF6', fontFamily: 'monospace' }}>
                  #{t.id}
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: isLight ? '#0F172A' : '#F8FAFC', fontFamily: "'Outfit', sans-serif" }}>
                  {t.title}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Chip
                  label={t.priority}
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    fontFamily: "'Outfit', sans-serif",
                    bgcolor: t.priority === 'high' ? (isLight ? 'rgba(244, 63, 94, 0.12)' : 'rgba(244, 63, 94, 0.2)') : (isLight ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.2)'),
                    color: t.priority === 'high' ? (isLight ? '#E11D48' : '#FB7185') : (isLight ? '#D97706' : '#FBBF24'),
                  }}
                />
                <Chip
                  label={t.status.replace('_', ' ')}
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    fontFamily: "'Outfit', sans-serif",
                    bgcolor: isLight ? 'rgba(6, 182, 212, 0.12)' : 'rgba(6, 182, 212, 0.2)',
                    color: isLight ? '#0284C7' : '#22D3EE',
                  }}
                />
              </Box>
            </Box>
          ))
        )}
      </Card>

    </Box>
  );
}
