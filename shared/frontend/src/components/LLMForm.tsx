import { useState, useEffect } from 'react';
import { useTheme } from '../context/useTheme';
import ServerStats from './ServerStarts';  // Import the ServerStats component
import Navbar from './Navbar';  // Import the Navbar component
import StableDiffusionForm from './StableDiffusionForm'; // Import the new StableDiffusionForm component
import IPAccessControlPanel from './AllowlistForm'; // Import the IP Access Control Panel component

// Spinning loader component
const Spinner = () => (
    <div className="inline-block animate-spin rounded-full border-4 border-solid border-current border-r-transparent h-5 w-5 ml-1" 
         style={{ borderColor: 'white transparent white transparent' }}></div>
);

interface LLMFormProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

const LLMForm = ({ activeTab, setActiveTab }: LLMFormProps) => {
    const { theme, toggleTheme } = useTheme();
    const [model, setModel] = useState('model');
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [host, setHost] = useState('0.0.0.0');
    const [port, setPort] = useState(1337);
    const [ngl, setNgl] = useState(30);
    const [template, setTemplate] = useState('chatml');
    const [customParams, setCustomParams] = useState('');
    const [serverStatus, setServerStatus] = useState('Unknown');
    const [logs, setLogs] = useState('');
    const [isStarting, setIsStarting] = useState(false);
    const [isStopping, setIsStopping] = useState(false);
    const [operationStatus, setOperationStatus] = useState<{message: string, success: boolean} | null>(null);
    const [showLogs, setShowLogs] = useState(false);

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
            } catch {
                // Any error means the server is not running
                setServerStatus('Stopped');
            }
        };

        const interval = setInterval(checkStatus, 3000);
        checkStatus();
        return () => clearInterval(interval);
    }, []);

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

    return (
        <>
            <Navbar 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
                toggleTheme={toggleTheme} 
            />
            
            <div className="p-6 space-y-6 rounded-lg shadow-lg" style={{ 
                width: '100%', 
                maxWidth: 'calc(100% - 100px)',
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

                        {/* Host, Port, GPU Layers, and Template in two rows, two per row */}
                        <div style={{ width: '550px', margin: '1.5rem auto', marginBottom: '2.5rem' }}>
                            {/* First row: Host and Port */}
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: '1.5rem' }}>
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
                            </div>
                            
                            {/* Second row: GPU Layers and Template */}
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
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
                        </div>

                        {/* Custom Parameters input */}
                        <div className="mt-6" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <label className="block mb-1">Custom Parameters (Optional):</label>
                            <input
                                type="text"
                                value={customParams}
                                onChange={(e) => setCustomParams(e.target.value)}
                                style={{ ...getInputStyle(), width: '300px', textAlign: 'center' }}
                            />
                        </div>

                        {/* Server status and control button */}
                        <div className="mt-14 mb-14" style={{ textAlign: 'center', width: '100%' }}>
                            <div style={{ display: 'block', width: '320px', margin: '0 auto', textAlign: 'center' }}>
                                {/* Status indicator */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
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
                                    <div className="flex flex-col">
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
                                
                                {/* Buttons container - placed side by side */}
                                <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'center', 
                                    gap: '20px', 
                                    margin: '0 auto'
                                }}>
                                    {/* Toggle button */}
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
                                    
                                    {/* Log toggle button */}
                                    <button
                                        className="px-4 py-2 rounded-md"
                                        onClick={() => setShowLogs(!showLogs)}
                                        style={{ 
                                            backgroundColor: theme === 'cyberpunk' ? '#2d2d4d' : '#f3f4f6',
                                            color: 'var(--text-color)', 
                                            border: theme === 'corporate' ? '1px solid #000' : 'none',
                                            boxShadow: theme === 'cyberpunk' ? 'var(--neon-glow)' : 'none',
                                            width: '140px',
                                        }}
                                    >
                                        <div className="flex items-center justify-center">
                                            <svg className="mr-1.5" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-6"></path>
                                                <polyline points="14 2 14 8 20 8"></polyline>
                                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                                <line x1="10" y1="9" x2="8" y2="9"></line>
                                            </svg>
                                            {showLogs ? 'Hide' : 'Logs'}
                                        </div>
                                    </button>
                                </div>
                            </div>
                            
                            {/* Operation status message */}
                            {operationStatus && (
                                <div className="px-4 py-3 rounded-md text-sm mt-4" style={{
                                    maxWidth: '450px',
                                    margin: '0 auto',
                                    textAlign: 'center',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    backgroundColor: operationStatus.success ? 
                                        (theme === 'cyberpunk' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)') : 
                                        (theme === 'cyberpunk' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)'),
                                    color: operationStatus.success ? 
                                        (theme === 'cyberpunk' ? '#10b981' : '#047857') : 
                                        (theme === 'cyberpunk' ? '#ef4444' : '#b91c1c'),
                                    border: theme === 'cyberpunk' ? 
                                        `1px solid ${operationStatus.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}` : 
                                        'none',
                                }}
                                >
                                    <div className="flex items-center justify-center">
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
                        
                        {/* Log display */}
                        {showLogs && (
                            <div className="w-full mt-6 mb-12">
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
                    </> 
                )}

                {/* StableDiffusion Tab */}
                {activeTab === 'stablediffusion' && (
                    <StableDiffusionForm />
                )}

                {/* Allowlist Tab */}
                {activeTab === 'allowlist' && (
                    <div className="mt-6">
                        <IPAccessControlPanel />
                    </div>
                )}
            </div>
        </>
    );
};

export default LLMForm;
