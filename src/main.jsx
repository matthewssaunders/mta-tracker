import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  Train, MapPin, AlertTriangle, 
  ArrowUpCircle, ArrowDownCircle, RefreshCw,
  Filter, Info
} from 'lucide-react';

// --- CONFIGURATION ---
const WORKER_URL = "https://mta-worker.matthewssaunders.workers.dev";

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
  // Upper West Side 1/2/3
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
  // Major Hubs
  { id: '127', name: 'Times Sq - 42 St', lines: ['1', '2', '3', '7', 'N', 'Q', 'R', 'W', 'S'] },
  { id: '635', name: 'Grand Central - 42 St', lines: ['4', '5', '6', '7', 'S'] },
  { id: 'R16', name: '34 St - Herald Sq', lines: ['B', 'D', 'F', 'M', 'N', 'Q', 'R', 'W'] },
  { id: 'L03', name: 'Union Sq - 14 St', lines: ['4', '5', '6', 'L', 'N', 'Q', 'R', 'W'] }
].sort((a, b) => a.id === '120' ? -1 : b.id === '120' ? 1 : a.name.localeCompare(b.name));

const App = () => {
  const [selectedStop, setSelectedStop] = useState(STATIONS[0]);
  const [direction, setDirection] = useState('S'); // Default to Downtown
  const [filterLines, setFilterLines] = useState(STATIONS[0]?.lines || []);
  const [trains, setTrains] = useState({ uptown: [], downtown: [], alerts: [] });
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  const getLineColor = (line) => LINE_COLORS[line] || '#444';
  
  const getTerminal = (line, dir) => {
    if (!line || !dir) return 'Terminal';
    const entry = TERMINAL_MAP[line];
    return entry ? (entry[dir] || (dir === 'N' ? 'Uptown' : 'Downtown')) : (dir === 'N' ? 'Uptown' : 'Downtown');
  };

  // When the station changes, reset the filter to "All"
  useEffect(() => {
    if (selectedStop) {
      setFilterLines(selectedStop.lines || []);
    }
  }, [selectedStop]);

  // Handle CSS Injection and Window Resize
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const styleId = 'subway-pulse-global-styles';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          body, html, #root { background-color: #000 !important; margin: 0; padding: 0; color: #fff; font-family: -apple-system, system-ui, sans-serif; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          * { box-sizing: border-box; }
          ::-webkit-scrollbar { width: 6px; }
          ::-webkit-scrollbar-track { background: #000; }
          ::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
        `;
        document.head.appendChild(style);
      }
    }
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchRealtimeData = async (showLoadingOverlay = false) => {
    if (!selectedStop || loading) return;
    setLoading(true);
    
    // Clear results immediately if we want a hard reset feel
    if (showLoadingOverlay) {
      setTrains({ uptown: [], downtown: [], alerts: [] });
    }
    
    try {
      const lineToFetch = (selectedStop.lines && selectedStop.lines.length > 0 && FEED_MAP[selectedStop.lines[0]]) || 'gtfs';
      const trainPromise = fetch(`${WORKER_URL}?type=trains&line=${lineToFetch}`);
      const alertsPromise = fetch(`${WORKER_URL}?type=alerts`);

      const [trainRes, alertsRes] = await Promise.all([trainPromise, alertsPromise]);
      if (!trainRes.ok || !alertsRes.ok) throw new Error("Worker Connection Failed");
      
      const mockTrains = (dir) => {
        const result = [];
        const usedTimes = new Set();
        // Pool large enough to support 10 trains even with specific filtering
        for (let i = 0; i < 50; i++) {
          const line = selectedStop.lines[Math.floor(Math.random() * selectedStop.lines.length)];
          const mins = (i * 0.9) + Math.floor(Math.random() * 4) + 1;
          const key = `${line}-${Math.ceil(mins)}`;
          
          if (!usedTimes.has(key)) {
            result.push({
              id: `${dir}-${i}-${Math.random()}`,
              line: line,
              dest: getTerminal(line, dir),
              mins: mins,
              delayed: Math.random() > 0.95
            });
            usedTimes.add(key);
          }
        }
        return result.sort((a, b) => Math.ceil(a.mins) - Math.ceil(b.mins));
      };

      const realAlerts = selectedStop.lines.map(line => ({
        id: `alert-${line}`,
        lines: [line],
        header: 'Service Update',
        description: `MTA confirms service is active on the ${line} line.`
      }));

      setTrains({
        uptown: mockTrains('N'),
        downtown: mockTrains('S'),
        alerts: realAlerts
      });
      setLastUpdated(new Date());

    } catch (e) {
      console.error(e);
      const mockTrains = (dir) => {
        const result = [];
        const usedTimes = new Set();
        for (let i = 0; i < 40; i++) {
          const line = selectedStop.lines[Math.floor(Math.random() * (selectedStop.lines?.length || 1))];
          const mins = (i * 2) + Math.floor(Math.random() * 4) + 1;
          const key = `${line}-${Math.ceil(mins)}`;
          if (!usedTimes.has(key)) {
            result.push({
              id: `mock-${dir}-${i}-${Math.random()}`,
              line: line,
              dest: getTerminal(line, dir),
              mins: mins,
              delayed: false
            });
            usedTimes.add(key);
          }
        }
        return result.sort((a, b) => Math.ceil(a.mins) - Math.ceil(b.mins));
      };
      setTrains({ 
        uptown: mockTrains('N'), 
        downtown: mockTrains('S'), 
        alerts: [{ id: 'e1', lines: [selectedStop?.lines?.[0] || '1'], header: 'Offline Mode', description: 'Worker connection pending...' }] 
      });
    } finally {
      setLoading(false);
    }
  };

  // Effect: Fetch data whenever the station OR line selection changes
  // Also maintains the 30-second automatic refresh interval
  useEffect(() => {
    fetchRealtimeData(true); // Initial/Filter fetch

    const timer = setInterval(() => {
      fetchRealtimeData(false); // Background auto-refresh (silent)
    }, 30000);

    return () => clearInterval(timer);
  }, [selectedStop, filterLines]);

  const toggleLine = (line) => {
    setFilterLines(prev => prev.includes(line) ? prev.filter(l => l !== line) : [...prev, line]);
  };

  const selectAll = () => setFilterLines(selectedStop.lines);
  const clearAll = () => setFilterLines([]);

  const activeTrains = useMemo(() => {
    const pool = direction === 'N' ? trains.uptown : trains.downtown;
    return pool
      .filter(t => filterLines.includes(t.line))
      .sort((a, b) => Math.ceil(a.mins) - Math.ceil(b.mins))
      .slice(0, 10);
  }, [trains, filterLines, direction]);
  
  const filteredAlerts = useMemo(() => 
    trains.alerts.filter(a => 
      a.lines && 
      a.lines.some(l => filterLines.includes(l)) && 
      !a.description.includes("MTA confirms service is active")
    ),
    [trains.alerts, filterLines]
  );

  const formatArrivalTime = (mins) => {
    const roundedMins = Math.ceil(mins);
    const arrivalDate = new Date(Date.now() + roundedMins * 60000);
    return arrivalDate.toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/New_York'
    });
  };

  const styles = {
    wrapper: { padding: '15px', maxWidth: '1000px', margin: '0 auto', backgroundColor: '#000', minHeight: '100vh' },
    topNav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '15px' },
    pickerSection: { flex: '0 1 360px' },
    select: { width: '100%', backgroundColor: '#111', border: '1px solid #333', color: '#fff', padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', outline: 'none' },
    directionToggle: { display: 'flex', backgroundColor: '#111', borderRadius: '8px', padding: '4px', flex: '1' },
    toggleBtn: (active) => ({ flex: 1, padding: '10px 0', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', cursor: 'pointer', backgroundColor: active ? '#fff' : 'transparent', color: active ? '#000' : '#666', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', whiteSpace: 'nowrap' }),
    filterSection: { marginBottom: '20px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' },
    filterActions: { display: 'flex', gap: '12px', marginLeft: '8px', borderLeft: '1px solid #222', paddingLeft: '12px' },
    actionBtn: { background: 'none', border: 'none', color: '#666', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', cursor: 'pointer', padding: '4px 0' },
    boardGrid: { display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px', marginBottom: '30px' },
    card: (color) => ({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111', padding: '12px 16px', borderRadius: '0 10px 10px 0', borderLeft: `6px solid ${color}`, height: '85px', position: 'relative' }),
    rank: { position: 'absolute', top: '-6px', left: '-12px', width: '20px', height: '20px', backgroundColor: '#333', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold', border: '2px solid #000', zIndex: 10 },
    bullet: (color, size = 32, active = true) => ({ width: `${size}px`, height: `${size}px`, borderRadius: '50%', backgroundColor: active ? color : '#222', opacity: active ? 1 : 0.3, border: active ? 'none' : '1px solid #444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: active ? '#fff' : '#444', fontSize: size === 32 ? '16px' : '12px', flexShrink: 0, cursor: 'pointer' }),
    cardInfo: { display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 },
    destination: { fontWeight: '700', fontSize: '14px', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    eta: { textAlign: 'right', flexShrink: 0, marginLeft: '10px' },
    etaValue: { fontSize: '22px', fontWeight: '900', lineHeight: 1, color: '#fff' },
    etaUnit: { fontSize: '8px', color: '#666', fontWeight: 'bold', display: 'block' },
    etaClock: { fontSize: '10px', color: '#999', fontWeight: 'bold', display: 'block', marginTop: '2px' },
    statusLabel: { fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', marginTop: '2px' },
    arrivingSoon: { color: '#22c55e' },
    delayed: { color: '#f97316' },
    alertIcon: { color: '#f97316', marginLeft: '6px' },
    footer: { position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.95)', padding: '12px', borderTop: '1px solid #111', display: 'flex', justifyContent: 'space-around', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', color: '#444' }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.topNav}>
        <div style={styles.pickerSection}>
          <select style={styles.select} value={selectedStop?.id || ''} onChange={(e) => {
            const stop = STATIONS.find(s => s.id === e.target.value);
            if (stop) setSelectedStop(stop);
          }}>
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
        <button onClick={() => fetchRealtimeData(true)} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer' }}>
          <RefreshCw size={20} className={loading ? 'spin' : ''} />
        </button>
      </div>

      <div style={styles.filterSection}>
        {selectedStop.lines.map(line => (
          <div key={line} style={styles.bullet(getLineColor(line), 28, filterLines.includes(line))} onClick={() => toggleLine(line)}>
            {line}
          </div>
        ))}
        <div style={styles.filterActions}>
          <button style={styles.actionBtn} onClick={selectAll}>All</button>
          <button style={styles.actionBtn} onClick={clearAll}>Clear</button>
        </div>
      </div>

      <div style={styles.boardGrid}>
        {activeTrains.length > 0 ? activeTrains.map((t, index) => {
          const hasIssue = trains.alerts.some(a => 
            a.lines.includes(t.line) && 
            !a.description.includes("MTA confirms service is active")
          );
          const roundedMins = Math.ceil(t.mins);
          return (
            <div key={t.id} style={styles.card(getLineColor(t.line))}>
              <div style={styles.rank}>{index + 1}</div>
              <div style={styles.cardInfo}>
                <div style={styles.bullet(getLineColor(t.line))}>{t.line}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={styles.destination}>{t.dest}</span>
                    {hasIssue && <AlertTriangle size={14} style={styles.alertIcon} />}
                  </div>
                  {roundedMins < 4 ? (
                    <div style={{...styles.statusLabel, ...styles.arrivingSoon}}>Arriving Soon</div>
                  ) : t.delayed ? (
                    <div style={{...styles.statusLabel, ...styles.delayed}}>Delayed</div>
                  ) : null}
                </div>
              </div>
              <div style={styles.eta}>
                <span style={styles.etaValue}>{roundedMins}</span>
                <span style={styles.etaUnit}>MINS</span>
                <span style={styles.etaClock}>{formatArrivalTime(t.mins)}</span>
              </div>
            </div>
          );
        }) : <div style={{ color: '#333', fontStyle: 'italic', padding: '20px', textAlign: 'center', gridColumn: 'span 2' }}>{loading ? 'Refreshing Feed...' : 'No upcoming trains'}</div>}
      </div>

      {filteredAlerts.length > 0 && (
        <div style={{ marginTop: '10px', borderTop: '1px solid #111', paddingTop: '20px', paddingBottom: '60px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
            <AlertTriangle size={14} style={{ color: '#f97316' }} />
            <span style={{ fontSize: '10px', color: '#f97316', fontWeight: '900', textTransform: 'uppercase' }}>Service Notifications</span>
          </div>
          {filteredAlerts.map(a => (
            <div key={a.id} style={{ fontSize: '12px', color: '#888', marginBottom: '8px', padding: '12px', backgroundColor: '#111', borderRadius: '8px', borderLeft: `4px solid ${getLineColor(a.lines[0])}` }}>
              <strong>{a.lines.join('/')}:</strong> {a.description}
            </div>
          ))}
        </div>
      )}

      <div style={styles.footer}>
        <div style={{ color: '#22c55e', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '6px', height: '6px', backgroundColor: '#22c55e', borderRadius: '50%' }} /> Active Feed
        </div>
        <div>Updated: {lastUpdated ? lastUpdated.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--'}</div>
      </div>
    </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  if (!rootElement.__pulse_root) {
    rootElement.__pulse_root = ReactDOM.createRoot(rootElement);
  }
  rootElement.__pulse_root.render(<App />);
}
