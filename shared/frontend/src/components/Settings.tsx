import { useState } from 'react'; // Import useState
import { ModelDownloadContainer } from './ModelDownload';
import ThemeSelector from './ThemeSelector';
import IPAccessControlPanel from './IPAccessControlPanel';
import { useTheme } from '../context/useTheme';
// Updated icons
import { FaPalette, FaDownload, FaUserShield } from 'react-icons/fa';

const Settings = () => {
    const { theme } = useTheme();
    // State for section visibility
    const [showTheme, setShowTheme] = useState(true);
    const [showModels, setShowModels] = useState(true);
    const [showAccess, setShowAccess] = useState(true);

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

    // Define container style for the icon buttons
    const getButtonContainerStyle = () => {
        const common = {
            padding: '1rem',
            borderRadius: '1rem',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '2rem', // Adjust gap if needed for 3 buttons
            width: 'fit-content',
            margin: '0 auto',
            marginBottom: '2.5rem',
        }
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
              }
    }

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

            {/* Updated Icon Button Container */}
            <div style={getButtonContainerStyle()}>
                {/* Theme Toggle Button */}
                <button
                    onClick={() => setShowTheme(!showTheme)}
                    // Added ring for 'on' state, opacity for 'off' state
                    className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                        showTheme
                            ? 'bg-teal-100 dark:bg-teal-900 border-teal-500 text-teal-700 dark:text-teal-300 ring-2 ring-offset-1 ring-teal-500' // Enhanced 'on' state
                            : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400 opacity-70 hover:opacity-100' // Subdued 'off' state
                    }`}
                    title={showTheme ? 'Hide Theme Section' : 'Show Theme Section'}
                >
                    <FaPalette size={24} />
                </button>
                {/* Model Download Toggle Button */}
                <button
                    onClick={() => setShowModels(!showModels)}
                    // Added ring for 'on' state, opacity for 'off' state
                    className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                        showModels
                            ? 'bg-blue-100 dark:bg-blue-900 border-blue-500 text-blue-700 dark:text-blue-300 ring-2 ring-offset-1 ring-blue-500' // Enhanced 'on' state
                            : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400 opacity-70 hover:opacity-100' // Subdued 'off' state
                    }`}
                    title={showModels ? 'Hide Model Download Section' : 'Show Model Download Section'}
                >
                    <FaDownload size={24} />
                </button>
                {/* Access Control Toggle Button */}
                <button
                    onClick={() => setShowAccess(!showAccess)}
                    // Added ring for 'on' state, opacity for 'off' state
                    className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                        showAccess
                            ? 'bg-red-100 dark:bg-red-900 border-red-500 text-red-700 dark:text-red-300 ring-2 ring-offset-1 ring-red-500' // Enhanced 'on' state
                            : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400 opacity-70 hover:opacity-100' // Subdued 'off' state
                    }`}
                    title={showAccess ? 'Hide Access Control Section' : 'Show Access Control Section'}
                >
                    <FaUserShield size={24} />
                </button>
            </div>

            <div className="settings-sections">
                {/* Theme Section - Conditional Render */}
                {showTheme && (
                    <section style={{ marginBottom: '2.5rem' }}>
                        <h3 className={`text-xl font-semibold mb-4 text-center ${theme === 'cyberpunk' ? 'glow-text' : ''}`}>
                            Theme
                        </h3>
                        <ThemeSelector />
                    </section>
                )}

                {/* Model Downloads Section - Conditional Render */}
                {showModels && (
                    <section style={{ marginBottom: '2.5rem' }}>
                        <h3 className={`text-xl font-semibold mb-4 text-center ${theme === 'cyberpunk' ? 'glow-text' : ''}`}>
                            Model Downloads
                        </h3>
                        <div style={getSectionStyle()}>
                            <ModelDownloadContainer />
                        </div>
                    </section>
                )}

                {/* IP Access Control Section - Conditional Render */}
                {showAccess && (
                    <section style={{ marginBottom: '2.5rem' }}>
                        <h3 className={`text-xl font-semibold mb-4 text-center ${theme === 'cyberpunk' ? 'glow-text' : ''}`}>
                            Access Control
                        </h3>
                        <IPAccessControlPanel />
                    </section>
                )}
            </div>
        </div>
    );
};

export default Settings;
