import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext' // Keep ThemeProvider import
import { useTheme } from './context/useTheme' // Corrected import path for useTheme
import Navbar from './components/Navbar'
import ServerStats from './components/ServerStats'
import LLMForm from './components/LLMForm'
import StableDiffusionForm from './components/StableDiffusionForm'
import Settings from './components/Settings'
import { FaBrain, FaImage, FaServer } from 'react-icons/fa' // Added FaServer

const HomePage = () => {
    const [showLLMForm, setShowLLMForm] = useState(true)
    const [showStableDiffusionForm, setShowStableDiffusionForm] = useState(true)
    const [showServerStats, setShowServerStats] = useState(true) // Added state for ServerStats
    const { theme } = useTheme() // Get the current theme

    const getButtonContainerStyle = () => {
        const common = {
            padding: '1rem', 
            borderRadius: '1rem', 
            display: 'flex',
            justifyContent: 'center', 
            alignItems: 'center',
            gap: '2rem', 
            width: 'fit-content',
            margin: '0 auto',
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

    // Style for the title containers to match component box positioning
    const titleContainerStyle = {
        width: '100%',
        maxWidth: '800px', // Set max-width for centering
        margin: '0 auto', // Center the container itself horizontally
        textAlign: 'center' as const, // Center the text within this container
        marginBottom: '1rem', // Add some space below the title
    };

    return (
        <div className="container mx-auto p-6 space-y-8"> {/* Main page container */}
            <h1 className="text-3xl font-bold text-center mt-10" style={getTitleStyle()}>Dashboard</h1>

            {/* Moved button container above ServerStats */}
            <div style={getButtonContainerStyle()}>
                {/* Server Stats Toggle Button */}
                <button
                    onClick={() => setShowServerStats(!showServerStats)}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                        showServerStats
                            ? 'bg-green-100 dark:bg-green-900 border-green-500 text-green-700 dark:text-green-300 ring-2 ring-offset-1 ring-green-500'
                            : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400 opacity-70 hover:opacity-100'
                    }`}
                    title={showServerStats ? 'Hide Server Stats' : 'Show Server Stats'}
                >
                    <FaServer size={24} />
                </button>
                {/* LLM Toggle Button */}
                <button
                    onClick={() => setShowLLMForm(!showLLMForm)}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                        showLLMForm
                            ? 'bg-blue-100 dark:bg-blue-900 border-blue-500 text-blue-700 dark:text-blue-300 ring-2 ring-offset-1 ring-blue-500'
                            : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400 opacity-70 hover:opacity-100'
                    }`}
                    title={showLLMForm ? 'Hide LLM Form' : 'Show LLM Form'}
                >
                    <FaBrain size={24} />
                </button>
                {/* Stable Diffusion Toggle Button */}
                <button
                    onClick={() =>
                        setShowStableDiffusionForm(!showStableDiffusionForm)
                    }
                    className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                        showStableDiffusionForm
                            ? 'bg-purple-100 dark:bg-purple-900 border-purple-500 text-purple-700 dark:text-purple-300 ring-2 ring-offset-1 ring-purple-500'
                            : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400 opacity-70 hover:opacity-100'
                    }`}
                    title={
                        showStableDiffusionForm
                            ? 'Hide Stable Diffusion Form'
                            : 'Show Stable Diffusion Form'
                    }
                >
                    <FaImage size={24} />
                </button>
            </div>

            {/* Conditionally render ServerStats with Centered Title */}
            {showServerStats && (
                <div className="w-full" style={{ maxWidth: '800px', margin: '0 auto' }}> {/* Centering Wrapper */}
                    <div style={titleContainerStyle}> {/* Title Container */}
                        <h3 className="text-xl font-semibold" style={getTitleStyle()}>
                            Stats
                        </h3>
                    </div>
                    <ServerStats />
                </div>
            )}

            {/* Conditionally render LLMForm with Centered Title */}
            {showLLMForm && (
                 <div className="w-full" style={{ maxWidth: '800px', margin: '0 auto' }}> {/* Centering Wrapper */}
                    <div style={titleContainerStyle}>
                        <h3 className="text-xl font-semibold" style={getTitleStyle()}>
                            LLM Server
                        </h3>
                    </div>
                    <LLMForm />
                 </div>
            )}

            {/* Conditionally render StableDiffusionForm with Centered Title */}
            {showStableDiffusionForm && (
                 <div className="w-full" style={{ maxWidth: '800px', margin: '0 auto' }}> {/* Centering Wrapper */}
                     <div style={titleContainerStyle}>
                        <h3 className="text-xl font-semibold" style={getTitleStyle()}>
                            Stable Diffusion
                        </h3>
                    </div>
                    <StableDiffusionForm />
                 </div>
            )}
        </div>
    )
}

const SettingsPage = () => {
    return (
        <div className="container mx-auto p-6"> {/* Main page container */}
            <Settings />
        </div>
    )
}

function AppContent() {
    return (
        <div className="main-container">
            <Navbar />
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/settings" element={<SettingsPage />} />
            </Routes>
        </div>
    )
}

function App() {
    return (
        <ThemeProvider>
            <AppContent />
        </ThemeProvider>
    )
}

export default App
