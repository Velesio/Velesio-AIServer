import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../context/useTheme';

// Define the structure for instance information from the backend
interface InstanceConfig {
    model: string;
    external_port: number;
    host: string;
    ngl: number;
    template: string;
    custom_params: string;
}

interface InstanceInfo {
    config: InstanceConfig;
    log_file: string;
    status: 'running' | 'stopped'; // Assuming status is always 'running' if listed here
    pid: number;
    internal_port: number;
}

// Define the structure for the list of running instances
type RunningInstances = Record<string, InstanceInfo>; // Key is the external port (as string)

// Available external ports (should match backend/nginx)
const AVAILABLE_EXTERNAL_PORTS = [1337, 1339, 1341, 1343, 1345];

// Spinning loader component
const Spinner = () => (
    <div className="inline-block animate-spin rounded-full border-4 border-solid border-current border-r-transparent h-5 w-5 ml-1"
         style={{ borderColor: 'white transparent white transparent' }}></div>
);

const LLMForm = () => {
    const { theme } = useTheme();
    // Form state for creating a new instance
    const [model, setModel] = useState(''); // Default to empty, user must select
    const [availableModels, setAvailableModels] = useState<string[]>([]);
    const [selectedExternalPort, setSelectedExternalPort] = useState<number>(AVAILABLE_EXTERNAL_PORTS[0]); // Default to the first available
    const [ngl, setNgl] = useState(30);
    const [template, setTemplate] = useState('chatml');
    const [customParams, setCustomParams] = useState('');

    // Instance management state
    const [runningInstances, setRunningInstances] = useState<RunningInstances>({});
    const [instanceLogs, setInstanceLogs] = useState<Record<number, string>>({}); // Store logs per external port
    const [viewingLogsForPort, setViewingLogsForPort] = useState<number | null>(null);
    const [isStarting, setIsStarting] = useState(false);
    const [stoppingPorts, setStoppingPorts] = useState<Record<number, boolean>>({}); // Track stopping state per port
    const [loadingLogsPort, setLoadingLogsPort] = useState<number | null>(null); // Track which logs are loading

    // General UI state
    const [operationStatus, setOperationStatus] = useState<{ message: string, success: boolean } | null>(null);

    // Theme-based styles
    const getContainerStyle = () => {
        return theme === 'cyberpunk'
            ? {
                backgroundColor: 'var(--primary-bg)',
                boxShadow: 'var(--neon-glow)',
                border: '1px solid var(--accent-color)',
                borderRadius: '1rem'
              }
            : {
                backgroundColor: 'var(--primary-bg)',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                borderRadius: '1rem' // Ensure consistent rounding
            };
    };

    const getInputStyle = () => {
        return theme === 'cyberpunk'
            ? {
                backgroundColor: 'var(--secondary-bg)',
                color: 'var(--text-color)',
                border: '1px solid var(--accent-color)',
                borderRadius: '0.5rem',
                padding: '0.5rem 1rem',
                outline: 'none',
                transition: 'border-color 0.3s ease',
              }
            : {
                backgroundColor: '#fff',
                color: '#333',
                border: '1px solid #ccc',
                borderRadius: '0.5rem',
                padding: '0.5rem 1rem',
                outline: 'none',
                transition: 'border-color 0.3s ease',
            };
    };

    // Helper function to get the API base URL
    const getApiBaseUrl = () => {
        // In production, use relative URLs that will work in any environment
        return '/api';
    };

    // Fetch running instances periodically
    const fetchRunningInstances = useCallback(async () => {
        try {
            const response = await fetch(`${getApiBaseUrl()}/list-llm-instances/`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data: RunningInstances = await response.json();
            setRunningInstances(data);

            // Update available ports for the form
            const usedPorts = Object.keys(data).map(Number);
            const freePorts = AVAILABLE_EXTERNAL_PORTS.filter(p => !usedPorts.includes(p));
            if (freePorts.length > 0 && !freePorts.includes(selectedExternalPort)) {
                setSelectedExternalPort(freePorts[0]); // Default to first available if current selection is taken
            } else if (freePorts.length === 0) {
                 // Handle case where no ports are free, maybe disable start button?
                 // For now, just keep the last selection or default
                 if (!selectedExternalPort && AVAILABLE_EXTERNAL_PORTS.length > 0) {
                     setSelectedExternalPort(AVAILABLE_EXTERNAL_PORTS[0]);
                 }
            }

        } catch (error) {
            console.error('Failed to fetch running instances:', error);
            setRunningInstances({}); // Clear instances on error
            setOperationStatus({ message: 'Failed to fetch instance status.', success: false });
        }
    }, [selectedExternalPort]); // Add selectedExternalPort dependency

    useEffect(() => {
        const interval = setInterval(fetchRunningInstances, 5000); // Poll every 5 seconds
        fetchRunningInstances(); // Initial fetch
        return () => clearInterval(interval);
    }, [fetchRunningInstances]);

    // Fetch logs when viewingLogsForPort changes
    useEffect(() => {
        const fetchLogs = async () => {
            if (viewingLogsForPort === null) return;

            setLoadingLogsPort(viewingLogsForPort);
            setInstanceLogs(prev => ({ ...prev, [viewingLogsForPort]: 'Loading logs...' })); // Show loading state

            try {
                const response = await fetch(`${getApiBaseUrl()}/llm-logs/?external_port=${viewingLogsForPort}`);
                if (!response.ok) {
                     throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.text();
                setInstanceLogs(prev => ({ ...prev, [viewingLogsForPort]: data || 'Log file is empty or not found.' }));
            } catch (error) {
                console.error(`Failed to fetch logs for port ${viewingLogsForPort}:`, error);
                setInstanceLogs(prev => ({ ...prev, [viewingLogsForPort]: `Error fetching logs for port ${viewingLogsForPort}.` }));
            } finally {
                 setLoadingLogsPort(null);
            }
        };

        fetchLogs(); // Fetch immediately when port changes

        // Optional: Set up an interval to auto-refresh logs if needed
        // const logInterval = setInterval(fetchLogs, 5000);
        // return () => clearInterval(logInterval);

    }, [viewingLogsForPort]);

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

    const handleStartInstance = async () => {
        if (!model) {
             setOperationStatus({ message: 'Please select a model.', success: false });
             return;
        }
        const usedPorts = Object.keys(runningInstances).map(Number);
        if (usedPorts.includes(selectedExternalPort)) {
            setOperationStatus({ message: `Port ${selectedExternalPort} is already in use.`, success: false });
            return;
        }

        setIsStarting(true);
        setOperationStatus(null);

        const instanceConfig = {
            model: model.trim(),
            external_port: selectedExternalPort,
            ngl,
            template,
            custom_params: customParams.trim(),
        };

        try {
            const response = await fetch(`${getApiBaseUrl()}/start-llm-instance/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(instanceConfig)
            });

            const responseData = await response.json(); // Read response body regardless of status

            if (response.ok) {
                setOperationStatus({
                    message: `Instance on port ${selectedExternalPort} started successfully!`,
                    success: true
                });
                await fetchRunningInstances(); // Refresh instance list
            } else {
                setOperationStatus({
                    message: `Failed to start instance: ${responseData.detail || 'Unknown error'}`,
                    success: false
                });
            }
        } catch (error) {
             console.error("Start instance error:", error);
            setOperationStatus({
                message: 'Network error or backend unavailable. Please try again.',
                success: false
            });
        } finally {
            setIsStarting(false);
        }
    };

    const handleStopInstance = async (externalPort: number) => {
        setStoppingPorts(prev => ({ ...prev, [externalPort]: true }));
        setOperationStatus(null);
        // If logs for this instance were open, close them
        if (viewingLogsForPort === externalPort) {
            setViewingLogsForPort(null);
        }

        try {
            const response = await fetch(`${getApiBaseUrl()}/stop-llm-instance/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ external_port: externalPort })
            });

            const responseData = await response.json(); // Read response body

            if (response.ok) {
                setOperationStatus({
                    message: `Instance on port ${externalPort} stopped successfully!`,
                    success: true
                });
                // Remove logs for the stopped instance
                setInstanceLogs(prev => {
                    const newLogs = { ...prev };
                    delete newLogs[externalPort];
                    return newLogs;
                });
            } else {
                setOperationStatus({
                    message: `Failed to stop instance ${externalPort}: ${responseData.detail || 'Unknown error'}`,
                    success: false
                });
            }
        } catch (error) {
             console.error("Stop instance error:", error);
            setOperationStatus({
                message: `Network error stopping instance ${externalPort}. Please try again.`,
                success: false
            });
        } finally {
            setStoppingPorts(prev => ({ ...prev, [externalPort]: false }));
            await fetchRunningInstances(); // Refresh instance list regardless of success/fail
        }
    };

    const handleToggleLogs = (externalPort: number) => {
        if (viewingLogsForPort === externalPort) {
            setViewingLogsForPort(null); // Close if already viewing
        } else {
            setViewingLogsForPort(externalPort); // Open for this port
        }
    };

    // Calculate available ports for the dropdown
    const usedPorts = Object.keys(runningInstances).map(Number);
    const freePorts = AVAILABLE_EXTERNAL_PORTS.filter(p => !usedPorts.includes(p));

    return (
        <div className="p-6 space-y-6 rounded-2xl shadow-lg" style={{ ...getContainerStyle() }}>
            <h2 className="text-2xl font-semibold mb-6 text-center" style={{ color: 'var(--text-color)' }}>
                Manage LLM Instances
            </h2>

            {/* Section for Creating New Instance */}
            <div className="p-4 border rounded-lg mb-8" style={{ borderColor: theme === 'cyberpunk' ? 'var(--accent-color)' : '#e5e7eb' }}>

                {/* Model Selection */}
                <div style={{ width: '100%', maxWidth: '550px', margin: '1rem auto', marginBottom: '1.5rem' }}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ flex: '1 1 180px', minWidth: '180px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <label className="block mb-1">Model:</label>
                            <select
                                onChange={(e) => setModel(e.target.value)}
                                value={model}
                                style={{ ...getInputStyle(), width: '180px', textAlign: 'center' }}
                                required // Make model selection mandatory
                            >
                                <option value="" disabled>-- Select Model --</option>
                                {availableModels.map((m) => (
                                    <option key={m} value={m}>
                                        {m}
                                    </option>
                                ))}
                            </select>
                        </div>
                         <div style={{ flex: '1 1 180px', minWidth: '180px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <label className="block mb-1">External Port:</label>
                            <select
                                value={selectedExternalPort}
                                onChange={(e) => setSelectedExternalPort(Number(e.target.value))}
                                style={{ ...getInputStyle(), width: '180px', textAlign: 'center' }}
                                disabled={freePorts.length === 0 || isStarting}
                            >
                                {freePorts.length === 0 && <option value="">-- No Ports Available --</option>}
                                {freePorts.map(port => (
                                    <option key={port} value={port}>{port}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                 {/* GPU Layers and Template */}
                <div style={{ width: '100%', maxWidth: '550px', margin: '1.5rem auto', marginBottom: '1.5rem' }}>
                    <div style={{ display: "flex", justifyContent: "space-between", flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ flex: '1 1 180px', minWidth: '180px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <label className="block mb-1">GPU Layers:</label>
                            <input
                                type="number"
                                value={ngl}
                                onChange={(e) => setNgl(Number(e.target.value))}
                                style={{ ...getInputStyle(), width: '180px', textAlign: 'center' }}
                                disabled={isStarting}
                            />
                        </div>
                        <div style={{ flex: '1 1 180px', minWidth: '180px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <label className="block mb-1">Template:</label>
                            <input
                                type="text"
                                value={template}
                                onChange={(e) => setTemplate(e.target.value)}
                                style={{ ...getInputStyle(), width: '180px', textAlign: 'center' }}
                                disabled={isStarting}
                            />
                        </div>
                    </div>
                </div>

                {/* Custom Parameters input */}
                <div className="mt-4 mb-4" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <label className="block mb-1">Custom Parameters (Optional):</label>
                    <input
                        type="text"
                        value={customParams}
                        onChange={(e) => setCustomParams(e.target.value)}
                        style={{ ...getInputStyle(), width: '300px', textAlign: 'center' }}
                        disabled={isStarting}
                        placeholder='e.g. --verbose --mlock'
                    />
                </div>

                {/* Start Button */}
                 <div className="mt-6 mb-4 text-center"> {/* Added text-center */}
                     <button
                        className="px-6 py-2 rounded-full text-md font-medium inline-flex items-center justify-center"
                        onClick={handleStartInstance}
                        disabled={isStarting || freePorts.length === 0 || !model}
                        style={{
                            backgroundColor: 'var(--button-primary)',
                            color: '#ffffff',
                            boxShadow: theme === 'cyberpunk' ? 'var(--neon-glow)' : 'none',
                            opacity: (isStarting || freePorts.length === 0 || !model) ? 0.6 : 1,
                            transition: 'all 0.2s ease',
                            width: '200px', // Wider button
                        }}
                    >
                        {isStarting ? (
                            <><span className="mr-1">Starting...</span><Spinner /></>
                        ) : (
                            <>
                                <svg className="mr-1.5" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                </svg>
                                Start Instance
                            </>
                        )}
                    </button>
                 </div>
            </div>


            {/* Section for Running Instances */}
            <div className="mt-8 w-full max-w-2xl mx-auto"> {/* Added mx-auto to center the container */}
                <h3 className="text-xl font-medium mb-4 text-center" style={{ color: 'var(--text-color)' }}> {/* Added text-center */}
                    Running Instances ({Object.keys(runningInstances).length})
                </h3>
                {Object.keys(runningInstances).length === 0 ? (
                    <p className="text-center" style={{ color: 'var(--text-color-secondary)' }}>No LLM instances are currently running.</p>
                ) : (
                    <div className="space-y-4">
                        {Object.entries(runningInstances).map(([portStr, instance]) => {
                            const port = Number(portStr);
                            const isStopping = stoppingPorts[port] || false;
                            const isViewingLogs = viewingLogsForPort === port;
                            const isLoadingLogs = loadingLogsPort === port;

                            return (
                                <div key={port} className="p-4 border rounded-lg" style={{ borderColor: theme === 'cyberpunk' ? 'var(--accent-color)' : '#e5e7eb', backgroundColor: 'var(--secondary-bg)' }}>
                                    <div className="flex flex-wrap justify-between items-center gap-4">
                                        <div>
                                            <span className="font-semibold" style={{ color: 'var(--text-color)' }}>Port: {port}</span>
                                            <p className="text-sm" style={{ color: 'var(--text-color-secondary)' }}>Model: {instance.config.model}</p>
                                            <p className="text-sm" style={{ color: 'var(--text-color-secondary)' }}>Template: {instance.config.template}, NGL: {instance.config.ngl}</p>
                                            {instance.config.custom_params && <p className="text-sm" style={{ color: 'var(--text-color-secondary)' }}>Params: {instance.config.custom_params}</p>}
                                        </div>
                                        <div className="flex gap-2 flex-wrap">
                                            {/* Stop Button */}
                                            <button
                                                className="px-3 py-1.5 rounded-full text-xs font-medium inline-flex items-center justify-center"
                                                onClick={() => handleStopInstance(port)}
                                                disabled={isStopping}
                                                style={{
                                                    backgroundColor: 'var(--button-danger)',
                                                    color: '#ffffff',
                                                    opacity: isStopping ? 0.7 : 1,
                                                    minWidth: '80px', // Ensure minimum width
                                                }}
                                            >
                                                {isStopping ? (
                                                    <><span className="mr-1">Stopping</span><Spinner /></>
                                                ) : (
                                                    <>
                                                        <svg className="mr-1" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <rect x="6" y="6" width="12" height="12" rx="2" ry="2"></rect>
                                                        </svg>
                                                        Stop
                                                    </>
                                                )}
                                            </button>
                                            {/* Logs Button */}
                                            <button
                                                className="px-3 py-1.5 rounded-full text-xs font-medium inline-flex items-center justify-center"
                                                onClick={() => handleToggleLogs(port)}
                                                disabled={isStopping || isLoadingLogs} // Disable if stopping or logs are loading
                                                style={{
                                                    backgroundColor: isViewingLogs ? (theme === 'cyberpunk' ? '#4a4a8a' : '#e5e7eb') : (theme === 'cyberpunk' ? '#2d2d4d' : '#f3f4f6'),
                                                    color: 'var(--text-color)',
                                                    border: theme === 'corporate' ? '1px solid #000' : 'none',
                                                    minWidth: '80px', // Ensure minimum width
                                                }}
                                            >
                                                {isLoadingLogs ? (
                                                     <><span className="mr-1">Loading</span><Spinner /></>
                                                ) : (
                                                    <>
                                                        <svg className="mr-1" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline>
                                                        </svg>
                                                        {isViewingLogs ? 'Hide' : 'Logs'}
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Log display for this instance */}
                                    {isViewingLogs && (
                                        <div className="w-full mt-4">
                                             <h4 className="text-sm font-medium mb-2" style={{ color: 'var(--text-color)' }}>Logs for Port {port}</h4>
                                            <div
                                                className="border p-3 rounded-lg whitespace-pre-wrap break-words overflow-y-scroll" // Changed to pre-wrap and break-words
                                                style={{
                                                    width: '100%',
                                                    maxHeight: '300px', // Limit height
                                                    overflowY: 'scroll',
                                                    backgroundColor: theme === 'cyberpunk' ? '#1a1a2e' : '#f8f9fa',
                                                    color: theme === 'cyberpunk' ? '#e0e0e0' : '#333', // Slightly lighter text for cyberpunk logs
                                                    border: theme === 'cyberpunk' ? '1px solid var(--accent-color)' : '1px solid #e5e7eb',
                                                    fontSize: '0.75rem', // Smaller font for logs
                                                    fontFamily: 'monospace' // Monospace font for logs
                                                }}
                                            >
                                                {instanceLogs[port] || 'No logs available or still loading...'}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>


            {/* Operation status message (centralized) */}
            {operationStatus && (
                <div className="px-4 py-3 rounded-xl text-sm mt-6 w-full max-w-2xl mx-auto" style={{
                    margin: '1.5rem auto 0 auto',
                    textAlign: 'center',
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
    );
};

export default LLMForm;
