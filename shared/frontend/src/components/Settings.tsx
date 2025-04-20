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

    // Helper function for title style
    const getTitleStyle = () => ({
        color: 'var(--text-color)',
        textShadow: theme === 'cyberpunk' ? '0 0 5px var(--accent-color)' : 'none'
    });

    // Style for title containers matching content box width/centering
    const sectionTitleContainerStyle = {
        maxWidth: '800px', // Match content box max-width
        margin: '0 auto', // Center the title container
        textAlign: 'center' as const, // Center the text within this container
        marginBottom: '1rem', // Space below title
    };

    return (
        <div className="settings-container" style={{
            // Removed maxWidth, margin, marginLeft - handled by parent/global styles
            padding: '2rem 1rem', // Keep padding consistent
        }}>
            <h2 className="text-3xl font-bold text-center mb-10" style={getTitleStyle()}>
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
                        {/* Title centered above the content box */}
                        <div style={sectionTitleContainerStyle}>
                            <h3 className="text-xl font-semibold" style={getTitleStyle()}>
                                Theme
                            </h3>
                        </div>
                        {/* ThemeSelector applies its own container style */}
                        <ThemeSelector />
                    </section>
                )}

                {/* Model Downloads Section - Conditional Render */}
                {showModels && (
                    <section style={{ marginBottom: '2.5rem' }}>
                        <div style={sectionTitleContainerStyle}>
                            <h3 className="text-xl font-semibold" style={getTitleStyle()}>
                                Model Downloads
                            </h3>
                        </div>
                        {/* ModelDownloadContainer is a flex wrapper, styling applied inside */}
                        <ModelDownloadContainer />
                    </section>
                )}

                {/* IP Access Control Section - Conditional Render */}
                {showAccess && (
                    <section style={{ marginBottom: '2.5rem' }}>
                        <div style={sectionTitleContainerStyle}>
                            <h3 className="text-xl font-semibold" style={getTitleStyle()}>
                                Access Control
                            </h3>
                        </div>
                        {/* IPAccessControlPanel applies its own container style */}
                        <IPAccessControlPanel />
                    </section>
                )}
            </div>
        </div>
    );
};

export default Settings;
