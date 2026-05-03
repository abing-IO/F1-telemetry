import { useRef, useCallback } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    ScatterChart, Scatter, Cell, ReferenceArea, ReferenceLine
} from 'recharts';
import {
    Activity, Calendar, Loader2, AlertCircle, Timer, Map, Download, Zap
} from 'lucide-react';
import ParticleCard from './ParticleCard';
import { DriverTag, CustomTooltip } from './ChartWidgets';
import { getDriverColor, YEARS, getTracksForYear, getDriverOptionsForYear } from '../config/drivers';
import { useTheme } from '../hooks/useTheme';
import { useAnalytics } from '../hooks/useAnalytics';
import { SkeletonChart } from './Skeletons';
import InsightPanel from './InsightPanel';
import PDFExport from './PDFExport';

const SESSION_TYPES = [
    { id: 'R', label: 'Race' },
    { id: 'Q', label: 'Quali' },
    { id: 'S', label: 'Sprint' },
    { id: 'FP1', label: 'FP1' },
    { id: 'FP2', label: 'FP2' },
    { id: 'FP3', label: 'FP3' },
];

const COMPOUND_COLORS = {
    'SOFT': '#FF3333',
    'MEDIUM': '#FFC300',
    'HARD': '#FFFFFF',
    'INTERMEDIATE': '#39B54A',
    'WET': '#0067FF',
    'UNKNOWN': '#888888',
};

const Card = ({ children, className = "", chartRef }) => (
    <ParticleCard
        className={className}
        enableTilt={false}
        enableStars={false}
        enableMagnetism={false}
        clickEffect={false}
        glowColor="255, 0, 0"
        particleCount={20}
    >
        <div ref={chartRef}>
            {children}
        </div>
    </ParticleCard>
);

function ExportButton({ chartRef, filename, isDark = true }) {
    const handleExport = useCallback(async () => {
        if (!chartRef.current) return;
        try {
            const { toPng } = await import('html-to-image');
            const dataUrl = await toPng(chartRef.current, {
                backgroundColor: isDark ? '#0f1014' : '#f3f4f6',
                pixelRatio: 2,
            });
            const link = document.createElement('a');
            link.download = `${filename}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Export failed:', err);
        }
    }, [chartRef, filename, isDark]);

    return (
        <button onClick={handleExport} className="text-gray-500 hover:text-white transition-colors p-1 rounded" title="Export as PNG">
            <Download size={14} />
        </button>
    );
}

function HeadToHeadCard({ headToHead, isDark, controlBorder }) {
    if (!headToHead) return null;
    const { stats, dominance } = headToHead;

    return (
        <Card className={isDark ? '' : 'bg-white/80 border-gray-200'}>
            <h3 className={`font-bold ${isDark ? 'text-gray-200' : 'text-gray-700'} text-sm uppercase tracking-wider mb-4 flex items-center gap-2`}>
                <Zap size={16} className="text-yellow-400" /> Head-to-Head
            </h3>

            {/* Dominance bar */}
            <div className="mb-4">
                <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">Micro-Sector Dominance</div>
                <div className="flex h-4 rounded-full overflow-hidden gap-0.5">
                    {dominance.map(d => (
                        <div
                            key={d.driver}
                            style={{ width: `${d.pct}%`, backgroundColor: d.color }}
                            className="flex items-center justify-center transition-all"
                        >
                            {d.pct > 15 && <span className="text-[9px] font-black text-white drop-shadow">{d.pct}%</span>}
                        </div>
                    ))}
                </div>
                <div className="flex justify-between mt-1">
                    {dominance.map(d => (
                        <span key={d.driver} className="text-[10px] font-bold" style={{ color: d.color }}>{d.driver}</span>
                    ))}
                </div>
            </div>

            {/* Stats comparison */}
            <div className="space-y-2">
                {[
                    { label: 'Top Speed', key: 'topSpeed', unit: ' km/h', best: 'max' },
                    { label: 'Avg Speed', key: 'avgSpeed', unit: ' km/h', best: 'max' },
                    { label: 'Lap Time', key: 'lapTime', unit: 's', best: 'min' },
                ].map(metric => {
                    const values = stats.map(s => s[metric.key]).filter(v => v > 0);
                    const bestVal = metric.best === 'max' ? Math.max(...values) : Math.min(...values);

                    return (
                        <div key={metric.key} className={`flex items-center justify-between text-xs py-1.5 px-2 rounded ${isDark ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
                            <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'} font-medium w-20`}>{metric.label}</span>
                            <div className="flex gap-4">
                                {stats.map(s => (
                                    <span
                                        key={s.id}
                                        className={`font-mono font-bold ${s[metric.key] === bestVal ? '' : 'opacity-50'}`}
                                        style={{ color: s.color }}
                                    >
                                        {metric.key === 'lapTime' ? s[metric.key].toFixed(3) : s[metric.key]}{metric.unit}
                                    </span>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}

export default function RaceData({
    year, setYear, gp, setGp,
    selectedDrivers, toggleDriver, handleAddDriver,
    loading, error, telemetryData, dominanceData,
    lapAnalysis, raceResults, theoreticalBest,
    availableLaps, sessionType, setSessionType,
    selectedLap, setSelectedLap,
    fetchTelemetry
}) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const speedRef = useRef(null);
    const gearRef = useRef(null);
    const throttleRef = useRef(null);
    const brakeRef = useRef(null);
    const deltaRef = useRef(null);

    const { deltaData, tractionZones, headToHead } = useAnalytics(telemetryData, lapAnalysis, selectedDrivers, year);

    const allLaps = Object.values(availableLaps).flat();
    const uniqueLapNumbers = [...new Set(allLaps.map(l => l.number))].sort((a, b) => a - b);

    const cardBg = isDark ? '' : 'bg-white/80 border-gray-200';
    const controlBg = isDark ? 'bg-gray-800/80' : 'bg-white/80';
    const controlBorder = isDark ? 'border-gray-700' : 'border-gray-200';
    const inputBg = isDark ? 'bg-gray-900' : 'bg-gray-100';
    const textMuted = isDark ? 'text-gray-500' : 'text-gray-400';
    const textPrimary = isDark ? 'text-white' : 'text-gray-900';
    const gridStroke = isDark ? '#374151' : '#E5E7EB';

    return (
        <div className="animate-in fade-in zoom-in-95 duration-300">
            {/* CONTROL BAR */}
            <div className={`${controlBg} backdrop-blur-sm rounded-xl p-4 mb-6 flex flex-col lg:flex-row gap-4 items-center justify-between border ${controlBorder} shadow-lg transition-colors duration-300`}>
                <div className="flex flex-wrap gap-3 items-center w-full lg:w-auto">
                    <div className={`flex items-center gap-2 ${inputBg} px-3 py-2 rounded-lg border ${controlBorder}`}>
                        <Calendar size={16} className={textMuted} />
                        <select onChange={e => setYear(e.target.value)} value={year} className={`bg-transparent border-none text-sm font-bold focus:ring-0 cursor-pointer ${textPrimary}`}>
                            {YEARS.map(y => <option key={y} value={y} className={isDark ? 'bg-gray-900' : 'bg-white'}>{y}</option>)}
                        </select>
                    </div>

                    <div className={`flex items-center gap-2 ${inputBg} px-3 py-2 rounded-lg border ${controlBorder}`}>
                        <Map size={16} className={textMuted} />
                        <select onChange={e => setGp(e.target.value)} value={gp} className={`bg-transparent border-none text-sm font-bold focus:ring-0 cursor-pointer max-w-[140px] ${textPrimary}`}>
                            {getTracksForYear(year).map(t => <option key={t} value={t} className={isDark ? 'bg-gray-900' : 'bg-white'}>{t}</option>)}
                        </select>
                    </div>

                    <div className={`flex ${inputBg} rounded-lg p-1 border ${controlBorder} gap-0.5`}>
                        {SESSION_TYPES.map(s => (
                            <button
                                key={s.id}
                                onClick={() => { setSessionType(s.id); setSelectedLap(null); }}
                                className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${sessionType === s.id
                                    ? 'bg-red-600 text-white shadow-sm'
                                    : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                                    }`}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>

                    {uniqueLapNumbers.length > 0 && (
                        <div className={`flex items-center gap-2 ${inputBg} px-3 py-2 rounded-lg border ${controlBorder}`}>
                            <Timer size={16} className={textMuted} />
                            <select
                                value={selectedLap ?? ''}
                                onChange={e => setSelectedLap(e.target.value === '' ? null : parseInt(e.target.value))}
                                className={`bg-transparent border-none text-xs font-bold focus:ring-0 cursor-pointer ${textPrimary} w-20`}
                            >
                                <option value="" className={isDark ? 'bg-gray-900' : 'bg-white'}>Fastest</option>
                                {uniqueLapNumbers.map(n => (
                                    <option key={n} value={n} className={isDark ? 'bg-gray-900' : 'bg-white'}>Lap {n}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <button onClick={fetchTelemetry} disabled={loading}
                        className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-red-900/20">
                        {loading && <Loader2 className="animate-spin w-4 h-4" />}
                        {loading ? 'Processing...' : 'Load Telemetry'}
                    </button>

                    {telemetryData.length > 0 && (
                        <div className="hidden sm:block ml-2 border-l border-gray-600 pl-4">
                            <PDFExport 
                                isDark={isDark}
                                targetRefs={[
                                    { title: 'Speed Trace (km/h)', ref: speedRef },
                                    { title: `Delta Time vs ${selectedDrivers[0]}`, ref: deltaRef },
                                    { title: 'Gear Shift', ref: gearRef },
                                    { title: 'Throttle Application', ref: throttleRef },
                                    { title: 'Brake Pressure (%)', ref: brakeRef }
                                ]}
                                sessionInfo={{ year, gp, sessionType, drivers: selectedDrivers }}
                            />
                        </div>
                    )}
                </div>

                <div className="flex flex-col items-end gap-2 w-full lg:w-auto">
                    <div className="flex flex-wrap justify-end gap-2">
                        <div className={`flex items-center gap-2 ${inputBg} px-2 py-1.5 rounded-lg border ${controlBorder}`}>
                            <span className={`${textMuted} text-xs font-bold px-1`}>ADD:</span>
                            <select value="" onChange={handleAddDriver}
                                className={`bg-transparent border-none text-xs font-bold ${textPrimary} uppercase focus:ring-0 p-0 cursor-pointer w-24`}>
                                <option value="" disabled>Select...</option>
                                {getDriverOptionsForYear(year).map(opt => (
                                    <option key={opt.id} value={opt.id} disabled={selectedDrivers.includes(opt.id)} className={isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}>
                                        {opt.id} - {opt.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {selectedDrivers.map(id => (
                            <DriverTag key={id} driverId={id} year={year} selected={true} onClick={() => toggleDriver(id)} isDark={isDark} />
                        ))}
                    </div>
                </div>
            </div>

            {error && (
                <div className="bg-red-900/20 border border-red-500/50 text-red-200 p-4 rounded-xl mb-6 flex items-center gap-3">
                    <AlertCircle className="shrink-0" />
                    <span className="text-sm font-medium">{error}</span>
                </div>
            )}

            {/* LOADING SKELETONS */}
            {loading && !telemetryData.length && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <SkeletonChart height="h-64" />
                        <div className="grid md:grid-cols-2 gap-6">
                            <SkeletonChart height="h-40" />
                            <SkeletonChart height="h-40" />
                        </div>
                    </div>
                    <div className="space-y-6">
                        <SkeletonChart height="h-72" />
                        <SkeletonChart height="h-48" />
                    </div>
                </div>
            )}

            {/* CHARTS */}
            {telemetryData.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Speed Trace with Traction Zones */}
                        <Card className={cardBg} chartRef={speedRef}>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className={`font-bold ${isDark ? 'text-gray-200' : 'text-gray-700'} text-sm uppercase tracking-wider flex items-center gap-2`}>
                                    <Activity size={16} className="text-blue-500" /> Speed Trace (km/h)
                                </h3>
                                <ExportButton chartRef={speedRef} filename={`speed_${year}_${gp}`} isDark={isDark} />
                            </div>
                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={telemetryData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} opacity={0.3} />
                                        {/* Traction Zones */}
                                        {tractionZones.brakingZones.map((z, i) => (
                                            <ReferenceArea key={`brake-${i}`} x1={z.start} x2={z.end} fill="#EF4444" fillOpacity={0.06} />
                                        ))}
                                        {tractionZones.accelZones.map((z, i) => (
                                            <ReferenceArea key={`accel-${i}`} x1={z.start} x2={z.end} fill="#22C55E" fillOpacity={0.06} />
                                        ))}
                                        <XAxis dataKey="dist" type="number" tick={{ fill: '#6B7280', fontSize: 10 }} tickFormatter={v => `${Math.round(v)}%`} />
                                        <YAxis domain={['auto', 'auto']} tick={{ fill: '#6B7280', fontSize: 10 }} width={30} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend />
                                        {selectedDrivers.map(d => (
                                            <Line key={d} type="monotone" dataKey={`${d}_speed`} name={d}
                                                stroke={getDriverColor(d, year)} dot={false} strokeWidth={2} activeDot={{ r: 4 }} />
                                        ))}
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-[10px] text-gray-500">
                                <span className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-red-500/20 inline-block" /> Braking Zone</span>
                                <span className="flex items-center gap-1"><span className="w-3 h-2 rounded bg-green-500/20 inline-block" /> Acceleration Zone</span>
                            </div>
                        </Card>

                        {/* Delta Time Chart */}
                        {deltaData.length > 0 && selectedDrivers.length >= 2 && (
                            <Card className={cardBg} chartRef={deltaRef}>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className={`font-bold ${isDark ? 'text-gray-200' : 'text-gray-700'} text-sm uppercase tracking-wider flex items-center gap-2`}>
                                        <Timer size={16} className="text-purple-400" /> Delta Time vs {selectedDrivers[0]}
                                    </h3>
                                    <ExportButton chartRef={deltaRef} filename={`delta_${year}_${gp}`} isDark={isDark} />
                                </div>
                                <div className="h-40 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={deltaData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} opacity={0.3} />
                                            <XAxis dataKey="dist" type="number" tick={{ fill: '#6B7280', fontSize: 10 }} tickFormatter={v => `${Math.round(v)}%`} />
                                            <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} width={40} tickFormatter={v => `${v > 0 ? '+' : ''}${v.toFixed(1)}s`} />
                                            <Tooltip content={({ active, payload, label }) => {
                                                if (active && payload?.length) {
                                                    return (
                                                        <div className="bg-gray-950 border border-gray-700 p-3 rounded-lg shadow-2xl text-xs">
                                                            <p className="text-gray-400 mb-1 font-mono">Dist: {Math.round(label)}%</p>
                                                            {payload.map((entry, i) => (
                                                                <div key={i} className="flex items-center gap-2">
                                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.stroke }} />
                                                                    <span className="font-bold" style={{ color: entry.stroke }}>{entry.name.replace('_delta', '')}:</span>
                                                                    <span className="font-mono text-white">{Number(entry.value) > 0 ? '+' : ''}{Number(entry.value).toFixed(3)}s</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }} />
                                            <ReferenceLine y={0} stroke={isDark ? '#fff' : '#000'} strokeWidth={1} strokeOpacity={0.3} />
                                            {selectedDrivers.slice(1).map(d => (
                                                <Line key={d} type="monotone" dataKey={`${d}_delta`} name={`${d}_delta`}
                                                    stroke={getDriverColor(d, year)} dot={false} strokeWidth={2} />
                                            ))}
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                                <p className={`text-[10px] ${textMuted} mt-2`}>Positive = behind {selectedDrivers[0]}, Negative = ahead</p>
                            </Card>
                        )}

                        {/* Gear & Throttle */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <Card className={cardBg} chartRef={gearRef}>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className={`font-bold ${isDark ? 'text-gray-200' : 'text-gray-700'} text-xs uppercase tracking-wider`}>Gear Shift</h3>
                                    <ExportButton chartRef={gearRef} filename={`gear_${year}_${gp}`} isDark={isDark} />
                                </div>
                                <div className="h-40 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={telemetryData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} opacity={0.3} />
                                            <XAxis dataKey="dist" hide />
                                            <YAxis domain={[1, 8]} tickCount={8} tick={{ fill: '#6B7280', fontSize: 10 }} width={20} />
                                            <Tooltip content={<CustomTooltip />} />
                                            {selectedDrivers.map(d => (
                                                <Line key={d} type="stepAfter" dataKey={`${d}_gear`} stroke={getDriverColor(d, year)} dot={false} strokeWidth={2} />
                                            ))}
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>

                            <Card className={cardBg} chartRef={throttleRef}>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className={`font-bold ${isDark ? 'text-gray-200' : 'text-gray-700'} text-xs uppercase tracking-wider`}>Throttle Application</h3>
                                    <ExportButton chartRef={throttleRef} filename={`throttle_${year}_${gp}`} isDark={isDark} />
                                </div>
                                <div className="h-40 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={telemetryData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} opacity={0.3} />
                                            <XAxis dataKey="dist" hide />
                                            <YAxis domain={[0, 100]} tick={{ fill: '#6B7280', fontSize: 10 }} width={30} />
                                            <Tooltip content={<CustomTooltip />} />
                                            {selectedDrivers.map(d => (
                                                <Line key={d} type="monotone" dataKey={`${d}_throttle`} stroke={getDriverColor(d, year)} dot={false} strokeWidth={2} strokeDasharray="4 4" />
                                            ))}
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </Card>
                        </div>

                        {/* Brake Trace */}
                        <Card className={cardBg} chartRef={brakeRef}>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className={`font-bold ${isDark ? 'text-gray-200' : 'text-gray-700'} text-sm uppercase tracking-wider flex items-center gap-2`}>
                                    <span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> Brake Pressure (%)
                                </h3>
                                <ExportButton chartRef={brakeRef} filename={`brake_${year}_${gp}`} isDark={isDark} />
                            </div>
                            <div className="h-40 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={telemetryData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} opacity={0.3} />
                                        <XAxis dataKey="dist" type="number" tick={{ fill: '#6B7280', fontSize: 10 }} tickFormatter={v => `${Math.round(v)}%`} />
                                        <YAxis domain={[0, 100]} tick={{ fill: '#6B7280', fontSize: 10 }} width={30} />
                                        <Tooltip content={<CustomTooltip />} />
                                        {selectedDrivers.map(d => (
                                            <Line key={d} type="monotone" dataKey={`${d}_brake`} name={`${d} brake`}
                                                stroke={getDriverColor(d, year)} dot={false} strokeWidth={2} />
                                        ))}
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="space-y-6">
                        {/* Head-to-Head */}
                        <HeadToHeadCard headToHead={headToHead} isDark={isDark} controlBorder={controlBorder} />


                        {/* Fastest Lap with Compounds */}
                        <Card className={cardBg}>
                            <h3 className={`font-bold ${isDark ? 'text-gray-200' : 'text-gray-700'} text-sm uppercase tracking-wider mb-4 border-b ${controlBorder} pb-2`}>
                                {selectedLap ? `Lap ${selectedLap} Comparison` : 'Fastest Lap Comparison'}
                            </h3>
                            <div className="space-y-4">
                                {lapAnalysis.map((lap) => (
                                    <div key={lap.id} className="text-sm">
                                        <div className="flex justify-between items-end mb-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-black text-lg" style={{ color: getDriverColor(lap.id, year) }}>{lap.id}</span>
                                                {lap.compound && lap.compound !== 'UNKNOWN' && (
                                                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-wider"
                                                        style={{
                                                            backgroundColor: COMPOUND_COLORS[lap.compound] || '#888',
                                                            color: ['HARD', 'MEDIUM'].includes(lap.compound) ? '#000' : '#FFF',
                                                        }}>
                                                        {lap.compound.charAt(0)}
                                                    </span>
                                                )}
                                                {lap.lap_number && <span className={`text-[10px] ${textMuted} font-mono`}>L{lap.lap_number}</span>}
                                            </div>
                                            <span className={`${textPrimary} font-mono font-bold text-base`}>{lap.lap.toFixed(3)}s</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-1 text-[10px] font-mono text-gray-400">
                                            <div className={`${isDark ? 'bg-gray-900' : 'bg-gray-100'} p-1.5 rounded text-center border ${controlBorder}`}>S1: <span className={textPrimary}>{lap.s1}</span></div>
                                            <div className={`${isDark ? 'bg-gray-900' : 'bg-gray-100'} p-1.5 rounded text-center border ${controlBorder}`}>S2: <span className={textPrimary}>{lap.s2}</span></div>
                                            <div className={`${isDark ? 'bg-gray-900' : 'bg-gray-100'} p-1.5 rounded text-center border ${controlBorder}`}>S3: <span className={textPrimary}>{lap.s3}</span></div>
                                        </div>
                                    </div>
                                ))}

                                <div className={`pt-4 mt-2 border-t ${controlBorder} flex justify-between items-center`}>
                                    <span className={`text-xs ${textMuted} uppercase font-bold`}>Theoretical Best</span>
                                    <span className="text-green-400 font-mono font-bold">{theoreticalBest}s</span>
                                </div>
                            </div>
                        </Card>

                        {/* AI Insights for Race Data */}
                        <InsightPanel
                            isDark={isDark}
                            analysisType="race_data"
                            rawData={headToHead || { drivers: selectedDrivers, session: sessionType }}
                        />
                    </div>
                </div>
            )}

            {/* Race Results */}
            {raceResults.length > 0 && (
                <div className="mt-8">
                    <Card className={cardBg}>
                        <div className="flex items-center gap-2 mb-6">
                            <Timer className="text-red-500" />
                            <h2 className={`text-xl font-bold ${textPrimary}`}>Race Classification (Top 5)</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className={`${textMuted} border-b ${controlBorder} uppercase text-xs tracking-wider`}>
                                        <th className="pb-3 pl-2">Pos</th><th className="pb-3">Driver</th><th className="pb-3">Team</th><th className="pb-3">Time / Gap</th><th className="pb-3 text-right pr-2">Pts</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${isDark ? 'divide-gray-800' : 'divide-gray-200'}`}>
                                    {raceResults.map((r, i) => (
                                        <tr key={i} className={`hover:bg-white/5 transition-colors ${r.pos === '1' ? 'bg-yellow-500/5' : ''}`}>
                                            <td className={`py-4 pl-2 font-mono ${textMuted} font-bold`}>{r.pos}</td>
                                            <td className={`py-4 font-bold ${textPrimary} flex items-center gap-3`}>
                                                <div className="w-1 h-8 rounded-full" style={{ backgroundColor: getDriverColor(r.driver, year) }}></div>
                                                {r.driver}
                                            </td>
                                            <td className={`py-4 ${textMuted} text-xs`}>{r.team}</td>
                                            <td className={`py-4 font-mono ${isDark ? 'text-gray-300' : 'text-gray-600'} font-medium`}>{r.time}</td>
                                            <td className={`py-4 text-right pr-2 font-mono ${textPrimary} font-bold`}>{r.points}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            )}

        </div>
    );
}
