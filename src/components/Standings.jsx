import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2, AlertCircle, User, Settings, TrendingUp, ChevronDown } from 'lucide-react';
import ParticleCard from './ParticleCard';
import { SkeletonTable, SkeletonChart } from './Skeletons';
import { useTheme } from '../hooks/useTheme';
import { getDriverColor } from '../config/drivers';

const Card = ({ children, className = "" }) => (
    <ParticleCard
        className={className}
        enableTilt={false}
        enableStars={false}
        enableMagnetism={false}
        clickEffect={false}
        glowColor="255, 0, 0"
        particleCount={20}
    >
        {children}
    </ParticleCard>
);

const PROGRESSION_YEARS = ['2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018'];

export default function Standings({
    driverStandings, teamStandings, standingsLoading, standingsError, retryStandings,
    progressData, progressLoading, progressError, fetchProgress
}) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [progYear, setProgYear] = useState('2025');

    useEffect(() => {
        if (fetchProgress) fetchProgress(progYear);
    }, [progYear, fetchProgress]);

    const maxPoints = teamStandings.length > 0 ? teamStandings[0].points : 1;
    const textPrimary = isDark ? 'text-white' : 'text-gray-900';
    const textMuted = isDark ? 'text-gray-500' : 'text-gray-400';
    const controlBorder = isDark ? 'border-gray-700' : 'border-gray-200';
    const cardBg = isDark ? '' : 'bg-white/80 border-gray-200';
    const gridStroke = isDark ? '#374151' : '#E5E7EB';

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-10">
                <h1 className={`text-4xl font-black italic uppercase tracking-tight mb-2 ${textPrimary}`}>Championship Standings</h1>
                <p className={textMuted + " text-sm"}>Real-time data sourced via Jolpica-F1 API</p>
            </div>

            {standingsError && (
                <div className="bg-red-900/20 border border-red-500/50 text-red-200 p-4 rounded-xl mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="shrink-0" />
                        <span className="text-sm font-medium">{standingsError}</span>
                    </div>
                    <button onClick={retryStandings} className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all">
                        Retry
                    </button>
                </div>
            )}

            {/* SKELETON LOADING */}
            {standingsLoading && (
                <div className="grid md:grid-cols-2 gap-8">
                    <SkeletonTable rows={10} cols={4} />
                    <SkeletonTable rows={10} cols={3} />
                </div>
            )}

            {!standingsLoading && driverStandings.length === 0 && !standingsError && (
                <div className={`text-center ${textMuted} py-20`}>No standings data available.</div>
            )}

            {driverStandings.length > 0 && (
                <div className="grid md:grid-cols-2 gap-8">
                    <Card className={cardBg}>
                        <h2 className={`text-xl font-bold flex items-center gap-2 mb-6 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}><User className="text-red-500" /> Driver Standings</h2>
                        <p className={`text-xs ${textMuted} mb-4`}>Showing top {driverStandings.length} drivers</p>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className={`${textMuted} border-b ${controlBorder} uppercase text-xs tracking-wider`}>
                                        <th className="pb-3 pl-2">Pos</th><th className="pb-3">Driver</th><th className="pb-3">Team</th><th className="pb-3 text-right pr-2">Pts</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${isDark ? 'divide-gray-800' : 'divide-gray-200'}`}>
                                    {driverStandings.map((d, i) => (
                                        <tr key={i} className="hover:bg-white/5 transition-colors">
                                            <td className={`py-3 pl-2 font-mono ${textMuted} font-bold`}>{d.pos}</td>
                                            <td className={`py-3 font-bold ${textPrimary}`}>{d.driver}</td>
                                            <td className={`py-3 ${textMuted} text-xs`}>{d.team}</td>
                                            <td className="py-3 text-right pr-2 font-mono text-red-400 font-bold">{d.points}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    <Card className={cardBg}>
                        <h2 className={`text-xl font-bold flex items-center gap-2 mb-6 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}><Settings className="text-red-500" /> Constructor Standings</h2>
                        <div className="space-y-4">
                            {teamStandings.map((team, i) => (
                                <div key={i} className={`flex items-center justify-between p-4 rounded-lg ${isDark ? 'bg-gray-900/40 border-gray-800 hover:border-gray-600' : 'bg-gray-50 border-gray-200 hover:border-gray-400'} border transition-all group`}>
                                    <div className="flex items-center gap-4 flex-1">
                                        <span className={`font-mono ${textMuted} w-6 font-bold`}>{team.pos}</span>
                                        <div className="flex-1">
                                            <div className={`font-bold ${textPrimary} group-hover:text-red-400 transition-colors`}>{team.name}</div>
                                            <div className={`w-full h-1.5 ${isDark ? 'bg-gray-800' : 'bg-gray-200'} rounded-full mt-2 overflow-hidden`}>
                                                <div className="h-full bg-red-600 rounded-full transition-all duration-1000" style={{ width: `${Math.min((team.points / maxPoints) * 100, 100)}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`text-xl font-black italic ${isDark ? 'text-gray-600 group-hover:text-white' : 'text-gray-300 group-hover:text-gray-900'} transition-colors pl-4`}>{team.points}</div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            )}

            {/* SEASON PROGRESSION CHART */}
            <div className="mt-8">
                <Card className={cardBg}>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                            <TrendingUp className="text-red-500" /> Season Progression
                        </h2>
                        <div className={`flex items-center gap-2 ${isDark ? 'bg-gray-900' : 'bg-gray-100'} px-3 py-2 rounded-lg border ${controlBorder}`}>
                            <select value={progYear} onChange={e => setProgYear(e.target.value)}
                                className={`bg-transparent border-none text-sm font-bold focus:ring-0 cursor-pointer ${textPrimary}`}>
                                {PROGRESSION_YEARS.map(y => <option key={y} value={y} className={isDark ? 'bg-gray-900' : 'bg-white'}>{y}</option>)}
                            </select>
                        </div>
                    </div>

                    {progressLoading && <SkeletonChart height="h-64" />}
                    {progressError && <p className="text-red-400 text-sm">{progressError}</p>}

                    {progressData && progressData.progression?.length > 0 && !progressLoading && (
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={progressData.progression}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} opacity={0.3} />
                                    <XAxis
                                        dataKey="race"
                                        tick={{ fill: '#6B7280', fontSize: 9 }}
                                        angle={-45}
                                        textAnchor="end"
                                        height={60}
                                        interval={0}
                                    />
                                    <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} width={40} />
                                    <Tooltip
                                        itemSorter={(item) => -item.value}
                                        contentStyle={{
                                            backgroundColor: isDark ? '#111' : '#fff',
                                            border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
                                            borderRadius: 8,
                                            fontSize: 12,
                                        }}
                                    />
                                    <Legend
                                        payload={progressData.drivers?.map(d => ({
                                            id: d.code,
                                            type: 'line',
                                            value: d.name,
                                            color: getDriverColor(d.code, progYear)
                                        }))}
                                    />
                                    {progressData.drivers?.map(d => (
                                        <Line
                                            key={d.code}
                                            type="monotone"
                                            dataKey={d.code}
                                            name={d.name}
                                            stroke={getDriverColor(d.code, progYear)}
                                            dot={false}
                                            strokeWidth={2}
                                            activeDot={{ r: 4 }}
                                        />
                                    ))}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {!progressLoading && !progressData && !progressError && (
                        <p className={`text-center ${textMuted} py-8`}>Select a year to view the championship battle.</p>
                    )}
                </Card>
            </div>
        </div>
    );
}
