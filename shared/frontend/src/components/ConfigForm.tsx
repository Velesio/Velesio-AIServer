import { useState, useEffect } from 'react';
import { useTheme } from '../context/useTheme';
import ServerStats from './ServerStarts';  // Import the ServerStats component
import Navbar from './Navbar';  // Import the new Navbar component
import ModelDownload from './ModelDownload'; // Import the ModelDownload component

// Spinning loader component
const Spinner = () => (
    <div className="inline-block animate-spin rounded-full border-4 border-solid border-current border-r-transparent h-5 w-5 ml-1" 
         style={{ borderColor: 'white transparent white transparent' }}></div>
);

interface ConfigFormProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

const ConfigForm = ({ activeTab, setActiveTab }: ConfigFormProps) => {
    const { theme, toggleTheme } = useTheme();
    const [model, setModel] = useState('model');
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [host, setHost] = useState('0.0.0.0');
    const [port, setPort] = useState(1337);
    const [ngl, setNgl] = useState(30);
    const [template, setTemplate] = useState('chatml');
    const [customParams, setCustomParams] = useState('');
    const [serverStatus, setServerStatus] = useState('Unknown');
    const [sdStatus, setSdStatus] = useState('Unknown');
    const [logs, setLogs] = useState('');
    const [sdLogs, setSdLogs] = useState('');
    const [isStarting, setIsStarting] = useState(false);
    const [isStopping, setIsStopping] = useState(false);
    const [isStartingSD, setIsStartingSD] = useState(false);
    const [isStoppingSD, setIsStoppingSD] = useState(false);
    const [operationStatus, setOperationStatus] = useState<{message: string, success: boolean} | null>(null);
    const [sdOperationStatus, setSdOperationStatus] = useState<{message: string, success: boolean} | null>(null);
    const [showLogs, setShowLogs] = useState(false);
    const [showSdLogs, setShowSdLogs] = useState(false);

    // Theme-based styles
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

    const getInputStyle = () => {
        return {
            width: "220px",
            padding: "0.5rem",
            borderRadius: "0.25rem",
            backgroundColor: "var(--input-bg)",
            color: "var(--text-color)",
            border: theme === 'cyberpunk' ? '1px solid #666' : '1px solid #d1d5db'
        };
    };

    // Helper function to get the API base URL
    const getApiBaseUrl = () => {
        // In production, use relative URLs that will work in any environment
        return '/api';
    };

    // Poll for server status every 3 seconds
    useEffect(() => {
        const checkStatus = async () => {
            try {
                const response = await fetch(`${getApiBaseUrl()}/stats/`);
                const data = await response.json();
                setServerStatus(data.server_running ? 'Running' : 'Stopped');
                setSdStatus(data.sd_running ? 'Running' : 'Stopped');
            } catch {
                // Any error means the server is not running
                setServerStatus('Stopped');
                setSdStatus('Stopped');
            }
        };

        const interval = setInterval(checkStatus, 3000);
        checkStatus();
        return () => clearInterval(interval);
    }, []);

    // Auto-refresh StableDiffusion status when in stablediffusion tab
    useEffect(() => {
        const checkSdWebUI = async () => {
            try {
                const response = await fetch('http://localhost:7860/api/endpoint');
                // Just parse the JSON to check if it's valid, no need to store or set state
                await response.json();
            } catch {
            }
        };

        if (activeTab === 'stablediffusion' && sdStatus === 'Running') {
            const interval = setInterval(checkSdWebUI, 5000);
            checkSdWebUI();
            return () => clearInterval(interval);
        }
    }, [activeTab, sdStatus]);

    // Auto-refresh LLM logs when showing logs in config tab
    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const response = await fetch(`${getApiBaseUrl()}/logs/`);
                const data = await response.text();
                setLogs(data);
            } catch {
                // Any error means we can't fetch logs
                setLogs('Error fetching logs.');
            }
        };

        if (activeTab === 'config' && showLogs) {
            const logInterval = setInterval(fetchLogs, 2000);
            fetchLogs();
            return () => clearInterval(logInterval);
        }
    }, [activeTab, showLogs]);
    
    // Fetch SD logs when needed
    useEffect(() => {
        const fetchSdLogs = async () => {
            try {
                const response = await fetch(`${getApiBaseUrl()}/sd-logs/`);
                const data = await response.text();
                setSdLogs(data);
            } catch {
                setSdLogs('Error fetching Stable Diffusion logs.');
            }
        };

        if (activeTab === 'stablediffusion' && showSdLogs) {
            const logInterval = setInterval(fetchSdLogs, 5000);
            fetchSdLogs();
            return () => clearInterval(logInterval);
        }
    }, [activeTab, showSdLogs]);

    // Fetch available models on mount
    useEffect(() => {
        const fetchModels = async () => {
            try {
                const response = await fetch(`${getApiBaseUrl()}/list-models/`);
                const data = await response.json();
                setAvailableModels(data.models);
            } catch (error) {
                console.error('Failed to fetch available models', error);
            }
        };
        fetchModels();
    }, []);

    const handleStartServer = async () => {
        setIsStarting(true);
        setOperationStatus(null);
        
        const commandParams = {
            model: model.trim() || 'model',
            host,
            port,
            ngl,
            template,
            custom_params: customParams.trim(),
        };

        try {
            const response = await fetch(`${getApiBaseUrl()}/start-server/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(commandParams)
            });

            if (response.ok) {
                setServerStatus('Running');
                setOperationStatus({
                    message: 'Server started successfully!',
                    success: true
                });
            } else {
                const errorData = await response.json();
                setOperationStatus({
                    message: `Failed to start server: ${errorData.detail}`,
                    success: false
                });
            }
        } catch {
            setOperationStatus({
                message: 'Network error occurred. Please try again.',
                success: false
            });
        } finally {
            setIsStarting(false);
        }
    };

    const handleStopServer = async () => {
        setIsStopping(true);
        setOperationStatus(null);
        
        try {
            const response = await fetch(`${getApiBaseUrl()}/stop-server/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                setServerStatus('Stopped');
                setLogs('');
                setOperationStatus({
                    message: 'Server stopped successfully!',
                    success: true
                });
            } else {
                const errorData = await response.json();
                setOperationStatus({
                    message: `Failed to stop server: ${errorData.detail}`,
                    success: false
                });
            }
        } catch {
            setOperationStatus({
                message: 'Network error occurred. Please try again.',
                success: false
            });
        } finally {
            setIsStopping(false);
        }
    };
    
    const handleStartStableDiffusion = async () => {
        setIsStartingSD(true);
        setSdOperationStatus(null);
        
        try {
            const response = await fetch(`${getApiBaseUrl()}/start-stable-diffusion/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                setSdStatus('Running');
                setSdOperationStatus({
                    message: 'Stable Diffusion started successfully! WebUI will be available in a moment.',
                    success: true
                });
            } else {
                const errorData = await response.json();
                setSdOperationStatus({
                    message: `Failed to start Stable Diffusion: ${errorData.detail}`,
                    success: false
                });
            }
        } catch {
            setSdOperationStatus({
                message: 'Network error occurred. Please try again.',
                success: false
            });
        } finally {
            setIsStartingSD(false);
        }
    };

    const handleStopStableDiffusion = async () => {
        setIsStoppingSD(true);
        setSdOperationStatus(null);
        
        try {
            const response = await fetch(`${getApiBaseUrl()}/stop-stable-diffusion/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                setSdStatus('Stopped');
                setSdOperationStatus({
                    message: 'Stable Diffusion stopped successfully!',
                    success: true
                });
            } else {
                const errorData = await response.json();
                setSdOperationStatus({
                    message: `Failed to stop Stable Diffusion: ${errorData.detail}`,
                    success: false
                });
            }
        } catch {
            setSdOperationStatus({
                message: 'Network error occurred. Please try again.',
                success: false
            });
        } finally {
            setIsStoppingSD(false);
        }
    };

    return (
        <>
            <Navbar 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
                toggleTheme={toggleTheme} 
            />
            
            <div className="p-6 space-y-6 rounded-lg shadow-lg" style={{ 
                width: '100%', 
                maxWidth: 'calc(100% - 100px)',  // Adjust width to account for sidebar
                margin: '1.5rem auto',
                marginLeft: '90px', // Change to left margin for left navbar
                ...getContainerStyle()
            }}>
                {/* Add ServerStats right after header */}
                <div className="mb-6">
                    <ServerStats />
                </div>

                {/* Configuration Tab */}
                {activeTab === 'config' && (
                    <>
                        <h2 className="text-2xl font-bold text-center">Server Configuration</h2>

                        {/* Model row with fixed width */}
                        <div style={{ width: '550px', margin: '1.5rem auto', marginBottom: '2.5rem' }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <div style={{ marginRight: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <label className="block mb-1">Model:</label>
                                    <input
                                        type="text"
                                        value={model}
                                        onChange={(e) => setModel(e.target.value)}
                                        style={{...getInputStyle(), width: '180px', textAlign: 'center'}}
                                    />
                                </div>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <label className="block mb-1">Available Models:</label>
                                    <select
                                        onChange={(e) => setModel(e.target.value)}
                                        value={model}
                                        style={{...getInputStyle(), width: '180px', textAlign: 'center'}}
                                    >
                                        <option value="">-- Select --</option>
                                        {availableModels.map((m) => (
                                            <option key={m} value={m}>
                                                {m}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Remaining fields with fixed width and centered */}
                        <div style={{ width: '100%', margin: '0 auto', marginBottom: '2.5rem', textAlign: 'center' }}>
                            <div className="grid grid-cols-2 gap-8 mb-8">
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <label className="block mb-1">Host:</label>
                                    <input
                                        type="text"
                                        value={host}
                                        onChange={(e) => setHost(e.target.value)}
                                        style={{ ...getInputStyle(), width: '180px', textAlign: 'center' }}
                                    />
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <label className="block mb-1">Port:</label>
                                    <input
                                        type="number"
                                        value={port}
                                        onChange={(e) => setPort(Number(e.target.value))}
                                        style={{ ...getInputStyle(), width: '180px', textAlign: 'center' }}
                                    />
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <label className="block mb-1">GPU Layers:</label>
                                    <input
                                        type="number"
                                        value={ngl}
                                        onChange={(e) => setNgl(Number(e.target.value))}
                                        style={{ ...getInputStyle(), width: '180px', textAlign: 'center' }}
                                    />
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <label className="block mb-1">Template:</label>
                                    <input
                                        type="text"
                                        value={template}
                                        onChange={(e) => setTemplate(e.target.value)}
                                        style={{ ...getInputStyle(), width: '180px', textAlign: 'center' }}
                                    />
                                </div>
                            </div>

                            <div className="mt-6" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <label className="block mb-1">Custom Parameters (Optional):</label>
                                <input
                                    type="text"
                                    value={customParams}
                                    onChange={(e) => setCustomParams(e.target.value)}
                                    style={{ ...getInputStyle(), width: '300px', textAlign: 'center' }}
                                />
                            </div>

                            <div className="flex justify-center items-center mt-14 mb-10 flex-col gap-6" style={{width: '100%', margin: '0 auto', textAlign: 'center'}}>
                                {/* Visual Server Status Indicator with integrated action button */}
                                <div className="mb-4 p-4 rounded-lg flex items-center justify-between w-full max-w-md" style={{
                                    backgroundColor: theme === 'cyberpunk' ? 'rgba(26, 26, 46, 0.4)' : 'var(--input-bg)',
                                    border: theme === 'cyberpunk' ? '1px solid var(--accent-color)' : '1px solid #e5e7eb',
                                    boxShadow: theme === 'cyberpunk' ? 'var(--neon-glow)' : '0 1px 3px rgba(0,0,0,0.1)',
                                }}>
                                    {/* Left side: Status indicator */}
                                    <div className="flex items-center">
                                        <div className="relative w-6 h-6 mr-2">
                                            <div className="w-6 h-6 rounded-full" style={{
                                                backgroundColor: serverStatus === 'Running' ? '#4ade80' : '#ef4444',
                                                boxShadow: theme === 'cyberpunk' 
                                                    ? `0 0 8px ${serverStatus === 'Running' ? '#4ade80' : '#ef4444'}`
                                                    : 'none',
                                            }}>
                                                {serverStatus === 'Running' && (
                                                    <div className="absolute inset-0 rounded-full animate-ping" style={{
                                                        backgroundColor: '#4ade80',
                                                        opacity: 0.3,
                                                        animationDuration: '2s',
                                                    }}></div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-start">
                                            <span className="text-xs opacity-70">LLM Server</span>
                                            <span className="font-medium text-sm" style={{
                                                color: serverStatus === 'Running' ? '#4ade80' : '#ef4444',
                                                textShadow: theme === 'cyberpunk' 
                                                    ? `0 0 3px ${serverStatus === 'Running' ? '#4ade80' : '#ef4444'}`
                                                    : 'none',
                                            }}>
                                                {serverStatus}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* Right side: Toggle button */}
                                    <button
                                        className="px-4 py-2 rounded text-sm font-medium inline-flex items-center"
                                        onClick={serverStatus === 'Running' ? handleStopServer : handleStartServer}
                                        disabled={isStarting || isStopping}
                                        style={{ 
                                            backgroundColor: serverStatus === 'Running' 
                                                ? 'var(--button-danger)' 
                                                : 'var(--button-primary)',
                                            color: '#ffffff',
                                            boxShadow: theme === 'cyberpunk' 
                                                ? serverStatus === 'Running'
                                                    ? '0 0 5px rgba(229, 62, 62, 0.5)' 
                                                    : 'var(--neon-glow)'
                                                : 'none',
                                            opacity: (isStarting || isStopping) ? 0.7 : 1,
                                            transition: 'all 0.2s ease',
                                            width: '140px',
                                        }}
                                    >
                                        {isStarting ? (
                                            <><span className="mr-1">Starting</span><Spinner /></>
                                        ) : isStopping ? (
                                            <><span className="mr-1">Stopping</span><Spinner /></>
                                        ) : serverStatus === 'Running' ? (
                                            <>
                                                <svg className="mr-1.5" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="6" y="6" width="12" height="12" rx="2" ry="2"></rect>
                                                </svg>
                                                Stop Server
                                            </>
                                        ) : (
                                            <>
                                                <svg className="mr-1.5" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                                </svg>
                                                Start Server
                                            </>
                                        )}
                                    </button>
                                </div>
                                
                                {operationStatus && (
                                    <div className="px-4 py-3 rounded-md text-sm max-w-md w-full" style={{
                                        backgroundColor: operationStatus.success ? 
                                            (theme === 'cyberpunk' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)') : 
                                            (theme === 'cyberpunk' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)'),
                                        color: operationStatus.success ? 
                                            (theme === 'cyberpunk' ? '#10b981' : '#047857') : 
                                            (theme === 'cyberpunk' ? '#ef4444' : '#b91c1c'),
                                        border: theme === 'cyberpunk' ? 
                                            `1px solid ${operationStatus.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}` : 
                                            'none',
                                    }}>
                                        <div className="flex items-center">
                                            <div className="mr-3 flex-shrink-0">
                                                {operationStatus.success ? (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                                    </svg>
                                                ) : (
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <circle cx="12" cy="12" r="10"></circle>
                                                        <line x1="12" y1="8" x2="12" y2="12"></line>
                                                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                                    </svg>
                                                )}
                                            </div>
                                            <span>{operationStatus.message}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {/* Toggle logs button - moved up */}
                            <div className="mb-8 w-full">
                                <div className="text-center">
                                    <button
                                        className="px-4 py-2 rounded-md"
                                        onClick={() => setShowLogs(!showLogs)}
                                        style={{ 
                                            backgroundColor: theme === 'cyberpunk' ? '#2d2d4d' : '#f3f4f6',
                                            color: 'var(--text-color)', 
                                            border: theme === 'corporate' ? '1px solid #000' : 'none',
                                            boxShadow: theme === 'cyberpunk' ? 'var(--neon-glow)' : 'none',
                                            width: '180px'
                                        }}
                                    >
                                        {showLogs ? 'Hide Logs' : 'Show Logs'}
                                    </button>
                                </div>
                                
                                {showLogs && (
                                    <div className="w-full mt-4">
                                        <div
                                            className="border p-4 rounded whitespace-pre overflow-y-scroll"
                                            style={{ 
                                                width: '100%',
                                                height: '400px', 
                                                overflowY: 'scroll',
                                                backgroundColor: theme === 'cyberpunk' ? '#1a1a2e' : '#f8f9fa',
                                                color: theme === 'cyberpunk' ? 'white' : '#333',
                                                border: theme === 'cyberpunk' ? '1px solid var(--accent-color)' : '1px solid #e5e7eb',
                                                boxShadow: theme === 'cyberpunk' ? 'var(--neon-glow)' : 'none',
                                                fontSize: '0.8rem'
                                            }}
                                        >
                                            {logs || 'No logs available.'}
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {/* Add ModelDownload component */}
                            <ModelDownload />
                            
                        </div>
                    </> 
                )}

                {/* StableDiffusion Tab */}
                {activeTab === 'stablediffusion' && (
                    <div className="mt-6 mb-4 flex flex-col items-center">
                        <h2 className="text-2xl font-bold text-center mb-6">Stable Diffusion Web UI</h2>
                        
                        <div className="flex flex-col items-center" style={{ width: '100%', maxWidth: '350px', margin: '0 auto' }}>
                            {/* Simplified Status Card with Toggle Button */}
                            <div className="mb-6 p-4 rounded-lg flex items-center justify-between shadow-sm w-full" style={{
                                backgroundColor: theme === 'cyberpunk' ? 'rgba(26, 26, 46, 0.4)' : 'var(--input-bg)',
                                border: theme === 'cyberpunk' ? '1px solid var(--accent-color)' : '1px solid #e5e7eb',
                                boxShadow: theme === 'cyberpunk' ? 'var(--neon-glow)' : '0 1px 3px rgba(0,0,0,0.1)',
                            }}>
                                {/* Left side: Status indicator */}
                                <div className="flex items-center">
                                    <div className="relative w-6 h-6 mr-2">
                                        <div className="w-6 h-6 rounded-full" style={{
                                            backgroundColor: sdStatus === 'Running' ? '#4ade80' : '#ef4444',
                                            boxShadow: theme === 'cyberpunk' 
                                                ? `0 0 8px ${sdStatus === 'Running' ? '#4ade80' : '#ef4444'}`
                                                : 'none',
                                        }}>
                                            {sdStatus === 'Running' && (
                                                <div className="absolute inset-0 rounded-full animate-ping" style={{
                                                    backgroundColor: '#4ade80',
                                                    opacity: 0.3,
                                                    animationDuration: '2s',
                                                }}></div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-start">
                                        <span className="text-xs opacity-70">SD Web UI</span>
                                        <span className="font-medium text-sm" style={{
                                            color: sdStatus === 'Running' ? '#4ade80' : '#ef4444',
                                            textShadow: theme === 'cyberpunk' 
                                                ? `0 0 3px ${sdStatus === 'Running' ? '#4ade80' : '#ef4444'}`
                                                : 'none',
                                        }}>
                                            {sdStatus}
                                        </span>
                                    </div>
                                </div>
                                
                                {/* Right side: Single toggle button */}
                                <button
                                    className="px-3 py-1.5 rounded text-sm font-medium inline-flex items-center"
                                    onClick={sdStatus === 'Running' ? handleStopStableDiffusion : handleStartStableDiffusion}
                                    disabled={isStartingSD || isStoppingSD}
                                    style={{ 
                                        backgroundColor: sdStatus === 'Running' 
                                            ? 'var(--button-danger)' 
                                            : 'var(--button-primary)',
                                        color: '#ffffff',
                                        boxShadow: theme === 'cyberpunk' 
                                            ? sdStatus === 'Running'
                                                ? '0 0 5px rgba(229, 62, 62, 0.5)' 
                                                : 'var(--neon-glow)'
                                            : 'none',
                                        opacity: (isStartingSD || isStoppingSD) ? 0.7 : 1,
                                        transition: 'all 0.2s ease',
                                        width: '120px',
                                    }}
                                >
                                    {isStartingSD ? (
                                        <><span className="mr-1">Starting</span><Spinner /></>
                                    ) : isStoppingSD ? (
                                        <><span className="mr-1">Stopping</span><Spinner /></>
                                    ) : sdStatus === 'Running' ? (
                                        <>
                                            <svg className="mr-1.5" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="6" y="6" width="12" height="12" rx="2" ry="2"></rect>
                                            </svg>
                                            Stop
                                        </>
                                    ) : (
                                        <>
                                            <svg className="mr-1.5" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                            </svg>
                                            Start
                                        </>
                                    )}
                                </button>
                            </div>
                            
                            {/* Status Messages */}
                            {sdOperationStatus && (
                                <div className="mb-4 px-4 py-3 rounded-md text-sm w-full" style={{
                                    backgroundColor: sdOperationStatus.success ? 
                                        (theme === 'cyberpunk' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)') : 
                                        (theme === 'cyberpunk' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)'),
                                    color: sdOperationStatus.success ? 
                                        (theme === 'cyberpunk' ? '#10b981' : '#047857') : 
                                        (theme === 'cyberpunk' ? '#ef4444' : '#b91c1c'),
                                    border: theme === 'cyberpunk' ? 
                                        `1px solid ${sdOperationStatus.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}` : 
                                        'none',
                                    textAlign: 'center',
                                }}>
                                    <div className="flex items-center justify-center">
                                        <div className="mr-3 flex-shrink-0">
                                            {sdOperationStatus.success ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                                </svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <circle cx="12" cy="12" r="10"></circle>
                                                    <line x1="12" y1="8" x2="12" y2="12"></line>
                                                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                                </svg>
                                            )}
                                        </div>
                                        <span>{sdOperationStatus.message}</span>
                                    </div>
                                </div>
                            )}
                            
                            {/* Web UI Link or Status */}
                            {sdStatus === 'Running' ? (
                                <div className="mb-6 p-4 rounded-md text-center w-full" style={{
                                    backgroundColor: theme === 'cyberpunk' ? 'rgba(26, 26, 46, 0.4)' : 'var(--input-bg)',
                                    border: theme === 'cyberpunk' ? '1px solid var(--accent-color)' : '1px solid #e5e7eb',
                                }}>
                                    <p className="text-sm mb-2">Stable Diffusion Web UI is running at:</p>
                                    <a 
                                        href="http://localhost:7860" 
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center text-sm font-medium"
                                        style={{
                                            color: theme === 'cyberpunk' ? '#50e3c2' : '#3b82f6',
                                            textShadow: theme === 'cyberpunk' ? '0 0 3px #50e3c2' : 'none',
                                        }}
                                    >
                                        <svg className="mr-1.5" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                            <polyline points="15 3 21 3 21 9"></polyline>
                                            <line x1="10" y1="14" x2="21" y2="3"></line>
                                        </svg>
                                        Open in New Tab
                                    </a>
                                </div>
                            ) : (
                                <div className="mb-6 p-4 rounded-md text-center w-full" style={{
                                    backgroundColor: theme === 'cyberpunk' ? 'rgba(26, 26, 46, 0.4)' : 'var(--input-bg)',
                                    border: theme === 'cyberpunk' ? '1px solid var(--accent-color)' : '1px solid #e5e7eb',
                                    color: 'var(--text-secondary)',
                                }}>
                                    <p className="text-sm">Stable Diffusion Web UI is not running</p>
                                    <p className="text-xs mt-1">Press Start to launch the UI</p>
                                </div>
                            )}
                            
                            {/* Logs Toggle Button */}
                            <div className="mt-4 text-center w-full flex justify-center">
                                <button 
                                    className="px-3 py-1.5 rounded text-sm font-medium inline-flex items-center justify-center"
                                    onClick={() => setShowSdLogs(!showSdLogs)}
                                    style={{ 
                                        backgroundColor: theme === 'cyberpunk' ? '#2d2d4d' : '#f3f4f6',
                                        color: 'var(--text-color)', 
                                        boxShadow: theme === 'cyberpunk' ? 'var(--neon-glow)' : 'none',
                                        width: '120px',
                                    }}
                                >
                                    <svg className="mr-1.5" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-6"></path>
                                        <polyline points="14 2 14 8 20 8"></polyline>
                                        <line x1="16" y1="13" x2="8" y2="13"></line>
                                        <line x1="16" y1="17" x2="8" y2="17"></line>
                                        <line x1="10" y1="9" x2="8" y2="9"></line>
                                    </svg>
                                    {showSdLogs ? 'Hide Logs' : 'Show Logs'}
                                </button>
                            </div>
                        </div>
                        
                        {/* Logs Display */}
                        {showSdLogs && (
                            <div style={{ width: '80%', maxWidth: '800px', margin: '20px auto 0' }}>
                                <div className="mx-auto">
                                    <div
                                        className="border p-3 rounded whitespace-pre overflow-y-scroll"
                                        style={{ 
                                            height: '300px', 
                                            overflowY: 'scroll',
                                            backgroundColor: theme === 'cyberpunk' ? '#1a1a2e' : '#f8f9fa',
                                            color: theme === 'cyberpunk' ? 'white' : '#333',
                                            border: theme === 'cyberpunk' ? '1px solid var(--accent-color)' : '1px solid #e5e7eb',
                                            boxShadow: theme === 'cyberpunk' ? 'var(--neon-glow)' : 'none',
                                            fontSize: '0.75rem',
                                            textAlign: 'left' // Keep logs left-aligned for readability
                                        }}
                                    >
                                        {sdLogs || 'No logs available yet.'}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Allowlist Tab */}
                {activeTab === 'allowlist' && (
                    <div className="mt-6">
                        {/* This would normally just include the AllowlistForm component */}
                    </div>
                )}
            </div>
        </>
    );
};

export default ConfigForm;
