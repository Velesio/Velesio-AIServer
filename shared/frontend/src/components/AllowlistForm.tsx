import React, { useState, useEffect } from 'react';

const useTheme = () => ({ theme: 'cyberpunk' });

const Spinner = () => (
    <div className="inline-block animate-spin rounded-full border-4 border-solid border-current border-r-transparent h-5 w-5 ml-2"
         style={{ borderColor: 'currentColor transparent currentColor transparent' }}></div>
);

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

    const getContainerStyle = (): React.CSSProperties => {
        return theme === 'cyberpunk'
            ? {
                backgroundColor: 'var(--primary-bg, #0a0a23)',
                color: 'var(--text-color, #ffffff)',
                boxShadow: 'var(--neon-glow, 0 0 15px rgba(0, 255, 255, 0.5))',
                border: '1px solid var(--accent-color, #0ff)',
              }
            : {
                backgroundColor: 'var(--primary-bg, #ffffff)',
                color: 'var(--text-color, #1f2937)',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e5e7eb',
              };
    };

    const getInputStyle = (): React.CSSProperties => {
        return {
            padding: "0.75rem",
            borderRadius: "0.375rem",
            backgroundColor: "var(--input-bg, #f3f4f6)",
            color: "var(--text-color, #1f2937)",
            border: theme === 'cyberpunk' ? '1px solid var(--accent-color, #0ff)' : '1px solid #d1d5db',
            outline: 'none',
        };
    };

    const getButtonStyle = (isPrimary: boolean = true, isDanger: boolean = false): React.CSSProperties => {
        let baseStyle: React.CSSProperties = {
            color: '#ffffff',
            transition: 'all 0.2s ease-in-out',
            border: 'none',
            cursor: 'pointer',
        };

        if (theme === 'cyberpunk') {
            baseStyle.border = `1px solid ${isDanger ? 'var(--button-danger, #f00)' : 'var(--accent-color, #0ff)'}`;
            baseStyle.boxShadow = isDanger
                ? '0 0 5px var(--button-danger, #f00), 0 0 10px rgba(229, 62, 62, 0.5)'
                : 'var(--neon-glow, 0 0 10px rgba(0, 255, 255, 0.4))';
        } else if (theme === 'corporate') {
            baseStyle.border = '1px solid #000';
        }

        if (isDanger) {
            return {
                ...baseStyle,
                backgroundColor: 'var(--button-danger, #e53e3e)',
            };
        }

        return {
            ...baseStyle,
            backgroundColor: isPrimary ? 'var(--button-primary, #4f46e5)' : 'var(--button-secondary, #6b7280)',
        };
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

    useEffect(() => {
        fetchIPLists();
    }, []);

    return (
        <div className="p-6 space-y-8 rounded-lg" style={{
            width: '100%',
            maxWidth: '800px',
            margin: '2rem auto',
            ...getContainerStyle()
        }}>
            <h2 className="text-3xl font-bold text-center mb-8" style={{ color: 'var(--text-color)' }}>IP Access Settings</h2>

            {(statusMessage || errorMessage) && (
                <div className={`p-4 mb-4 rounded-md text-sm font-medium ${statusMessage ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-800 border border-red-300'}`}
                     style={{
                         backgroundColor: statusMessage
                             ? (theme === 'cyberpunk' ? 'rgba(16, 185, 129, 0.3)' : undefined)
                             : (theme === 'cyberpunk' ? 'rgba(239, 68, 68, 0.3)' : undefined),
                         color: statusMessage
                             ? (theme === 'cyberpunk' ? '#10b981' : undefined)
                             : (theme === 'cyberpunk' ? '#ef4444' : undefined),
                         border: theme === 'cyberpunk'
                             ? `1px solid ${statusMessage ? 'rgba(16, 185, 129, 0.7)' : 'rgba(239, 68, 68, 0.7)'}`
                             : undefined,
                     }}
                     role="alert"
                >
                    {statusMessage || errorMessage}
                </div>
            )}

            <div className="mb-8">
                 <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-color)' }}>Current Status</h3>
                 <div className="p-5 border rounded-md flex items-center gap-4 max-w-full" style={{
                    backgroundColor: theme === 'cyberpunk' ? 'rgba(26, 26, 46, 0.8)' : '#f8f9fa',
                    border: theme === 'cyberpunk' ? '1px solid var(--accent-color, #0ff)' : '1px solid #e5e7eb',
                    color: 'var(--text-color)',
                 }}>
                    <div className="w-10 h-10 rounded-full flex-shrink-0 relative flex items-center justify-center" style={{
                        backgroundColor: ipList.length === 0 ? '#4ade80' : '#ef4444',
                        boxShadow: theme === 'cyberpunk'
                            ? `0 0 12px ${ipList.length === 0 ? 'rgba(74, 222, 128, 0.7)' : 'rgba(239, 68, 68, 0.7)'}`
                            : 'none',
                    }}>
                        {/* SVG Icon Removed */}
                        {ipList.length === 0 && theme === 'cyberpunk' && (
                            <div className="absolute inset-0 rounded-full animate-ping" style={{
                                backgroundColor: 'rgba(74, 222, 128, 0.5)',
                                animationDuration: '1.5s'
                            }}></div>
                        )}
                    </div>
                    <div>
                        <p className="font-semibold text-lg">Access Mode:</p>
                        <p className="text-xl font-bold" style={{
                            color: ipList.length === 0 ? '#4ade80' : '#ef4444',
                            textShadow: theme === 'cyberpunk'
                                ? `0 0 5px ${ipList.length === 0 ? 'rgba(74, 222, 128, 0.6)' : 'rgba(239, 68, 68, 0.6)'}`
                                : 'none'
                        }}>
                            {ipList.length === 0 ? 'OPEN ACCESS' : 'RESTRICTED ACCESS'}
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'var(--text-secondary, #6b7280)' }}>
                            {ipList.length === 0 ? 'All IPs allowed.' : `Access restricted to ${ipList.length} IP(s).`}
                            {blockedIPs.length > 0 && ` ${blockedIPs.length} IP(s) explicitly blocked.`}
                        </p>
                    </div>
                 </div>
            </div>

            <div className="mb-8">
                <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-color)' }}>Manage IP Access</h3>
                <form onSubmit={(e) => { e.preventDefault(); addIP(); }} className="space-y-4">
                     <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <div className="flex-grow">
                            <label htmlFor="ipToAdd" className="sr-only">IP Address</label>
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
                        <div className="flex-shrink-0">
                            <label htmlFor="actionType" className="sr-only">Action Type</label>
                            <select
                                id="actionType"
                                value={actionType}
                                onChange={(e) => setActionType(e.target.value as 'allow' | 'block')}
                                style={{ ...getInputStyle(), minWidth: '110px' }}
                                className="h-full w-full sm:w-auto"
                                aria-label="Select action: Allow or Block IP"
                            >
                                <option value="allow">Allow</option>
                                <option value="block">Block</option>
                            </select>
                        </div>
                        <div className="flex-shrink-0">
                            <button
                                type="submit"
                                className="px-6 py-2 rounded-md w-full sm:w-auto font-semibold"
                                disabled={isAddingAllow || isAddingBlock || !ipToAdd}
                                style={{
                                    ...getButtonStyle(true, actionType === 'block'),
                                    display: 'inline-flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    minWidth: '130px',
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
                     <div id="ip-error-message" className="h-4">
                         {errorMessage && (errorMessage.includes('IP format') || errorMessage.includes('empty') || errorMessage.includes('already in the')) && (
                             <p className="text-red-600 text-xs" style={{ color: theme === 'cyberpunk' ? '#ff4d4d' : '#dc2626' }}>
                                 {errorMessage}
                             </p>
                         )}
                     </div>
                </form>
            </div>

            <div className="grid gap-8 grid-cols-1 md:grid-cols-2">
                <div className="space-y-4">
                    <h3 className="text-xl font-semibold" style={{ color: 'var(--text-color)' }}>Allowed IPs</h3>
                    {ipList.length > 0 ? (
                        <div className="overflow-hidden rounded-lg shadow" style={{ border: theme === 'cyberpunk' ? '1px solid var(--accent-color, #0ff)' : '1px solid #e5e7eb' }}>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y" style={{
                                    borderCollapse: 'collapse',
                                    width: '100%',
                                    color: 'var(--text-color)',
                                    borderColor: theme === 'cyberpunk' ? 'rgba(0, 255, 255, 0.3)' : '#e5e7eb',
                                }}>
                                    <thead style={{ backgroundColor: theme === 'cyberpunk' ? 'rgba(45, 45, 77, 0.8)' : '#f9fafb' }}>
                                        <tr>
                                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary, #6b7280)' }}>#</th>
                                            <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary, #6b7280)' }}>IP Address</th>
                                            <th scope="col" className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary, #6b7280)' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y" style={{
                                        backgroundColor: theme === 'cyberpunk' ? 'rgba(26, 26, 46, 0.8)' : '#ffffff',
                                        borderColor: theme === 'cyberpunk' ? 'rgba(0, 255, 255, 0.3)' : '#e5e7eb',
                                    }}>
                                        {ipList.map((ip, index) => (
                                            <tr key={`allow-${ip}-${index}`} className={index % 2 !== 0 ? (theme === 'cyberpunk' ? 'bg-opacity-10 bg-blue-900' : 'bg-gray-50') : ''}>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">{index + 1}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-mono">{ip}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                                                    <button
                                                        onClick={() => removeIP(ip, 'allow')}
                                                        className="font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 rounded"
                                                        style={{ color: theme === 'cyberpunk' ? '#ff4d4d' : '#dc2626' }}
                                                        aria-label={`Remove allowed IP ${ip}`}
                                                    >
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
                        <div className="text-center p-5 rounded-md text-sm" style={{
                            backgroundColor: theme === 'cyberpunk' ? 'rgba(26, 26, 46, 0.7)' : '#f8f9fa',
                            border: theme === 'cyberpunk' ? '1px dashed rgba(0, 255, 255, 0.4)' : '1px dashed #d1d5db',
                            color: 'var(--text-secondary, #6b7280)'
                        }}>
                            <p className="font-medium">Open Access Mode Active</p>
                            <p className="mt-1">Add IPs to the allow list above to restrict access.</p>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <h3 className="text-xl font-semibold" style={{ color: 'var(--text-color)' }}>Blocked IPs</h3>
                    {blockedIPs.length > 0 ? (
                        <div className="overflow-hidden rounded-lg shadow" style={{ border: theme === 'cyberpunk' ? '1px solid var(--accent-color, #0ff)' : '1px solid #e5e7eb' }}>
                             <div className="overflow-x-auto">
                                <table className="min-w-full divide-y" style={{
                                    borderCollapse: 'collapse',
                                    width: '100%',
                                    color: 'var(--text-color)',
                                    borderColor: theme === 'cyberpunk' ? 'rgba(0, 255, 255, 0.3)' : '#e5e7eb',
                                }}>
                                    <thead style={{ backgroundColor: theme === 'cyberpunk' ? 'rgba(45, 45, 77, 0.8)' : '#f9fafb' }}>
                                        <tr>
                                             <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary, #6b7280)' }}>#</th>
                                             <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary, #6b7280)' }}>IP Address</th>
                                             <th scope="col" className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary, #6b7280)' }}>Actions</th>
                                        </tr>
                                    </thead>
                                     <tbody className="divide-y" style={{
                                         backgroundColor: theme === 'cyberpunk' ? 'rgba(26, 26, 46, 0.8)' : '#ffffff',
                                         borderColor: theme === 'cyberpunk' ? 'rgba(0, 255, 255, 0.3)' : '#e5e7eb',
                                     }}>
                                        {blockedIPs.map((ip, index) => (
                                            <tr key={`block-${ip}-${index}`} className={index % 2 !== 0 ? (theme === 'cyberpunk' ? 'bg-opacity-10 bg-blue-900' : 'bg-gray-50') : ''}>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">{index + 1}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-mono">{ip}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                                                    <button
                                                        onClick={() => removeIP(ip, 'block')}
                                                        className="font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 rounded"
                                                        style={{ color: theme === 'cyberpunk' ? '#ff4d4d' : '#dc2626' }}
                                                        aria-label={`Remove blocked IP ${ip}`}
                                                    >
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
                        <div className="text-center p-5 rounded-md text-sm" style={{
                            backgroundColor: theme === 'cyberpunk' ? 'rgba(26, 26, 46, 0.7)' : '#f8f9fa',
                            border: theme === 'cyberpunk' ? '1px dashed rgba(0, 255, 255, 0.4)' : '1px dashed #d1d5db',
                            color: 'var(--text-secondary, #6b7280)'
                        }}>
                            <p className="font-medium">No IPs are currently blocked.</p>
                            <p className="mt-1">Add IPs to the block list using the form above.</p>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};

export default IPAccessControlPanel;
