import { ModelDownloadContainer } from './ModelDownload'; // Import the ModelDownload container component
import ThemeSelector from './ThemeSelector'; // Import the new ThemeSelector component
import IPAccessControlPanel from './IPAccessControlPanel'; // Import the new IP Access Control Panel

const Settings = () => {
    return (
        <div className="settings-content" data-component="settings">
            <h2 className="text-3xl font-bold text-center mb-8" style={{ color: 'var(--text-color)' }}>Settings</h2>

            {/* Render Theme Selector */}
            <div className="mb-12">
                <ThemeSelector />
            </div>

            {/* Render IP Access Control Panel */}
            <div className="mb-12">
                <IPAccessControlPanel />
            </div>

            {/* Render ModelDownloadContainer */}
            <div className="mb-12">
                <ModelDownloadContainer />
            </div>
        </div>
    );
};

export default Settings;
