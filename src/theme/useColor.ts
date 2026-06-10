import { AppColors, Colors } from './color';
import { useThemeStore } from './useThemeStore';

export function useColors(): AppColors {
  const isDark = useThemeStore((s) => s.isDark);
  return Colors[isDark ? 'dark' : 'light'];
}