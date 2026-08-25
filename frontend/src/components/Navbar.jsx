import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useThemeMode } from '../context/ThemeModeContext';
import NotificationBell from './NotificationBell';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import { 
  AssignmentIndRounded, 
  AccountTreeRounded, 
  InsightsRounded, 
  AdminPanelSettingsRounded, 
  SearchRounded, 
  AddRounded, 
  LogoutRounded,
  ElectricBoltRounded,
  LightModeRounded,
  DarkModeRounded
} from '@mui/icons-material';

export default function Navbar({ activeTab, setActiveTab, onOpenCommandPalette, onOpenSearch, onSelectTaskID }) {
  const { user, logout, switchRole } = useAuth();
  const { mode, toggleThemeMode } = useThemeMode();
  const isLight = mode === 'light';

  const handleRoleChange = async (e) => {
    const roleEmailMap = {
      admin: 'admin@smartops.io',
      manager: 'manager@smartops.io',
      employee: 'dev@smartops.io',
    };
    const targetEmail = roleEmailMap[e.target.value];
    if (targetEmail) {
      await switchRole(targetEmail);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return '#10B981'; // Emerald
      case 'manager': return '#F59E0B'; // Amber
      default: return '#8B5CF6'; // Violet/Purple
    }
  };

  const navItems = [
    { key: 'my-tasks', label: 'My Tasks', icon: AssignmentIndRounded, color: '#8B5CF6' },
    { key: 'team-board', label: 'Team Board', icon: AccountTreeRounded, color: '#06B6D4' },
    { key: 'analytics', label: 'Analytics', icon: InsightsRounded, color: '#EC4899' },
    { key: 'workspace-settings', label: 'Workspace', icon: AdminPanelSettingsRounded, color: '#10B981' },
  ];

  return (
    <AppBar 
      position="sticky" 
      elevation={0}
      sx={{
        bgcolor: isLight ? 'rgba(255, 255, 255, 0.85)' : 'rgba(12, 7, 24, 0.88)',
        backdropFilter: 'blur(24px)',
        borderBottom: isLight ? '1px solid rgba(139, 92, 246, 0.15)' : '1px solid rgba(168, 85, 247, 0.2)',
        boxShadow: isLight ? '0 4px 25px rgba(99, 102, 241, 0.06)' : '0 8px 30px rgba(0, 0, 0, 0.5)',
        transition: 'background-color 0.3s ease, border-color 0.3s ease',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, md: 3.5 }, minHeight: '70px' }}>
        
        {/* Brand Logo & Navigation Pills */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 2, md: 3.5 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, cursor: 'pointer' }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #3B82F6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(139, 92, 246, 0.5)',
              }}
            >
              <ElectricBoltRounded sx={{ color: '#FFFFFF', fontSize: 24 }} />
            </Box>
            <Typography
              variant="h5"
              sx={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 900,
                background: isLight 
                  ? 'linear-gradient(90deg, #6D28D9 0%, #DB2777 100%)' 
                  : 'linear-gradient(90deg, #FFFFFF 0%, #E9D5FF 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: { xs: 'none', sm: 'block' },
                letterSpacing: '-0.03em',
              }}
            >
              AppGlide
            </Typography>
          </Box>

          {/* Glowing Tab Pills */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.key;

              return (
                <Button
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  startIcon={<Icon sx={{ fontSize: 18, color: isActive ? (isLight ? '#FFFFFF' : '#FFFFFF') : item.color }} />}
                  sx={{
                    px: 1.8,
                    py: 0.9,
                    borderRadius: '12px',
                    fontSize: '0.86rem',
                    fontWeight: 700,
                    fontFamily: "'Outfit', sans-serif",
                    color: isActive 
                      ? '#FFFFFF' 
                      : (isLight ? '#475569' : '#C4B5FD'),
                    background: isActive 
                      ? (isLight 
                          ? `linear-gradient(135deg, ${item.color} 0%, ${item.color}DD 100%)` 
                          : `linear-gradient(135deg, ${item.color}45 0%, rgba(26, 17, 46, 0.95) 100%)`) 
                      : 'transparent',
                    border: isActive 
                      ? (isLight ? '1px solid transparent' : `1px solid ${item.color}80`) 
                      : '1px solid transparent',
                    boxShadow: isActive ? `0 4px 18px ${item.color}40` : 'none',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      color: isLight ? item.color : '#F8FAFC',
                      bgcolor: `${item.color}15`,
                    },
                  }}
                >
                  {item.label}
                </Button>
              );
            })}
          </Box>
        </Box>

        {/* Right Section: Search, New Task, Theme Toggle, Notifications & User */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          
          {/* Search Trigger Input */}
          <Button
            variant="outlined"
            onClick={onOpenSearch}
            startIcon={<SearchRounded sx={{ color: isLight ? '#8B5CF6' : '#C084FC' }} />}
            endIcon={
              <Chip
                label="⌘K"
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  bgcolor: isLight ? 'rgba(139, 92, 246, 0.1)' : 'rgba(168, 85, 247, 0.15)',
                  color: isLight ? '#7C3AED' : '#D8B4FE',
                  borderRadius: '6px',
                }}
              />
            }
            sx={{
              color: isLight ? '#475569' : '#C4B5FD',
              bgcolor: isLight ? 'rgba(241, 245, 249, 0.85)' : 'rgba(22, 14, 40, 0.8)',
              borderColor: isLight ? 'rgba(139, 92, 246, 0.2)' : 'rgba(168, 85, 247, 0.25)',
              borderRadius: '12px',
              py: 0.8,
              px: 1.8,
              display: { xs: 'none', md: 'inline-flex' },
              '&:hover': {
                borderColor: '#8B5CF6',
                bgcolor: isLight ? 'rgba(139, 92, 246, 0.08)' : 'rgba(168, 85, 247, 0.18)',
                color: isLight ? '#0F172A' : '#F8FAFC',
                boxShadow: '0 0 14px rgba(139, 92, 246, 0.25)',
              },
            }}
          >
            Search tasks...
          </Button>

          {/* Quick Create Task with Purple-Pink Gradient */}
          <Button
            variant="contained"
            onClick={onOpenCommandPalette}
            startIcon={<AddRounded />}
            sx={{
              borderRadius: '12px',
              py: 0.9,
              px: 2.2,
              fontWeight: 800,
              fontSize: '0.88rem',
              background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
              boxShadow: '0 4px 18px rgba(139, 92, 246, 0.4)',
              '&:hover': {
                background: 'linear-gradient(135deg, #7C3AED 0%, #DB2777 100%)',
                boxShadow: '0 8px 26px rgba(236, 72, 153, 0.6)',
                transform: 'translateY(-2px)',
              },
            }}
          >
            New Task
          </Button>

          {/* Theme Mode Toggle Button (Sun / Moon) */}
          <Tooltip title={isLight ? 'Switch to Dark Theme' : 'Switch to Light Theme'}>
            <IconButton
              onClick={toggleThemeMode}
              sx={{
                width: 40,
                height: 40,
                borderRadius: '12px',
                bgcolor: isLight ? 'rgba(139, 92, 246, 0.1)' : 'rgba(168, 85, 247, 0.18)',
                border: isLight ? '1px solid rgba(139, 92, 246, 0.25)' : '1px solid rgba(168, 85, 247, 0.35)',
                color: isLight ? '#F59E0B' : '#FBBF24',
                boxShadow: isLight ? '0 2px 10px rgba(245, 158, 11, 0.2)' : '0 0 15px rgba(251, 191, 36, 0.3)',
                transition: 'all 0.25s ease',
                '&:hover': {
                  transform: 'rotate(15deg) scale(1.06)',
                  bgcolor: isLight ? 'rgba(139, 92, 246, 0.18)' : 'rgba(168, 85, 247, 0.3)',
                },
              }}
            >
              {isLight ? <DarkModeRounded sx={{ color: '#7C3AED', fontSize: 20 }} /> : <LightModeRounded sx={{ color: '#FBBF24', fontSize: 20 }} />}
            </IconButton>
          </Tooltip>

          {/* Notification Bell */}
          <NotificationBell onSelectTaskID={onSelectTaskID} />

          {/* Role Switcher & Profile */}
          {user && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.2,
                pl: 1.5,
                borderLeft: isLight ? '1px solid rgba(139, 92, 246, 0.15)' : '1px solid rgba(168, 85, 247, 0.2)',
              }}
            >
              <Select
                value={user.role}
                onChange={handleRoleChange}
                size="small"
                sx={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  bgcolor: isLight ? 'rgba(241, 245, 249, 0.9)' : 'rgba(22, 14, 40, 0.85)',
                  borderRadius: '10px',
                  border: isLight ? '1px solid rgba(139, 92, 246, 0.2)' : '1px solid rgba(168, 85, 247, 0.25)',
                  color: isLight ? '#0F172A' : '#F8FAFC',
                  '& .MuiSelect-select': { py: 0.7, px: 1.4 },
                }}
              >
                <MenuItem value="employee" sx={{ color: '#8B5CF6', fontWeight: 700 }}>Role: Employee</MenuItem>
                <MenuItem value="manager" sx={{ color: '#F59E0B', fontWeight: 700 }}>Role: Manager</MenuItem>
                <MenuItem value="admin" sx={{ color: '#10B981', fontWeight: 700 }}>Role: Admin</MenuItem>
              </Select>

              <Tooltip title={user.email}>
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: getRoleColor(user.role),
                    fontSize: '0.88rem',
                    fontWeight: 900,
                    color: '#FFFFFF',
                    boxShadow: `0 0 16px ${getRoleColor(user.role)}80`,
                  }}
                >
                  {user.email[0].toUpperCase()}
                </Avatar>
              </Tooltip>

              <Tooltip title="Logout">
                <IconButton onClick={logout} size="small" sx={{ color: isLight ? '#64748B' : '#C4B5FD', '&:hover': { color: '#F43F5E' } }}>
                  <LogoutRounded fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Box>

      </Toolbar>
    </AppBar>
  );
}
