import { createContext, useState, ReactNode, useEffect } from 'react';

// Theme types
export type ThemeType = 'cyberpunk' | 'corporate';

// Theme context type
export interface ThemeContextType {
    theme: ThemeType;
    toggleTheme: () => void;
}

// Create context with default values
export const ThemeContext = createContext<ThemeContextType>({
    theme: 'cyberpunk',
    toggleTheme: () => {},
});

// Theme provider component
export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const [theme, setTheme] = useState<ThemeType>('cyberpunk');
    
    const toggleTheme = () => {
        setTheme(prev => prev === 'cyberpunk' ? 'corporate' : 'cyberpunk');
    };
    
    // Apply theme to body using useEffect to handle SSR
    useEffect(() => {
        document.body.className = theme;
    }, [theme]);
    
    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};