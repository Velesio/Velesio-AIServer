import { useState } from 'react';
import ConfigForm from './components/ConfigForm';
import ModelDownload from './components/ModelDownload';
import IPAccessControlPanel from './components/AllowlistForm';
import { ThemeProvider } from './context/ThemeContext';
import { useTheme } from './context/useTheme';

function App() {
    const [activeTab, setActiveTab] = useState<'config' | 'allowlist' | 'stablediffusion'>('config');
    
    return (
        <ThemeProvider>
            <AppContent activeTab={activeTab} setActiveTab={setActiveTab} />
        </ThemeProvider>
    );
}

function AppContent({ 
    activeTab, 
    setActiveTab 
}: { 
    activeTab: 'config' | 'allowlist' | 'stablediffusion'; 
    setActiveTab: (tab: 'config' | 'allowlist' | 'stablediffusion') => void;
}) {
    const { theme } = useTheme();
    
    const getBgClass = () => {
        return theme === 'cyberpunk' 
            ? 'bg-gray-900 text-white' 
            : 'bg-white text-gray-900';
    };
    
    return (
        <div className={`p-8 ${getBgClass()} min-h-screen flex justify-center transition-colors duration-300`}>
            <div className="w-[900px]">
                <ConfigForm activeTab={activeTab} setActiveTab={setActiveTab} />
                {activeTab === 'config' && <div className="mt-8"><ModelDownload /></div>}
                {activeTab === 'allowlist' && <div className="mt-8"><IPAccessControlPanel /></div>}
            </div>
        </div>
    );
}

export default App;
