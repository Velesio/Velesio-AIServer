import { useState, useEffect } from 'react';
import { useTheme } from '../context/useTheme';

const Spinner = () => (
    <div className="inline-block animate-spin rounded-full border-4 border-solid border-current border-r-transparent h-5 w-5 ml-1" 
         style={{ borderColor: 'white transparent white transparent' }}></div>
);

const StableDiffusionForm = () => {
    const { theme } = useTheme();
    const [sdStatus, setSdStatus] = useState('Unknown');
    const [sdLogs, setSdLogs] = useState('');
    const [isStartingSD, setIsStartingSD] = useState(false);
    const [isStoppingSD, setIsStoppingSD] = useState(false);
    const [sdOperationStatus, setSdOperationStatus] = useState<{message: string, success: boolean} | null>(null);
    const [showSdLogs, setShowSdLogs] = useState(false);

    const getApiBaseUrl = () => {
        return '/api';
    };

    const getContainerStyle = () => theme === 'cyberpunk'
        ? {
            backgroundColor: 'var(--primary-bg)',
            boxShadow: 'var(--neon-glow)',
            border: '1px solid var(--accent-color)',
            borderRadius: '1rem'
          }
        : {
            backgroundColor: 'var(--primary-bg)',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb',
            borderRadius: '1rem'
          };

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const response = await fetch(`${getApiBaseUrl()}/stats/`);
                const data = await response.json();
                setSdStatus(data.sd_running ? 'Running' : 'Stopped');
            } catch {
                setSdStatus('Stopped');
            }
        };

        const interval = setInterval(checkStatus, 3000);
        checkStatus();
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const checkSdWebUI = async () => {
            try {
                const response = await fetch('http://localhost:7860/api/endpoint');
                await response.json();
            } catch {
            }
        };

        if (sdStatus === 'Running') {
            const interval = setInterval(checkSdWebUI, 5000);
            checkSdWebUI();
            return () => clearInterval(interval);
        }
    }, [sdStatus]);
    
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

        if (showSdLogs) {
            const logInterval = setInterval(fetchSdLogs, 5000);
            fetchSdLogs();
            return () => clearInterval(logInterval);
        }
    }, [showSdLogs]);

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
        <div
            className="p-6 space-y-6 rounded-2xl shadow-lg"
            style={{
                width: '100%',
                maxWidth: 'calc(100% - 100px)',
                margin: '1.5rem auto',
                marginLeft: '90px', // account for navbar
                ...getContainerStyle()
            }}
        >
            <h2 className="text-2xl font-bold text-center mb-6">Stable Diffusion Web UI</h2>
            
            <div className="flex justify-center items-center mt-10 mb-10 flex-col gap-6" style={{width: '100%', margin: '0 auto', textAlign: 'center'}}>
                <div className="mb-4 flex items-center justify-between w-full max-w-md">
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
                    </div>
                    
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center',
                        gap: '20px'
                    }}>
                        <button
                            className="px-4 py-2 rounded-full text-sm font-medium inline-flex items-center"
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

                        <button
                            className="px-4 py-2 rounded-full text-sm font-medium inline-flex items-center"
                            onClick={() => setShowSdLogs(!showSdLogs)}
                            style={{ 
                                backgroundColor: theme === 'cyberpunk' ? '#2d2d4d' : '#f3f4f6',
                                color: 'var(--text-color)', 
                                border: theme === 'corporate' ? '1px solid #000' : 'none',
                                boxShadow: theme === 'cyberpunk' ? 'var(--neon-glow)' : 'none',
                                width: '120px',
                                transition: 'all 0.2s ease',
                            }}
                        >
                            <svg className="mr-1.5" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-6"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="16" y1="13" x2="8" y2="13"></line>
                                <line x1="16" y1="17" x2="8" y2="17"></line>
                                <line x1="10" y1="9" x2="8" y2="9"></line>
                            </svg>
                            {showSdLogs ? 'Hide' : 'Logs'}
                        </button>
                    </div>
                </div>
                
                {sdOperationStatus && (
                    <div className="px-4 py-3 rounded-xl text-sm max-w-md w-full" style={{
                        maxWidth: '450px',
                        margin: '0 auto',
                        backgroundColor: sdOperationStatus.success ? 
                            (theme === 'cyberpunk' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)') : 
                            (theme === 'cyberpunk' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)'),
                        color: sdOperationStatus.success ? 
                            (theme === 'cyberpunk' ? '#10b981' : '#047857') : 
                            (theme === 'cyberpunk' ? '#ef4444' : '#b91c1c'),
                        border: theme === 'cyberpunk' ? 
                            `1px solid ${sdOperationStatus.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}` : 
                            'none',
                    }}>
                        <div className="flex items-center">
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
                
                {sdStatus === 'Running' && (
                    <div className="mb-6 p-4 rounded-xl text-center w-full max-w-md" style={{
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
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1-2-2h6"></path>
                                <polyline points="15 3 21 3 21 9"></polyline>
                                <line x1="10" y1="14" x2="21" y2="3"></line>
                            </svg>
                            Open in New Tab
                        </a>
                    </div>
                )}
            </div>
            
            {showSdLogs && (
                <div className="w-full mt-6 mb-12">
                    <div
                        className="border p-4 rounded-xl whitespace-pre overflow-y-scroll"
                        style={{ 
                            width: '100%',
                            height: '400px', 
                            overflowY: 'scroll',
                            backgroundColor: theme === 'cyberpunk' ? '#1a1a2e' : '#f8f9fa',
                            color: theme === 'cyberpunk' ? 'white' : '#333',
                            border: theme === 'cyberpunk' ? '1px solid var(--accent-color)' : '1px solid #e5e7eb',
                            boxShadow: theme === 'cyberpunk' ? 'var(--neon-glow)' : 'none',
                            fontSize: '0.8rem',
                            textAlign: 'left'
                        }}
                    >
                        {sdLogs || 'No logs available yet.'}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StableDiffusionForm;