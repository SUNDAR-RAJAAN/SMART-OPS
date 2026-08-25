import { createTheme } from '@mui/material/styles';

export const getAppGlideTheme = (mode = 'light') => {
  const isLight = mode === 'light';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: '#8B5CF6', // Radiant Violet / Purple
        light: '#A78BFA',
        dark: '#6D28D9',
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: '#EC4899', // Pink / Fuchsia
        light: '#F472B6',
        dark: '#BE185D',
        contrastText: '#FFFFFF',
      },
      success: {
        main: '#10B981', // Emerald Mint
        light: '#34D399',
        dark: '#059669',
        contrastText: '#FFFFFF',
      },
      warning: {
        main: '#F59E0B', // Warm Amber
        light: '#FBBF24',
        dark: '#D97706',
        contrastText: '#1E1E2F',
      },
      error: {
        main: '#F43F5E', // Rose Coral
        light: '#FB7185',
        dark: '#E11D48',
        contrastText: '#FFFFFF',
      },
      info: {
        main: '#06B6D4', // Cyber Cyan
        light: '#22D3EE',
        dark: '#0891B2',
        contrastText: '#FFFFFF',
      },
      background: {
        default: isLight ? '#F8F9FD' : '#0C0718',
        paper: isLight ? '#FFFFFF' : '#170E2A',
      },
      text: {
        primary: isLight ? '#0F172A' : '#F8FAFC',
        secondary: isLight ? '#64748B' : '#C4B5FD',
        disabled: isLight ? '#94A3B8' : '#7E6B9E',
      },
      divider: isLight ? 'rgba(139, 92, 246, 0.12)' : 'rgba(168, 85, 247, 0.18)',
    },
    typography: {
      fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
      h1: { fontFamily: "'Outfit', sans-serif", fontWeight: 900, letterSpacing: '-0.035em' },
      h2: { fontFamily: "'Outfit', sans-serif", fontWeight: 850, letterSpacing: '-0.03em' },
      h3: { fontFamily: "'Outfit', sans-serif", fontWeight: 800, letterSpacing: '-0.025em' },
      h4: { fontFamily: "'Outfit', sans-serif", fontWeight: 800, letterSpacing: '-0.02em' },
      h5: { fontFamily: "'Outfit', sans-serif", fontWeight: 750, letterSpacing: '-0.015em' },
      h6: { fontFamily: "'Outfit', sans-serif", fontWeight: 700, letterSpacing: '-0.01em' },
      subtitle1: { fontWeight: 600, letterSpacing: '0.01em' },
      subtitle2: { fontWeight: 700, letterSpacing: '0.01em' },
      body1: { fontSize: '0.92rem', lineHeight: 1.6 },
      body2: { fontSize: '0.84rem', lineHeight: 1.5 },
      button: { textTransform: 'none', fontWeight: 700, letterSpacing: '0.01em' },
    },
    shape: {
      borderRadius: 14,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: isLight ? '#F8F9FD' : '#0C0718',
            color: isLight ? '#0F172A' : '#F8FAFC',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            background: isLight 
              ? 'linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 255, 0.9) 100%)'
              : 'linear-gradient(145deg, rgba(26, 17, 46, 0.9) 0%, rgba(17, 10, 32, 0.95) 100%)',
            backdropFilter: 'blur(20px)',
            border: isLight ? '1px solid rgba(139, 92, 246, 0.15)' : '1px solid rgba(168, 85, 247, 0.2)',
            borderRadius: 16,
            boxShadow: isLight
              ? '0 10px 30px rgba(99, 102, 241, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)'
              : '0 10px 35px 0 rgba(0, 0, 0, 0.55), 0 0 25px rgba(168, 85, 247, 0.1)',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            padding: '8px 20px',
            fontWeight: 700,
            transition: 'all 0.22s ease-in-out',
          },
          containedPrimary: {
            background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
            boxShadow: isLight 
              ? '0 4px 18px 0 rgba(139, 92, 246, 0.35)' 
              : '0 4px 18px 0 rgba(168, 85, 247, 0.45)',
            '&:hover': {
              background: 'linear-gradient(135deg, #7C3AED 0%, #DB2777 100%)',
              boxShadow: isLight
                ? '0 8px 25px 0 rgba(236, 72, 153, 0.45)'
                : '0 8px 26px 0 rgba(236, 72, 153, 0.65)',
              transform: 'translateY(-2px)',
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 700,
            borderRadius: 10,
            fontSize: '0.74rem',
          },
        },
      },
    },
  });
};
