import { useState } from 'react';
import ConfigForm from './components/LLMForm';
import { ThemeProvider } from './context/ThemeContext';

function App() {
    const [activeTab, setActiveTab] = useState('config');

    // Main component body
    return (
        <ThemeProvider>
            <div className="main-container">
                <ConfigForm activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>
        </ThemeProvider>
    );
}

export default App;
