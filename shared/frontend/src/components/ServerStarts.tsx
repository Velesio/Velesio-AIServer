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

    // Get color based on value
    const getColor = (value: number) => {
        if (value > 80) return '#ef4444'; // Red for very high usage
        if (value > 60) return '#f97316'; // Orange for high usage
        if (value > 40) return '#eab308'; // Yellow for medium usage
        return '#4ade80'; // Green for low usage
    };

    // Visual meter component with redesigned look
    const StatMeter = ({ value, label }: { value: number, label: string }) => {
        const color = getColor(value);
        
        // Theme-specific styles
        const meterBgColor = theme === 'cyberpunk' ? '#1a1a2e' : '#f5f5f7';
        const labelColor = theme === 'cyberpunk' ? '#a0a0b0' : '#71717a';
        const glowEffect = theme === 'cyberpunk' ? `0 0 10px ${color}40` : 'none';
        
        return (
            <div className="stat-meter" style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '10px 15px',
                borderRadius: '16px',
                background: 'transparent',
            }}>
                {/* Modern circular gauge */}
                <div className="gauge-container" style={{
                    position: 'relative',
                    width: '100px',
                    height: '100px',
                    margin: '0 auto',
                }}>
                    {/* Background circle */}
                    <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
                        <circle 
                            cx="50" 
                            cy="50" 
                            r="40" 
                            stroke={meterBgColor}
                            strokeWidth="8" 
                            fill="transparent" 
                        />
                        {/* Progress arc */}
                        <circle 
                            cx="50" 
                            cy="50" 
                            r="40" 
                            stroke={color}
                            strokeWidth="8" 
                            fill="transparent" 
                            strokeDasharray={`${2 * Math.PI * 40}`}
                            strokeDashoffset={`${2 * Math.PI * 40 * (1 - value / 100)}`}
                            style={{ 
                                transition: 'stroke-dashoffset 0.5s ease-in-out',
                                filter: `drop-shadow(${glowEffect})`,
                            }}
                        />
                    </svg>
                    
                    {/* Center value display */}
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        color,
                        textShadow: theme === 'cyberpunk' ? `0 0 3px ${color}` : 'none',
                    }}>
                        {value}%
                    </div>
                </div>
                
                {/* Label */}
                <div style={{
                    marginTop: '10px',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    color: labelColor,
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                }}>
                    {label}
                </div>
                
                {/* Additional info text for better context */}
                <div style={{
                    fontSize: '0.75rem',
                    color: labelColor,
                    marginTop: '2px',
                    opacity: 0.8,
                }}>
                    {value > 80 ? 'Very High' : 
                     value > 60 ? 'High' : 
                     value > 40 ? 'Moderate' : 'Low'} Usage
                </div>
            </div>
        );
    };

    return (
        <div className="stats-dashboard" style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '15px 0',
            width: '100%',
            marginLeft: '90px', // Keep the left margin for sidebar
            maxWidth: 'calc(100% - 100px)',
        }}>
            <div className="stats-container" style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '30px',
                flexWrap: 'wrap',
                margin: '0 auto',
            }}>
                <StatMeter value={stats.cpu} label="CPU" />
                <StatMeter value={stats.ram} label="RAM" />
                <StatMeter value={stats.gpu} label="GPU" />
            </div>
        </div>
    );
}

export default ServerStats;
