import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useTheme } from '../context/useTheme';
import ModelDownload from './ModelDownload'; // Import the ModelDownload component

const Spinner = () => (
    <div className="inline-block animate-spin rounded-full border-4 border-solid border-current border-r-transparent h-5 w-5 ml-2"
         style={{ borderColor: 'currentColor transparent currentColor transparent' }}></div>
);

// Create a reusable component for the IP tables
const IPTable = ({ 
    title, 
    ipList, 
    actionType, 
    removeIP, 
    theme 
}: { 
    title: string; 
    ipList: string[]; 
    actionType: 'allow' | 'block'; 
    removeIP: (ip: string, type: 'allow' | 'block') => Promise<void>; 
    theme: string;
}) => {
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-semibold" style={{ color: 'var(--text-color)' }}>{title}</h3>
                <span className="text-sm py-1 px-3 rounded-full" style={{ 
                    backgroundColor: theme === 'cyberpunk' ? 'rgba(157, 78, 221, 0.2)' : '#f3f4f6',
                    color: 'var(--text-secondary)'
                }}>
                    {ipList.length} IPs
                </span>
            </div>
            
            {ipList.length > 0 ? (
                <div className="overflow-hidden rounded-xl shadow-sm" style={{ 
                    border: theme === 'cyberpunk' ? '1px solid rgba(157, 78, 221, 0.3)' : '1px solid rgba(229, 231, 235, 0.5)',
                }}>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y" style={{
                            borderCollapse: 'collapse',
                            width: '100%',
                            color: 'var(--text-color)',
                            borderColor: theme === 'cyberpunk' ? 'rgba(157, 78, 221, 0.2)' : 'rgba(229, 231, 235, 0.5)',
                        }}>
                            <thead style={{ backgroundColor: theme === 'cyberpunk' ? 'rgba(45, 45, 77, 0.5)' : '#f9fafb' }}>
                                <tr>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>#</th>
                                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>IP Address</th>
                                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y" style={{
                                backgroundColor: theme === 'cyberpunk' ? 'rgba(26, 26, 46, 0.4)' : '#ffffff',
                                borderColor: theme === 'cyberpunk' ? 'rgba(157, 78, 221, 0.2)' : 'rgba(229, 231, 235, 0.5)',
                            }}>
                                {ipList.map((ip, index) => (
                                    <tr key={`${actionType}-${ip}-${index}`} style={{
                                        transition: 'all 0.2s ease',
                                        backgroundColor: index % 2 !== 0 
                                            ? (theme === 'cyberpunk' ? 'rgba(45, 45, 77, 0.3)' : '#f9fafb')
                                            : 'transparent'
                                    }}>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">{index + 1}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-mono">{ip}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                                            <button
                                                onClick={() => removeIP(ip, actionType)}
                                                className="inline-flex items-center px-3 py-1 rounded-full"
                                                style={{ 
                                                    color: theme === 'cyberpunk' ? '#f87171' : '#dc2626',
                                                    backgroundColor: theme === 'cyberpunk' ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2',
                                                    transition: 'all 0.2s ease'
                                                }}
                                                aria-label={`Remove ${actionType === 'allow' ? 'allowed' : 'blocked'} IP ${ip}`}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                                Remove
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="text-center p-6 rounded-xl flex flex-col items-center justify-center" style={{
                    backgroundColor: theme === 'cyberpunk' ? 'rgba(26, 26, 46, 0.4)' : 'var(--input-bg)',
                    border: theme === 'cyberpunk' ? '1px dashed rgba(157, 78, 221, 0.3)' : '1px dashed #d1d5db',
                    color: 'var(--text-secondary)',
                    minHeight: '12rem'
                }}>
                    <div className="w-12 h-12 mb-4 rounded-full flex items-center justify-center" style={{
                        backgroundColor: actionType === 'allow' 
                            ? (theme === 'cyberpunk' ? 'rgba(16, 185, 129, 0.2)' : '#ecfdf5')
                            : (theme === 'cyberpunk' ? 'rgba(157, 78, 221, 0.2)' : '#f3f3f3'),
                        color: actionType === 'allow' ? '#10b981' : (theme === 'cyberpunk' ? '#c77dff' : '#6366f1')
                    }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {actionType === 'allow' ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                            )}
                        </svg>
                    </div>
                    <p className="font-medium text-base mb-1">
                        {actionType === 'allow' ? 'Open Access Mode Active' : 'No IPs are currently blocked'}
                    </p>
                    <p className="text-sm">
                        {actionType === 'allow' 
                            ? 'Add IPs to the allow list to restrict access' 
                            : 'Add IPs to the block list using the form above'}
                    </p>
                </div>
            )}
        </div>
    );
};

// Unique identifier for this component
const COMPONENT_UNIQUE_CLASS = 'ip-access-control-panel-root';

const IPAccessControlPanel = () => {
    const { theme } = useTheme();
    const [ipList, setIpList] = useState<string[]>([]);
    const [blockedIPs, setBlockedIPs] = useState<string[]>([]);
    const [ipToAdd, setIpToAdd] = useState('');
    const [isAddingAllow, setIsAddingAllow] = useState(false);
    const [isAddingBlock, setIsAddingBlock] = useState(false);
    const [actionType, setActionType] = useState<'allow' | 'block'>('allow');
    const [statusMessage, setStatusMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    
    // Track if this instance should render content
    const [shouldRender, setShouldRender] = useState(true);
    const componentRef = useRef<HTMLDivElement>(null);
    
    // Check for duplicates before initial render
    useLayoutEffect(() => {
        const existingInstances = document.getElementsByClassName(COMPONENT_UNIQUE_CLASS);
        
        // If this is not the first instance, don't render
        if (existingInstances.length > 0 && componentRef.current !== existingInstances[0]) {
            setShouldRender(false);
        }
    }, []);
    
    useEffect(() => {
        // Only fetch data if this is the instance that should render
        if (shouldRender) {
            fetchIPLists();
        }
    }, [shouldRender]);

    // Don't render anything if this is a duplicate
    if (!shouldRender) {
        return null;
    }

    const getInputStyle = (): React.CSSProperties => {
        return {
            padding: "0.75rem 1rem",
            borderRadius: "0.75rem",
            backgroundColor: "var(--input-bg)",
            color: "var(--text-color)",
            border: theme === 'cyberpunk' ? '1px solid rgba(157, 78, 221, 0.3)' : '1px solid rgba(209, 213, 219, 0.5)',
            outline: 'none',
            transition: 'all 0.2s ease',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
        };
    };

    const getButtonStyle = (isPrimary: boolean = true, isDanger: boolean = false): React.CSSProperties => {
        let baseStyle: React.CSSProperties = {
            color: '#ffffff',
            transition: 'all 0.2s ease-in-out',
            cursor: 'pointer',
            borderRadius: '0.75rem',
            padding: '0.75rem 1.5rem',
            fontWeight: 500,
        };

        if (theme === 'cyberpunk') {
            baseStyle.border = isDanger 
                ? '1px solid rgba(229, 62, 62, 0.5)'
                : '1px solid rgba(157, 78, 221, 0.5)';
            
            baseStyle.boxShadow = isDanger
                ? '0 4px 12px rgba(229, 62, 62, 0.25)'
                : 'var(--neon-glow)';
            
            baseStyle.background = isDanger
                ? 'linear-gradient(180deg, #e53e3e 0%, #c53030 100%)'
                : 'linear-gradient(180deg, #9d4edd 0%, #7b2cbf 100%)';
        } else {
            baseStyle.border = '1px solid transparent';
            baseStyle.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
            baseStyle.background = isDanger
                ? 'var(--button-danger)'
                : isPrimary ? 'var(--button-primary)' : 'var(--button-secondary)';
        }

        return baseStyle;
    };

    const getApiBaseUrl = () => '/api';

    const fetchIPLists = async () => {
        setStatusMessage('');
        setErrorMessage('');
        try {
            const response = await fetch(`${getApiBaseUrl()}/allowlist/`);

            if (!response.ok) {
                let errorDetail = `Server responded with status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorDetail = errorData.detail || errorDetail;
                } catch (e) { /* Ignore */ }
                throw new Error(`Failed to fetch IP lists: ${errorDetail}`);
            }

            const data = await response.json();

            setIpList(
                data.allowlist && data.allowlist !== "0.0.0.0"
                ? data.allowlist.split(",").map((ip: string) => ip.trim()).filter(Boolean)
                : []
            );

            setBlockedIPs(
                data.blocklist && data.blocklist !== ""
                ? data.blocklist.split(",").map((ip: string) => ip.trim()).filter(Boolean)
                : []
            );

        } catch (error) {
            console.error('Failed to fetch IP lists:', error);
            setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred while fetching IP settings.');
        }
    };

    const addIP = async () => {
        setStatusMessage('');
        setErrorMessage('');

        if (!ipToAdd) {
            setErrorMessage('IP address cannot be empty.');
            return;
        }

        const ipPattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        if (!ipPattern.test(ipToAdd)) {
            setErrorMessage('Invalid IP format. Please use IPv4 format (e.g., 192.168.1.1).');
            return;
        }

        if (actionType === 'allow' && ipList.includes(ipToAdd)) {
            setErrorMessage(`IP ${ipToAdd} is already in the allowed list.`);
            return;
        }
        if (actionType === 'block' && blockedIPs.includes(ipToAdd)) {
            setErrorMessage(`IP ${ipToAdd} is already in the blocked list.`);
            return;
        }

        const isAdding = actionType === 'allow';
        if (isAdding) setIsAddingAllow(true);
        else setIsAddingBlock(true);

        try {
            const endpoint = isAdding ? '/update-allowlist/' : '/update-blocklist/';
            const payloadKey = isAdding ? 'allowlist' : 'blocklist';
            const currentList = isAdding ? ipList : blockedIPs;
            const successMessage = `IP ${ipToAdd} added to ${actionType} list!`;

            const newList = [...currentList, ipToAdd].filter(Boolean).join(',');
            const listToSubmit = (isAdding && newList.length === 0) ? "0.0.0.0" : newList;

            const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [payloadKey]: listToSubmit })
            });

            if (response.ok) {
                setStatusMessage(successMessage);
                setIpToAdd('');
                await fetchIPLists();
            } else {
                let errorDetail = `Server responded with status: ${response.status}`;
                try {
                    const errorData = await response.json();
                    errorDetail = errorData.detail || errorDetail;
                } catch (e) { /* Ignore */ }
                throw new Error(`Failed to update ${actionType} list: ${errorDetail}`);
            }

        } catch (error) {
            console.error(`Error updating ${actionType} list:`, error);
            setErrorMessage(error instanceof Error ? error.message : `An unexpected error occurred while updating the ${actionType} list.`);
        } finally {
            if (isAdding) setIsAddingAllow(false);
            else setIsAddingBlock(false);
        }
    };

    const removeIP = async (ipToRemove: string, listType: 'allow' | 'block') => {
         setStatusMessage('');
         setErrorMessage('');

         const isAllowList = listType === 'allow';
         const currentList = isAllowList ? ipList : blockedIPs;
         const endpoint = isAllowList ? '/update-allowlist/' : '/update-blocklist/';
         const payloadKey = isAllowList ? 'allowlist' : 'blocklist';

         const newList = currentList.filter(ip => ip !== ipToRemove).join(',');

         try {
             const listToSubmit = (isAllowList && newList.length === 0) ? "0.0.0.0" : newList;

             const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ [payloadKey]: listToSubmit })
             });

             if (response.ok) {
                 setStatusMessage(`IP ${ipToRemove} removed from ${listType} list!`);
                 await fetchIPLists();
             } else {
                 let errorDetail = `Server responded with status: ${response.status}`;
                 try {
                     const errorData = await response.json();
                     errorDetail = errorData.detail || errorDetail;
                 } catch (e) { /* Ignore */ }
                 throw new Error(`Failed to update ${listType} list: ${errorDetail}`);
             }
         } catch (error) {
             console.error(`Error updating ${listType} list:`, error);
             setErrorMessage(error instanceof Error ? error.message : `An unexpected error occurred while updating the ${listType} list.`);
         }
     };

    return (
        <div 
            className={`settings-content ${COMPONENT_UNIQUE_CLASS}`} 
            ref={componentRef} 
            data-component="ip-access-control"
        >
            <h2 className="text-3xl font-bold text-center mb-8" style={{ color: 'var(--text-color)' }}>Settings</h2>
            
            <div className="mb-12">
                <ModelDownload />
            </div>

            <h3 className="text-2xl font-semibold mb-6" style={{ color: 'var(--text-color)' }}>IP Access Control</h3>
            
            {(statusMessage || errorMessage) && (
                <div className="mb-6 px-5 py-4 rounded-xl flex items-center" style={{
                    backgroundColor: statusMessage
                        ? (theme === 'cyberpunk' ? 'rgba(16, 185, 129, 0.15)' : '#f0fdf4')
                        : (theme === 'cyberpunk' ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2'),
                    border: statusMessage
                        ? (theme === 'cyberpunk' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #dcfce7')
                        : (theme === 'cyberpunk' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid #fee2e2'),
                    color: statusMessage
                        ? (theme === 'cyberpunk' ? '#34d399' : '#166534')
                        : (theme === 'cyberpunk' ? '#f87171' : '#b91c1c')
                }}>
                    <div className="mr-4 flex-shrink-0">
                        {statusMessage ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                        )}
                    </div>
                    <div className="text-sm font-medium">
                        {statusMessage || errorMessage}
                    </div>
                </div>
            )}

            <div className="mb-8">
                 <h4 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-color)' }}>Current Status</h4>
                 <div className="p-5 border rounded-xl flex items-center gap-6" style={{
                    backgroundColor: theme === 'cyberpunk' ? 'rgba(26, 26, 46, 0.4)' : 'var(--input-bg)',
                    border: theme === 'cyberpunk' ? '1px solid rgba(157, 78, 221, 0.3)' : '1px solid rgba(229, 231, 235, 0.5)',
                    color: 'var(--text-color)',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
                 }}>
                    <div className="flex items-center justify-center w-14 h-14 rounded-full" style={{
                        backgroundColor: theme === 'cyberpunk' ? 'rgba(18, 18, 37, 0.7)' : '#f9fafb',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                    }}>
                        <div className="w-10 h-10 rounded-full flex-shrink-0 relative flex items-center justify-center" style={{
                            backgroundColor: ipList.length === 0 ? '#10b981' : '#ef4444',
                            boxShadow: theme === 'cyberpunk'
                                ? `0 0 12px ${ipList.length === 0 ? 'rgba(16, 185, 129, 0.7)' : 'rgba(239, 68, 68, 0.7)'}`
                                : '0 1px 3px rgba(0, 0, 0, 0.1)',
                        }}>
                            {ipList.length === 0 ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            )}
                            
                            {ipList.length === 0 && theme === 'cyberpunk' && (
                                <div className="absolute inset-0 rounded-full animate-ping" style={{
                                    backgroundColor: 'rgba(16, 185, 129, 0.5)',
                                    animationDuration: '1.5s'
                                }}></div>
                            )}
                        </div>
                    </div>
                    <div>
                        <div className="status-badge mb-2" style={{
                            backgroundColor: ipList.length === 0 
                                ? (theme === 'cyberpunk' ? 'rgba(16, 185, 129, 0.2)' : '#ecfdf5')
                                : (theme === 'cyberpunk' ? 'rgba(239, 68, 68, 0.2)' : '#fef2f2'),
                            color: ipList.length === 0 ? '#10b981' : '#ef4444',
                        }}>
                            <div className="status-indicator" style={{ backgroundColor: ipList.length === 0 ? '#10b981' : '#ef4444' }}></div>
                            <span>{ipList.length === 0 ? 'OPEN ACCESS' : 'RESTRICTED ACCESS'}</span>
                        </div>
                        
                        <p className="text-lg font-medium" style={{ color: 'var(--text-color)' }}>
                            {ipList.length === 0 ? 'All IPs allowed' : `Access restricted to ${ipList.length} IP(s)`}
                        </p>
                        
                        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                            {blockedIPs.length > 0 && `${blockedIPs.length} IP(s) explicitly blocked`}
                            {blockedIPs.length === 0 && ipList.length === 0 && "No restrictions configured"}
                        </p>
                    </div>
                 </div>
            </div>

            <div className="mb-10">
                <h4 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-color)' }}>Manage IP Access</h4>
                <form onSubmit={(e) => { e.preventDefault(); addIP(); }} className="space-y-4">
                     <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-4">
                        <div className="flex-grow">
                            <label htmlFor="ipToAdd" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>IP Address</label>
                            <input
                                id="ipToAdd"
                                type="text"
                                value={ipToAdd}
                                onChange={(e) => setIpToAdd(e.target.value)}
                                placeholder="Enter IP Address (e.g., 192.168.1.1)"
                                style={getInputStyle()}
                                className="w-full"
                                aria-label="IP Address to add or block"
                                aria-describedby="ip-error-message"
                                aria-invalid={!!errorMessage && (errorMessage.includes('IP format') || errorMessage.includes('empty'))}
                            />
                        </div>
                        <div className="sm:self-end">
                            <label htmlFor="actionType" className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Action</label>
                            <select
                                id="actionType"
                                value={actionType}
                                onChange={(e) => setActionType(e.target.value as 'allow' | 'block')}
                                style={{ ...getInputStyle(), minWidth: '140px' }}
                                className="h-full w-full sm:w-auto"
                                aria-label="Select action: Allow or Block IP"
                            >
                                <option value="allow">Allow</option>
                                <option value="block">Block</option>
                            </select>
                        </div>
                        <div className="sm:self-end">
                            <button
                                type="submit"
                                className="px-6 py-3 font-semibold"
                                disabled={isAddingAllow || isAddingBlock || !ipToAdd}
                                style={{
                                    ...getButtonStyle(true, actionType === 'block'),
                                    display: 'inline-flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    minWidth: '140px',
                                    height: '100%',
                                    opacity: (isAddingAllow || isAddingBlock || !ipToAdd) ? 0.6 : 1,
                                    cursor: (isAddingAllow || isAddingBlock || !ipToAdd) ? 'not-allowed' : 'pointer',
                                }}
                            >
                                {(actionType === 'allow' ? isAddingAllow : isAddingBlock) ? (
                                    <>
                                        {actionType === 'allow' ? 'Adding' : 'Blocking'}
                                        <Spinner />
                                    </>
                                ) : (
                                    actionType === 'allow' ? 'Allow IP' : 'Block IP'
                                )}
                            </button>
                        </div>
                    </div>
                     <div id="ip-error-message" className="h-6">
                         {errorMessage && (errorMessage.includes('IP format') || errorMessage.includes('empty') || errorMessage.includes('already in the')) && (
                             <p className="text-red-600 text-sm mt-1" style={{ color: theme === 'cyberpunk' ? '#f87171' : '#dc2626' }}>
                                 {errorMessage}
                             </p>
                         )}
                     </div>
                </form>
            </div>

            <div className="grid gap-8 grid-cols-1 md:grid-cols-2">
                <IPTable 
                    title="Allowed IPs" 
                    ipList={ipList} 
                    actionType="allow" 
                    removeIP={removeIP} 
                    theme={theme} 
                />
                
                <IPTable 
                    title="Blocked IPs" 
                    ipList={blockedIPs} 
                    actionType="block" 
                    removeIP={removeIP} 
                    theme={theme} 
                />
            </div>
        </div>
    );
};

export default IPAccessControlPanel;
