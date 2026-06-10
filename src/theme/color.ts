// theme/colors.ts

const palette = {
  // Brand
  green:      '#00FF87',
  greenDim:   '#00FF8712',
  greenBorder:'#00FF8730',
  red:        '#FF3B30',
  redDim:     '#FF3B3012',
  redBorder:  '#FF3B3030',
  blue:       '#0A84FF',
  yellow:     '#FFD60A',

  // Neutrals
  white:      '#FFF',
  black:      '#000000',
} as const;

export type ColorScheme = 'light' | 'dark';

export interface AppColors {
  // Backgrounds
  background:        string;
  backgroundCard:    string;
  backgroundElevated:string;
  backgroundOverlay: string;

  // Text
  textPrimary:       string;
  textSecondary:     string;
  textMuted:         string;

  // Brand accents (same across both modes)
  accentGreen:       string;
  accentGreenDim:    string;
  accentGreenBorder: string;
  accentRed:         string;
  accentRedDim:      string;
  accentRedBorder:   string;
  accentBlue:        string;
  accentYellow:      string;

  // UI chrome
  border:            string;
  borderStrong:      string;
  shimmer:           string;
  tabBarBg:          string;
  tabBarBorder:      string;
  tabIconActive:     string;
  tabIconInactive:   string;
}

const dark: AppColors = {
  background:         '#0A0A0A',
  backgroundCard:     '#111111',
  backgroundElevated: '#1A1A1A',
  backgroundOverlay:  'rgba(255,255,255,0.04)',

  textPrimary:        palette.white,   // #FCFCFC
  textSecondary:      '#A0A0A0',
  textMuted:          '#505050',

  accentGreen:        palette.green,
  accentGreenDim:     palette.greenDim,
  accentGreenBorder:  palette.greenBorder,
  accentRed:          palette.red,
  accentRedDim:       palette.redDim,
  accentRedBorder:    palette.redBorder,
  accentBlue:         palette.blue,
  accentYellow:       palette.yellow,

  border:             'rgba(255,255,255,0.06)',
  borderStrong:       'rgba(255,255,255,0.12)',
  shimmer:            'rgba(255,255,255,0.10)',
  tabBarBg:           '#0D0D0D',
  tabBarBorder:       'rgba(255,255,255,0.08)',
  tabIconActive:      palette.white,
  tabIconInactive:    '#444444',
};

const light: AppColors = {
  background:         palette.white,   // #FCFCFC — your primary
  backgroundCard:     '#F4F4F4',
  backgroundElevated: '#EBEBEB',
  backgroundOverlay:  'rgba(0,0,0,0.03)',

  textPrimary:        '#0A0A0A',
  textSecondary:      '#555555',
  textMuted:          '#AAAAAA',

  accentGreen:        '#00C96E',       // slightly darkened for light bg legibility
  accentGreenDim:     'rgba(0,201,110,0.10)',
  accentGreenBorder:  'rgba(0,201,110,0.25)',
  accentRed:          '#D93025',
  accentRedDim:       'rgba(217,48,37,0.10)',
  accentRedBorder:    'rgba(217,48,37,0.25)',
  accentBlue:         '#0A74E0',
  accentYellow:       '#B89400',

  border:             'rgba(0,0,0,0.07)',
  borderStrong:       'rgba(0,0,0,0.14)',
  shimmer:            'rgba(0,0,0,0.06)',
  tabBarBg:           palette.white,
  tabBarBorder:       'rgba(0,0,0,0.08)',
  tabIconActive:      '#0A0A0A',
  tabIconInactive:    '#BBBBBB',
};

export const Colors: Record<ColorScheme, AppColors> = { dark, light };