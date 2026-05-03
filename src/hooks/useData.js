import { useState, useEffect, useMemo, useCallback } from 'react';
import { API_BASE } from '../config/drivers';

// --- CACHING LAYER ---
const CACHE_PREFIX = 'f1hub_';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

function getCached(key) {
    try {
        const raw = sessionStorage.getItem(CACHE_PREFIX + key);
        if (!raw) return null;
        const { data, ts } = JSON.parse(raw);
        if (Date.now() - ts > CACHE_TTL) {
            sessionStorage.removeItem(CACHE_PREFIX + key);
            return null;
        }
        return data;
    } catch { return null; }
}

function setCache(key, data) {
    try {
        sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ data, ts: Date.now() }));
    } catch {
        // Storage full — clear old entries
        try {
            Object.keys(sessionStorage)
                .filter(k => k.startsWith(CACHE_PREFIX))
                .forEach(k => sessionStorage.removeItem(k));
            sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ data, ts: Date.now() }));
        } catch { /* ignore */ }
    }
}

// --- STANDINGS HOOK ---
export function useStandings() {
    const [driverStandings, setDriverStandings] = useState([]);
    const [teamStandings, setTeamStandings] = useState([]);
    const [standingsError, setStandingsError] = useState(null);
    const [standingsLoading, setStandingsLoading] = useState(true);

    const fetchStandings = () => {
        const cached = getCached('standings');
        if (cached) {
            setDriverStandings(cached.drivers || []);
            setTeamStandings(cached.constructors || []);
            setStandingsLoading(false);
            return;
        }

        setStandingsLoading(true);
        setStandingsError(null);
        fetch(`${API_BASE}/api/standings`)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then(data => {
                setDriverStandings(data.drivers || []);
                setTeamStandings(data.constructors || []);
                setCache('standings', data);
            })
            .catch(err => {
                console.error("Standings API Error:", err);
                setStandingsError("Failed to load standings. Check if the backend is running.");
            })
            .finally(() => setStandingsLoading(false));
    };

    useEffect(() => { fetchStandings(); }, []);

    return { driverStandings, teamStandings, standingsError, standingsLoading, retryStandings: fetchStandings };
}

// --- TELEMETRY HOOK ---
export function useTelemetry(drivers, year, gp) {
    const searchParams = new URLSearchParams(window.location.search);
    const initialSession = searchParams.get('session') || 'R';
    const initialLap = searchParams.get('lap') ? parseInt(searchParams.get('lap')) : null;

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [telemetryData, setTelemetryData] = useState([]);
    const [dominanceData, setDominanceData] = useState([]);
    const [lapAnalysis, setLapAnalysis] = useState([]);
    const [raceResults, setRaceResults] = useState([]);
    const [availableLaps, setAvailableLaps] = useState({});
    const [sessionType, setSessionType] = useState(initialSession);
    const [selectedLap, setSelectedLap] = useState(initialLap);

    const fetchTelemetry = async () => {
        const driversQuery = drivers.join(',');
        const cacheKey = `tel_${year}_${gp}_${sessionType}_${driversQuery}_${selectedLap || 'fastest'}`;

        // Check cache first
        const cached = getCached(cacheKey);
        if (cached) {
            applyTelemetryResult(cached);
            return;
        }

        setLoading(true);
        setError(null);
        setRaceResults([]);

        try {
            let url = `${API_BASE}/api/telemetry?year=${year}&gp=${gp}&drivers=${driversQuery}&session=${sessionType}`;
            if (selectedLap !== null) url += `&lap=${selectedLap}`;
            const response = await fetch(url);
            const result = await response.json();

            if (result.status === 'error') throw new Error(result.message);

            applyTelemetryResult(result);
            setCache(cacheKey, result);

        } catch (err) {
            console.error(err);
            setError(`Failed to load data for ${year} ${gp} (${sessionType}). Session might not exist yet.`);
        } finally {
            setLoading(false);
        }
    };

    const applyTelemetryResult = (result) => {
        if (result.telemetry && result.telemetry.length > 0) {
            const maxLen = Math.max(...result.telemetry.map(d => d.data.length));
            const merged = [];
            for (let i = 0; i < maxLen; i++) {
                const row = { dist: result.telemetry[0]?.data[i]?.dist ?? i };
                result.telemetry.forEach(d => {
                    if (d.data[i]) {
                        row[`${d.driver}_speed`] = d.data[i].speed;
                        row[`${d.driver}_gear`] = d.data[i].gear;
                        row[`${d.driver}_throttle`] = d.data[i].throttle;
                        row[`${d.driver}_brake`] = d.data[i].brake;
                        row[`${d.driver}_time`] = d.data[i].time;
                    }
                });
                merged.push(row);
            }
            setTelemetryData(merged);
        } else {
            setTelemetryData([]);
        }

        setDominanceData(result.dominance || []);
        setLapAnalysis(result.analysis || []);
        setRaceResults(result.race_results || []);
        setAvailableLaps(result.available_laps || {});
        setLoading(false);
    };

    const theoreticalBest = useMemo(() => {
        if (!lapAnalysis.length) return 0;
        const bestS1 = Math.min(...lapAnalysis.map(d => d.s1).filter(s => s > 0));
        const bestS2 = Math.min(...lapAnalysis.map(d => d.s2).filter(s => s > 0));
        const bestS3 = Math.min(...lapAnalysis.map(d => d.s3).filter(s => s > 0));
        return (bestS1 + bestS2 + bestS3).toFixed(3);
    }, [lapAnalysis]);

    return {
        loading, error, telemetryData, dominanceData, lapAnalysis,
        raceResults, theoreticalBest, availableLaps,
        sessionType, setSessionType,
        selectedLap, setSelectedLap,
        fetchTelemetry
    };
}

// --- SEASON PROGRESSION HOOK ---
export function useSeasonProgress() {
    const [progressData, setProgressData] = useState(null);
    const [progressLoading, setProgressLoading] = useState(false);
    const [progressError, setProgressError] = useState(null);
    const [progressYear, setProgressYear] = useState('2025');

    const fetchProgress = useCallback(async (year) => {
        const cacheKey = `progress_${year}`;
        const cached = getCached(cacheKey);
        if (cached) {
            setProgressData(cached);
            setProgressYear(year);
            return;
        }

        setProgressLoading(true);
        setProgressError(null);

        try {
            const res = await fetch(`${API_BASE}/api/season-progress?year=${year}`);
            const data = await res.json();

            if (data.status === 'error') throw new Error(data.message);

            setProgressData(data);
            setProgressYear(year);
            setCache(cacheKey, data);
        } catch (err) {
            console.error("Season progress error:", err);
            setProgressError("Failed to load season progression data.");
        } finally {
            setProgressLoading(false);
        }
    }, []);

    return { progressData, progressLoading, progressError, progressYear, fetchProgress };
}
