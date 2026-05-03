import { useMemo } from 'react';
import { getDriverColor } from '../config/drivers';

/**
 * Compute delta time between drivers at each distance point.
 * Returns array of { dist, [DRIVER]_delta } where delta is relative to the first driver.
 */
export function computeDeltaTime(telemetryData, selectedDrivers) {
    if (!telemetryData.length || selectedDrivers.length < 2) return [];

    const referenceDriver = selectedDrivers[0];

    return telemetryData.map(row => {
        const refTime = row[`${referenceDriver}_time`];
        const point = { dist: row.dist };

        selectedDrivers.forEach(d => {
            const dTime = row[`${d}_time`];
            if (refTime !== undefined && dTime !== undefined) {
                // Positive = behind reference driver, negative = ahead
                point[`${d}_delta`] = parseFloat((dTime - refTime).toFixed(4));
            }
        });

        return point;
    });
}

/**
 * Detect braking and acceleration zones from speed data.
 * Returns { brakingZones: [{start, end}], accelZones: [{start, end}] }
 */
export function detectTractionZones(telemetryData, selectedDrivers) {
    if (!telemetryData.length || !selectedDrivers.length) {
        return { brakingZones: [], accelZones: [] };
    }

    // Use the first driver's speed data as reference
    const driver = selectedDrivers[0];
    const speedKey = `${driver}_speed`;
    const speeds = telemetryData.map(d => d[speedKey] || 0);

    const brakingZones = [];
    const accelZones = [];
    let currentZone = null;

    const SPEED_THRESHOLD = 8; // km/h change per sample
    const MIN_ZONE_LENGTH = 3; // minimum samples to count as a zone

    for (let i = 1; i < speeds.length; i++) {
        const diff = speeds[i] - speeds[i - 1];

        if (diff < -SPEED_THRESHOLD) {
            // Braking
            if (currentZone?.type !== 'brake') {
                if (currentZone && currentZone.length >= MIN_ZONE_LENGTH) {
                    (currentZone.type === 'brake' ? brakingZones : accelZones).push({
                        start: currentZone.start,
                        end: telemetryData[i - 1].dist
                    });
                }
                currentZone = { type: 'brake', start: telemetryData[i].dist, length: 1 };
            } else {
                currentZone.length++;
            }
        } else if (diff > SPEED_THRESHOLD) {
            // Acceleration
            if (currentZone?.type !== 'accel') {
                if (currentZone && currentZone.length >= MIN_ZONE_LENGTH) {
                    (currentZone.type === 'brake' ? brakingZones : accelZones).push({
                        start: currentZone.start,
                        end: telemetryData[i - 1].dist
                    });
                }
                currentZone = { type: 'accel', start: telemetryData[i].dist, length: 1 };
            } else {
                currentZone.length++;
            }
        } else {
            // Neutral — close the zone
            if (currentZone && currentZone.length >= MIN_ZONE_LENGTH) {
                (currentZone.type === 'brake' ? brakingZones : accelZones).push({
                    start: currentZone.start,
                    end: telemetryData[i - 1].dist
                });
            }
            currentZone = null;
        }
    }

    // Close final zone
    if (currentZone && currentZone.length >= MIN_ZONE_LENGTH) {
        (currentZone.type === 'brake' ? brakingZones : accelZones).push({
            start: currentZone.start,
            end: telemetryData[telemetryData.length - 1].dist
        });
    }

    return { brakingZones, accelZones };
}

/**
 * Compute head-to-head stats between selected drivers.
 */
export function computeHeadToHead(telemetryData, lapAnalysis, selectedDrivers, year) {
    if (selectedDrivers.length < 2 || !telemetryData.length) return null;

    const stats = selectedDrivers.map(driver => {
        const lap = lapAnalysis.find(l => l.id === driver);
        const speeds = telemetryData.map(d => d[`${driver}_speed`] || 0);
        const topSpeed = Math.max(...speeds);
        const avgSpeed = Math.round(speeds.reduce((a, b) => a + b, 0) / speeds.length);

        return {
            id: driver,
            color: getDriverColor(driver, year),
            topSpeed,
            avgSpeed,
            lapTime: lap?.lap || 0,
            s1: lap?.s1 || 0,
            s2: lap?.s2 || 0,
            s3: lap?.s3 || 0,
            compound: lap?.compound || 'UNKNOWN',
        };
    });

    // Micro-sector dominance
    const sectorWins = {};
    selectedDrivers.forEach(d => { sectorWins[d] = 0; });

    telemetryData.forEach(row => {
        let fastest = null;
        let bestSpeed = -1;
        selectedDrivers.forEach(d => {
            const s = row[`${d}_speed`] || 0;
            if (s > bestSpeed) { bestSpeed = s; fastest = d; }
        });
        if (fastest) sectorWins[fastest]++;
    });

    const total = telemetryData.length;
    const dominance = selectedDrivers.map(d => ({
        driver: d,
        color: getDriverColor(d, year),
        pct: Math.round((sectorWins[d] / total) * 100),
        wins: sectorWins[d],
    }));

    return { stats, dominance };
}

/**
 * React hook for computing delta, zones, and head-to-head.
 */
export function useAnalytics(telemetryData, lapAnalysis, selectedDrivers, year) {
    const deltaData = useMemo(
        () => computeDeltaTime(telemetryData, selectedDrivers),
        [telemetryData, selectedDrivers]
    );

    const tractionZones = useMemo(
        () => detectTractionZones(telemetryData, selectedDrivers),
        [telemetryData, selectedDrivers]
    );

    const headToHead = useMemo(
        () => computeHeadToHead(telemetryData, lapAnalysis, selectedDrivers, year),
        [telemetryData, lapAnalysis, selectedDrivers, year]
    );

    return { deltaData, tractionZones, headToHead };
}
