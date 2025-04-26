import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../context/useTheme';

const Spinner = () => (
    <div className="inline-block animate-spin rounded-full border-4 border-solid border-current border-r-transparent h-5 w-5 ml-1"
         style={{ borderColor: 'white transparent white transparent' }}></div>
);

type ServiceType = 'frontend' | 'llm' | 'sd';

const IPAccessControlPanel = () => {
    const { theme } = useTheme();
    const [selectedService, setSelectedService] = useState<ServiceType>('frontend');
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
            maxWidth: '800px',
            margin: '0 auto',
          }
        : {
            backgroundColor: 'var(--primary-bg)',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb',
            borderRadius: 'var(--border-radius)',
            padding: '1.5rem',
            maxWidth: '800px',
            margin: '0 auto',
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

    const fetchAllowedIPs = useCallback(async (service: ServiceType) => {
        setIsLoading(true);
        setStatusMessage(null);
        try {
            const response = await fetch(`${getApiBaseUrl()}/get-allowed-ips/?service=${service}`);
            if (response.ok) {
                const data = await response.text();
                setAllowedIPs(data);
            } else {
                const errorText = await response.text();
                setStatusMessage({ message: `Failed to fetch ${service} IP allowlist: ${errorText}`, success: false });
                setAllowedIPs('');
            }
        } catch (error) {
            setStatusMessage({ message: `Network error fetching ${service} IP allowlist.`, success: false });
            setAllowedIPs('');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllowedIPs(selectedService);
    }, [selectedService, fetchAllowedIPs]);

    const handleSaveChanges = async () => {
        setIsSaving(true);
        setStatusMessage(null);
        try {
            const response = await fetch(`${getApiBaseUrl()}/update-allowed-ips/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ service: selectedService, content: allowedIPs }),
            });
            if (response.ok) {
                const result = await response.json();
                setStatusMessage({ message: result.status || `Allowlist for ${selectedService} updated. Restart Nginx to apply.`, success: true });
            } else {
                const errorData = await response.json();
                setStatusMessage({ message: `Failed to update ${selectedService} allowlist: ${errorData.detail}`, success: false });
            }
        } catch (error) {
            setStatusMessage({ message: `Network error saving ${selectedService} allowlist.`, success: false });
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

    const getTabStyle = (isActive: boolean) => ({
        padding: '0.5rem 1rem',
        cursor: 'pointer',
        borderBottom: isActive ? `2px solid var(--accent-color)` : '2px solid transparent',
        color: isActive ? 'var(--accent-color)' : 'var(--text-secondary)',
        fontWeight: isActive ? 600 : 400,
        transition: 'all 0.2s ease',
        backgroundColor: 'transparent',
        borderTop: 'none',
        borderLeft: 'none',
        borderRight: 'none',
        fontSize: '0.95rem',
    });

    const getServiceDisplayName = (service: ServiceType): string => {
        switch (service) {
            case 'frontend': return 'Frontend UI (Port 3000)';
            case 'llm': return 'LLM API (Ports 1337, 1339, 1341, 1343, 1345)';
            case 'sd': return 'Stable Diffusion API (Port 7860)';
            default: return 'Unknown Service';
        }
    };

    return (
        <div
            className="space-y-6 rounded-lg shadow-lg"
            style={{
                ...getContainerStyle()
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'center', borderBottom: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
                {(['frontend', 'llm', 'sd'] as ServiceType[]).map((service) => (
                    <button
                        key={service}
                        style={getTabStyle(selectedService === service)}
                        onClick={() => setSelectedService(service)}
                        disabled={isLoading || isSaving}
                    >
                        {service.toUpperCase()}
                    </button>
                ))}
            </div>

            <h3 className="text-lg font-semibold text-center mb-2" style={{ color: 'var(--text-color)' }}>
                Manage Allowlist for: {getServiceDisplayName(selectedService)}
            </h3>

            <p className="text-sm text-center mb-4" style={{ color: 'var(--text-secondary)' }}>
                Edit the allowlist below for the selected service. Enter one IP address or CIDR range per line. Example: `192.168.1.100` or `10.0.0.0/8`. Use `0.0.0.0/0` to allow all IPs. Changes require an Nginx restart to take effect.
            </p>

            {isLoading ? (
                <div className="text-center p-4" style={{ color: 'var(--text-secondary)' }}>Loading {selectedService} configuration... <Spinner /></div>
            ) : (
                <textarea
                    style={getTextAreaStyle()}
                    value={allowedIPs}
                    onChange={(e) => setAllowedIPs(e.target.value)}
                    placeholder={`Enter allowed IPs/CIDRs for ${selectedService.toUpperCase()} here...`}
                    disabled={isLoading || isSaving}
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
                    {isSaving ? 'Saving...' : `Save ${selectedService.toUpperCase()} List`}
                </button>
                <button
                    onClick={handleRestartNginx}
                    style={getButtonStyle('danger')}
                    disabled={isRestarting || isSaving}
                >
                    {isRestarting && <Spinner />}
                    {isRestarting ? 'Restarting...' : 'Restart Nginx'}
                </button>
            </div>
        </div>
    );
};

export default IPAccessControlPanel;
