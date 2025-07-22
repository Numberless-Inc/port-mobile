import {useMemo} from 'react';

import {useTheme} from 'src/context/ThemeContext';

/**
 * Common colors for the app.
 */
const CommonColors = {
  white: '#FFFFFF',
  black: '#000000',
  mildBlack: '#05070B',
  red: '#EF4D41',
  redBackground: '#FFE6E6',
  accent2: '#7A98FF',
  grey:'#667085',
  boldAccentColors: {
    violet: '#730BDC',
    darkGreen: '#469A5F',
    orange: '#EE6337',
    deepSafron: '#F99520',
    tealBlue: '#4A94B0',
    brightRed: '#E20036',
    blue: '#7A98FF',
    purple: '#9E82ED',
    grey: '#F3F3F5',
  },
  lowAccentColors: {
    violet: '#730BDC1A',
    darkGreen: '#469A5F1A',
    orange: '#EE63371A',
    deepSafron: '#F995201A',
    tealBlue: '#4A94B01A',
    brightRed: '#E200361A',
    blue: '#4E75FF1A',
    purple: '#9E82ED1A',
    grey: '#F3F3F5',
  },
};

/**
 * Light colors for the app.
 */
const LightColors = {
  background: '#F3F2F7',
  background2: '#FFFFFF',
  surface: '#FFFFFF',
  surface1: '#FFFFFF',
  surface2: '#FFFFFF',
  surface3: '#F3F3F5',
  search:'#F3F3F5',
  stroke: '#E8E6EC',
  accent: '#05070B',
  purple: '#6A35FF',
  overlay: '#000000',
  notch: '#98A2B3',
  disabled: '#CFCCD6',
  enabled: '#6A35FF',
  text: {
    subtitle: '#667085',
    title: '#05070B',
    buttonText: '#6A35FF',
  },
};

/**
 * Dark colors for the app.
 */
const DarkColors = {
  background: '#05070B',
  background2: '#05070B',
  surface: '#17181C',
  surface1: '#17181C',
  surface2: '#27272B',
  surface3: '#27272B',
  search:'#17181C',
  stroke: '#61616B',
  accent: '#FFFFFF',
  purple: '#6A35FF',
  overlay: '#52525b',
  notch: '#98A2B3',
  disabled: '#7E7B84',
  enabled: '#6A35FF',
  purpleGradient: ['#290B80', '#1D0A57', '#170A43', '#05070B'],
  text: {
    subtitle: '#CFCCD9',
    title: '#FFFFFF',
    buttonText: '#FFFFFF',
  },
};

/**
 * Colors for the app.
 */
export const Colors = {
  common: CommonColors,
  light: LightColors,
  dark: DarkColors,
};

/**
 * Get theme-specific colors
 * @param theme - The theme to use
 * @returns color object based on chosen theme
 */
export const useThemeColors = (theme: 'light' | 'dark') => {
  return {
    ...Colors.common,
    ...(theme === 'light' ? Colors.light : Colors.dark),
    theme: theme,
  };
};

/**
 * Hook to get colors based on current theme
 * @returns Memoized color object based on current theme
 */
export const useColors = (forceTheme?: 'light' | 'dark') => {
  const {themeValue} = useTheme();

  return useMemo(() => {
    const selectedTheme = forceTheme || themeValue;
    return {
      ...Colors.common,
      ...Colors[selectedTheme],
      theme: selectedTheme,
    };
  }, [themeValue, forceTheme]);
};
