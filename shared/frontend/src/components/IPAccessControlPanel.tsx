import { useState, useEffect } from 'react';
import { useTheme } from '../context/useTheme';

const Spinner = () => (
    <div className="inline-block animate-spin rounded-full border-4 border-solid border-current border-r-transparent h-5 w-5 ml-1"
         style={{ borderColor: 'white transparent white transparent' }}></div>
);

const IPAccessControlPanel = () => {
    const { theme } = useTheme();
    const [allowedIPs, setAllowedIPs] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isRestarting, setIsRestarting] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ message: string, success: boolean } | null>(null);

    const getApiBaseUrl = () => '/api';

    const getContainerStyle = () => theme === 'cyberpunk'
        ? {
            backgroundColor: 'var(--primary-bg)',
            boxShadow: 'var(--neon-glow)',
            border: '1px solid var(--accent-color)',
            borderRadius: 'var(--border-radius)',
            padding: '1.5rem',
          }
        : {
            backgroundColor: 'var(--primary-bg)',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb',
            borderRadius: 'var(--border-radius)',
            padding: '1.5rem',
          };

    const getTextAreaStyle = () => ({
        width: '100%',
        minHeight: '150px',
        padding: '0.75rem',
        borderRadius: 'var(--border-radius)',
        backgroundColor: 'var(--input-bg)',
        color: 'var(--text-color)',
        border: theme === 'cyberpunk' ? '1px solid #666' : '1px solid #d1d5db',
        fontFamily: 'monospace',
        fontSize: '0.9rem',
        resize: 'vertical' as const,
    });

    const getButtonStyle = (variant: 'primary' | 'secondary' | 'danger' = 'primary') => {
        let bgColor = 'var(--button-primary)';
        if (variant === 'secondary') {
            bgColor = 'var(--button-secondary)';
        } else if (variant === 'danger') {
            bgColor = 'var(--button-danger)';
        }

        return {
            padding: '0.6rem 1.2rem',
            borderRadius: 'var(--border-radius)',
            border: 'none',
            backgroundColor: bgColor,
            color: '#ffffff',
            cursor: 'pointer',
            fontWeight: 500,
            transition: 'all 0.2s ease',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            minWidth: '120px',
            justifyContent: 'center',
            boxShadow: theme === 'cyberpunk' ? 'var(--neon-glow)' : 'none',
        };
    };

    // Fetch current allowed IPs on mount
    useEffect(() => {
        const fetchAllowedIPs = async () => {
            setIsLoading(true);
            setStatusMessage(null);
            try {
                const response = await fetch(`${getApiBaseUrl()}/get-allowed-ips/`);
                if (response.ok) {
                    const data = await response.text();
                    setAllowedIPs(data);
                } else {
                    setStatusMessage({ message: 'Failed to fetch current IP allowlist.', success: false });
                }
            } catch (error) {
                setStatusMessage({ message: 'Network error fetching IP allowlist.', success: false });
            } finally {
                setIsLoading(false);
            }
        };
        fetchAllowedIPs();
    }, []);

    const handleSaveChanges = async () => {
        setIsSaving(true);
        setStatusMessage(null);
        try {
            const response = await fetch(`${getApiBaseUrl()}/update-allowed-ips/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: allowedIPs }),
            });
            if (response.ok) {
                setStatusMessage({ message: 'Allowlist updated successfully. Restart Nginx to apply changes.', success: true });
            } else {
                const errorData = await response.json();
                setStatusMessage({ message: `Failed to update allowlist: ${errorData.detail}`, success: false });
            }
        } catch (error) {
            setStatusMessage({ message: 'Network error saving allowlist.', success: false });
        } finally {
            setIsSaving(false);
        }
    };

    const handleRestartNginx = async () => {
        setIsRestarting(true);
        setStatusMessage(null);
        try {
            const response = await fetch(`${getApiBaseUrl()}/restart-nginx/`, {
                method: 'POST',
            });
            if (response.ok) {
                setStatusMessage({ message: 'Nginx restarted successfully.', success: true });
            } else {
                const errorData = await response.json();
                setStatusMessage({ message: `Failed to restart Nginx: ${errorData.detail}`, success: false });
            }
        } catch (error) {
            setStatusMessage({ message: 'Network error restarting Nginx.', success: false });
        } finally {
            setIsRestarting(false);
        }
    };

    return (
        <div
            className="space-y-6 rounded-lg shadow-lg"
            style={{
                width: '100%',
                maxWidth: '800px',
                margin: 'auto',
                ...getContainerStyle()
            }}
        >
            <p className="text-sm text-center mb-4" style={{ color: 'var(--text-secondary)' }}>
                Edit the allowlist below. Enter one IP address or CIDR range per line. Example: `192.168.1.100` or `10.0.0.0/8`. Use `0.0.0.0/0` to allow all IPs.
            </p>

            {isLoading ? (
                <div className="text-center p-4">Loading current configuration...</div>
            ) : (
                <textarea
                    style={getTextAreaStyle()}
                    value={allowedIPs}
                    onChange={(e) => setAllowedIPs(e.target.value)}
                    placeholder="Enter allowed IPs here..."
                />
            )}

            {statusMessage && (
                <div className="px-4 py-3 rounded-md text-sm text-center" style={{
                    backgroundColor: statusMessage.success ?
                        (theme === 'cyberpunk' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)') :
                        (theme === 'cyberpunk' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)'),
                    color: statusMessage.success ?
                        (theme === 'cyberpunk' ? '#10b981' : '#047857') :
                        (theme === 'cyberpunk' ? '#ef4444' : '#b91c1c'),
                    border: theme === 'cyberpunk' ?
                        `1px solid ${statusMessage.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}` :
                        'none',
                }}>
                    {statusMessage.message}
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                <button
                    onClick={handleSaveChanges}
                    style={getButtonStyle('primary')}
                    disabled={isSaving || isLoading}
                >
                    {isSaving && <Spinner />}
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                    onClick={handleRestartNginx}
                    style={getButtonStyle('danger')}
                    disabled={isRestarting}
                >
                    {isRestarting && <Spinner />}
                    {isRestarting ? 'Restarting...' : 'Restart Nginx'}
                </button>
            </div>
        </div>
    );
};

export default IPAccessControlPanel;
