import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useThemeMode } from '../context/ThemeModeContext';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import { 
  ElectricBoltRounded, 
  ArrowForwardRounded, 
  CodeRounded, 
  AccountTreeRounded, 
  AdminPanelSettingsRounded,
  AutoAwesomeRounded,
  SearchRounded,
  CheckCircleRounded,
  SpeedRounded,
  HubRounded,
  LayersRounded,
  LightModeRounded,
  DarkModeRounded
} from '@mui/icons-material';

export default function LoginPage() {
  const { login, loading } = useAuth();
  const { mode, toggleThemeMode } = useThemeMode();
  const isLight = mode === 'light';

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError('');
    try {
      await login(email.trim());
    } catch (err) {
      console.error('Login error:', err);
      setError(
        err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')
          ? '⚠️ Backend server (Port 8080) is offline. Please start the Go server using "go run cmd/server/main.go".'
          : `Login failed: ${err.message || 'Unknown error'}`
      );
    }
  };

  const handleQuickLogin = async (presetEmail) => {
    setEmail(presetEmail);
    setError('');
    try {
      await login(presetEmail);
    } catch (err) {
      console.error('Login error:', err);
      setError(
        err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')
          ? '⚠️ Backend server (Port 8080) is offline. Please start the Go server using "go run cmd/server/main.go".'
          : `Login failed: ${err.message || 'Unknown error'}`
      );
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: isLight ? '#F8F9FD' : '#0C0718',
        backgroundImage: isLight
          ? `
            radial-gradient(at 0% 0%, rgba(139, 92, 246, 0.15) 0px, transparent 50%),
            radial-gradient(at 100% 0%, rgba(6, 182, 212, 0.15) 0px, transparent 50%),
            radial-gradient(at 50% 50%, rgba(236, 72, 153, 0.09) 0px, transparent 65%),
            radial-gradient(at 80% 100%, rgba(16, 185, 129, 0.12) 0px, transparent 55%)
          `
          : `
            radial-gradient(at 0% 0%, rgba(147, 51, 234, 0.28) 0px, transparent 50%),
            radial-gradient(at 100% 0%, rgba(192, 132, 252, 0.22) 0px, transparent 50%),
            radial-gradient(at 50% 50%, rgba(236, 72, 153, 0.14) 0px, transparent 65%),
            radial-gradient(at 80% 100%, rgba(124, 58, 237, 0.25) 0px, transparent 55%)
          `,
        backgroundAttachment: 'fixed',
        display: 'flex',
        alignItems: 'center',
        py: { xs: 5, md: 8 },
        position: 'relative',
        overflow: 'hidden',
        transition: 'background-color 0.3s ease',
      }}
    >
      {/* Top Floating Theme Switcher */}
      <Box sx={{ position: 'absolute', top: 24, right: 28, zIndex: 10 }}>
        <Tooltip title={isLight ? 'Switch to Dark Theme' : 'Switch to Light Theme'}>
          <IconButton
            onClick={toggleThemeMode}
            sx={{
              width: 44,
              height: 44,
              borderRadius: '14px',
              bgcolor: isLight ? 'rgba(255, 255, 255, 0.9)' : 'rgba(26, 17, 46, 0.9)',
              border: isLight ? '1px solid rgba(139, 92, 246, 0.25)' : '1px solid rgba(168, 85, 247, 0.35)',
              boxShadow: isLight ? '0 4px 15px rgba(139, 92, 246, 0.15)' : '0 4px 15px rgba(0, 0, 0, 0.5)',
              transition: 'all 0.25s ease',
              '&:hover': { transform: 'scale(1.08)' },
            }}
          >
            {isLight ? <DarkModeRounded sx={{ color: '#7C3AED', fontSize: 22 }} /> : <LightModeRounded sx={{ color: '#FBBF24', fontSize: 22 }} />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Dynamic Animated Ambient Orbs */}
      <Box
        sx={{
          position: 'absolute',
          width: 550,
          height: 550,
          borderRadius: '50%',
          background: isLight 
            ? 'radial-gradient(circle, rgba(139, 92, 246, 0.18) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(147, 51, 234, 0.25) 0%, transparent 70%)',
          top: '-150px',
          left: '-100px',
          filter: 'blur(70px)',
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: isLight 
            ? 'radial-gradient(circle, rgba(6, 182, 212, 0.16) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(6, 182, 212, 0.2) 0%, transparent 70%)',
          bottom: '-120px',
          right: '-80px',
          filter: 'blur(70px)',
          pointerEvents: 'none',
        }}
      />

      <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '1.15fr 0.85fr' },
            gap: { xs: 5, lg: 8 },
            alignItems: 'center',
          }}
        >
          
          {/* ================= LEFT COLUMN: APPGLIDE VALUE & LIVE SHOWCASE ================= */}
          <Box sx={{ pr: { lg: 3 } }}>
            
            {/* Brand Logo & Tag */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.8, mb: 2.5 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 50%, #3B82F6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 25px rgba(139, 92, 246, 0.55)',
                }}
              >
                <ElectricBoltRounded sx={{ color: '#FFFFFF', fontSize: 28 }} />
              </Box>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontFamily: "'Outfit', sans-serif",
                  fontWeight: 900, 
                  color: isLight ? '#0F172A' : '#FFFFFF', 
                  letterSpacing: '-0.03em' 
                }}
              >
                AppGlide
              </Typography>
            </Box>

            {/* Pill Tag */}
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                py: 0.8,
                px: 2,
                borderRadius: '50px',
                background: isLight 
                  ? 'linear-gradient(90deg, rgba(139, 92, 246, 0.12) 0%, rgba(6, 182, 212, 0.12) 100%)'
                  : 'linear-gradient(90deg, rgba(139, 92, 246, 0.2) 0%, rgba(6, 182, 212, 0.15) 100%)',
                border: isLight ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid rgba(168, 85, 247, 0.4)',
                color: isLight ? '#7C3AED' : '#C4B5FD',
                mb: 3,
              }}
            >
              <AutoAwesomeRounded sx={{ fontSize: 16, color: isLight ? '#0284C7' : '#22D3EE' }} />
              <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: '0.05em', fontSize: '0.78rem', fontFamily: "'Outfit', sans-serif" }}>
                NEXT-GEN AI TASK & WORKFLOW ORCHESTRATION
              </Typography>
            </Box>

            {/* Main Catchy Headline */}
            <Typography
              variant="h2"
              sx={{
                fontFamily: "'Outfit', sans-serif",
                fontWeight: 900,
                fontSize: { xs: '2.5rem', sm: '3.4rem', md: '4rem' },
                lineHeight: 1.1,
                letterSpacing: '-0.04em',
                color: isLight ? '#0F172A' : '#FFFFFF',
                mb: 2.5,
              }}
            >
              Orchestrate Tasks at the{' '}
              <Box
                component="span"
                sx={{
                  background: 'linear-gradient(90deg, #8B5CF6 0%, #EC4899 50%, #06B6D4 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  display: 'inline-block',
                }}
              >
                Speed of Thought
              </Box>
            </Typography>

            <Typography
              variant="body1"
              sx={{
                fontSize: { xs: '1rem', md: '1.15rem' },
                color: isLight ? '#475569' : '#C4B5FD',
                lineHeight: 1.7,
                mb: 4,
                maxWidth: 600,
              }}
            >
              Supercharge engineering workflows with automated LLM subtask breakdown, ChromaDB vector duplicate triage, and real-time team collaboration.
            </Typography>

            {/* 3 Colorful Live Feature Cards */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 4.5 }}>
              
              {/* Feature 1: AI Decomposition */}
              <Box
                sx={{
                  p: 2.4,
                  borderRadius: '16px',
                  bgcolor: isLight ? 'rgba(255, 255, 255, 0.85)' : 'rgba(26, 17, 46, 0.85)',
                  backdropFilter: 'blur(16px)',
                  border: isLight ? '1px solid rgba(139, 92, 246, 0.2)' : '1px solid rgba(168, 85, 247, 0.35)',
                  boxShadow: isLight ? '0 4px 20px rgba(139, 92, 246, 0.08)' : '0 8px 30px rgba(0, 0, 0, 0.4)',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-3px)', borderColor: '#8B5CF6' },
                }}
              >
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '10px',
                    bgcolor: isLight ? 'rgba(139, 92, 246, 0.12)' : 'rgba(139, 92, 246, 0.25)',
                    color: isLight ? '#7C3AED' : '#C084FC',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 1.5,
                  }}
                >
                  <AutoAwesomeRounded fontSize="small" />
                </Box>
                <Typography variant="subtitle2" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: isLight ? '#0F172A' : '#FFFFFF', mb: 0.4 }}>
                  AI Decomposition
                </Typography>
                <Typography variant="caption" sx={{ color: isLight ? '#64748B' : '#C4B5FD', lineHeight: 1.4, display: 'block' }}>
                  Auto-break high-level goals into technical sub-tasks with estimated hours.
                </Typography>
              </Box>

              {/* Feature 2: Vector Duplicate Triage */}
              <Box
                sx={{
                  p: 2.4,
                  borderRadius: '16px',
                  bgcolor: isLight ? 'rgba(255, 255, 255, 0.85)' : 'rgba(26, 17, 46, 0.85)',
                  backdropFilter: 'blur(16px)',
                  border: isLight ? '1px solid rgba(6, 182, 212, 0.2)' : '1px solid rgba(6, 182, 212, 0.35)',
                  boxShadow: isLight ? '0 4px 20px rgba(6, 182, 212, 0.08)' : '0 8px 30px rgba(0, 0, 0, 0.4)',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-3px)', borderColor: '#06B6D4' },
                }}
              >
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '10px',
                    bgcolor: isLight ? 'rgba(6, 182, 212, 0.12)' : 'rgba(6, 182, 212, 0.25)',
                    color: isLight ? '#0284C7' : '#22D3EE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 1.5,
                  }}
                >
                  <SearchRounded fontSize="small" />
                </Box>
                <Typography variant="subtitle2" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: isLight ? '#0F172A' : '#FFFFFF', mb: 0.4 }}>
                  3-Tier Vector Search
                </Typography>
                <Typography variant="caption" sx={{ color: isLight ? '#64748B' : '#C4B5FD', lineHeight: 1.4, display: 'block' }}>
                  Exact, Fuzzy, & BGE Semantic Embeddings detect duplicate issues live.
                </Typography>
              </Box>

              {/* Feature 3: Team Collaboration */}
              <Box
                sx={{
                  p: 2.4,
                  borderRadius: '16px',
                  bgcolor: isLight ? 'rgba(255, 255, 255, 0.85)' : 'rgba(26, 17, 46, 0.85)',
                  backdropFilter: 'blur(16px)',
                  border: isLight ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(16, 185, 129, 0.35)',
                  boxShadow: isLight ? '0 4px 20px rgba(16, 185, 129, 0.08)' : '0 8px 30px rgba(0, 0, 0, 0.4)',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-3px)', borderColor: '#10B981' },
                }}
              >
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '10px',
                    bgcolor: isLight ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.25)',
                    color: isLight ? '#059669' : '#34D399',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 1.5,
                  }}
                >
                  <HubRounded fontSize="small" />
                </Box>
                <Typography variant="subtitle2" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: isLight ? '#0F172A' : '#FFFFFF', mb: 0.4 }}>
                  WebSocket Alerts
                </Typography>
                <Typography variant="caption" sx={{ color: isLight ? '#64748B' : '#C4B5FD', lineHeight: 1.4, display: 'block' }}>
                  Instant @mention push notifications and MS Teams channel webhooks.
                </Typography>
              </Box>

            </Box>

            {/* Architecture Pills Footer */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
              <Chip
                icon={<SpeedRounded sx={{ fontSize: 16 }} />}
                label="Go 1.26 High Throughput Backend"
                size="small"
                sx={{ 
                  bgcolor: isLight ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.05)', 
                  color: isLight ? '#475569' : '#CBD5E1', 
                  border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255, 255, 255, 0.1)', 
                  fontWeight: 700 
                }}
              />
              <Chip
                icon={<LayersRounded sx={{ fontSize: 16 }} />}
                label="ChromaDB Local Vector DB"
                size="small"
                sx={{ 
                  bgcolor: isLight ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.05)', 
                  color: isLight ? '#475569' : '#CBD5E1', 
                  border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255, 255, 255, 0.1)', 
                  fontWeight: 700 
                }}
              />
              <Chip
                icon={<CheckCircleRounded sx={{ fontSize: 16 }} />}
                label="Zero-Config SQLite / PostgreSQL"
                size="small"
                sx={{ 
                  bgcolor: isLight ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.05)', 
                  color: isLight ? '#475569' : '#CBD5E1', 
                  border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255, 255, 255, 0.1)', 
                  fontWeight: 700 
                }}
              />
            </Box>

          </Box>

          {/* ================= RIGHT COLUMN: COLORFUL HIGH-GLOSS LOGIN CARD ================= */}
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Card
              sx={{
                width: '100%',
                maxWidth: 460,
                p: { xs: 3.5, sm: 4.5 },
                borderRadius: '24px',
                background: isLight 
                  ? 'linear-gradient(165deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 255, 0.95) 100%)' 
                  : 'linear-gradient(165deg, rgba(26, 17, 46, 0.95) 0%, rgba(15, 9, 28, 0.98) 100%)',
                backdropFilter: 'blur(28px)',
                border: isLight ? '1px solid rgba(139, 92, 246, 0.25)' : '1px solid rgba(168, 85, 247, 0.35)',
                boxShadow: isLight 
                  ? '0 20px 60px rgba(139, 92, 246, 0.12), 0 4px 16px rgba(0, 0, 0, 0.04)' 
                  : '0 30px 80px -15px rgba(0, 0, 0, 0.9), 0 0 50px rgba(168, 85, 247, 0.25)',
                position: 'relative',
              }}
            >
              {/* Top Card Badge */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ElectricBoltRounded sx={{ color: '#FFFFFF', fontSize: 16 }} />
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: isLight ? '#0F172A' : '#FFFFFF' }}>
                    AppGlide
                  </Typography>
                </Box>

                <Chip
                  label="v2.0 Active"
                  size="small"
                  sx={{
                    bgcolor: 'rgba(16, 185, 129, 0.12)',
                    color: isLight ? '#059669' : '#34D399',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    fontWeight: 800,
                    fontSize: '0.7rem',
                    fontFamily: "'Outfit', sans-serif",
                  }}
                />
              </Box>

              <Typography variant="h5" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, color: isLight ? '#0F172A' : '#F8FAFC', mb: 0.8 }}>
                Sign In to Workspace
              </Typography>
              <Typography variant="body2" sx={{ color: isLight ? '#64748B' : '#C4B5FD', fontSize: '0.85rem', mb: 2.5 }}>
                Enter your work email or click any 1-click role preset below.
              </Typography>

              {error && (
                <Alert
                  severity="error"
                  onClose={() => setError('')}
                  sx={{
                    mb: 2.5,
                    textAlign: 'left',
                    borderRadius: '12px',
                    bgcolor: 'rgba(244, 63, 94, 0.12)',
                    border: '1px solid rgba(244, 63, 94, 0.35)',
                    color: isLight ? '#E11D48' : '#FB7185',
                    fontSize: '0.82rem',
                    '& .MuiAlert-icon': { color: '#F43F5E' },
                  }}
                >
                  {error}
                </Alert>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: isLight ? '#475569' : '#C4B5FD', display: 'block', mb: 0.8, letterSpacing: '0.04em' }}>
                    WORK EMAIL
                  </Typography>
                  <TextField
                    fullWidth
                    type="email"
                    placeholder="e.g. dev@smartops.io"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    size="small"
                  />
                </Box>

                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  endIcon={loading ? <CircularProgress size={18} color="inherit" /> : <ArrowForwardRounded />}
                  sx={{
                    py: 1.3,
                    fontSize: '0.98rem',
                    fontWeight: 800,
                    fontFamily: "'Outfit', sans-serif",
                    borderRadius: '12px',
                    background: 'linear-gradient(90deg, #8B5CF6 0%, #EC4899 100%)',
                    boxShadow: isLight ? '0 6px 20px rgba(139, 92, 246, 0.35)' : '0 6px 25px rgba(168, 85, 247, 0.45)',
                    transition: 'all 0.25s ease',
                    '&:hover': {
                      background: 'linear-gradient(90deg, #7C3AED 0%, #DB2777 100%)',
                      boxShadow: '0 8px 30px rgba(236, 72, 153, 0.6)',
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  {loading ? 'Authenticating...' : 'Enter AppGlide Workspace →'}
                </Button>
              </form>

              {/* Quick Role Presets Header */}
              <Box sx={{ position: 'relative', my: 3, textAlign: 'center' }}>
                <Box sx={{ borderBottom: isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.08)' }} />
                <Typography
                  variant="caption"
                  sx={{
                    position: 'absolute',
                    top: '-9px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    bgcolor: isLight ? '#FFFFFF' : 'rgba(26, 17, 46, 0.95)',
                    px: 1.5,
                    color: isLight ? '#64748B' : '#C4B5FD',
                    fontWeight: 800,
                    fontSize: '0.68rem',
                    letterSpacing: '0.06em',
                    fontFamily: "'Outfit', sans-serif",
                  }}
                >
                  1-CLICK ROLE PRESETS
                </Typography>
              </Box>

              {/* 3 Vibrant 1-Click Role Cards */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
                
                {/* Developer Preset */}
                <Box
                  onClick={() => handleQuickLogin('dev@smartops.io')}
                  sx={{
                    p: 1.5,
                    borderRadius: '12px',
                    bgcolor: isLight ? 'rgba(6, 182, 212, 0.06)' : 'rgba(6, 182, 212, 0.08)',
                    border: isLight ? '1px solid rgba(6, 182, 212, 0.25)' : '1px solid rgba(6, 182, 212, 0.3)',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: isLight ? 'rgba(6, 182, 212, 0.12)' : 'rgba(6, 182, 212, 0.18)',
                      borderColor: '#06B6D4',
                      transform: 'translateX(4px)',
                      boxShadow: '0 4px 18px rgba(6, 182, 212, 0.2)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '10px',
                        bgcolor: 'rgba(6, 182, 212, 0.15)',
                        color: isLight ? '#0284C7' : '#22D3EE',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CodeRounded fontSize="small" />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, color: isLight ? '#0F172A' : '#F8FAFC', lineHeight: 1.2 }}>
                        Lead Developer
                      </Typography>
                      <Typography variant="caption" sx={{ color: isLight ? '#64748B' : '#C4B5FD' }}>
                        dev@smartops.io
                      </Typography>
                    </Box>
                  </Box>
                  <Chip label="Developer" size="small" sx={{ bgcolor: 'rgba(6, 182, 212, 0.15)', color: isLight ? '#0284C7' : '#22D3EE', fontWeight: 800 }} />
                </Box>

                {/* Manager Preset */}
                <Box
                  onClick={() => handleQuickLogin('manager@smartops.io')}
                  sx={{
                    p: 1.5,
                    borderRadius: '12px',
                    bgcolor: isLight ? 'rgba(245, 158, 11, 0.06)' : 'rgba(245, 158, 11, 0.08)',
                    border: isLight ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid rgba(245, 158, 11, 0.3)',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: isLight ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.18)',
                      borderColor: '#F59E0B',
                      transform: 'translateX(4px)',
                      boxShadow: '0 4px 18px rgba(245, 158, 11, 0.2)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '10px',
                        bgcolor: 'rgba(245, 158, 11, 0.15)',
                        color: isLight ? '#D97706' : '#FBBF24',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <AccountTreeRounded fontSize="small" />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, color: isLight ? '#0F172A' : '#F8FAFC', lineHeight: 1.2 }}>
                        Engineering Manager
                      </Typography>
                      <Typography variant="caption" sx={{ color: isLight ? '#64748B' : '#C4B5FD' }}>
                        manager@smartops.io
                      </Typography>
                    </Box>
                  </Box>
                  <Chip label="Manager" size="small" sx={{ bgcolor: 'rgba(245, 158, 11, 0.15)', color: isLight ? '#D97706' : '#FBBF24', fontWeight: 800 }} />
                </Box>

                {/* Admin Preset */}
                <Box
                  onClick={() => handleQuickLogin('admin@smartops.io')}
                  sx={{
                    p: 1.5,
                    borderRadius: '12px',
                    bgcolor: isLight ? 'rgba(16, 185, 129, 0.06)' : 'rgba(16, 185, 129, 0.08)',
                    border: isLight ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(16, 185, 129, 0.3)',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: isLight ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.18)',
                      borderColor: '#10B981',
                      transform: 'translateX(4px)',
                      boxShadow: '0 4px 18px rgba(16, 185, 129, 0.2)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '10px',
                        bgcolor: 'rgba(16, 185, 129, 0.15)',
                        color: isLight ? '#059669' : '#34D399',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <AdminPanelSettingsRounded fontSize="small" />
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, color: isLight ? '#0F172A' : '#F8FAFC', lineHeight: 1.2 }}>
                        Workspace Admin
                      </Typography>
                      <Typography variant="caption" sx={{ color: isLight ? '#64748B' : '#C4B5FD' }}>
                        admin@smartops.io
                      </Typography>
                    </Box>
                  </Box>
                  <Chip label="Admin" size="small" sx={{ bgcolor: 'rgba(16, 185, 129, 0.15)', color: isLight ? '#059669' : '#34D399', fontWeight: 800 }} />
                </Box>

              </Box>

            </Card>
          </Box>

        </Box>
      </Container>
    </Box>
  );
}
