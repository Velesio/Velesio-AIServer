import { useEffect, useState } from 'react';
import { useTheme } from '../context/useTheme';

function ServerStats() {
    const { theme } = useTheme();
    const [stats, setStats] = useState({ cpu: 0, ram: 0, gpu: 0 });

    useEffect(() => {
        const fetchStats = async () => {
            const res = await fetch('/api/stats/');
            const data = await res.json();
            setStats(data);
        };

        const interval = setInterval(fetchStats, 5000);
        fetchStats(); 
        return () => clearInterval(interval);
    }, []);

    const getColor = (value: number) => {
        if (value > 80) return '#ef4444';
        if (value > 60) return '#f97316';
        if (value > 40) return '#eab308';
        return '#4ade80';
    };

    const StatMeter = ({ value, label }: { value: number, label: string }) => {
        const color = getColor(value);
        
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
                <div className="gauge-container" style={{
                    position: 'relative',
                    width: '100px',
                    height: '100px',
                    margin: '0 auto',
                }}>
                    <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
                        <circle 
                            cx="50" 
                            cy="50" 
                            r="40" 
                            stroke={meterBgColor}
                            strokeWidth="8" 
                            fill="transparent" 
                        />
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
            </div>
        );
    };

    const getContainerStyle = () => {
        return theme === 'cyberpunk'
            ? {
                backgroundColor: 'var(--primary-bg)',
                boxShadow: 'var(--neon-glow)',
                border: '1px solid var(--accent-color)',
                borderRadius: '1rem',
                padding: '1.5rem',
              }
            : {
                backgroundColor: 'var(--primary-bg)',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                border: '1px solid #e5e7eb',
                borderRadius: '1rem',
                padding: '1.5rem',
              };
    };

    return (
        <div className="server-stats-container" style={{
            width: '100%',
            ...getContainerStyle()
        }}>
            <div className="stats-container" style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '30px',
                flexWrap: 'wrap',
                width: '100%',
                maxWidth: '600px', 
                padding: '0 20px', 
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
