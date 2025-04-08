import { useTheme } from '../context/useTheme';

interface NavbarProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
    toggleTheme: () => void;
}

const Navbar = ({ activeTab, setActiveTab, toggleTheme }: NavbarProps) => {
    const { theme } = useTheme();
    
    const getNavbarStyle = () => {
        return {
            position: 'fixed' as const,
            right: 0,
            top: 0,
            height: '100vh',
            width: '80px',
            backgroundColor: theme === 'cyberpunk' ? '#1a1a2e' : '#f9fafb',
            borderLeft: theme === 'cyberpunk' ? '1px solid rgba(157, 78, 221, 0.3)' : '1px solid #e5e7eb',
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem 0',
            zIndex: 50,
            boxShadow: theme === 'cyberpunk' ? 'var(--neon-glow)' : '0 4px 15px rgba(0, 0, 0, 0.05)',
        };
    };
    
    const getButtonStyle = (isActive: boolean) => {
        return {
            width: '50px',
            height: '50px',
            borderRadius: '12px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            margin: '0.75rem 0',
            color: isActive ? '#fff' : (theme === 'cyberpunk' ? '#fff' : '#333'),
            backgroundColor: isActive 
                ? (theme === 'cyberpunk' ? 'var(--button-primary)' : 'var(--button-primary)')
                : 'transparent',
            boxShadow: isActive && theme === 'cyberpunk' ? 'var(--neon-glow)' : 'none',
            border: theme === 'corporate' && isActive ? '1px solid #000' : 'none',
            transition: 'all 0.2s ease-in-out',
            cursor: 'pointer',
        };
    };

    // Icons
    const LLMIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="7.5 4.21 12 6.81 16.5 4.21"></polyline>
            <line x1="12" y1="6.81" x2="12" y2="19.91"></line>
        </svg>
    );

    const ImagesIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
        </svg>
    );

    const SettingsIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
    );

    const ThemeIcon = () => {
        if (theme === 'cyberpunk') {
            return (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
            );
        } else {
            return (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
            );
        }
    };

    const RefreshIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 4v6h-6"></path>
            <path d="M1 20v-6h6"></path>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"></path>
            <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"></path>
        </svg>
    );

    return (
        <nav style={getNavbarStyle()}>
            <div style={{ flex: 1 }}></div>
            
            <button
                onClick={() => setActiveTab('config')}
                style={getButtonStyle(activeTab === 'config')}
                title="LLM Configuration"
            >
                <LLMIcon />
            </button>
            
            <button
                onClick={() => setActiveTab('stablediffusion')}
                style={getButtonStyle(activeTab === 'stablediffusion')}
                title="Stable Diffusion"
            >
                <ImagesIcon />
            </button>
            
            <button
                onClick={() => setActiveTab('allowlist')}
                style={getButtonStyle(activeTab === 'allowlist')}
                title="Settings"
            >
                <SettingsIcon />
            </button>
            
            <div style={{ flex: 1 }}></div>
            
            <button
                onClick={toggleTheme}
                style={{
                    ...getButtonStyle(false),
                    backgroundColor: theme === 'cyberpunk' ? 'rgba(157, 78, 221, 0.2)' : 'rgba(79, 70, 229, 0.1)',
                }}
                title="Toggle Theme"
            >
                <ThemeIcon />
            </button>
            
            <button
                onClick={() => window.location.reload()}
                style={getButtonStyle(false)}
                title="Refresh"
            >
                <RefreshIcon />
            </button>
        </nav>
    );
};

export default Navbar;
