import { ModelDownloadContainer } from './ModelDownload';
import ThemeSelector from './ThemeSelector';
import IPAccessControlPanel from './IPAccessControlPanel';
import { useTheme } from '../context/useTheme';

const Settings = () => {
    const { theme } = useTheme();
    
    // Common section container style for consistent appearance
    const getSectionStyle = () => ({
        width: '100%',
        maxWidth: '800px',
        margin: '0 auto 2.5rem auto',
        borderRadius: 'var(--border-radius)',
        backgroundColor: theme === 'cyberpunk' 
            ? 'var(--primary-bg)' 
            : 'var(--primary-bg)',
        boxShadow: theme === 'cyberpunk' 
            ? 'var(--neon-glow)' 
            : '0 4px 15px rgba(0, 0, 0, 0.1)',
        border: theme === 'cyberpunk' 
            ? '1px solid var(--accent-color)' 
            : '1px solid #e5e7eb',
        padding: '1.5rem',
    });

    return (
        <div className="settings-container" style={{
            maxWidth: 'calc(100% - 100px)',
            margin: '0 auto',
            marginLeft: '90px', // account for navbar
            padding: '2rem 1rem',
        }}>
            <h2 className="text-3xl font-bold text-center mb-10" 
                style={{ 
                    color: 'var(--text-color)',
                    textShadow: theme === 'cyberpunk' ? '0 0 5px var(--accent-color)' : 'none'
                }}>
                Settings
            </h2>
            
            <div className="settings-sections">
                {/* Theme Section */}
                <section style={{ marginBottom: '2.5rem' }}>
                    <h3 className={`text-xl font-semibold mb-4 text-center ${theme === 'cyberpunk' ? 'glow-text' : ''}`}>
                        Theme
                    </h3>
                    <ThemeSelector />
                </section>
                
                {/* Model Downloads Section */}
                <section style={{ marginBottom: '2.5rem' }}>
                    <h3 className={`text-xl font-semibold mb-4 text-center ${theme === 'cyberpunk' ? 'glow-text' : ''}`}>
                        Model Downloads
                    </h3>
                    <div style={getSectionStyle()}>
                        <ModelDownloadContainer />
                    </div>
                </section>
                
                {/* IP Access Control Section */}
                <section style={{ marginBottom: '2.5rem' }}>
                    <h3 className={`text-xl font-semibold mb-4 text-center ${theme === 'cyberpunk' ? 'glow-text' : ''}`}>
                        Access Control
                    </h3>
                    <IPAccessControlPanel />
                </section>
            </div>
        </div>
    );
};

export default Settings;
