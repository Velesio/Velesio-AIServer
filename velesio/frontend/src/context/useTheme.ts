import { useContext } from 'react';
import { ThemeContext, ThemeType as ContextThemeType } from './ThemeContext'; // Import ThemeType

// Custom hook to use theme
export const useTheme = () => useContext(ThemeContext);

// Re-export ThemeType for convenience
export type ThemeType = ContextThemeType;