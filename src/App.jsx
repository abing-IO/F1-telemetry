import { useState, useEffect } from 'react';
import { Trophy, Activity, Sun, Moon, FlaskConical } from 'lucide-react';
import { useStandings, useTelemetry, useSeasonProgress } from './hooks/useData';
import { useTheme } from './hooks/useTheme';
import { SEASON_DATA, getTracksForYear } from './config/drivers';
import Standings from './components/Standings';
import RaceData from './components/RaceData';
import Analysis from './components/Analysis';

export default function F1TelemetryApp() {
  const searchParams = new URLSearchParams(window.location.search);
  const initialView = searchParams.get('view') || 'standings';
  const initialYear = searchParams.get('year') || '2024';
  const initialGp = searchParams.get('gp') || 'Bahrain';
  const initialDrivers = searchParams.get('drivers') ? searchParams.get('drivers').split(',') : ['VER', 'NOR'];

  const [view, setView] = useState(initialView);
  const [year, setYear] = useState(initialYear);
  const [gp, setGp] = useState(initialGp);
  const [selectedDrivers, setSelectedDrivers] = useState(initialDrivers);
  const { theme, toggleTheme } = useTheme();

  const { driverStandings, teamStandings, standingsError, standingsLoading, retryStandings } = useStandings();
  const {
    loading, error, telemetryData, dominanceData, lapAnalysis,
    raceResults, theoreticalBest, availableLaps,
    sessionType, setSessionType,
    selectedLap, setSelectedLap,
    fetchTelemetry
  } = useTelemetry(selectedDrivers, year, gp);
  const { progressData, progressLoading, progressError, fetchProgress } = useSeasonProgress();

  useEffect(() => {
    const params = new URLSearchParams();
    if (view !== 'standings') params.set('view', view);
    if (year !== '2024') params.set('year', year);
    if (gp !== 'Bahrain') params.set('gp', gp);
    if (selectedDrivers.join(',') !== 'VER,NOR') params.set('drivers', selectedDrivers.join(','));
    if (sessionType !== 'R') params.set('session', sessionType);
    if (selectedLap !== null) params.set('lap', selectedLap);

    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState({}, '', newUrl);
  }, [view, year, gp, selectedDrivers, sessionType, selectedLap]);

  const handleYearChange = (newYear) => {
    setYear(newYear);
    const tracks = getTracksForYear(newYear);
    setGp(tracks[0] || 'Australia');
    const seasonDrivers = SEASON_DATA[parseInt(newYear)]?.drivers || ['VER', 'NOR'];
    const validDrivers = selectedDrivers.filter(d => seasonDrivers.includes(d));
    setSelectedDrivers(validDrivers.length >= 1 ? validDrivers : seasonDrivers.slice(0, 2));
    setSelectedLap(null); // Reset lap selection on year change
  };

  const toggleDriver = (id) => {
    if (selectedDrivers.includes(id)) {
      if (selectedDrivers.length > 1) setSelectedDrivers(prev => prev.filter(d => d !== id));
    } else {
      setSelectedDrivers(prev => [...prev, id]);
    }
  };

  const handleAddDriver = (e) => {
    const id = e.target.value;
    if (id && !selectedDrivers.includes(id)) {
      setSelectedDrivers(prev => [...prev, id]);
    }
  };

  const isDark = theme === 'dark';
  const bg = isDark ? 'bg-[#0f1014]' : 'bg-gray-100';
  const text = isDark ? 'text-gray-100' : 'text-gray-900';
  const headerBg = isDark ? 'bg-[#0f1014]/90' : 'bg-white/90';
  const headerBorder = isDark ? 'border-gray-800' : 'border-gray-200';

  return (
    <div className={`min-h-screen ${bg} ${text} font-sans selection:bg-red-500/30 overflow-x-hidden transition-colors duration-300`}>

      <header className={`fixed top-0 w-full z-50 ${headerBg} backdrop-blur-md border-b ${headerBorder} transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-red-600 text-white font-black italic px-2 py-1 text-xl rounded-sm skew-x-[-10deg]">F1</div>
            <span className="font-bold text-lg hidden sm:block tracking-tight">TELEMETRY<span className="text-red-600">HUB</span></span>
          </div>

          <div className="flex gap-2 items-center">
            <button onClick={() => setView('standings')} className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors ${view === 'standings' ? 'bg-red-600 text-white' : isDark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-200'}`}>
              <Trophy size={16} /> <span className="hidden sm:inline">Standings</span>
            </button>
            <button onClick={() => setView('race')} className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors ${view === 'race' ? 'bg-red-600 text-white' : isDark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-200'}`}>
              <Activity size={16} /> <span className="hidden sm:inline">Race Data</span>
            </button>
            <button onClick={() => setView('analysis')} className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors ${view === 'analysis' ? 'bg-red-600 text-white' : isDark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-200'}`}>
              <FlaskConical size={16} /> <span className="hidden sm:inline">Analysis</span>
            </button>
            <div className="w-px h-6 bg-gray-700 mx-1" />
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors ${isDark ? 'text-yellow-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-200'}`}
              title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-12 px-4 max-w-7xl mx-auto z-10 relative">
        {view === 'standings' && (
          <Standings
            driverStandings={driverStandings}
            teamStandings={teamStandings}
            standingsLoading={standingsLoading}
            standingsError={standingsError}
            retryStandings={retryStandings}
            progressData={progressData}
            progressLoading={progressLoading}
            progressError={progressError}
            fetchProgress={fetchProgress}
          />
        )}

        {view === 'race' && (
          <RaceData
            year={year} setYear={handleYearChange}
            gp={gp} setGp={setGp}
            selectedDrivers={selectedDrivers}
            toggleDriver={toggleDriver}
            handleAddDriver={handleAddDriver}
            loading={loading} error={error}
            telemetryData={telemetryData}
            dominanceData={dominanceData}
            lapAnalysis={lapAnalysis}
            raceResults={raceResults}
            theoreticalBest={theoreticalBest}
            availableLaps={availableLaps}
            sessionType={sessionType}
            setSessionType={setSessionType}
            selectedLap={selectedLap}
            setSelectedLap={setSelectedLap}
            fetchTelemetry={fetchTelemetry}
          />
        )}

        {view === 'analysis' && <Analysis />}
      </main>
    </div>
  );
}
