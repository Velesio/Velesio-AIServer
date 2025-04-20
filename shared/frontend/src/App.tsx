import { useState } from 'react' // Added import
import { Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import Navbar from './components/Navbar'
import ServerStats from './components/ServerStats'
import LLMForm from './components/LLMForm'
import StableDiffusionForm from './components/StableDiffusionForm'
import Settings from './components/Settings'
import { FaBrain, FaImage } from 'react-icons/fa' // Added icon imports

const HomePage = () => {
    // Added state for form visibility
    const [showLLMForm, setShowLLMForm] = useState(true)
    const [showStableDiffusionForm, setShowStableDiffusionForm] =
        useState(true)

    return (
        <div className="container mx-auto p-6 space-y-8"> {/* Adjusted spacing */}
            <h1 className="text-3xl font-bold text-center mt-10">Dashboard</h1>
            <ServerStats />

            {/* Added Icon Toggle Buttons */}
            <div className="flex justify-center space-x-8 py-4">
                <button
                    onClick={() => setShowLLMForm(!showLLMForm)}
                    className={`p-3 rounded-lg border-2 transition-colors duration-200 ${
                        showLLMForm
                            ? 'bg-blue-100 dark:bg-blue-900 border-blue-500 text-blue-700 dark:text-blue-300'
                            : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400'
                    }`}
                    title={showLLMForm ? 'Hide LLM Form' : 'Show LLM Form'}
                >
                    <FaBrain size={24} />
                </button>
                <button
                    onClick={() =>
                        setShowStableDiffusionForm(!showStableDiffusionForm)
                    }
                    className={`p-3 rounded-lg border-2 transition-colors duration-200 ${
                        showStableDiffusionForm
                            ? 'bg-purple-100 dark:bg-purple-900 border-purple-500 text-purple-700 dark:text-purple-300'
                            : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-400'
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

            {/* Conditionally render forms */}
            {showLLMForm && <LLMForm />}
            {showStableDiffusionForm && <StableDiffusionForm />}
        </div>
    )
}

const SettingsPage = () => {
    return (
        <div className="container mx-auto p-6">
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
