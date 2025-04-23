import { createContext, useState, ReactNode, useEffect } from 'react';

// Theme types
export type ThemeType = 'cyberpunk' | 'corporate';

// Theme context type
export interface ThemeContextType {
    theme: ThemeType;
    setTheme: (theme: ThemeType) => void; // Changed from toggleTheme
    toggleTheme: () => void; // Keep toggleTheme for potential other uses or remove if unused
}

// Create context with default values
export const ThemeContext = createContext<ThemeContextType>({
    theme: 'cyberpunk',
    setTheme: () => {}, // Add setTheme default
    toggleTheme: () => {},
});

// Theme provider component
export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const [theme, setThemeState] = useState<ThemeType>('cyberpunk');

    // Function to set a specific theme
    const setTheme = (newTheme: ThemeType) => {
        setThemeState(newTheme);
    };

    // Keep toggleTheme for compatibility or specific use cases
    const toggleTheme = () => {
        setThemeState(prev => prev === 'cyberpunk' ? 'corporate' : 'cyberpunk');
    };

    // Apply theme to body using useEffect to handle SSR
    useEffect(() => {
        document.body.className = theme;
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}> {/* Provide setTheme */}
            {children}
        </ThemeContext.Provider>
    );
};