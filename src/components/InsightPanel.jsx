import { useState } from 'react';
import { Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { API_BASE } from '../config/drivers';

const INSIGHT_ICONS = {
    analysis: '📊', warning: '⚠️', positive: '✅', recommendation: '💡',
    info: 'ℹ️', caution: '⚡', strategy: '🏁',
};

const ANALYSIS_TITLES = {
    tire: '🏎️ Tire Degradation Analysis',
    weather: '🌦️ Weather Impact Analysis',
    overtakes: '⚔️ Overtaking Pattern Analysis',
    race_data: '🏁 Race Telemetry Analysis',
};

export default function InsightPanel({ insights = [], isDark, analysisType, rawData }) {
    const [aiInsights, setAiInsights] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const handleExplain = async () => {
        setShowModal(true);
        setAiLoading(true); setAiError(null);
        try {
            const res = await fetch(`${API_BASE}/api/ai-insight`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: analysisType, data: rawData, rule_insights: insights }),
            });
            const json = await res.json();
            if (json.status === 'error') throw new Error(json.message);
            setAiInsights(json.insights);
        } catch (e) {
            setAiError(e.message);
        } finally {
            setAiLoading(false);
        }
    };

    return (
        <>
            {/* Inline rule-based insights / AI Trigger */}
            <div className={`mt-6 ${isDark ? 'bg-linear-to-br from-purple-900/20 to-blue-900/20' : 'bg-linear-to-br from-purple-50 to-blue-50'} rounded-xl p-4 border ${isDark ? 'border-purple-500/20' : 'border-purple-200'}`}>
                <div className="flex items-center justify-between">
                    <h4 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                        <Sparkles size={16} className="text-purple-400" /> AI Insights
                    </h4>
                    <button onClick={handleExplain} disabled={aiLoading}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${isDark ? 'bg-purple-600/30 text-purple-300 hover:bg-purple-600/50 border border-purple-500/30'
                            : 'bg-purple-100 text-purple-700 hover:bg-purple-200 border border-purple-300'
                            } disabled:opacity-50`}>
                        {aiLoading ? <Loader2 className="animate-spin w-3 h-3" /> : <Sparkles size={12} />}
                        {aiLoading ? 'Generating...' : 'Explain with AI ✨'}
                    </button>
                </div>
                {insights && insights.length > 0 && (
                    <div className="space-y-2 mt-3 pt-3 border-t border-purple-500/20">
                        {insights.map((insight, i) => (
                            <div key={i} className={`text-xs leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'} flex gap-2`}>
                                <span className="shrink-0 mt-0.5">{INSIGHT_ICONS[insight.type] || '📊'}</span>
                                <span>{insight.text}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal dialog for Gemini AI insights */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => !aiLoading && setShowModal(false)}>
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <div onClick={e => e.stopPropagation()}
                        className={`relative w-full max-w-2xl max-h-[80vh] rounded-2xl border shadow-2xl overflow-hidden flex flex-col ${isDark ? 'bg-gray-900 border-purple-500/30' : 'bg-white border-purple-200'
                            }`}>
                        {/* Header */}
                        <div className={`flex items-center justify-between p-5 border-b ${isDark ? 'border-gray-800 bg-linear-to-r from-purple-900/30 to-blue-900/30' : 'border-gray-100 bg-linear-to-r from-purple-50 to-blue-50'}`}>
                            <div>
                                <h3 className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    <Sparkles size={20} className="text-purple-400" />
                                    {ANALYSIS_TITLES[analysisType] || 'AI Analysis'}
                                </h3>
                                <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Powered by Gemini 2.5 Flash
                                </p>
                            </div>
                            <button onClick={() => setShowModal(false)}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                                    }`}>✕</button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-5">
                            {aiLoading && (
                                <div className="flex flex-col items-center justify-center py-12 gap-4">
                                    <Loader2 className="animate-spin w-8 h-8 text-purple-400" />
                                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                        Analyzing telemetry data with Gemini...
                                    </p>
                                </div>
                            )}

                            {aiError && !aiLoading && (
                                <div className="flex flex-col items-center justify-center py-12 gap-3">
                                    <AlertCircle className="w-8 h-8 text-red-400" />
                                    <p className="text-red-400 text-sm">⚠️ {aiError}</p>
                                    <button onClick={handleExplain}
                                        className="text-xs px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                                        Try Again
                                    </button>
                                </div>
                            )}

                            {aiInsights && !aiLoading && (
                                <div className="space-y-4">
                                    {aiInsights.map((insight, i) => (
                                        <div key={i} className={`text-sm leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'} flex gap-3`}>
                                            <span className="shrink-0 mt-0.5 text-base">✨</span>
                                            <span>{insight.text}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
