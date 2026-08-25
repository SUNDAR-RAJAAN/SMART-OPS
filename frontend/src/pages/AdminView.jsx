import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useThemeMode } from '../context/ThemeModeContext';
import { api } from '../api/client';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import { 
  ChatRounded, 
  SendRounded, 
  SaveRounded, 
  StorageRounded, 
  DnsRounded, 
  TaskAltRounded, 
  CheckCircleOutlineRounded, 
  BoltRounded 
} from '@mui/icons-material';

export default function AdminView({ tasks }) {
  const { token } = useAuth();
  const { mode } = useThemeMode();
  const isLight = mode === 'light';

  const [webhookUrl, setWebhookUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const seedUsers = [
    { id: 1, email: 'admin@smartops.io', role: 'admin', team: 'Core Infrastructure', color: '#10B981' },
    { id: 2, email: 'manager@smartops.io', role: 'manager', team: 'Product Management', color: '#F59E0B' },
    { id: 3, email: 'dev@smartops.io', role: 'employee', team: 'Backend Engineering', color: '#8B5CF6' },
  ];

  useEffect(() => {
    if (!token) return;
    api.getProfile(token)
      .then((profile) => {
        if (profile?.teams_webhook_url) {
          setWebhookUrl(profile.teams_webhook_url);
        }
      })
      .catch((err) => console.error('Failed loading profile settings:', err));
  }, [token]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback({ type: '', message: '' });

    try {
      await api.updateUserSettings({ teams_webhook_url: webhookUrl.trim() }, token);
      setFeedback({ type: 'success', message: 'Teams Webhook URL saved successfully!' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed saving settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl.trim()) {
      setFeedback({ type: 'error', message: 'Please enter a valid Teams Webhook URL first.' });
      return;
    }

    setTesting(true);
    setFeedback({ type: '', message: '' });

    try {
      const res = await api.testTeamsWebhook(webhookUrl.trim(), token);
      setFeedback({ type: 'success', message: res.message || 'Sample test message sent to Microsoft Teams successfully!' });
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed sending test message to Teams.' });
    } finally {
      setTesting(false);
    }
  };

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
          Workspace Settings & System Control
        </Typography>
        <Typography variant="body2" sx={{ color: isLight ? '#64748B' : '#C4B5FD' }}>
          System architecture metrics, RBAC permissions, and Microsoft Teams integration.
        </Typography>
      </Box>

      {/* Microsoft Teams Webhook Integration Card */}
      <Card
        sx={{
          p: 3.5,
          mb: 3.5,
          borderRadius: '18px',
          background: isLight 
            ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(236, 72, 153, 0.06) 100%)' 
            : 'linear-gradient(135deg, rgba(139, 92, 246, 0.18) 0%, rgba(236, 72, 153, 0.1) 100%)',
          border: isLight ? '1px solid rgba(139, 92, 246, 0.25)' : '1px solid rgba(168, 85, 247, 0.35)',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.8 }}>
            <Box
              sx={{
                p: 1.2,
                borderRadius: '12px',
                bgcolor: isLight ? 'rgba(139, 92, 246, 0.15)' : 'rgba(168, 85, 247, 0.25)',
                color: isLight ? '#7C3AED' : '#C084FC',
                display: 'flex',
              }}
            >
              <ChatRounded fontSize="medium" />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: isLight ? '#0F172A' : '#FFFFFF' }}>
                Microsoft Teams Channel Webhook
              </Typography>
              <Typography variant="body2" sx={{ color: isLight ? '#64748B' : '#C4B5FD', fontSize: '0.82rem' }}>
                Receive real-time channel notifications for task state transitions, @mentions, and assignments.
              </Typography>
            </Box>
          </Box>

          <Chip
            icon={<BoltRounded sx={{ fontSize: 16 }} />}
            label="Real-Time Push"
            size="small"
            color="primary"
            sx={{ fontWeight: 800, fontFamily: "'Outfit', sans-serif" }}
          />
        </Box>

        {feedback.message && (
          <Alert severity={feedback.type === 'success' ? 'success' : 'error'} sx={{ mb: 2.5, borderRadius: '12px' }}>
            {feedback.message}
          </Alert>
        )}

        <form onSubmit={handleSaveSettings}>
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: isLight ? '#475569' : '#C4B5FD', display: 'block', mb: 0.8, letterSpacing: '0.04em' }}>
              TEAMS WEBHOOK CONNECTOR URL
            </Typography>
            <TextField
              fullWidth
              type="url"
              placeholder="https://outlook.office.com/webhook/... or Azure Logic App URL"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              size="small"
              sx={{ fontFamily: 'monospace' }}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
            <Button
              type="button"
              variant="outlined"
              disabled={testing || !webhookUrl.trim()}
              onClick={handleTestWebhook}
              startIcon={testing ? <CircularProgress size={16} color="inherit" /> : <SendRounded />}
              sx={{ borderRadius: '12px' }}
            >
              {testing ? 'Sending Sample...' : 'Test Teams Webhook'}
            </Button>

            <Button
              type="submit"
              variant="contained"
              disabled={saving}
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveRounded />}
              sx={{
                borderRadius: '12px',
                px: 2.5,
                background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
              }}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </Box>
        </form>
      </Card>

      {/* System Metrics Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2.5, mb: 3.5 }}>
        <Card sx={{ p: 2.8, borderRadius: '18px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: '#8B5CF6', mb: 1 }}>
            <StorageRounded />
            <Typography variant="subtitle2" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: isLight ? '#7C3AED' : '#C084FC' }}>
              Database Engine
            </Typography>
          </Box>
          <Typography variant="h6" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: isLight ? '#0F172A' : '#FFFFFF' }}>
            SQLite3 (smartops.db)
          </Typography>
          <Typography variant="caption" sx={{ color: isLight ? '#64748B' : '#94A3B8', display: 'block', mt: 0.5 }}>
            Zero-config local relational storage mode
          </Typography>
        </Card>

        <Card sx={{ p: 2.8, borderRadius: '18px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: '#06B6D4', mb: 1 }}>
            <DnsRounded />
            <Typography variant="subtitle2" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: isLight ? '#0284C7' : '#22D3EE' }}>
              Backend Server
            </Typography>
          </Box>
          <Typography variant="h6" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: isLight ? '#0F172A' : '#FFFFFF' }}>
            Go 1.26 HTTP Server (:8080)
          </Typography>
          <Typography variant="caption" sx={{ color: isLight ? '#64748B' : '#94A3B8', display: 'block', mt: 0.5 }}>
            High-performance concurrency with sub-1ms response
          </Typography>
        </Card>

        <Card sx={{ p: 2.8, borderRadius: '18px' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: '#10B981', mb: 1 }}>
            <TaskAltRounded />
            <Typography variant="subtitle2" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: isLight ? '#059669' : '#34D399' }}>
              Indexed Tasks
            </Typography>
          </Box>
          <Typography variant="h6" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: isLight ? '#0F172A' : '#FFFFFF' }}>
            {tasks.length} Total Tasks
          </Typography>
          <Typography variant="caption" sx={{ color: isLight ? '#64748B' : '#94A3B8', display: 'block', mt: 0.5 }}>
            Indexed for vector similarity triage & search
          </Typography>
        </Card>
      </Box>

      {/* Role-Based Access Control (RBAC) User List */}
      <Card sx={{ p: 3, borderRadius: '18px' }}>
        <Typography variant="subtitle1" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: isLight ? '#0F172A' : '#FFFFFF', mb: 2 }}>
          Workspace Users & RBAC Directory
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {seedUsers.map((u) => (
            <Box
              key={u.id}
              sx={{
                p: 2,
                borderRadius: '12px',
                bgcolor: isLight ? 'rgba(248, 250, 252, 0.9)' : 'rgba(255, 255, 255, 0.03)',
                border: isLight ? '1px solid rgba(0, 0, 0, 0.06)' : '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: `${u.color}30`, color: u.color, fontWeight: 900 }}>
                  {u.email[0].toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, color: isLight ? '#0F172A' : '#F8FAFC' }}>
                    {u.email}
                  </Typography>
                  <Typography variant="caption" sx={{ color: isLight ? '#64748B' : '#94A3B8' }}>
                    {u.team}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Chip
                  label={u.role}
                  size="small"
                  sx={{
                    bgcolor: `${u.color}20`,
                    color: u.color,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    fontFamily: "'Outfit', sans-serif",
                    border: `1px solid ${u.color}40`,
                  }}
                />
                <Chip
                  icon={<CheckCircleOutlineRounded sx={{ fontSize: 14 }} />}
                  label="Active"
                  size="small"
                  variant="outlined"
                  color="success"
                  sx={{ fontWeight: 700 }}
                />
              </Box>
            </Box>
          ))}
        </Box>
      </Card>

    </Box>
  );
}
