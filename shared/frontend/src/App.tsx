import { useState } from 'react';
import ConfigForm from './components/LLMForm';
import AllowlistForm from './components/AllowlistForm';
import { ThemeProvider } from './context/ThemeContext';

function App() {
    const [activeTab, setActiveTab] = useState('config');

    // Main component body
    return (
        <ThemeProvider>
            <div className="main-container">
                <ConfigForm activeTab={activeTab} setActiveTab={setActiveTab} />
                
                {activeTab === 'allowlist' && <AllowlistForm />}
            </div>
        </ThemeProvider>
    );
}

export default App;
