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
    background: '#FAFAFA',
    surface: '#FFFFFF',
    surfaceSecondary: '#F5F5F5',
    border: '#E5E5E5',
    textPrimary: '#171717',
    textSecondary: '#737373',
    accent: '#2F6FED',
    accentGradient: '#2F6FED',
    accentText: '#FFFFFF',
    positive: '#16A34A',
    negative: '#E11D48',
  },
  dark: {
    background: '#0A0A0A',
    surface: '#171717',
    surfaceSecondary: '#262626',
    border: '#404040',
    textPrimary: '#FAFAFA',
    textSecondary: '#A3A3A3',
    accent: '#C6FF3D',
    accentGradient: '#C6FF3D',
    accentText: '#171717',
    positive: '#34D399',
    negative: '#FB7185',
  },
};

export const getThemePalette = (isDark: boolean): ThemePalette => {
  return isDark ? THEME_COLORS.dark : THEME_COLORS.light;
};
