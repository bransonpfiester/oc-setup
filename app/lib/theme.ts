import { Dimensions, Platform } from 'react-native';

export const colors = {
  bg: '#09090e',
  bgCard: '#111118',
  bgElevated: '#191924',
  border: '#262636',
  text: '#ededf4',
  textDim: '#7c7c96',
  accent: '#f87171',
  accentDim: '#ef4444',
  accentGlow: 'rgba(248, 113, 113, 0.15)',
  cyan: '#67e8f9',
  yellow: '#fde68a',
  red: '#fca5a5',
  green: '#4ade80',
  purple: '#c084fc',
  orange: '#fb923c',
  pink: '#f472b6',
  blue: '#60a5fa',
  teal: '#2dd4bf',
  indigo: '#818cf8',
};

export const chartColors = [
  colors.accent,
  colors.cyan,
  colors.yellow,
  colors.green,
  colors.purple,
  colors.orange,
  colors.pink,
  colors.blue,
  colors.teal,
  colors.indigo,
];

export const fonts = {
  sans: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    web: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    default: 'System',
  }) as string,
  mono: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    web: "'JetBrains Mono', 'Fira Code', monospace",
    default: 'monospace',
  }) as string,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
};

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  hero: 40,
};

export function isTablet(): boolean {
  const { width } = Dimensions.get('window');
  return width >= 768;
}

export function isDesktop(): boolean {
  if (Platform.OS === 'web') {
    return Dimensions.get('window').width >= 1024;
  }
  return false;
}
