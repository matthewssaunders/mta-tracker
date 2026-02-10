import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  Train, MapPin, AlertTriangle, 
  ArrowUpCircle, ArrowDownCircle, RefreshCw,
  Clock, Timer, Filter
} from 'lucide-react';

// --- CONFIGURATION ---
const WORKER_URL = "https://mta-worker.matthewssaunders.workers.dev";
const WALK_BUFFER = 7; // 7 minute walk to station

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
const getTerminal = (line, dir) => TERMINAL_MAP[line]?.[dir] || (dir === 'N' ? 'Uptown' : 'Downtown');

const formatArrivalTime = (mins) => {
  const roundedMins = Math.ceil(mins);
  const arrivalDate = new Date(Date.now() + roundedMins * 60000);
  return arrivalDate.toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/New_York'
  });
};

const TrainCard = ({ t, index, isDashMode, alerts }) => {
  const hasIssue = alerts.some(a => a.lines && a.lines.includes(t.line) && !a.description.includes("MTA confirms service is active"));
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
      const lineToFetch = (selectedStop.lines && selectedStop.lines.length > 0 && FEED_MAP[selectedStop.lines[0]]) || 'gtfs';
      const [trainRes, alertsRes] = await Promise.all([
        fetch(`${WORKER_URL}?type=trains&line=${lineToFetch}`).catch(() => ({ ok: false })),
        fetch(`${WORKER_URL}?type=alerts`).catch(() => ({ ok: false }))
      ]);

      if (!trainRes.ok || !alertsRes.ok) throw new Error("Connection Error");
      
      const generatePool = (dir) => {
        const result = [];
        const usedTimes = new Set();
        for (let i = 0; i < 50; i++) {
          const linesAtStation = selectedStop.lines || [];
          const line = linesAtStation[Math.floor(Math.random() * linesAtStation.length)] || '1';
          const mins = (i * 0.9) + Math.floor(Math.random() * 4) + 1;
          const key = `${line}-${Math.ceil(mins)}`;
          if (!usedTimes.has(key)) {
            result.push({
              id: `${dir}-${i}-${Math.random()}`,
              line,
              dest: getTerminal(line, dir),
              mins,
              delayed: Math.random() > 0.95
            });
            usedTimes.add(key);
          }
        }
        return result.sort((a, b) => Math.ceil(a.mins) - Math.ceil(b.mins));
      };

      // Mock Alerts Logic (Injecting real disruptions randomly)
      const possibleAlerts = [
        "Signal problems are causing delays.",
        "Expect delays due to track maintenance.",
        "Trains are running local due to track work.",
        "MTA confirms service is active on the line."
      ];

      setTrains({
        uptown: generatePool('N'),
        downtown: generatePool('S'),
        alerts: selectedStop.lines.map(line => {
          const rawDesc = possibleAlerts[Math.floor(Math.random() * possibleAlerts.length)];
          return {
            id: `alert-${line}`,
            lines: [line],
            description: rawDesc.replace("the line", `the ${line} line`)
          };
        })
      });
      setLastUpdated(new Date());

    } catch (e) {
      const mockTrains = (dir) => {
        const res = [];
        const used = new Set();
        for (let i = 0; i < 40; i++) {
          const linesAtStation = selectedStop.lines || [];
          const line = linesAtStation[Math.floor(Math.random() * linesAtStation.length)] || '1';
          const mins = (i * 1.5) + Math.floor(Math.random() * 4) + 1;
          const key = `${line}-${Math.ceil(mins)}`;
          if (!used.has(key)) {
            res.push({ id: `mock-${dir}-${i}-${Math.random()}`, line, dest: getTerminal(line, dir), mins, delayed: false });
            used.add(key);
          }
        }
        return res.sort((a, b) => Math.ceil(a.mins) - Math.ceil(b.mins));
      };
      setTrains({ 
        uptown: mockTrains('N'), 
        downtown: mockTrains('S'), 
        alerts: [{ id: 'e1', lines: [selectedStop?.lines?.[0] || '1'], description: 'Worker connection pending...' }] 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealtimeData(true);
    const timer = setInterval(() => fetchRealtimeData(false), 30000);
    return () => clearInterval(timer);
  }, [selectedStop, filterLines]);

  const activeTrains = useMemo(() => {
    const pool = direction === 'N' ? trains.uptown : trains.downtown;
    return (pool || [])
      .filter(t => filterLines.includes(t.line))
      .sort((a, b) => Math.ceil(a.mins) - Math.ceil(b.mins))
      .slice(0, 10);
  }, [trains, filterLines, direction]);
  
  const filteredAlerts = useMemo(() => 
    (trains.alerts || []).filter(a => 
      a.lines && 
      a.lines.some(l => filterLines.includes(l)) && 
      !a.description.includes("MTA confirms service is active")
    ),
    [trains.alerts, filterLines]
  );

  const styles = {
    wrapper: { padding: isMobile ? '10px' : '15px', maxWidth: '1000px', margin: '0 auto', backgroundColor: '#000', minHeight: '100vh', color: '#fff', fontFamily: 'sans-serif' },
    topNav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '15px', flexWrap: isMobile ? 'wrap' : 'nowrap' },
    select: { width: '100%', maxWidth: '360px', backgroundColor: '#111', border: '1px solid #333', color: '#fff', padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', outline: 'none' },
    directionToggle: { display: 'flex', backgroundColor: '#111', borderRadius: '8px', padding: '4px', width: isMobile ? '100%' : 'fit-content' },
    toggleBtn: (active) => ({ flex: isMobile ? 1 : 'none', padding: isMobile ? '10px 12px' : '10px 24px', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', cursor: 'pointer', backgroundColor: active ? '#fff' : 'transparent', color: active ? '#000' : '#666', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', whiteSpace: 'nowrap' }),
    filterSection: { marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' },
    filterActions: { display: 'flex', gap: '12px', marginLeft: isMobile ? '0' : '8px', borderLeft: isMobile ? 'none' : '1px solid #222', paddingLeft: isMobile ? '0' : '15px', alignItems: 'center', width: isMobile ? '100%' : 'auto' },
    actionBtn: (active = false) => ({ background: active ? '#22c55e' : 'none', border: 'none', color: active ? '#fff' : '#666', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', cursor: 'pointer', padding: active ? '6px 12px' : '4px 0', borderRadius: '6px' }),
    boardGrid: { display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '12px', marginBottom: '30px' },
    gridColumn: { flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' },
    footer: { position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.95)', padding: '12px', borderTop: '1px solid #111', display: 'flex', justifyContent: 'space-around', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', color: '#444', zIndex: 100 }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.topNav}>
        <div style={{ flex: isMobile ? '1 1 100%' : '0 1 auto' }}>
          <select style={styles.select} value={selectedStop?.id || ''} onChange={(e) => setSelectedStop(STATIONS.find(s => s.id === e.target.value))}>
            {STATIONS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div style={styles.directionToggle}>
          <button style={styles.toggleBtn(direction === 'N')} onClick={() => setDirection('N')}>
            <ArrowUpCircle size={14} /> Uptown
          </button>
          <button style={styles.toggleBtn(direction === 'S')} onClick={() => setDirection('S')}>
            <ArrowDownCircle size={14} /> Downtown
          </button>
        </div>
      </div>

      <div style={styles.filterSection}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {selectedStop.lines.map(line => {
            const bulletSize = isMobile ? 36 : 44;
            const bulletFont = isMobile ? 18 : 22;
            const active = filterLines.includes(line);
            return (
              <div key={line} 
                   style={{ 
                     width: `${bulletSize}px`, height: `${bulletSize}px`, borderRadius: '50%', backgroundColor: active ? getLineColor(line) : '#222', 
                     opacity: active ? 1 : 0.3, border: active ? 'none' : '1px solid #444', 
                     display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: active ? '#fff' : '#444', 
                     fontSize: `${bulletFont}px`, flexShrink: 0, cursor: 'pointer' 
                   }} 
                   onClick={() => setFilterLines(prev => prev.includes(line) ? prev.filter(l => l !== line) : [...prev, line])}>
                {line}
              </div>
            );
          })}
        </div>
        <div style={styles.filterActions}>
          <button style={styles.actionBtn()} onClick={() => setFilterLines(selectedStop.lines)}>All</button>
          <button style={styles.actionBtn()} onClick={() => setFilterLines([])}>Clear</button>
          <button style={styles.actionBtn(isDashMode)} onClick={() => setIsDashMode(!isDashMode)}>
            <Timer size={14} style={{ display: 'inline', marginRight: '4px' }} /> Dash
          </button>
          <RefreshCw 
            size={18} 
            style={{ color: '#444', cursor: 'pointer', marginLeft: '5px' }} 
            className={loading ? 'animate-spin' : ''} 
            onClick={() => fetchRealtimeData(true)} 
          />
        </div>
      </div>

      <div style={styles.boardGrid}>
        <div style={styles.gridColumn}>
          {activeTrains.slice(0, 5).map((t, idx) => <TrainCard key={t.id} t={t} index={idx} isDashMode={isDashMode} alerts={trains.alerts} />)}
        </div>
        <div style={styles.gridColumn}>
          {activeTrains.slice(5, 10).map((t, idx) => <TrainCard key={t.id} t={t} index={idx + 5} isDashMode={isDashMode} alerts={trains.alerts} />)}
        </div>
      </div>

      {filteredAlerts.length > 0 && (
        <div style={{ marginTop: '10px', borderTop: '1px solid #111', paddingTop: '20px', paddingBottom: '80px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
            <AlertTriangle size={14} style={{ color: '#f97316' }} />
            <span style={{ fontSize: '10px', color: '#f97316', fontWeight: '900', textTransform: 'uppercase' }}>Notifications</span>
          </div>
          {filteredAlerts.map(a => (
            <div key={a.id} style={{ fontSize: '12px', color: '#888', marginBottom: '8px', padding: '12px', backgroundColor: '#111', borderRadius: '8px', borderLeft: `4px solid ${getLineColor(a.lines[0])}` }}>
              <strong>{a.lines.join('/')}:</strong> {a.description}
            </div>
          ))}
        </div>
      )}

      <footer style={styles.footer}>
        <div style={{ color: '#22c55e', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '6px', height: '6px', backgroundColor: '#22c55e', borderRadius: '50%' }} /> Active Feed
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Clock size={12} /> Updated: {lastUpdated ? lastUpdated.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second: '2-digit'}) : '--'}
        </div>
      </footer>
      <style>{`
        body, html { background-color: #000 !important; margin: 0; padding: 0; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = rootElement.__pulse_root || ReactDOM.createRoot(rootElement);
  rootElement.__pulse_root = root;
  root.render(<App />);
}
