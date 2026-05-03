import { getDriverColor } from '../config/drivers';

export const DriverTag = ({ driverId, year, selected, onClick, isDark = true }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${selected
            ? isDark ? 'bg-gray-700 text-white border-white/50 shadow-[0_0_10px_rgba(255,255,255,0.1)]' : 'bg-gray-200 text-gray-900 border-gray-400 shadow-sm'
            : isDark ? 'bg-gray-900/50 text-gray-400 border-transparent hover:bg-gray-800' : 'bg-gray-100 text-gray-500 border-transparent hover:bg-gray-200'
            }`}
    >
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getDriverColor(driverId, year) }} />
        {driverId}
    </button>
);

export const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-gray-950 border border-gray-700 p-3 rounded-lg shadow-2xl text-xs z-50">
                <p className="text-gray-400 mb-2 font-mono">Lap Distance: {Math.round(label)}%</p>
                {payload.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.stroke }}></div>
                        <span className="font-bold text-gray-200">{entry.name}:</span>
                        <span className="font-mono text-white">{entry.value}</span>
                        {entry.dataKey.includes('speed') && <span className="text-gray-500">km/h</span>}
                        {entry.dataKey.includes('throttle') && <span className="text-gray-500">%</span>}
                    </div>
                ))}
            </div>
        );
    }
    return null;
};
