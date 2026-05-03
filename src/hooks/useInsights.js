/**
 * AI Insight Engine
 * Generates human-readable analysis from telemetry data using domain-specific heuristics.
 * No external API needed — purely rule-based interpretation.
 */

// ========== TIRE DEGRADATION INSIGHTS ==========
export function generateTireInsights(data) {
    if (!data || Object.keys(data).length === 0) return null;

    const insights = [];
    const driverStints = {};

    // Collect all stint info
    Object.entries(data).forEach(([driver, info]) => {
        driverStints[driver] = info.stints || [];
    });

    // Overall race strategy insight
    const drivers = Object.keys(data);
    drivers.forEach(driver => {
        const stints = driverStints[driver] || [];
        const stintCount = stints.length;
        const compounds = stints.map(s => s.compound);

        if (stintCount > 0) {
            const strategy = compounds.join(' → ');
            insights.push({
                type: 'strategy',
                driver,
                text: `${driver} ran a ${stintCount}-stop strategy: ${strategy}.`,
            });
        }
    });

    // Degradation comparison
    const allStints = [];
    Object.entries(driverStints).forEach(([driver, stints]) => {
        stints.forEach(s => allStints.push({ ...s, driver }));
    });

    if (allStints.length > 0) {
        // Find worst degradation
        const worstDeg = allStints.reduce((a, b) => a.deg_rate > b.deg_rate ? a : b);
        const bestDeg = allStints.filter(s => s.deg_rate > 0).reduce((a, b) => a.deg_rate < b.deg_rate ? a : b, allStints[0]);

        if (worstDeg.deg_rate > 0.05) {
            insights.push({
                type: 'warning',
                text: `${worstDeg.driver}'s ${worstDeg.compound} stint showed high degradation at +${worstDeg.deg_rate.toFixed(3)}s/lap — ${worstDeg.deg_rate > 0.1 ? 'severe graining or overheating likely occurred' :
                    'consistent tire wear throughout the stint'
                    }.`,
            });
        }

        if (bestDeg && bestDeg.deg_rate < 0.03 && bestDeg.lap_count > 10) {
            insights.push({
                type: 'positive',
                text: `${bestDeg.driver} managed excellent tire preservation on ${bestDeg.compound}s — only +${bestDeg.deg_rate.toFixed(3)}s/lap over ${bestDeg.lap_count} laps.`,
            });
        }

        // Compare soft vs hard degradation across all drivers
        const softStints = allStints.filter(s => s.compound === 'SOFT');
        const hardStints = allStints.filter(s => s.compound === 'HARD');

        if (softStints.length > 0 && hardStints.length > 0) {
            const avgSoftDeg = softStints.reduce((a, b) => a + b.deg_rate, 0) / softStints.length;
            const avgHardDeg = hardStints.reduce((a, b) => a + b.deg_rate, 0) / hardStints.length;
            const ratio = avgSoftDeg / (avgHardDeg || 0.001);

            insights.push({
                type: 'analysis',
                text: `Soft tires degraded ${ratio.toFixed(1)}x faster than hards (${avgSoftDeg.toFixed(3)} vs ${avgHardDeg.toFixed(3)} s/lap). ${ratio > 3 ? 'The track surface was particularly aggressive on softer compounds.' :
                    ratio > 1.5 ? 'This is a typical degradation differential for this compound gap.' :
                        'Surprisingly close degradation rates — the harder compound offered limited longevity advantage.'
                    }`,
            });
        }

        // Optimal stint length insight
        if (softStints.length > 0) {
            const avgSoftDeg = softStints.reduce((a, b) => a + b.deg_rate, 0) / softStints.length;
            if (avgSoftDeg > 0) {
                const optimalLaps = Math.round(1.5 / avgSoftDeg);
                insights.push({
                    type: 'recommendation',
                    text: `Based on the degradation rate, the optimal soft tire stint length was approximately ${optimalLaps} laps before the performance drop becomes significant.`,
                });
            }
        }
    }

    // Consistency analysis
    drivers.forEach(driver => {
        const laps = data[driver]?.laps || [];
        if (laps.length > 5) {
            const times = laps.map(l => l.time);
            const mean = times.reduce((a, b) => a + b, 0) / times.length;
            const variance = times.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / times.length;
            const stdDev = Math.sqrt(variance);

            if (stdDev < 0.5) {
                insights.push({
                    type: 'positive',
                    text: `${driver} was extremely consistent with a standard deviation of just ${stdDev.toFixed(2)}s across ${laps.length} laps.`,
                });
            } else if (stdDev > 2.0) {
                insights.push({
                    type: 'warning',
                    text: `${driver} showed high lap time variation (σ = ${stdDev.toFixed(2)}s) — likely affected by traffic, pit stops, or safety car periods.`,
                });
            }
        }
    });

    return insights;
}

// ========== WEATHER CORRELATION INSIGHTS ==========
export function generateWeatherInsights(data) {
    if (!data) return null;

    const insights = [];
    const { correlations, summary, data_points } = data;

    const trackCorr = correlations.track_temp_vs_laptime;
    const airCorr = correlations.air_temp_vs_laptime;

    const interpretCorrelation = (r) => {
        const abs = Math.abs(r);
        if (abs > 0.7) return 'strong';
        if (abs > 0.4) return 'moderate';
        if (abs > 0.2) return 'weak';
        return 'negligible';
    };

    insights.push({
        type: 'analysis',
        text: `Track temperature shows a ${interpretCorrelation(trackCorr)} ${trackCorr > 0 ? 'positive' : 'negative'} correlation (r = ${trackCorr.toFixed(4)}) with lap times. ${trackCorr > 0.3 ? 'Higher track temperatures appear to slow drivers down — likely due to increased tire degradation and reduced grip.' :
            trackCorr < -0.3 ? 'Higher track temperatures are associated with faster laps — warmer rubber may be providing better grip at this circuit.' :
                'Track temperature had minimal direct impact on overall lap times in this race.'
            }`,
    });

    insights.push({
        type: 'analysis',
        text: `Air temperature correlation is ${interpretCorrelation(airCorr)} (r = ${airCorr.toFixed(4)}). ${Math.abs(airCorr) > Math.abs(trackCorr) + 0.1
            ? 'Air temperature had a stronger influence than track temperature, suggesting aerodynamic/engine cooling effects were more significant.'
            : 'Track surface conditions were the dominant thermal factor.'
            }`,
    });

    if (summary.track_temp_range) {
        const range = summary.track_temp_range[1] - summary.track_temp_range[0];
        insights.push({
            type: 'info',
            text: `Track temperature ranged from ${summary.track_temp_range[0]}°C to ${summary.track_temp_range[1]}°C (Δ${range.toFixed(1)}°C). ${range > 10 ? 'This significant temperature swing likely affected tire strategy.' :
                range > 5 ? 'A moderate temperature change occurred during the session.' :
                    'Temperatures remained relatively stable throughout.'
                }`,
        });
    }

    if (data_points) {
        const rainyLaps = data_points.filter(d => d.rainfall).length;
        const totalLaps = data_points.length;
        if (rainyLaps > 0) {
            const rainPct = ((rainyLaps / totalLaps) * 100).toFixed(0);
            const avgDryTime = data_points.filter(d => !d.rainfall).reduce((a, b) => a + b.lap_time, 0) / (totalLaps - rainyLaps || 1);
            const avgWetTime = data_points.filter(d => d.rainfall).reduce((a, b) => a + b.lap_time, 0) / (rainyLaps || 1);

            insights.push({
                type: 'warning',
                text: `Rain was detected during ${rainPct}% of laps. Wet conditions added ~${(avgWetTime - avgDryTime).toFixed(1)}s to average lap times compared to dry conditions.`,
            });
        } else {
            insights.push({
                type: 'positive',
                text: 'The race remained completely dry — no rainfall detected throughout the session.',
            });
        }

        const humidities = data_points.map(d => d.humidity);
        const avgHumidity = humidities.reduce((a, b) => a + b, 0) / humidities.length;
        if (avgHumidity > 70) {
            insights.push({
                type: 'info',
                text: `High humidity levels (avg ${avgHumidity.toFixed(0)}%) may have reduced engine performance slightly due to lower air density.`,
            });
        }
    }

    if (summary.total_samples < 100) {
        insights.push({
            type: 'caution',
            text: `Analysis based on ${summary.total_samples} data points — a larger sample size would improve statistical confidence.`,
        });
    }

    return insights;
}

// ========== OVERTAKE INSIGHTS ==========
export function generateOvertakeInsights(data) {
    if (!data) return null;

    const insights = [];

    insights.push({
        type: 'analysis',
        text: `A total of ${data.total_overtakes} on-track position changes were detected across ${data.overtakes.length} events. ${data.total_overtakes > 50 ? 'This was an action-packed race with above-average overtaking.' :
            data.total_overtakes > 25 ? 'A moderately eventful race in terms of on-track battles.' :
                data.total_overtakes > 10 ? 'A relatively processional race with limited overtaking opportunities.' :
                    'Very few overtakes — the circuit or conditions made passing extremely difficult.'
            }`,
    });

    if (data.top_overtakers?.length > 0) {
        const top = data.top_overtakers[0];
        insights.push({
            type: 'positive',
            text: `${top.driver} was the most active overtaker with ${top.count} successful passes — ${top.count > 10 ? 'a remarkable recovery drive likely from a poor starting position.' :
                top.count > 5 ? 'strong race pace allowed multiple overtakes.' :
                    'consistent pressure on rivals.'
                }`,
        });
    }

    const firstLapOvertakes = data.overtakes.filter(o => o.lap <= 3);
    if (firstLapOvertakes.length > 5) {
        insights.push({
            type: 'info',
            text: `${firstLapOvertakes.length} position changes in the first 3 laps — typical opening lap chaos with multiple drivers battling for position.`,
        });
    }

    return insights;
}
