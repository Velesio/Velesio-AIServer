import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext'; // Keep this
import { useTheme } from './context/useTheme'; // Correct import path for useTheme
import Navbar from './components/Navbar';
import ServerStats from './components/ServerStats';
import LLMForm from './components/LLMForm';
import StableDiffusionForm from './components/StableDiffusionForm';
import Settings from './components/Settings';

// Define page components
const HomePage = () => {
    const { theme } = useTheme();
    const getContainerStyle = () => {
        return theme === 'cyberpunk'
            ? {
                backgroundColor: 'var(--primary-bg)',
                boxShadow: 'var(--neon-glow)',
                border: '1px solid var(--accent-color)'
              }
            : {
                backgroundColor: 'var(--primary-bg)',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e5e7eb'
              };
    };
    return (
        <div className="p-6 space-y-6 rounded-lg shadow-lg" style={{
            width: '100%',
            maxWidth: 'calc(100% - 100px)',
            margin: '1.5rem auto',
            marginLeft: '90px',
            ...getContainerStyle()
        }}>
            <h2 className="text-2xl font-bold text-center mb-6">Server Status</h2>
            <ServerStats />
        </div>
    );
};

const ConfigPage = () => <LLMForm />;
const StableDiffusionPage = () => {
     const { theme } = useTheme();
     const getContainerStyle = () => {
        return theme === 'cyberpunk'
            ? {
                backgroundColor: 'var(--primary-bg)',
                boxShadow: 'var(--neon-glow)',
                border: '1px solid var(--accent-color)'
              }
            : {
                backgroundColor: 'var(--primary-bg)',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e5e7eb'
              };
    };
    return (
        <div className="p-6 space-y-6 rounded-lg shadow-lg" style={{
            width: '100%',
            maxWidth: 'calc(100% - 100px)',
            margin: '1.5rem auto',
            marginLeft: '90px',
            ...getContainerStyle()
        }}>
            <StableDiffusionForm />
        </div>
    );
};
const SettingsPage = () => {
     const { theme } = useTheme();
     const getContainerStyle = () => {
        return theme === 'cyberpunk'
            ? {
                backgroundColor: 'var(--primary-bg)',
                boxShadow: 'var(--neon-glow)',
                border: '1px solid var(--accent-color)'
              }
            : {
                backgroundColor: 'var(--primary-bg)',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e5e7eb'
              };
    };
    return (
        <div className="p-6 space-y-6 rounded-lg shadow-lg" style={{
            width: '100%',
            maxWidth: 'calc(100% - 100px)',
            margin: '1.5rem auto',
            marginLeft: '90px',
            ...getContainerStyle()
        }}>
            <Settings /> {/* Renders ModelDownloadContainer */}
        </div>
    );
};


function AppContent() {
    return (
        <div className="main-container">
            <Navbar />
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/llm" element={<ConfigPage />} />
                <Route path="/stablediffusion" element={<StableDiffusionPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                {/* Add other routes as needed */}
            </Routes>
        </div>
    );
}

function App() {
    // Main component body
    return (
        <ThemeProvider>
            <AppContent />
        </ThemeProvider>
    );
}

export default App;
