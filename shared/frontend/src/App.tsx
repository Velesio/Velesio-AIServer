import { Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import Navbar from './components/Navbar'
import ServerStats from './components/ServerStats'
import LLMForm from './components/LLMForm'
import StableDiffusionForm from './components/StableDiffusionForm'
import Settings from './components/Settings'

const HomePage = () => {
    return (
        <div className="container mx-auto p-6 space-y-10">e()
            <h1 className="text-3xl font-bold text-center">Dashboard</h1>
            <ServerStats />
            <LLMForm />
            <StableDiffusionForm />
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
                {/* other routes removed */}
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
