import { useState, useMemo } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    ScatterChart, Scatter, Cell, BarChart, Bar,
} from 'recharts';
import {
    Loader2, AlertCircle, TrendingDown, Cloud, ArrowRightLeft, Calendar, Map, Sparkles
} from 'lucide-react';
import ParticleCard from './ParticleCard';
import { SkeletonChart } from './Skeletons';
import { getDriverColor, YEARS, getTracksForYear, API_BASE } from '../config/drivers';
import { useTheme } from '../hooks/useTheme';
import { generateTireInsights, generateWeatherInsights, generateOvertakeInsights } from '../hooks/useInsights';
import InsightPanel from './InsightPanel';

const COMPOUND_COLORS = {
    'SOFT': '#FF3333', 'MEDIUM': '#FFC300', 'HARD': '#FFFFFF',
    'INTERMEDIATE': '#39B54A', 'WET': '#0067FF', 'UNKNOWN': '#888888',
};

const Card = ({ children, className = "" }) => (
    <ParticleCard className={className} enableTilt={false} enableStars={false} enableMagnetism={false} clickEffect={false} glowColor="255, 0, 0" particleCount={20}>
        {children}
    </ParticleCard>
);



// ========== TIRE DEGRADATION ==========
function TireDegradation({ isDark, controlBorder, inputBg, textPrimary, textMuted, gridStroke, cardBg }) {
    const [year, setYear] = useState('2024');
    const [gp, setGp] = useState('Bahrain');
    const [drivers, setDrivers] = useState('VER,NOR');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        setLoading(true); setError(null);
        try {
            const res = await fetch(`${API_BASE}/api/tire-degradation?year=${year}&gp=${gp}&drivers=${drivers}`);
            const json = await res.json();
            if (json.status === 'error') throw new Error(json.message);
            setData(json.data);
        } catch (e) { setError(e.message); }
        finally { setLoading(false); }
    };

    return (
        <Card className={cardBg}>
            <h3 className={`font-bold text-xl ${textPrimary} flex items-center gap-2 mb-4`}>
                <TrendingDown className="text-orange-400" /> Tire Degradation Analysis
            </h3>
            <p className={`${textMuted} text-xs mb-4`}>Measures how lap times increase per stint due to tire wear. The degradation rate (sec/lap) shows the slope of the trendline.</p>

            <div className="flex flex-wrap gap-3 mb-6">
                <select value={year} onChange={e => setYear(e.target.value)} className={`${inputBg} border ${controlBorder} rounded-lg px-3 py-2 text-sm font-bold ${textPrimary}`}>
                    {YEARS.filter(y => parseInt(y) <= 2025).map(y => <option key={y} value={y} className={isDark ? 'bg-gray-900' : 'bg-white'}>{y}</option>)}
                </select>
                <select value={gp} onChange={e => setGp(e.target.value)} className={`${inputBg} border ${controlBorder} rounded-lg px-3 py-2 text-sm font-bold ${textPrimary}`}>
                    {getTracksForYear(year).map(t => <option key={t} value={t} className={isDark ? 'bg-gray-900' : 'bg-white'}>{t}</option>)}
                </select>
                <input value={drivers} onChange={e => setDrivers(e.target.value)}
                    className={`${inputBg} border ${controlBorder} rounded-lg px-3 py-2 text-sm font-bold ${textPrimary} w-32`}
                    placeholder="VER,NOR" />
                <button onClick={fetchData} disabled={loading}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50 flex items-center gap-2">
                    {loading && <Loader2 className="animate-spin w-4 h-4" />} {loading ? 'Loading...' : 'Analyze'}
                </button>
            </div>

            {error && <p className="text-red-400 text-sm mb-4"><AlertCircle className="inline w-4 h-4 mr-1" />{error}</p>}
            {loading && <SkeletonChart height="h-64" />}

            {data && Object.keys(data).length > 0 && !loading && (
                <div className="space-y-6">
                    {/* Lap time chart */}
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart>
                                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} opacity={0.3} />
                                <XAxis dataKey="lap" type="number" tick={{ fill: '#6B7280', fontSize: 10 }} label={{ value: 'Lap', position: 'insideBottom', offset: -5, fill: '#6B7280' }} allowDuplicatedCategory={false} />
                                <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} domain={['auto', 'auto']} label={{ value: 'Time (s)', angle: -90, position: 'insideLeft', fill: '#6B7280' }} />
                                <Tooltip contentStyle={{ backgroundColor: isDark ? '#111' : '#fff', border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`, borderRadius: 8, fontSize: 12 }} />
                                <Legend />
                                {Object.entries(data).map(([driver, d]) => (
                                    <Line key={driver} data={d.laps} type="monotone" dataKey="time" name={driver}
                                        stroke={getDriverColor(driver, year)} dot={{ r: 2, fill: getDriverColor(driver, year) }} strokeWidth={2} />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Stint analysis cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(data).map(([driver, d]) => (
                            <div key={driver} className={`${isDark ? 'bg-gray-900/60' : 'bg-gray-50'} rounded-lg p-4 border ${controlBorder}`}>
                                <h4 className="font-bold text-base mb-3" style={{ color: getDriverColor(driver, year) }}>{driver}</h4>
                                <div className="space-y-2">
                                    {d.stints.map(s => (
                                        <div key={s.stint} className={`flex items-center justify-between text-xs p-2 rounded ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                                            <div className="flex items-center gap-2">
                                                <span className="font-black px-1.5 py-0.5 rounded text-[9px]" style={{
                                                    backgroundColor: COMPOUND_COLORS[s.compound] || '#888',
                                                    color: ['HARD', 'MEDIUM'].includes(s.compound) ? '#000' : '#FFF',
                                                }}>{s.compound}</span>
                                                <span className={textMuted}>Stint {s.stint} • {s.lap_count} laps</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={textMuted}>Avg: <span className={textPrimary}>{s.avg_time}s</span></span>
                                                <span className={`font-mono font-bold ${s.deg_rate > 0.05 ? 'text-red-400' : s.deg_rate < 0.02 ? 'text-green-400' : 'text-yellow-400'}`}>
                                                    {s.deg_rate > 0 ? '+' : ''}{s.deg_rate} s/lap
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <InsightPanel insights={generateTireInsights(data)} isDark={isDark} controlBorder={controlBorder} analysisType="tire" rawData={data} />
                </div>
            )}
        </Card>
    );
}

// ========== WEATHER CORRELATION ==========
function WeatherCorrelation({ isDark, controlBorder, inputBg, textPrimary, textMuted, gridStroke, cardBg }) {
    const [year, setYear] = useState('2024');
    const [gp, setGp] = useState('Bahrain');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        setLoading(true); setError(null);
        try {
            const res = await fetch(`${API_BASE}/api/weather-correlation?year=${year}&gp=${gp}`);
            const json = await res.json();
            if (json.status === 'error') throw new Error(json.message);
            setData(json);
        } catch (e) { setError(e.message); }
        finally { setLoading(false); }
    };

    return (
        <Card className={cardBg}>
            <h3 className={`font-bold text-xl ${textPrimary} flex items-center gap-2 mb-4`}>
                <Cloud className="text-blue-400" /> Weather Impact Correlation
            </h3>
            <p className={`${textMuted} text-xs mb-4`}>Scatter analysis of track temperature vs lap time. The Pearson correlation coefficient (r) quantifies the linear relationship.</p>

            <div className="flex flex-wrap gap-3 mb-6">
                <select value={year} onChange={e => setYear(e.target.value)} className={`${inputBg} border ${controlBorder} rounded-lg px-3 py-2 text-sm font-bold ${textPrimary}`}>
                    {YEARS.filter(y => parseInt(y) <= 2025).map(y => <option key={y} value={y} className={isDark ? 'bg-gray-900' : 'bg-white'}>{y}</option>)}
                </select>
                <select value={gp} onChange={e => setGp(e.target.value)} className={`${inputBg} border ${controlBorder} rounded-lg px-3 py-2 text-sm font-bold ${textPrimary}`}>
                    {getTracksForYear(year).map(t => <option key={t} value={t} className={isDark ? 'bg-gray-900' : 'bg-white'}>{t}</option>)}
                </select>
                <button onClick={fetchData} disabled={loading}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50 flex items-center gap-2">
                    {loading && <Loader2 className="animate-spin w-4 h-4" />} {loading ? 'Loading...' : 'Analyze'}
                </button>
            </div>

            {error && <p className="text-red-400 text-sm mb-4"><AlertCircle className="inline w-4 h-4 mr-1" />{error}</p>}
            {loading && <SkeletonChart height="h-64" />}

            {data && !loading && (
                <div className="space-y-6">
                    {/* Correlation badges */}
                    <div className="flex gap-4 flex-wrap">
                        {[
                            { label: 'Track Temp ↔ Lap Time', val: data.correlations.track_temp_vs_laptime },
                            { label: 'Air Temp ↔ Lap Time', val: data.correlations.air_temp_vs_laptime },
                        ].map(c => (
                            <div key={c.label} className={`${isDark ? 'bg-gray-900' : 'bg-gray-50'} rounded-lg px-4 py-3 border ${controlBorder} flex-1`}>
                                <div className={`text-[10px] uppercase font-bold ${textMuted} mb-1`}>{c.label}</div>
                                <div className={`text-2xl font-black font-mono ${Math.abs(c.val) > 0.5 ? 'text-red-400' : Math.abs(c.val) > 0.3 ? 'text-yellow-400' : 'text-green-400'
                                    }`}>
                                    r = {c.val.toFixed(4)}
                                </div>
                                <div className={`text-[10px] ${textMuted}`}>
                                    {Math.abs(c.val) > 0.7 ? 'Strong' : Math.abs(c.val) > 0.4 ? 'Moderate' : Math.abs(c.val) > 0.2 ? 'Weak' : 'Negligible'} correlation
                                </div>
                            </div>
                        ))}
                        <div className={`${isDark ? 'bg-gray-900' : 'bg-gray-50'} rounded-lg px-4 py-3 border ${controlBorder}`}>
                            <div className={`text-[10px] uppercase font-bold ${textMuted} mb-1`}>Samples</div>
                            <div className={`text-2xl font-black font-mono ${textPrimary}`}>{data.summary.total_samples}</div>
                            <div className={`text-[10px] ${textMuted}`}>data points</div>
                        </div>
                    </div>

                    {/* Scatter plot */}
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart>
                                <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} opacity={0.3} />
                                <XAxis dataKey="track_temp" type="number" tick={{ fill: '#6B7280', fontSize: 10 }}
                                    label={{ value: 'Track Temperature (°C)', position: 'insideBottom', offset: -5, fill: '#6B7280' }} />
                                <YAxis dataKey="lap_time" type="number" tick={{ fill: '#6B7280', fontSize: 10 }}
                                    domain={['auto', 'auto']} label={{ value: 'Lap Time (s)', angle: -90, position: 'insideLeft', fill: '#6B7280' }} />
                                <Tooltip content={({ active, payload }) => {
                                    if (active && payload?.length) {
                                        const d = payload[0].payload;
                                        return (
                                            <div className="bg-gray-950 border border-gray-700 p-3 rounded-lg shadow-2xl text-xs">
                                                <div className={textPrimary}><span className="font-bold">{d.driver}</span> • Lap {d.lap}</div>
                                                <div className={textMuted}>Time: <span className={textPrimary}>{d.lap_time}s</span></div>
                                                <div className={textMuted}>Track: <span className={textPrimary}>{d.track_temp}°C</span> | Air: <span className={textPrimary}>{d.air_temp}°C</span></div>
                                                <div className={textMuted}>Humidity: {d.humidity}% | Wind: {d.wind_speed} km/h</div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }} />
                                <Scatter data={data.data_points} shape="circle">
                                    {data.data_points.map((entry, i) => (
                                        <Cell key={i} fill={entry.rainfall ? '#3B82F6' : '#EF4444'} r={3} opacity={0.6} />
                                    ))}
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] text-gray-500">
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> Dry</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> Rain</span>
                    </div>

                    <InsightPanel insights={generateWeatherInsights(data)} isDark={isDark} controlBorder={controlBorder} analysisType="weather" rawData={{ correlations: data.correlations, summary: data.summary }} />
                </div>
            )}
        </Card>
    );
}

// ========== OVERTAKING DETECTION ==========
function OvertakeAnalysis({ isDark, controlBorder, inputBg, textPrimary, textMuted, gridStroke, cardBg }) {
    const [year, setYear] = useState('2024');
    const [gp, setGp] = useState('Bahrain');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        setLoading(true); setError(null);
        try {
            const res = await fetch(`${API_BASE}/api/overtakes?year=${year}&gp=${gp}`);
            const json = await res.json();
            if (json.status === 'error') throw new Error(json.message);
            setData(json);
        } catch (e) { setError(e.message); }
        finally { setLoading(false); }
    };

    // Build bar chart data from by_lap
    const lapBarData = data ? Object.entries(data.by_lap)
        .map(([lap, count]) => ({ lap: parseInt(lap), overtakes: count }))
        .filter(d => d.overtakes > 0)
        .sort((a, b) => a.lap - b.lap) : [];

    return (
        <Card className={cardBg}>
            <h3 className={`font-bold text-xl ${textPrimary} flex items-center gap-2 mb-4`}>
                <ArrowRightLeft className="text-green-400" /> Overtaking Detection
            </h3>
            <p className={`${textMuted} text-xs mb-4`}>Detects position swaps between drivers lap-by-lap. Shows which drivers gained the most positions and when overtakes cluster.</p>

            <div className="flex flex-wrap gap-3 mb-6">
                <select value={year} onChange={e => setYear(e.target.value)} className={`${inputBg} border ${controlBorder} rounded-lg px-3 py-2 text-sm font-bold ${textPrimary}`}>
                    {YEARS.filter(y => parseInt(y) <= 2025).map(y => <option key={y} value={y} className={isDark ? 'bg-gray-900' : 'bg-white'}>{y}</option>)}
                </select>
                <select value={gp} onChange={e => setGp(e.target.value)} className={`${inputBg} border ${controlBorder} rounded-lg px-3 py-2 text-sm font-bold ${textPrimary}`}>
                    {getTracksForYear(year).map(t => <option key={t} value={t} className={isDark ? 'bg-gray-900' : 'bg-white'}>{t}</option>)}
                </select>
                <button onClick={fetchData} disabled={loading}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50 flex items-center gap-2">
                    {loading && <Loader2 className="animate-spin w-4 h-4" />} {loading ? 'Loading...' : 'Detect'}
                </button>
            </div>

            {error && <p className="text-red-400 text-sm mb-4"><AlertCircle className="inline w-4 h-4 mr-1" />{error}</p>}
            {loading && <SkeletonChart height="h-64" />}

            {data && !loading && (
                <div className="space-y-6">
                    {/* Summary */}
                    <div className="flex gap-4 flex-wrap">
                        <div className={`${isDark ? 'bg-gray-900' : 'bg-gray-50'} rounded-lg px-4 py-3 border ${controlBorder} flex-1 text-center`}>
                            <div className={`text-3xl font-black ${textPrimary}`}>{data.total_overtakes}</div>
                            <div className={`text-[10px] uppercase font-bold ${textMuted}`}>Total Overtakes</div>
                        </div>
                        <div className={`${isDark ? 'bg-gray-900' : 'bg-gray-50'} rounded-lg px-4 py-3 border ${controlBorder} flex-1 text-center`}>
                            <div className={`text-3xl font-black ${textPrimary}`}>{data.overtakes.length}</div>
                            <div className={`text-[10px] uppercase font-bold ${textMuted}`}>Overtake Events</div>
                        </div>
                        <div className={`${isDark ? 'bg-gray-900' : 'bg-gray-50'} rounded-lg px-4 py-3 border ${controlBorder} flex-1 text-center`}>
                            <div className={`text-3xl font-black ${textPrimary}`}>{data.top_overtakers?.[0]?.driver || '—'}</div>
                            <div className={`text-[10px] uppercase font-bold ${textMuted}`}>Top Overtaker</div>
                        </div>
                    </div>

                    {/* Overtakes by lap bar chart */}
                    {lapBarData.length > 0 && (
                        <div className="h-48">
                            <div className={`text-xs font-bold ${textMuted} uppercase mb-2`}>Overtakes by Lap</div>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={lapBarData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} opacity={0.3} />
                                    <XAxis dataKey="lap" tick={{ fill: '#6B7280', fontSize: 9 }} />
                                    <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} allowDecimals={false} />
                                    <Tooltip contentStyle={{ backgroundColor: isDark ? '#111' : '#fff', border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`, borderRadius: 8, fontSize: 12 }} />
                                    <Bar dataKey="overtakes" fill="#22C55E" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Top overtakers */}
                    <div>
                        <div className={`text-xs font-bold ${textMuted} uppercase mb-3`}>Top Overtakers</div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                            {data.top_overtakers?.slice(0, 10).map((o, i) => (
                                <div key={o.driver} className={`${isDark ? 'bg-gray-900' : 'bg-gray-50'} rounded-lg p-3 border ${controlBorder} text-center`}>
                                    <div className="text-lg font-black" style={{ color: getDriverColor(o.driver, year) }}>{o.driver}</div>
                                    <div className={`text-xs ${textMuted}`}>{o.count} overtakes</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Strategy Battles (Undercut/Overcut) */}
                    {data.strategy_battles?.length > 0 && (
                        <div>
                            <div className={`text-xs font-bold ${textMuted} uppercase mb-3`}>Strategy Battles</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {data.strategy_battles.map((b, i) => (
                                    <div key={i} className={`${isDark ? 'bg-gray-900/50' : 'bg-gray-50'} rounded-lg p-3 border border-purple-500/30 flex flex-col`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                b.type === 'undercut' ? 'bg-purple-500/20 text-purple-400' : 'bg-orange-500/20 text-orange-400'
                                            }`}>
                                                {b.type === 'undercut' ? '🔽 Undercut' : '🔼 Overcut'}
                                            </span>
                                            <span className={`text-[10px] ${textMuted} font-mono`}>Laps {b.pit_lap}-{b.position_gained_lap}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-bold text-base" style={{ color: getDriverColor(b.driver, year) }}>{b.driver}</span>
                                            <span className={textMuted}>passed</span>
                                            <span className="font-bold text-base" style={{ color: getDriverColor(b.target, year) }}>{b.target}</span>
                                        </div>
                                        <div className={`text-xs ${textMuted}`}>
                                            P{b.pos_before} → P{b.pos_after}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Event log */}
                    <div className={`max-h-48 overflow-y-auto rounded-lg border ${controlBorder}`}>
                        <table className="w-full text-xs">
                            <thead className={`${isDark ? 'bg-gray-900' : 'bg-gray-100'} sticky top-0`}>
                                <tr className={textMuted}>
                                    <th className="text-left p-2">Lap</th><th className="text-left p-2">Driver</th><th className="text-left p-2">Passed</th><th className="text-left p-2">Position</th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${isDark ? 'divide-gray-800' : 'divide-gray-200'}`}>
                                {data.overtakes.slice(0, 50).map((o, i) => (
                                    <tr key={i} className="hover:bg-white/5">
                                        <td className={`p-2 font-mono ${textMuted}`}>{o.lap}</td>
                                        <td className="p-2 font-bold" style={{ color: getDriverColor(o.driver, year) }}>{o.driver}</td>
                                        <td className={`p-2 ${textMuted}`}>{o.overtaken.join(', ')}</td>
                                        <td className={`p-2 ${textMuted}`}>P{o.old_pos} → P{o.new_pos}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <InsightPanel insights={generateOvertakeInsights(data)} isDark={isDark} controlBorder={controlBorder} analysisType="overtakes" rawData={{ total_overtakes: data.total_overtakes, top_overtakers: data.top_overtakers, event_count: data.overtakes.length }} />
                </div>
            )}
        </Card>
    );
}

// ========== MAIN ANALYSIS VIEW ==========
export default function Analysis() {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const cardBg = isDark ? '' : 'bg-white/80 border-gray-200';
    const controlBorder = isDark ? 'border-gray-700' : 'border-gray-200';
    const inputBg = isDark ? 'bg-gray-900' : 'bg-gray-100';
    const textPrimary = isDark ? 'text-white' : 'text-gray-900';
    const textMuted = isDark ? 'text-gray-500' : 'text-gray-400';
    const gridStroke = isDark ? '#374151' : '#E5E7EB';

    const sharedProps = { isDark, controlBorder, inputBg, textPrimary, textMuted, gridStroke, cardBg };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-10">
                <h1 className={`text-4xl font-black italic uppercase tracking-tight mb-2 ${textPrimary}`}>Advanced Analysis</h1>
                <p className={textMuted + " text-sm"}>Deep analytical tools powered by FastF1 telemetry data</p>
            </div>

            <TireDegradation {...sharedProps} />
            <WeatherCorrelation {...sharedProps} />
            <OvertakeAnalysis {...sharedProps} />
        </div>
    );
}
