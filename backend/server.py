import fastf1
import requests
from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import numpy as np
import os
import json
import re
import time
from datetime import datetime
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.env'))

app = Flask(__name__)
CORS(app, origins=os.environ.get('CORS_ORIGINS', 'http://localhost:5173').split(','))

# 1. SETUP CACHE
CACHE_DIR = os.environ.get('FASTF1_CACHE_DIR', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cache'))
if not os.path.exists(CACHE_DIR):
    os.makedirs(CACHE_DIR)
fastf1.Cache.enable_cache(CACHE_DIR)

def get_sec(val):
    """Safely convert timedelta to seconds."""
    return val.total_seconds() if pd.notna(val) else 0.0

def _summarize_for_ai(analysis_type, data):
    """Pre-summarize raw data into compact stats to reduce Gemini token usage."""
    try:
        if analysis_type == 'tire':
            summary = {}
            for driver, info in data.items():
                stints = info.get('stints', [])
                summary[driver] = {
                    'stint_count': len(stints),
                    'stints': [{
                        'compound': s['compound'],
                        'laps': s['lap_count'],
                        'deg_rate': s['deg_rate'],
                        'avg_time': s['avg_time'],
                    } for s in stints],
                    'total_laps': len(info.get('laps', [])),
                }
            return summary

        elif analysis_type == 'weather':
            return {
                'correlations': data.get('correlations', {}),
                'summary': data.get('summary', {}),
                'rain_laps': sum(1 for d in data.get('data_points', []) if d.get('rainfall')),
                'total_laps': len(data.get('data_points', [])),
            }

        elif analysis_type == 'overtakes':
            return {
                'total_overtakes': data.get('total_overtakes', 0),
                'event_count': len(data.get('overtakes', [])),
                'top_overtakers': data.get('top_overtakers', [])[:5],
                'first_lap_events': sum(1 for o in data.get('overtakes', []) if o.get('lap', 99) <= 3),
                'strategy_battles': data.get('strategy_battles', []),
            }

        elif analysis_type == 'race_data':
            # Already typically compact (H2H stats), just clean up
            if isinstance(data, dict):
                clean = {}
                if 'stats' in data:
                    clean['stats'] = data['stats']
                if 'dominance' in data:
                    clean['dominance'] = data['dominance']
                if 'drivers' in data:
                    clean['drivers'] = data['drivers']
                if 'session' in data:
                    clean['session'] = data['session']
                return clean if clean else data
            return data

        return data
    except Exception:
        return data

# --- ROUTE 1: GET SEASON STANDINGS (SMART FALLBACK) ---
@app.route('/api/standings')
def get_standings():
    try:
        base_url = "https://api.jolpi.ca/ergast/f1/current"
        
        try:
            d_resp = requests.get(f"{base_url}/driverStandings.json", timeout=3)
            d_data = d_resp.json()
            standings_lists = d_data['MRData']['StandingsTable']['StandingsLists']
        except Exception as e:
            print(f"Could not fetch current season standings: {e}")
            standings_lists = []

        if not standings_lists:
            print("Current season empty. Falling back to previous year data.")
            base_url = f"https://api.jolpi.ca/ergast/f1/{datetime.now().year - 1}"
            d_resp = requests.get(f"{base_url}/driverStandings.json", timeout=5)
            d_data = d_resp.json()
            standings_lists = d_data['MRData']['StandingsTable']['StandingsLists']
        
        c_resp = requests.get(f"{base_url}/constructorStandings.json", timeout=5)
        c_data = c_resp.json()

        clean_drivers = []
        if standings_lists:
            drivers_list = standings_lists[0]['DriverStandings']
            for row in drivers_list[:10]:
                team_name = row['Constructors'][0]['name'] if row.get('Constructors') else "Unknown"
                clean_drivers.append({
                    'pos': int(row['position']),
                    'driver': row['Driver']['familyName'],
                    'team': team_name,
                    'points': float(row['points'])
                })

        clean_teams = []
        c_lists = c_data['MRData']['StandingsTable']['StandingsLists']
        if c_lists:
            teams_list = c_lists[0]['ConstructorStandings']
            for row in teams_list[:10]:
                clean_teams.append({
                    'pos': int(row['position']),
                    'name': row['Constructor']['name'],
                    'points': float(row['points'])
                })
            
        return jsonify({
            'drivers': clean_drivers,
            'constructors': clean_teams
        })

    except Exception as e:
        print(f"Standings Error: {e}")
        return jsonify({'drivers': [], 'constructors': []})

# --- ROUTE 2: GET TELEMETRY & RACE RESULTS ---
@app.route('/api/telemetry')
def get_telemetry():
    year = int(request.args.get('year', datetime.now().year))
    max_telemetry_year = datetime.now().year - 1 if datetime.now().month < 3 else datetime.now().year
    if year > max_telemetry_year:
        print(f"Year {year} requested. Defaulting to {max_telemetry_year} for Telemetry.")
        year = max_telemetry_year
        
    gp = request.args.get('gp', 'Monaco')
    session_type = request.args.get('session', 'R')
    drivers = request.args.get('drivers', 'VER,NOR').split(',')
    lap_number = request.args.get('lap', None)  # None = fastest lap

    try:
        print(f"Loading {year} {gp} ({session_type})...")
        session = fastf1.get_session(year, gp, session_type)
        session.load()
        
        # --- PROCESS SESSION RESULTS ---
        race_results = []
        if session_type == 'R' and hasattr(session, 'results') and not session.results.empty:
            winner_row = session.results.iloc[0]
            winner_time = winner_row['Time']
            top_5 = session.results.iloc[:5]
            
            for i, row in top_5.iterrows():
                status = str(row['Status'])
                time_str = status
                
                if status == 'Finished':
                    driver_time = row['Time']
                    if pd.notna(driver_time):
                        if i == 0 or row['Abbreviation'] == winner_row['Abbreviation']:
                            ts = driver_time.total_seconds()
                            h, rem = divmod(ts, 3600)
                            m, s = divmod(rem, 60)
                            time_str = f"{int(h)}:{int(m):02d}:{s:06.3f}"
                        elif pd.notna(winner_time):
                            if driver_time < winner_time:
                                gap = driver_time.total_seconds()
                            else:
                                gap = (driver_time - winner_time).total_seconds()
                            time_str = f"+{gap:.3f}s"
                
                race_results.append({
                    'pos': str(row['ClassifiedPosition']),
                    'driver': row['Abbreviation'],
                    'team': row['TeamName'],
                    'time': time_str,
                    'points': float(row['Points'])
                })

        # --- PROCESS TELEMETRY ---
        telemetry_response = []
        laps_analysis = []
        dominance_list = []
        available_laps = {}  # Per-driver available laps
        
        if hasattr(session, 'laps') and not session.laps.empty:
            common_dist = np.linspace(0, 100, num=200)
            dominance_map = {i: {'dist': d, 'max_speed': -1, 'fastest_driver': None, 'x': 0, 'y': 0} 
                             for i, d in enumerate(common_dist)}

            for driver in drivers:
                try:
                    d_laps = session.laps.pick_drivers(driver)
                    if d_laps.empty: continue
                    
                    # Build available laps list for this driver
                    driver_lap_list = []
                    for _, lap_row in d_laps.iterrows():
                        lap_num = int(lap_row['LapNumber'])
                        lap_time = get_sec(lap_row['LapTime'])
                        if lap_time > 0:
                            driver_lap_list.append({
                                'number': lap_num,
                                'time': round(lap_time, 3)
                            })
                    available_laps[driver] = driver_lap_list
                    
                    # Pick the requested lap
                    if lap_number is not None:
                        target_lap = d_laps[d_laps['LapNumber'] == int(lap_number)]
                        if target_lap.empty:
                            chosen_lap = d_laps.pick_fastest()
                        else:
                            chosen_lap = target_lap.iloc[0]
                    else:
                        chosen_lap = d_laps.pick_fastest()
                    
                    if chosen_lap is None: continue

                    # Get tire compound
                    compound = 'UNKNOWN'
                    try:
                        if 'Compound' in chosen_lap.index:
                            compound = str(chosen_lap['Compound'])
                        elif hasattr(chosen_lap, 'Compound'):
                            compound = str(chosen_lap.Compound)
                    except:
                        pass

                    laps_analysis.append({
                        'id': driver,
                        's1': round(get_sec(chosen_lap['Sector1Time']), 3),
                        's2': round(get_sec(chosen_lap['Sector2Time']), 3),
                        's3': round(get_sec(chosen_lap['Sector3Time']), 3),
                        'lap': round(get_sec(chosen_lap['LapTime']), 3),
                        'lap_number': int(chosen_lap['LapNumber']),
                        'compound': compound
                    })

                    tel = chosen_lap.get_telemetry()
                    max_dist = tel['Distance'].max()
                    tel['DistancePct'] = (tel['Distance'] / max_dist) * 100
                    
                    interp_speed = np.interp(common_dist, tel['DistancePct'], tel['Speed'])
                    interp_throttle = np.interp(common_dist, tel['DistancePct'], tel['Throttle'])
                    interp_gear = np.interp(common_dist, tel['DistancePct'], tel['nGear'])
                    
                    # Brake data
                    interp_brake = np.zeros(200)
                    if 'Brake' in tel.columns:
                        interp_brake = np.interp(common_dist, tel['DistancePct'], tel['Brake'].astype(float))
                    
                    # Elapsed time (seconds from lap start)
                    interp_time = np.zeros(200)
                    if 'Time' in tel.columns:
                        elapsed = tel['Time'].dt.total_seconds().values
                        interp_time = np.interp(common_dist, tel['DistancePct'], elapsed)
                    
                    # Track coordinates
                    if 'X' in tel.columns:
                        interp_x = np.interp(common_dist, tel['DistancePct'], tel['X'])
                        interp_y = np.interp(common_dist, tel['DistancePct'], tel['Y'])
                    else:
                        interp_x = np.zeros(200)
                        interp_y = np.zeros(200)

                    driver_data = []
                    for i in range(len(common_dist)):
                        s_val = float(interp_speed[i])
                        if s_val > dominance_map[i]['max_speed']:
                            dominance_map[i]['max_speed'] = s_val
                            dominance_map[i]['fastest_driver'] = driver
                            dominance_map[i]['x'] = float(interp_x[i])
                            dominance_map[i]['y'] = float(interp_y[i])

                        driver_data.append({
                            'dist': common_dist[i],
                            'speed': int(s_val),
                            'gear': int(interp_gear[i]),
                            'throttle': int(interp_throttle[i]),
                            'brake': int(interp_brake[i] * 100),
                            'time': round(float(interp_time[i]), 4)
                        })
                    telemetry_response.append({'driver': driver, 'data': driver_data})
                except Exception as e:
                    print(f"Skipping {driver}: {e}")
                    continue
            
            dominance_list = [v for k, v in dominance_map.items()]

        return jsonify({
            'status': 'success',
            'session_type': session_type,
            'race_results': race_results,
            'telemetry': telemetry_response,
            'dominance': dominance_list,
            'analysis': laps_analysis,
            'available_laps': available_laps,
            'track': session.event.EventName if hasattr(session, 'event') else gp
        })

    except Exception as e:
        err_msg = str(e)
        print(f"Server Error: {err_msg}")
        # Detect future race / no data scenarios
        if 'not been loaded' in err_msg or 'No data' in err_msg or 'does not exist' in err_msg:
            return jsonify({'status': 'error', 'message': f'No data available for {year} {gp} ({session_type}). The session may not have taken place yet.'}), 404
        return jsonify({'status': 'error', 'message': err_msg}), 500

# --- ROUTE 3: SEASON PROGRESSION (race-by-race points) ---
@app.route('/api/season-progress')
def get_season_progress():
    year = request.args.get('year', 'current')
    try:
        base_url = f"https://api.jolpi.ca/ergast/f1/{year}"
        
        # Get race schedule to know how many races
        schedule_resp = requests.get(f"{base_url}.json", timeout=5)
        schedule_data = schedule_resp.json()
        total_races = int(schedule_data['MRData']['RaceTable']['Races'][-1]['round']) if schedule_data['MRData']['RaceTable']['Races'] else 0
        
        if total_races == 0:
            return jsonify({'status': 'error', 'message': 'No race data for this season'}), 404
        
        # Get final standings to know the top 10 drivers
        standings_resp = requests.get(f"{base_url}/driverStandings.json", timeout=5)
        standings_data = standings_resp.json()
        standings_lists = standings_data['MRData']['StandingsTable']['StandingsLists']
        if not standings_lists:
            return jsonify({'status': 'error', 'message': 'No standings data'}), 404
        
        top_drivers = []
        for row in standings_lists[0]['DriverStandings'][:10]:
            code = row['Driver'].get('code', row['Driver']['familyName'][:3].upper())
            top_drivers.append({
                'code': code,
                'name': row['Driver']['familyName']
            })
        
        # Build race-by-race data
        progression = []
        cumulative = {d['code']: 0 for d in top_drivers}
        
        for race in schedule_data['MRData']['RaceTable']['Races']:
            round_num = int(race['round'])
            race_name = race['raceName'].replace(' Grand Prix', '')
            
            # Fetch results for this round
            try:
                r_resp = requests.get(f"{base_url}/{round_num}/results.json", timeout=5)
                r_data = r_resp.json()
                results = r_data['MRData']['RaceTable']['Races']
                if not results:
                    continue
                
                for result in results[0]['Results']:
                    code = result['Driver'].get('code', result['Driver']['familyName'][:3].upper())
                    if code in cumulative:
                        cumulative[code] += float(result['points'])
                
                row = {'round': round_num, 'race': race_name}
                for d in top_drivers:
                    row[d['code']] = cumulative[d['code']]
                progression.append(row)
            except Exception as e:
                print(f"Skipping round {round_num}: {e}")
                continue
        
        return jsonify({
            'status': 'success',
            'drivers': top_drivers,
            'progression': progression
        })
    
    except Exception as e:
        print(f"Season Progress Error: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500


# --- ROUTE 4: TIRE DEGRADATION ANALYSIS ---
@app.route('/api/tire-degradation')
def get_tire_degradation():
    year = int(request.args.get('year', datetime.now().year))
    max_year = datetime.now().year - 1 if datetime.now().month < 3 else datetime.now().year
    if year > max_year:
        year = max_year
    gp = request.args.get('gp', 'Monaco')
    drivers = request.args.get('drivers', 'VER,NOR').split(',')

    try:
        session = fastf1.get_session(year, gp, 'R')
        session.load()

        result = {}
        for driver in drivers:
            try:
                d_laps = session.laps.pick_drivers(driver)
                if d_laps.empty:
                    continue

                laps = []
                for _, lap in d_laps.iterrows():
                    lt = get_sec(lap['LapTime'])
                    if lt <= 0 or lt > 200:
                        continue
                    compound = str(lap.get('Compound', 'UNKNOWN'))
                    stint = int(lap.get('Stint', 1))
                    laps.append({
                        'lap': int(lap['LapNumber']),
                        'time': round(lt, 3),
                        'compound': compound,
                        'stint': stint,
                    })

                # Calculate degradation per stint
                stints = {}
                for l in laps:
                    key = l['stint']
                    if key not in stints:
                        stints[key] = {'compound': l['compound'], 'laps': []}
                    stints[key]['laps'].append(l)

                stint_analysis = []
                for stint_num, data in stints.items():
                    s_laps = data['laps']
                    if len(s_laps) >= 3:
                        x = np.array([l['lap'] for l in s_laps])
                        y = np.array([l['time'] for l in s_laps])
                        slope = float(np.polyfit(x, y, 1)[0]) if len(x) > 1 else 0.0
                        stint_analysis.append({
                            'stint': stint_num,
                            'compound': data['compound'],
                            'lap_count': len(s_laps),
                            'deg_rate': round(slope, 4),
                            'avg_time': round(float(np.mean(y)), 3),
                        })

                result[driver] = {
                    'laps': laps,
                    'stints': stint_analysis,
                }
            except Exception as e:
                print(f"Tire deg skip {driver}: {e}")
                continue

        return jsonify({'status': 'success', 'data': result})

    except Exception as e:
        print(f"Tire Degradation Error: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

# --- ROUTE 5: WEATHER IMPACT CORRELATION ---
@app.route('/api/weather-correlation')
def get_weather_correlation():
    year = int(request.args.get('year', datetime.now().year))
    max_year = datetime.now().year - 1 if datetime.now().month < 3 else datetime.now().year
    if year > max_year:
        year = max_year
    gp = request.args.get('gp', 'Monaco')

    try:
        session = fastf1.get_session(year, gp, 'R')
        session.load()

        weather = session.weather_data if hasattr(session, 'weather_data') else None
        if weather is None or weather.empty:
            return jsonify({'status': 'error', 'message': 'No weather data available'}), 404

        laps = session.laps
        if laps.empty:
            return jsonify({'status': 'error', 'message': 'No lap data'}), 404

        data_points = []
        # Build a time-indexed weather lookup using the 'Time' column (timedelta from session start)
        weather_times = weather['Time'].dt.total_seconds().values if 'Time' in weather.columns else None

        for _, lap in laps.iterrows():
            lt = get_sec(lap['LapTime'])
            if lt <= 0 or lt > 200:
                continue

            try:
                # Match lap to closest weather reading using timedelta
                lap_time_val = lap.get('Time')
                if pd.notna(lap_time_val) and weather_times is not None:
                    lap_secs = lap_time_val.total_seconds() if hasattr(lap_time_val, 'total_seconds') else float(lap_time_val)
                    w_idx = int(np.argmin(np.abs(weather_times - lap_secs)))
                else:
                    # Fallback: use lap number as rough index
                    w_idx = min(int(lap['LapNumber']) - 1, len(weather) - 1)

                w = weather.iloc[w_idx]
                data_points.append({
                    'lap': int(lap['LapNumber']),
                    'driver': str(lap['Driver']),
                    'lap_time': round(lt, 3),
                    'track_temp': round(float(w.get('TrackTemp', 0)), 1),
                    'air_temp': round(float(w.get('AirTemp', 0)), 1),
                    'humidity': round(float(w.get('Humidity', 0)), 1),
                    'rainfall': bool(w.get('Rainfall', False)),
                    'wind_speed': round(float(w.get('WindSpeed', 0)), 1),
                })
            except Exception:
                continue

        corr_track = 0
        corr_air = 0
        if data_points:
            times = np.array([d['lap_time'] for d in data_points])
            track_temps = np.array([d['track_temp'] for d in data_points])
            air_temps = np.array([d['air_temp'] for d in data_points])
            corr_track = float(np.corrcoef(track_temps, times)[0, 1]) if len(set(track_temps)) > 1 else 0
            corr_air = float(np.corrcoef(air_temps, times)[0, 1]) if len(set(air_temps)) > 1 else 0

        return jsonify({
            'status': 'success',
            'data_points': data_points[:500],
            'correlations': {
                'track_temp_vs_laptime': round(corr_track, 4),
                'air_temp_vs_laptime': round(corr_air, 4),
            },
            'summary': {
                'total_samples': len(data_points),
                'track_temp_range': [min(d['track_temp'] for d in data_points), max(d['track_temp'] for d in data_points)] if data_points else [0, 0],
                'air_temp_range': [min(d['air_temp'] for d in data_points), max(d['air_temp'] for d in data_points)] if data_points else [0, 0],
            }
        })

    except Exception as e:
        print(f"Weather Correlation Error: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

# --- ROUTE 6: OVERTAKING DETECTION ---
@app.route('/api/overtakes')
def get_overtakes():
    year = int(request.args.get('year', datetime.now().year))
    max_year = datetime.now().year - 1 if datetime.now().month < 3 else datetime.now().year
    if year > max_year:
        year = max_year
    gp = request.args.get('gp', 'Monaco')

    try:
        session = fastf1.get_session(year, gp, 'R')
        session.load()

        laps = session.laps
        if laps.empty:
            return jsonify({'status': 'error', 'message': 'No lap data'}), 404

        position_grid = {}
        driver_lap_times = {}  # {driver: {lap_num: lap_time_seconds}}
        for _, lap in laps.iterrows():
            lap_num = int(lap['LapNumber'])
            driver = str(lap['Driver'])
            pos = lap.get('Position')
            if pd.notna(pos):
                if lap_num not in position_grid:
                    position_grid[lap_num] = {}
                position_grid[lap_num][driver] = int(pos)
            lt = get_sec(lap['LapTime'])
            if lt > 0:
                if driver not in driver_lap_times:
                    driver_lap_times[driver] = {}
                driver_lap_times[driver][lap_num] = lt

        overtakes = []
        sorted_laps = sorted(position_grid.keys())

        for i in range(1, len(sorted_laps)):
            prev_lap = sorted_laps[i - 1]
            curr_lap = sorted_laps[i]
            prev_pos = position_grid[prev_lap]
            curr_pos = position_grid[curr_lap]

            for driver in curr_pos:
                if driver in prev_pos:
                    if curr_pos[driver] < prev_pos[driver]:
                        positions_gained = prev_pos[driver] - curr_pos[driver]
                        overtaken = []
                        for other in curr_pos:
                            if other != driver and other in prev_pos:
                                if prev_pos[other] < prev_pos[driver] and curr_pos[other] > curr_pos[driver]:
                                    overtaken.append(other)

                        if overtaken:
                            overtakes.append({
                                'lap': curr_lap,
                                'driver': driver,
                                'overtaken': overtaken,
                                'new_pos': curr_pos[driver],
                                'old_pos': prev_pos[driver],
                                'positions_gained': positions_gained,
                            })

        # --- UNDERCUT / OVERCUT DETECTION ---
        strategy_battles = []
        # Detect pit laps: a lap time significantly longer than the driver's median
        pit_laps = {}  # {driver: [lap_numbers]}
        for driver, lap_times in driver_lap_times.items():
            if len(lap_times) < 5:
                continue
            times = list(lap_times.values())
            median_time = float(np.median(times))
            pit_threshold = median_time + 20  # Pit stops add ~20+ seconds
            for lap_num, lt in lap_times.items():
                if lt > pit_threshold:
                    if driver not in pit_laps:
                        pit_laps[driver] = []
                    pit_laps[driver].append(lap_num)

        # Check for undercuts/overcuts between driver pairs
        all_drivers = list(pit_laps.keys())
        seen_battles = set()
        for d1 in all_drivers:
            for d2 in all_drivers:
                if d1 >= d2:
                    continue
                for pit_lap_d1 in pit_laps.get(d1, []):
                    for pit_lap_d2 in pit_laps.get(d2, []):
                        lap_diff = pit_lap_d2 - pit_lap_d1
                        if 1 <= abs(lap_diff) <= 5:
                            early_pitter = d1 if lap_diff > 0 else d2
                            late_pitter = d2 if lap_diff > 0 else d1
                            early_pit_lap = min(pit_lap_d1, pit_lap_d2)
                            late_pit_lap = max(pit_lap_d1, pit_lap_d2)

                            # Check positions before and after the pit window
                            before_lap = early_pit_lap - 1
                            after_lap = late_pit_lap + 1

                            if before_lap in position_grid and after_lap in position_grid:
                                pos_before = position_grid[before_lap]
                                pos_after = position_grid[after_lap]

                                if early_pitter in pos_before and late_pitter in pos_before and \
                                   early_pitter in pos_after and late_pitter in pos_after:
                                    was_behind = pos_before[early_pitter] > pos_before[late_pitter]
                                    now_ahead = pos_after[early_pitter] < pos_after[late_pitter]

                                    battle_key = (early_pitter, late_pitter, early_pit_lap)
                                    if battle_key not in seen_battles and was_behind and now_ahead:
                                        seen_battles.add(battle_key)
                                        strategy_battles.append({
                                            'type': 'undercut',
                                            'driver': early_pitter,
                                            'target': late_pitter,
                                            'pit_lap': early_pit_lap,
                                            'position_gained_lap': after_lap,
                                            'pos_before': pos_before[early_pitter],
                                            'pos_after': pos_after[early_pitter],
                                        })

                                    was_ahead_late = pos_before[late_pitter] > pos_before[early_pitter]
                                    now_ahead_late = pos_after[late_pitter] < pos_after[early_pitter]
                                    battle_key_oc = (late_pitter, early_pitter, late_pit_lap)
                                    if battle_key_oc not in seen_battles and was_ahead_late and now_ahead_late:
                                        seen_battles.add(battle_key_oc)
                                        strategy_battles.append({
                                            'type': 'overcut',
                                            'driver': late_pitter,
                                            'target': early_pitter,
                                            'pit_lap': late_pit_lap,
                                            'position_gained_lap': after_lap,
                                            'pos_before': pos_before[late_pitter],
                                            'pos_after': pos_after[late_pitter],
                                        })

        driver_overtake_count = {}
        for o in overtakes:
            d = o['driver']
            driver_overtake_count[d] = driver_overtake_count.get(d, 0) + len(o['overtaken'])

        top_overtakers = sorted(driver_overtake_count.items(), key=lambda x: x[1], reverse=True)[:10]

        return jsonify({
            'status': 'success',
            'overtakes': overtakes,
            'total_overtakes': sum(len(o['overtaken']) for o in overtakes),
            'top_overtakers': [{'driver': d, 'count': c} for d, c in top_overtakers],
            'by_lap': {str(lap): sum(len(o['overtaken']) for o in overtakes if o['lap'] == lap) for lap in sorted_laps},
            'strategy_battles': strategy_battles,
        })

    except Exception as e:
        print(f"Overtake Detection Error: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

# --- ROUTE 7: AI-POWERED INSIGHTS (GEMINI) ---
@app.route('/api/ai-insight', methods=['POST'])
def get_ai_insight():
    gemini_key = os.environ.get('GEMINI_API_KEY', '')
    if not gemini_key:
        return jsonify({'status': 'error', 'message': 'GEMINI_API_KEY not set'}), 400

    body = request.get_json()
    analysis_type = body.get('type', 'general')
    data_summary = body.get('data', {})
    rule_insights = body.get('rule_insights', [])  # Accept rule-based insights from frontend

    # Pre-summarize data to reduce token usage
    compact_data = _summarize_for_ai(analysis_type, data_summary)
    data_str = json.dumps(compact_data, default=str)

    # Build context from rule-based insights
    rule_context = ""
    if rule_insights:
        findings = "; ".join([r.get('text', '') for r in rule_insights if r.get('text')])
        rule_context = f"\n\nThe following automated analysis has already been generated from the data:\n{findings}\n\nBuild on these findings — do NOT repeat them. Focus on deeper patterns, strategic implications, and insights the automated system may have missed."

    prompts = {
        'tire': f"""You are an expert F1 race engineer analyzing tire degradation data.
Data: {data_str}{rule_context}

Write a comprehensive explanation of this tire data as 1-2 cohesive paragraphs. Do not use bullet points or markdown headers. Use drivers name instead of abbreviations (eg Verstappen instead of VER).
Discuss the overall strategy, compound comparisons, the degradation rates, and optimal stint lengths based on the provided numbers.""",

        'weather': f"""You are an F1 data scientist analyzing weather impact on race performance.
Data: {data_str}{rule_context}

Write a comprehensive explanation of this weather data as 1-2 cohesive paragraphs. Do not use bullet points or markdown headers. Use drivers name instead of abbreviations (eg Verstappen instead of VER).
Explain the correlation between temperatures and lap times, how weather affected tire performance, and any notable rain/humidity factors based on the provided numbers.""",

        'overtakes': f"""You are an F1 race analyst studying overtaking patterns and pit strategy.
Data: {data_str}{rule_context}

Write a comprehensive explanation of the overtaking data as 1-2 cohesive paragraphs. Do not use bullet points or markdown headers. Use drivers name instead of abbreviations(eg Verstappen instead of VER).
Describe the overall level of action, highlight the top overtakers, discuss first-lap incidents, any undercut or overcut strategy battles, and explain how track characteristics affected passing based on the provided numbers.""",

        'race_data': f"""You are an F1 race engineer comparing driver telemetry data.
Data: {data_str}{rule_context}

Write a comprehensive explanation of this telemetry comparison as 2-3 cohesive paragraphs. Do not use bullet points or markdown headers. Use drivers name instead of abbreviations (eg Verstappen instead of VER).
Discuss top speed differences, average speed comparison, lap time analysis, micro-sector dominance, and what the data reveals about car setup or driving style differences.""",
    }

    prompt = prompts.get(analysis_type, f"Analyze this F1 data. Write 1-2 cohesive paragraphs explaining the data: {data_str}{rule_context}")

    max_retries = 3
    for attempt in range(max_retries):
        try:
            resp = requests.post(
                f'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={gemini_key}',
                headers={'Content-Type': 'application/json'},
                json={
                    'contents': [{'parts': [{'text': prompt}]}],
                    'generationConfig': {'temperature': 0.7}
                },
                timeout=30
            )

            if resp.status_code == 429 and attempt < max_retries - 1:
                time.sleep(2 * (attempt + 1))
                continue

            if resp.status_code != 200:
                return jsonify({'status': 'error', 'message': f'Gemini API error: {resp.status_code}'}), 500

            result = resp.json()
            text = result['candidates'][0]['content']['parts'][0]['text']

            # Parse: split into paragraphs based on double newlines
            raw_paragraphs = text.split('\n\n')
            cleaned = []

            for para in raw_paragraphs:
                cleaned_para = para.strip()
                if not cleaned_para:
                    continue
                # Remove any leftover markdown
                cleaned_para = re.sub(r'\*\*([^*]+)\*\*', r'\1', cleaned_para)
                cleaned_para = re.sub(r'\*([^*]+)\*', r'\1', cleaned_para)
                cleaned_para = re.sub(r'^#+\s*', '', cleaned_para)
                # Strip leading bullets if Gemini still uses them
                cleaned_para = cleaned_para.lstrip('-•* ').strip()

                if len(cleaned_para) > 15:
                    cleaned.append({'type': 'analysis', 'text': cleaned_para})

            return jsonify({'status': 'success', 'insights': cleaned})

        except Exception as e:
            if attempt < max_retries - 1:
                time.sleep(2)
                continue
            print(f"Gemini Error: {e}")
            return jsonify({'status': 'error', 'message': str(e)}), 500

    return jsonify({'status': 'error', 'message': 'Max retries exceeded'}), 500

if __name__ == '__main__':
    print("Veloce Backend Running on Port 5000...")
    app.run(debug=True, port=5000)
