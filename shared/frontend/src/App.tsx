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
    
    return (
        <div className={`min-h-screen flex flex-col transition-colors duration-300`}
             style={{ 
                 backgroundColor: theme === 'cyberpunk' ? '#121225' : '#f9fafb',
                 color: theme === 'cyberpunk' ? '#ffffff' : '#111827',
                 backgroundImage: theme === 'cyberpunk' 
                     ? 'radial-gradient(circle at 50% 50%, #1e1e31 0%, #121225 100%)' 
                     : 'radial-gradient(circle at 50% 50%, #ffffff 0%, #f9fafb 100%)',
                 backgroundAttachment: 'fixed' 
             }}>
            <header className="py-6">
                <div className="container mx-auto px-4">
                    <h1 className="text-3xl font-bold text-center" style={{ 
                        color: 'var(--text-color)',
                        textShadow: theme === 'cyberpunk' ? '0 0 10px rgba(157, 78, 221, 0.5)' : 'none'
                    }}>
                        Velesio AI Server
                    </h1>
                </div>
            </header>
            
            <main className="flex-grow container mx-auto px-4 py-4 max-w-5xl">
                <div className="mb-4">
                    <ConfigForm activeTab={activeTab} setActiveTab={setActiveTab} />
                </div>
                
                {activeTab === 'config' && (
                    <div className="mb-8">
                        <ModelDownload />
                    </div>
                )}
                
                {activeTab === 'allowlist' && (
                    <div className="mb-8">
                        <IPAccessControlPanel />
                    </div>
                )}
            </main>
            
            <footer className="py-6" style={{ backgroundColor: 'rgba(0,0,0,0.05)' }}>
                <div className="container mx-auto px-4 text-center">
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Velesio AI Server &copy; {new Date().getFullYear()} • 
                        <a href="https://github.com/Velesio/Velesio-AIServer" 
                           className="ml-1 hover:underline" 
                           style={{ color: theme === 'cyberpunk' ? '#9d4edd' : '#4f46e5' }}>
                            GitHub
                        </a>
                    </p>
                </div>
            </footer>
        </div>
    );
}

export default App;
