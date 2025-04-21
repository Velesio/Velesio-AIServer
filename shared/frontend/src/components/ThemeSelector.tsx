import { useTheme, ThemeType } from '../context/useTheme';

const ThemeSelector = () => {
    const { theme, setTheme } = useTheme();

    const themes: ThemeType[] = ['cyberpunk', 'corporate'];

    const getContainerStyle = () => {
        const common = {
            maxWidth: '800px', 
            margin: '0 auto',
            padding: '1.5rem',
            borderRadius: 'var(--border-radius)',
            boxSizing: 'border-box' as const,
            width: '100%',
        };
        return theme === 'cyberpunk'
            ? {
                ...common,
                backgroundColor: 'var(--primary-bg)',
                boxShadow: 'var(--neon-glow)',
                border: '1px solid var(--accent-color)',
              }
            : {
                ...common,
                backgroundColor: 'var(--primary-bg)',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e5e7eb',
              };
    };

    const getButtonStyle = (currentTheme: ThemeType, targetTheme: ThemeType) => {
        const isActive = currentTheme === targetTheme;
        return {
            padding: '0.75rem 1.5rem',
            borderRadius: 'var(--border-radius)',
            border: isActive
                ? `2px solid var(--accent-color)`
                : `1px solid ${theme === 'cyberpunk' ? '#666' : '#d1d5db'}`,
            backgroundColor: isActive ? 'var(--accent-color)' : 'var(--secondary-bg)',
            color: isActive ? '#fff' : 'var(--text-color)',
            cursor: 'pointer',
            fontWeight: 500,
            transition: 'all 0.2s ease',
            textTransform: 'capitalize' as const,
            boxShadow: isActive && theme === 'cyberpunk' ? 'var(--neon-glow)' : 'none',
        };
    };

    return (
        <div style={getContainerStyle()}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                {themes.map((themeOption) => (
                    <button
                        key={themeOption}
                        onClick={() => setTheme(themeOption)}
                        style={getButtonStyle(theme, themeOption)}
                    >
                        {themeOption}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ThemeSelector;
