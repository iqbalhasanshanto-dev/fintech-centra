export interface ThemePalette {
  background: string;
  surface: string;
  surfaceSecondary: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  accentGradient: string;
  accentText: string;
  positive: string;
  negative: string;
}

export const THEME_COLORS: { light: ThemePalette; dark: ThemePalette } = {
  light: {
    background: '#F7F8FA',
    surface: '#FFFFFF',
    surfaceSecondary: '#F1F2F4',
    border: 'rgba(0, 0, 0, 0.06)',
    textPrimary: '#18212F',
    textSecondary: '#667085',
    accent: '#C6FF3D',
    accentGradient: '#C6FF3D',
    accentText: '#0A0E1A',
    positive: '#16A34A',
    negative: '#E11D48',
  },
  dark: {
    background: '#000000',
    surface: '#1D1D1D',
    surfaceSecondary: '#262626',
    border: 'rgba(255, 255, 255, 0.08)',
    textPrimary: '#FFFFFF',
    textSecondary: '#9CA3AF',
    accent: '#C6FF3D',
    accentGradient: '#C6FF3D',
    accentText: '#0A0E1A',
    positive: '#22C55E',
    negative: '#F43F5E',
  },
};

export const getThemePalette = (isDark: boolean): ThemePalette => {
  return isDark ? THEME_COLORS.dark : THEME_COLORS.light;
};
