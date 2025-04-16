import { ModelDownloadContainer } from './ModelDownload'; // Import the ModelDownload container component

const Settings = () => {
    return (
        <div className="settings-content" data-component="settings">
            <h2 className="text-3xl font-bold text-center mb-8" style={{ color: 'var(--text-color)' }}>Settings</h2>
            {/* Render ModelDownloadContainer directly */}
            <div className="mb-12">
                <ModelDownloadContainer />
            </div>
            {/* Removed IPAccessControlPanel - assuming ModelDownload is the main content */}
        </div>
    );
};

export default Settings;
