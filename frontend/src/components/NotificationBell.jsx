import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useThemeMode } from '../context/ThemeModeContext';
import { api } from '../api/client';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Slide from '@mui/material/Slide';
import { 
  NotificationsRounded, 
  AlternateEmailRounded, 
  CheckRounded, 
  CloseRounded
} from '@mui/icons-material';

export default function NotificationBell({ onSelectTaskID }) {
  const { token } = useAuth();
  const { mode } = useThemeMode();
  const isLight = mode === 'light';

  const [notifications, setNotifications] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [toast, setToast] = useState(null);

  const open = Boolean(anchorEl);

  const fetchUnread = async () => {
    if (!token) return;
    try {
      const data = await api.getUnreadNotifications(token);
      setNotifications(data || []);
    } catch (err) {
      console.error('Failed fetching unread notifications:', err);
    }
  };

  useEffect(() => {
    fetchUnread();
  }, [token]);

  // Real-time WebSocket Push Notification listener
  useEffect(() => {
    if (!token) return;

    const wsUrl = `ws://localhost:8080/ws/notifications?token=${token}`;
    let socket = null;

    try {
      socket = new WebSocket(wsUrl);

      socket.onmessage = (event) => {
        try {
          const newNotif = JSON.parse(event.data);
          setNotifications((prev) => [newNotif, ...prev]);

          // Show floating toast alert
          setToast(newNotif);
          setTimeout(() => setToast(null), 5000);
        } catch (e) {
          console.error('Error parsing notification WS event:', e);
        }
      };

      socket.onerror = () => {
        // Fall back gracefully if WS unavailable
      };
    } catch (e) {
      console.error('WebSocket connection error:', e);
    }

    return () => {
      if (socket) socket.close();
    };
  }, [token]);

  const handleMarkRead = async (notifId, refURL) => {
    try {
      await api.markNotificationRead(notifId, token);
      setNotifications((prev) => prev.filter((n) => n.id !== notifId));

      if (refURL && refURL.includes('/tasks/')) {
        const parts = refURL.split('/tasks/');
        if (parts.length > 1) {
          onSelectTaskID?.(parseInt(parts[1]));
        }
      }
    } catch (err) {
      console.error('Failed marking notification read:', err);
    }
  };

  return (
    <>
      <IconButton
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{
          color: open ? '#8B5CF6' : (isLight ? '#64748B' : '#C4B5FD'),
          bgcolor: open 
            ? (isLight ? 'rgba(139, 92, 246, 0.15)' : 'rgba(168, 85, 247, 0.2)') 
            : (isLight ? 'rgba(241, 245, 249, 0.85)' : 'rgba(22, 14, 40, 0.8)'),
          border: isLight ? '1px solid rgba(139, 92, 246, 0.2)' : '1px solid rgba(168, 85, 247, 0.25)',
          borderRadius: '12px',
          p: 1,
          '&:hover': {
            bgcolor: isLight ? 'rgba(139, 92, 246, 0.12)' : 'rgba(168, 85, 247, 0.25)',
            color: isLight ? '#7C3AED' : '#F8FAFC',
            borderColor: '#8B5CF6',
          },
        }}
      >
        <Badge
          badgeContent={notifications.length}
          color="error"
          sx={{
            '& .MuiBadge-badge': {
              fontWeight: 800,
              fontSize: '0.7rem',
              boxShadow: '0 0 8px rgba(244, 63, 94, 0.6)',
            },
          }}
        >
          <NotificationsRounded fontSize="small" />
        </Badge>
      </IconButton>

      {/* Notifications Popover Menu */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        PaperProps={{
          sx: {
            width: 340,
            maxHeight: 400,
            mt: 1.5,
            p: 1,
            borderRadius: '16px',
            background: isLight ? 'rgba(255, 255, 255, 0.98)' : 'linear-gradient(160deg, #1A112E 0%, #0F091C 100%)',
            backdropFilter: 'blur(20px)',
            border: isLight ? '1px solid rgba(139, 92, 246, 0.2)' : '1px solid rgba(168, 85, 247, 0.25)',
            boxShadow: isLight ? '0 15px 40px rgba(99, 102, 241, 0.12)' : '0 20px 50px rgba(0,0,0,0.7)',
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, pb: 1, borderBottom: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255, 255, 255, 0.08)' }}>
          <Typography variant="subtitle2" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: isLight ? '#0F172A' : '#F8FAFC' }}>
            Notifications
          </Typography>
          <Chip
            label={`${notifications.length} unread`}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ height: 22, fontSize: '0.7rem', fontWeight: 800 }}
          />
        </Box>

        <Box sx={{ mt: 1, maxHeight: 300, overflowY: 'auto' }}>
          {notifications.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: isLight ? '#64748B' : '#8B5CF6' }}>
                All caught up! No unread notifications.
              </Typography>
            </Box>
          ) : (
            notifications.map((n) => (
              <MenuItem
                key={n.id}
                onClick={() => {
                  handleMarkRead(n.id, n.reference_url);
                  setAnchorEl(null);
                }}
                sx={{
                  p: 1.5,
                  mb: 0.8,
                  borderRadius: '12px',
                  bgcolor: isLight ? 'rgba(241, 245, 249, 0.8)' : 'rgba(255, 255, 255, 0.04)',
                  border: isLight ? '1px solid rgba(0, 0, 0, 0.04)' : '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1.2,
                  whiteSpace: 'normal',
                  '&:hover': {
                    bgcolor: isLight ? 'rgba(139, 92, 246, 0.1)' : 'rgba(168, 85, 247, 0.15)',
                    borderColor: '#8B5CF6',
                  },
                }}
              >
                <AlternateEmailRounded sx={{ color: '#8B5CF6', fontSize: 18, mt: 0.3 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{ fontSize: '0.82rem', fontWeight: 600, color: isLight ? '#0F172A' : '#F1F5F9', lineHeight: 1.35 }}>
                    {n.message}
                  </Typography>
                  <Typography variant="caption" sx={{ color: isLight ? '#64748B' : '#C4B5FD', display: 'block', mt: 0.4 }}>
                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </Box>
                <IconButton size="small" sx={{ color: isLight ? '#64748B' : '#C4B5FD', '&:hover': { color: '#10B981' } }}>
                  <CheckRounded fontSize="small" />
                </IconButton>
              </MenuItem>
            ))
          )}
        </Box>
      </Menu>

      {/* Real-time Slide Toast Alert */}
      <Slide direction="up" in={Boolean(toast)} mountOnEnter unmountOnExit>
        <Paper
          elevation={6}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 9999,
            p: 2,
            borderRadius: '16px',
            bgcolor: isLight ? 'rgba(255, 255, 255, 0.98)' : 'rgba(26, 17, 46, 0.98)',
            backdropFilter: 'blur(20px)',
            border: isLight ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid rgba(168, 85, 247, 0.5)',
            boxShadow: isLight ? '0 10px 30px rgba(139, 92, 246, 0.2)' : '0 10px 30px rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            maxWidth: 380,
          }}
        >
          <Box sx={{ p: 1, borderRadius: '10px', bgcolor: 'rgba(139, 92, 246, 0.15)', color: '#8B5CF6' }}>
            <AlternateEmailRounded />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: isLight ? '#0F172A' : '#F8FAFC' }}>
              Real-Time Push Alert
            </Typography>
            <Typography variant="body2" sx={{ color: isLight ? '#475569' : '#C4B5FD', fontSize: '0.82rem' }}>
              {toast?.message}
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setToast(null)}>
            <CloseRounded fontSize="small" />
          </IconButton>
        </Paper>
      </Slide>
    </>
  );
}
