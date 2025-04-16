import { ModelDownloadContainer } from './ModelDownload'; // Import the ModelDownload container component
import ThemeSelector from './ThemeSelector'; // Import the new ThemeSelector component

const Settings = () => {
    return (
        <div className="settings-content" data-component="settings">
            <h2 className="text-3xl font-bold text-center mb-8" style={{ color: 'var(--text-color)' }}>Settings</h2>

            {/* Render Theme Selector */}
            <div className="mb-12">
                <ThemeSelector />
            </div>

            {/* Render ModelDownloadContainer */}
            <div className="mb-12">
                <ModelDownloadContainer />
            </div>
            {/* Removed IPAccessControlPanel - assuming ModelDownload is the main content */}
        </div>
    );
};

export default Settings;
