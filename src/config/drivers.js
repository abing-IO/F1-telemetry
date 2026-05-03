// --- CONFIG: COLOR ERAS ---

// 2026 (New regs, 11 teams including Cadillac)
export const COLORS_2026 = {
    'VER': '#0600EF', 'HAD': '#1E41FF', // Red Bull
    'NOR': '#FF8700', 'PIA': '#FFB347', // McLaren
    'LEC': '#DC0000', 'HAM': '#FF2400', // Ferrari
    'RUS': '#24FFFF', 'ANT': '#00D2BE', // Mercedes
    'ALO': '#006F62', 'STR': '#00A591', // Aston Martin
    'GAS': '#FF7CA1', 'COL': '#FF5A85', // Alpine
    'ALB': '#005AFF', 'SAI': '#0041B3', // Williams
    'LAW': '#6692FF', 'LIN': '#214DBD', // Racing Bulls
    'HUL': '#00E701', 'BOR': '#52E252', // Audi
    'OCO': '#B6BABD', 'BEA': '#E3E3E3', // Haas
    'BOT': '#C8A415', 'PER': '#DAB825'  // Cadillac
};

// 2025
export const COLORS_2025 = {
    'VER': '#0600EF', 'LAW': '#1E41FF', // Red Bull
    'NOR': '#FF8700', 'PIA': '#FFB347', // McLaren
    'LEC': '#DC0000', 'HAM': '#FF2400', // Ferrari
    'RUS': '#24FFFF', 'ANT': '#00D2BE', // Mercedes
    'ALO': '#006F62', 'STR': '#00A591', // Aston Martin
    'GAS': '#FF7CA1', 'DOO': '#FF5A85', // Alpine
    'ALB': '#005AFF', 'SAI': '#0041B3', // Williams
    'TSU': '#6692FF', 'HAD': '#214DBD', // RB
    'HUL': '#00E701', 'BOR': '#52E252', // Sauber
    'OCO': '#B6BABD', 'BEA': '#E3E3E3'  // Haas
};

// 2019-2024
export const COLORS_2024 = {
    'VER': '#0600EF', 'PER': '#1E41FF',
    'NOR': '#FF8700', 'PIA': '#FFB347',
    'LEC': '#DC0000', 'SAI': '#FF2400',
    'HAM': '#00D2BE', 'RUS': '#24FFFF',
    'ALO': '#006F62', 'STR': '#00A591',
    'GAS': '#0090FF', 'OCO': '#70C2FF',
    'ALB': '#005AFF', 'SAR': '#64C4FF', 'COL': '#0041B3',
    'TSU': '#6692FF', 'RIC': '#3B6EFF', 'LAW': '#214DBD',
    'BOT': '#00E701', 'ZHO': '#52E252',
    'HUL': '#B6BABD', 'MAG': '#E3E3E3',
    'DEV': '#6692FF', 'BEA': '#B6BABD'
};

// Legacy (pre-2019)
export const COLORS_LEGACY = {
    'VET': '#DC0000', 'RAI': '#9B0000',
    'ROS': '#6CD3BF', 'RIC': '#FF8700',
    'MAZ': '#FFFFFF', 'MSC': '#F1F1F1',
    'LAT': '#005AFF', 'KUB': '#9B0000',
    'KVY': '#469BFF', 'GRO': '#7B7B7B',
    'GIO': '#900000', 'ERI': '#9B0000',
    'SIR': '#005AFF', 'VAN': '#FF8700',
    'HAR': '#469BFF',
};

// --- FULL DRIVER NAME MAP ---
const DRIVER_NAMES = {
    'VER': 'Max Verstappen', 'NOR': 'Lando Norris', 'LEC': 'Charles Leclerc',
    'HAM': 'Lewis Hamilton', 'PIA': 'Oscar Piastri', 'RUS': 'George Russell',
    'SAI': 'Carlos Sainz', 'ALB': 'Alex Albon', 'ALO': 'Fernando Alonso',
    'STR': 'Lance Stroll', 'GAS': 'Pierre Gasly', 'OCO': 'Esteban Ocon',
    'LAW': 'Liam Lawson', 'LIN': 'Arvid Lindblad', 'ANT': 'Kimi Antonelli',
    'COL': 'Franco Colapinto', 'BEA': 'Ollie Bearman', 'BOR': 'Gabriel Bortoleto',
    'HAD': 'Isack Hadjar', 'HUL': 'Nico Hulkenberg', 'PER': 'Sergio Perez',
    'BOT': 'Valtteri Bottas', 'TSU': 'Yuki Tsunoda', 'DOO': 'Jack Doohan',
    'RIC': 'Daniel Ricciardo', 'ZHO': 'Guanyu Zhou', 'MAG': 'Kevin Magnussen',
    'DEV': 'Nyck de Vries', 'SAR': 'Logan Sargeant', 'VET': 'Sebastian Vettel',
    'RAI': 'Kimi Raikkonen', 'GIO': 'Antonio Giovinazzi', 'LAT': 'Nicholas Latifi',
    'MAZ': 'Nikita Mazepin', 'MSC': 'Mick Schumacher', 'KVY': 'Daniil Kvyat',
    'GRO': 'Romain Grosjean', 'KUB': 'Robert Kubica', 'ERI': 'Marcus Ericsson',
    'SIR': 'Sergey Sirotkin', 'VAN': 'Stoffel Vandoorne', 'HAR': 'Brendon Hartley',
};

// --- PER-YEAR SEASON DATA ---
export const SEASON_DATA = {
    2026: {
        drivers: ['VER', 'HAD', 'NOR', 'PIA', 'LEC', 'HAM', 'RUS', 'ANT', 'ALO', 'STR', 'GAS', 'COL', 'ALB', 'SAI', 'LAW', 'LIN', 'HUL', 'BOR', 'OCO', 'BEA', 'BOT', 'PER'],
        tracks: ['Australia', 'China', 'Japan', 'Bahrain', 'Saudi Arabia', 'Miami', 'Canada', 'Monaco', 'Barcelona', 'Austria', 'Great Britain', 'Belgium', 'Hungary', 'Netherlands', 'Italy', 'Madrid', 'Azerbaijan', 'Singapore', 'United States', 'Mexico', 'Brazil', 'Las Vegas', 'Qatar', 'Abu Dhabi'],
    },
    2025: {
        drivers: ['VER', 'LAW', 'NOR', 'PIA', 'LEC', 'HAM', 'RUS', 'ANT', 'ALO', 'STR', 'GAS', 'DOO', 'ALB', 'SAI', 'TSU', 'HAD', 'HUL', 'BOR', 'OCO', 'BEA'],
        tracks: ['Australia', 'China', 'Japan', 'Bahrain', 'Saudi Arabia', 'Miami', 'Emilia Romagna', 'Monaco', 'Spain', 'Canada', 'Austria', 'Great Britain', 'Belgium', 'Hungary', 'Netherlands', 'Italy', 'Azerbaijan', 'Singapore', 'United States', 'Mexico', 'Brazil', 'Las Vegas', 'Qatar', 'Abu Dhabi'],
    },
    2024: {
        drivers: ['VER', 'PER', 'NOR', 'PIA', 'LEC', 'SAI', 'HAM', 'RUS', 'ALO', 'STR', 'GAS', 'OCO', 'ALB', 'SAR', 'COL', 'TSU', 'RIC', 'LAW', 'BOT', 'ZHO', 'MAG', 'HUL', 'BEA'],
        tracks: ['Bahrain', 'Saudi Arabia', 'Australia', 'Japan', 'China', 'Miami', 'Emilia Romagna', 'Monaco', 'Canada', 'Spain', 'Austria', 'Great Britain', 'Hungary', 'Belgium', 'Netherlands', 'Italy', 'Azerbaijan', 'Singapore', 'United States', 'Mexico', 'Brazil', 'Las Vegas', 'Qatar', 'Abu Dhabi'],
    },
    2023: {
        drivers: ['VER', 'PER', 'NOR', 'PIA', 'LEC', 'SAI', 'HAM', 'RUS', 'ALO', 'STR', 'GAS', 'OCO', 'ALB', 'SAR', 'LAW', 'TSU', 'DEV', 'RIC', 'BOT', 'ZHO', 'MAG', 'HUL'],
        tracks: ['Bahrain', 'Saudi Arabia', 'Australia', 'Azerbaijan', 'Miami', 'Emilia Romagna', 'Monaco', 'Spain', 'Canada', 'Austria', 'Great Britain', 'Hungary', 'Belgium', 'Netherlands', 'Italy', 'Singapore', 'Japan', 'Qatar', 'United States', 'Mexico', 'Brazil', 'Las Vegas', 'Abu Dhabi'],
    },
    2022: {
        drivers: ['VER', 'PER', 'NOR', 'RIC', 'LEC', 'SAI', 'HAM', 'RUS', 'ALO', 'STR', 'GAS', 'TSU', 'OCO', 'VET', 'ALB', 'LAT', 'DEV', 'BOT', 'ZHO', 'MAG', 'MSC', 'HUL'],
        tracks: ['Bahrain', 'Saudi Arabia', 'Australia', 'Emilia Romagna', 'Miami', 'Spain', 'Monaco', 'Azerbaijan', 'Canada', 'Great Britain', 'Austria', 'France', 'Hungary', 'Belgium', 'Netherlands', 'Italy', 'Singapore', 'Japan', 'United States', 'Mexico', 'Brazil', 'Abu Dhabi'],
    },
    2021: {
        drivers: ['VER', 'PER', 'NOR', 'RIC', 'LEC', 'SAI', 'HAM', 'BOT', 'RUS', 'ALO', 'STR', 'OCO', 'GAS', 'TSU', 'VET', 'RAI', 'GIO', 'LAT', 'MSC', 'MAZ', 'MAG', 'KUB'],
        tracks: ['Bahrain', 'Emilia Romagna', 'Portugal', 'Spain', 'Monaco', 'Azerbaijan', 'France', 'Austria', 'Great Britain', 'Hungary', 'Belgium', 'Netherlands', 'Italy', 'Russia', 'Turkey', 'United States', 'Mexico', 'Brazil', 'Qatar', 'Saudi Arabia', 'Abu Dhabi'],
    },
    2020: {
        drivers: ['VER', 'ALB', 'NOR', 'SAI', 'LEC', 'VET', 'HAM', 'BOT', 'RUS', 'STR', 'PER', 'HUL', 'OCO', 'RIC', 'GAS', 'KVY', 'RAI', 'GIO', 'LAT', 'MAG', 'GRO'],
        tracks: ['Austria', 'Great Britain', 'Hungary', 'Spain', 'Belgium', 'Italy', 'Russia', 'Portugal', 'Emilia Romagna', 'Turkey', 'Bahrain', 'Sakhir', 'Abu Dhabi'],
    },
    2019: {
        drivers: ['VER', 'GAS', 'ALB', 'NOR', 'SAI', 'LEC', 'VET', 'HAM', 'BOT', 'STR', 'PER', 'HUL', 'RIC', 'KVY', 'RAI', 'GIO', 'RUS', 'KUB', 'MAG', 'GRO'],
        tracks: ['Australia', 'Bahrain', 'China', 'Azerbaijan', 'Spain', 'Monaco', 'Canada', 'France', 'Austria', 'Great Britain', 'Germany', 'Hungary', 'Belgium', 'Italy', 'Singapore', 'Russia', 'Japan', 'United States', 'Mexico', 'Brazil', 'Abu Dhabi'],
    },
    2018: {
        drivers: ['VER', 'RIC', 'NOR', 'VAN', 'LEC', 'ERI', 'HAM', 'BOT', 'STR', 'PER', 'OCO', 'HUL', 'SAI', 'GAS', 'HAR', 'VET', 'RAI', 'ALO', 'SIR', 'MAG', 'GRO'],
        tracks: ['Australia', 'Bahrain', 'China', 'Azerbaijan', 'Spain', 'Monaco', 'Canada', 'France', 'Austria', 'Great Britain', 'Germany', 'Hungary', 'Belgium', 'Italy', 'Singapore', 'Russia', 'Japan', 'United States', 'Mexico', 'Brazil', 'Abu Dhabi'],
    },
};

// --- HELPER FUNCTIONS ---

export const getDriverColor = (id, yearString) => {
    if (!id) return '#555';
    const year = parseInt(yearString);

    let colorMap;
    if (year >= 2026) colorMap = COLORS_2026;
    else if (year === 2025) colorMap = COLORS_2025;
    else if (year >= 2019) colorMap = COLORS_2024;
    else colorMap = COLORS_LEGACY;

    if (colorMap[id]) return colorMap[id];
    if (COLORS_LEGACY[id]) return COLORS_LEGACY[id];

    // Hash Fallback
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return '#' + c.padStart(6, '0');
};

/** Returns driver options for dropdown filtered by year */
export const getDriverOptionsForYear = (year) => {
    const y = parseInt(year);
    const seasonDrivers = SEASON_DATA[y]?.drivers || SEASON_DATA[2026].drivers;
    return seasonDrivers.map(id => ({ id, name: DRIVER_NAMES[id] || id }));
};

/** Returns tracks for dropdown filtered by year */
export const getTracksForYear = (year) => {
    const y = parseInt(year);
    return SEASON_DATA[y]?.tracks || SEASON_DATA[2026].tracks;
};

export const YEARS = ['2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018'];

export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
