import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  Train, MapPin, AlertTriangle, 
  ArrowUpCircle, ArrowDownCircle, RefreshCw,
  Clock, Timer, Filter
} from 'lucide-react';
import GtfsRealtimeBindings from 'gtfs-realtime-bindings';

// --- CONFIGURATION ---
const WORKER_URL = "https://mta-worker.matthewssaunders.workers.dev";
const WALK_BUFFER = 7; 

const LINE_COLORS = {
  '1': '#EE352E', '2': '#EE352E', '3': '#EE352E',
  '4': '#00933C', '5': '#00933C', '6': '#00933C',
  '7': '#B933AD',
  'A': '#0039A6', 'C': '#0039A6', 'E': '#0039A6',
  'B': '#FF6319', 'D': '#FF6319', 'F': '#FF6319', 'M': '#FF6319',
  'G': '#6CBE45',
  'J': '#996633', 'Z': '#996633',
  'L': '#A7A9AC',
  'N': '#FCCC0A', 'Q': '#FCCC0A', 'R': '#FCCC0A', 'W': '#FCCC0A',
  'S': '#808183'
};

const FEED_MAP = {
  '1': 'gtfs', '2': 'gtfs', '3': 'gtfs', '4': 'gtfs', '5': 'gtfs', '6': 'gtfs', 'S': 'gtfs',
  'A': 'gtfs-ace', 'C': 'gtfs-ace', 'E': 'gtfs-ace',
  'B': 'gtfs-bdfm', 'D': 'gtfs-bdfm', 'F': 'gtfs-bdfm', 'M': 'gtfs-bdfm',
  'G': 'gtfs-g',
  'J': 'gtfs-jz', 'Z': 'gtfs-jz',
  'L': 'gtfs-l',
  'N': 'gtfs-nqrw', 'Q': 'gtfs-nqrw', 'R': 'gtfs-nqrw', 'W': 'gtfs-nqrw',
  '7': 'gtfs-7'
};

const EXPRESS_LINES = ['2', '3', '4', '5', 'A', 'B', 'D'];

const TERMINAL_MAP = {
  '1': { N: 'Van Cortlandt Pk-242 St', S: 'South Ferry' },
  '2': { N: 'Wakefield-241 St', S: 'Flatbush Av-Brooklyn Coll' },
  '3': { N: 'Harlem-148 St', S: 'New Lots Av' },
  '4': { N: 'Woodlawn', S: 'Crown Hts-Utica Av' },
  '5': { N: 'Eastchester-Dyre Av', S: 'Flatbush Av-Brooklyn Coll' },
  '6': { N: 'Pelham Bay Park', S: 'Brooklyn Bridge-City Hall' },
  '7': { N: 'Flushing-Main St', S: '34 St-Hudson Yards' },
  'A': { N: 'Inwood-207 St', S: 'Far Rockaway' },
  'B': { N: 'Bedford Pk Blvd', S: 'Brighton Beach' },
  'C': { N: '168 St', S: 'Euclid Av' },
  'D': { N: 'Norwood-205 St', S: 'Coney Island' },
  'E': { N: 'Jamaica Center', S: 'World Trade Center' },
  'F': { N: 'Jamaica-179 St', S: 'Coney Island' },
  'G': { N: 'Court Sq', S: 'Church Av' },
  'J': { N: 'Jamaica Center', S: 'Broad St' },
  'L': { N: '8 Av', S: 'Canarsie-Rockaway Pkwy' },
  'M': { N: 'Forest Hills-71 Av', S: 'Middle Village-Metropolitan Av' },
  'N': { N: 'Astoria-Ditmars Blvd', S: 'Coney Island' },
  'Q': { N: '96 St-2 Av', S: 'Coney Island' },
  'R': { N: 'Forest Hills-71 Av', S: 'Bay Ridge-95 St' },
  'W': { N: 'Astoria-Ditmars Blvd', S: 'Whitehall St' },
  'Z': { N: 'Jamaica Center', S: 'Broad St' },
  'S': { N: 'Grand Central', S: 'Times Sq' }
};

const STATIONS = [
  { id: '120', name: '96 St', lines: ['1', '2', '3'] },
  { id: '125', name: '59 St-Columbus Circle', lines: ['1', '2', 'A', 'B', 'C', 'D'] },
  { id: '124', name: '66 St-Lincoln Center', lines: ['1'] },
  { id: '123', name: '72 St', lines: ['1', '2', '3'] },
  { id: '122', name: '79 St', lines: ['1'] },
  { id: '121', name: '86 St', lines: ['1'] },
  { id: '119', name: '103 St', lines: ['1'] },
  { id: '118', name: '110 St-Cathedral Pkwy', lines: ['1'] },
  { id: '117', name: '116 St-Columbia Univ', lines: ['1'] },
  { id: '116', name: '125 St', lines: ['1'] },
  { id: '127', name: 'Times Sq - 42 St', lines: ['1', '2', '3', '7', 'N', 'Q', 'R', 'W', 'S'] },
  { id: '635', name: 'Grand Central - 42 St', lines: ['4', '5', '6', '7', 'S'] },
].sort((a, b) => a.id === '120' ? -1 : b.id === '120' ? 1 : a.name.localeCompare(b.name));

const getLineColor = (line) => LINE_COLORS[line] || '#444';

const getTerminal = (line, dir) => {
  if (!line || !dir) return 'Terminal';
  const entry = TERMINAL_MAP[line];
  if (!entry) return dir === 'N' ? 'Uptown' : 'Downtown';
  return entry[dir] || (dir === 'N' ? 'Uptown' : 'Downtown');
};

const formatArrivalTime = (mins) => {
  const roundedMins = Math.ceil(mins);
  const arrivalDate = new Date(Date.now() + roundedMins * 60000);
  return arrivalDate.toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/New_York'
  });
};

const TrainCard = ({ t, index, isDashMode, alerts }) => {
  const hasIssue = (alerts || []).some(a => a.lines?.includes(t.line) && !a.description.includes("MTA confirms service is active"));
  const isExpress = EXPRESS_LINES.includes(t.line);
  const roundedMins = Math.ceil(t.mins);
  
  const dashTime = roundedMins - WALK_BUFFER;
  const isTooLate = dashTime < 0;

  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111', 
      padding: '12px 16px', borderRadius: '0 10px 10px 0', borderLeft: `6px solid ${getLineColor(t.line)}`, 
      height: '85px', position: 'relative'
    }}>
      <div style={{ position: 'absolute', top: '-6px', left: '-12px', width: '20px', height: '20px', backgroundColor: '#333', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold', border: '2px solid #000', zIndex: 10 }}>
        {index + 1}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: getLineColor(t.line), display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: '#fff', fontSize: '16px', flexShrink: 0 }}>
          {t.line}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '10px', fontWeight: '800', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {isExpress ? 'Express' : 'Local'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontWeight: '700', fontSize: '20px', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {t.dest}
            </span>
            {hasIssue && <AlertTriangle size={14} style={{ color: '#f97316', marginLeft: '6px' }} />}
          </div>
          {isDashMode ? (
            <div style={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', marginTop: '2px', color: isTooLate ? '#ef4444' : '#22c55e' }}>
              {isTooLate ? 'Too Late' : dashTime === 0 ? 'Leave Now!' : `${dashTime}m until dash`}
            </div>
          ) : (
            <>
              {roundedMins < 4 ? (
                <div style={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', marginTop: '2px', color: '#22c55e' }}>Arriving Soon</div>
              ) : t.delayed ? (
                <div style={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', marginTop: '2px', color: '#f97316' }}>Delayed</div>
              ) : null}
            </>
          )}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '10px' }}>
        <span style={{ fontSize: '22px', fontWeight: '900', lineHeight: 1, color: (isDashMode && isTooLate) ? '#444' : '#fff' }}>
          {roundedMins}
        </span>
        <span style={{ fontSize: '8px', color: '#666', fontWeight: 'bold', display: 'block' }}>MINS</span>
        <span style={{ fontSize: '10px', color: '#999', fontWeight: 'bold', display: 'block', marginTop: '2px' }}>
          {formatArrivalTime(t.mins)}
        </span>
      </div>
    </div>
  );
};

const App = () => {
  const [selectedStop, setSelectedStop] = useState(STATIONS[0]);
  const [direction, setDirection] = useState('S'); 
  const [filterLines, setFilterLines] = useState(STATIONS[0]?.lines || []);
  const [trains, setTrains] = useState({ uptown: [], downtown: [], alerts: [] });
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [isDashMode, setIsDashMode] = useState(false);

  useEffect(() => {
    if (selectedStop) setFilterLines(selectedStop.lines || []);
  }, [selectedStop]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchRealtimeData = async (manual = false) => {
    if (!selectedStop || (loading && !manual)) return;
    setLoading(true);
    if (manual) setTrains({ uptown: [], downtown: [], alerts: [] });
    
    try {
      const lineToFetch = (selectedStop.lines?.[0] && FEED_MAP[selectedStop.lines[0]]) || 'gtfs';
      const [trainRes, alertsRes] = await Promise.all([
        fetch(`${WORKER_URL}?type=trains&line=${lineToFetch}`).catch(() => ({ ok: false })),
        fetch(`${WORKER_URL}?type=alerts`).catch(() => ({ ok: false }))
      ]);

      if (!trainRes.ok || !alertsRes.ok) throw new Error("Sync Pending");
      
      const trainBuffer = await trainRes.arrayBuffer();
      const alertsBuffer = await alertsRes.arrayBuffer();
      
      const trainFeed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
        new Uint8Array(trainBuffer)
      );
      const alertsFeed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
        new Uint8Array(alertsBuffer)
      );

      const trainData = trainFeed.toJSON();
      const alertsData = alertsFeed.toJSON();

      const parseFeed = (data, dir) => {
        const stationId = (selectedStop.id || '') + dir;
        const arrivals = [];
        (data.entity || []).forEach(entity => {
          if (entity.tripUpdate && entity.tripUpdate.stopTimeUpdate) {
            const update = entity.tripUpdate.stopTimeUpdate.find(u => u.stopId === stationId);
            if (update && update.arrival) {
              const mins = (update.arrival.time - Math.floor(Date.now() / 1000)) / 60;
              if (mins > -1) {
                arrivals.push({
                  id: entity.id,
                  line: entity.tripUpdate.trip.routeId,
                  dest: getTerminal(entity.tripUpdate.trip.routeId, dir),
                  mins: mins,
                  delayed: entity.tripUpdate.delay > 60
                });
              }
            }
          }
        });
        return arrivals.sort((a, b) => a.mins - b.mins);
      };

      setTrains({
        uptown: parseFeed(trainData, 'N'),
        downtown: parseFeed(trainData, 'S'),
        alerts: (alertsData.entity || []).map(e => ({
          id: e.id,
          lines: (e.alert?.informedEntity || []).map(ie => ie.routeId),
          description: e.alert?.headerText?.translation?.[0]?.text || "Service Update"
