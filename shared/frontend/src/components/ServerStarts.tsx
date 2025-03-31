import { useEffect, useState } from 'react';
import { useTheme } from '../context/useTheme';

function ServerStats() {
    const { theme } = useTheme();
    const [stats, setStats] = useState({ cpu: 0, ram: 0, gpu: 0 });

    useEffect(() => {
        const fetchStats = async () => {
            // Use relative URL instead of hardcoded localhost
            const res = await fetch('/api/stats/');
            const data = await res.json();
            setStats(data);
        };

        const interval = setInterval(fetchStats, 5000);
        fetchStats(); // Initial fetch
        return () => clearInterval(interval);
    }, []);

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

    const getStatCardStyle = () => {
        return theme === 'cyberpunk'
            ? {
                width: '120px',
                textAlign: 'center' as const,
                backgroundColor: 'var(--stats-bg)',
                boxShadow: 'var(--neon-glow)',
                border: '1px solid var(--accent-color)',
                padding: '12px 8px'
              }
            : {
                width: '120px',
                textAlign: 'center' as const,
                backgroundColor: 'var(--stats-bg)',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                border: '1px solid #e5e7eb',
                padding: '12px 8px'
              };
    };

    // Get label color based on theme
    const getLabelClass = () => {
        return theme === 'cyberpunk' ? 'text-gray-400' : 'text-gray-500';
    };

    // Get color based on value
    const getColor = (value: number) => {
        if (value > 80) return '#ef4444'; // Red for very high usage
        if (value > 60) return '#f97316'; // Orange for high usage
        if (value > 40) return '#eab308'; // Yellow for medium usage
        return '#4ade80'; // Green for low usage
    };

    // Get meter background style based on theme
    const getMeterBgStyle = () => {
        return theme === 'cyberpunk'
            ? { backgroundColor: '#1a1a2e' }
            : { backgroundColor: '#e5e7eb' };
    };

    // Visual meter component
    const MeterGauge = ({ value, label }: { value: number, label: string }) => {
        const color = getColor(value);
        const meterWidth = `${value}%`;
        
        // Cyberpunk-specific styles
        const cyberpunkStyles = theme === 'cyberpunk' 
            ? { boxShadow: `0 0 5px ${color}, 0 0 10px ${color}` } 
            : {};
        
        return (
            <div className="p-3 rounded-lg" style={getStatCardStyle()}>
                <div className={`text-sm ${getLabelClass()} mb-2`}>{label}</div>
                
                {/* Circular gauge for visual appeal */}
                <div className="relative w-16 h-16 mx-auto mb-2" style={{ 
                    backgroundColor: theme === 'cyberpunk' ? '#1a1a2e' : '#f3f4f6',
                    borderRadius: '50%',
                    border: theme === 'cyberpunk' ? '2px solid #333' : '2px solid #d1d5db',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    ...cyberpunkStyles
                }}>
                    {/* Gauge fill based on value (semi-circle that rotates) */}
                    <div className="absolute top-0 left-0 w-full h-full" style={{ 
                        borderRadius: '50%',
                        overflow: 'hidden',
                        clip: 'rect(0, 32px, 64px, 0)',
                    }}>
                        <div className="absolute top-0 left-0 w-full h-full" style={{
                            borderRadius: '50%',
                            background: `conic-gradient(${color} 0% ${value}%, transparent ${value}% 100%)`,
                            transform: 'rotate(-90deg)',
                            transformOrigin: 'center',
                            opacity: 0.8,
                        }} />
                    </div>
                    
                    {/* Value display */}
                    <div className="text-xl font-bold relative z-10" style={{ 
                        color: color,
                        textShadow: theme === 'cyberpunk' ? `0 0 3px ${color}` : 'none',
                    }}>
                        {value}%
                    </div>
                </div>
                
                {/* Linear meter as additional visual */}
                <div className="mt-2 w-full h-2 rounded-full overflow-hidden" style={getMeterBgStyle()}>
                    <div 
                        className="h-full rounded-full" 
                        style={{ 
                            width: meterWidth, 
                            backgroundColor: color,
                            transition: 'width 0.5s ease-in-out',
                            boxShadow: theme === 'cyberpunk' ? `0 0 4px ${color}` : 'none',
                        }}
                    />
                </div>
            </div>
        );
    };

    return (
        <div className="p-4 space-y-4 rounded-lg shadow-lg mt-6" style={{ 
            width: '100%', 
            maxWidth: '800px', 
            margin: '0 auto',
            ...getContainerStyle()
        }}>
            <h2 className={`text-2xl font-bold text-center mb-4 ${theme === 'cyberpunk' ? 'glow-text' : ''}`}>
                System Stats
            </h2>
            
            <div style={{ width: '500px', margin: '0 auto', display: 'flex', justifyContent: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                    <MeterGauge value={stats.cpu} label="CPU Usage" />
                    <MeterGauge value={stats.ram} label="RAM Usage" />
                    <MeterGauge value={stats.gpu} label="GPU Usage" />
                </div>
            </div>
        </div>
    );
}

export default ServerStats;
