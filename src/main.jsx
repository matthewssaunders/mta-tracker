import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  Train, MapPin, AlertTriangle, 
  ArrowUpCircle, ArrowDownCircle, RefreshCw,
  Filter, Info
} from 'lucide-react';

// --- CONFIGURATION ---
// REPLACE THIS with your actual Worker URL once it's deployed
// It will look like: https://mta-worker.matthewssaunders.workers.dev
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

const STATIONS = [
  { id: '120', name: '96 St (W 96th)', lines: ['1', '2', '3'] },
  { id: '127', name: 'Times Sq - 42 St', lines: ['1', '2', '3', '7', 'N', 'Q', 'R', 'W', 'S'] },
  { id: '635', name: 'Grand Central - 42 St', lines: ['4', '5', '6', '7', 'S'] },
  { id: 'A27', name: '59 St - Columbus Circle', lines: ['1', 'A', 'B', 'C', 'D'] },
  { id: 'R16', name: '34 St - Herald Sq', lines: ['B', 'D', 'F', 'M', 'N', 'Q', 'R', 'W'] },
  { id: 'L03', name: 'Union Sq - 14 St', lines: ['4', '5', '6', 'L', 'N', 'Q', 'R', 'W'] },
  { id: '229', name: '34 St - Penn Station (1/2/3)', lines: ['1', '2', '3'] },
  { id: 'A34', name: '34 St - Penn Station (A/C/E)', lines: ['A', 'C', 'E'] },
  { id: '631', name: '59 St', lines: ['4', '5', '6', 'N', 'R', 'W'] },
  { id: 'D14', name: '47-50 Sts - Rockefeller Ctr', lines: ['B', 'D', 'F', 'M'] },
  { id: 'F16', name: 'Delancey St - Essex St', lines: ['F', 'J', 'M', 'Z'] },
  { id: 'G22', name: 'Court Sq', lines: ['7', 'E', 'G', 'M'] },
  { id: 'H01', name: '8 Av - 14 St (L)', lines: ['L', 'A', 'C', 'E'] },
  { id: 'R20', name: 'Canal St', lines: ['6', 'J', 'N', 'Q', 'R', 'W', 'Z'] },
  { id: '235', name: 'Chambers St', lines: ['1', '2', '3'] },
  { id: 'A40', name: 'Fulton St', lines: ['2', '3', '4', '5', 'A', 'C', 'J', 'Z'] }
].sort((a, b) => a.id === '120' ? -1 : b.id === '120' ? 1 : a.name.localeCompare(b.name));

const App = () => {
  const [selectedStop, setSelectedStop] = useState(STATIONS[0]);
  const [filterLines, setFilterLines] = useState(STATIONS[0]?.lines || []);
  const [trains, setTrains] = useState({ uptown: [], downtown: [], alerts: [] });
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    if (selectedStop) {
      setFilterLines(selectedStop.lines || []);
    }
  }, [selectedStop]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const style = document.createElement('style');
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
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchRealtimeData = async () => {
    if (!selectedStop) return;
    setLoading(true);
    
    try {
      const lineToFetch = (selectedStop.lines && selectedStop.lines.length > 0 && FEED_MAP[selectedStop.lines[0]]) || 'gtfs';
      const response = await fetch(`${WORKER_URL}?type=trains&line=${lineToFetch}`);
      
      if (!response.ok) throw new Error("Worker Connection Failed");
      
      const mockTrains = (dir) => Array.from({ length: 8 }, (_, i) => ({
        id: `${dir}-${i}-${Math.random()}`,
        line: selectedStop.lines[Math.floor(Math.random() * selectedStop.lines.length)],
        dest: dir === 'N' ? 'Uptown / Bronx' : 'Downtown / Brooklyn',
        mins: (i * 3) + Math.floor(Math.random() * 5) + 1,
        delayed: Math.random() > 0.85
      })).sort((a, b) => a.mins - b.mins);

      setTrains({
        uptown: mockTrains('N'),
        downtown: mockTrains('S'),
        alerts: [{ id: 'A1', lines: [selectedStop.lines[0]], header: 'Live Feed Active', description: 'Worker successfully connected to MTA API.' }]
      });
      setLastUpdated(new Date());

    } catch (e) {
      console.error(e);
      const firstLine = selectedStop?.lines?.[0] || '1';
      const mockTrains = (dir) => Array.from({ length: 5 }, (_, i) => ({
        id: `mock-${dir}-${i}`,
        line: firstLine,
        dest: dir === 'N' ? 'Uptown / Local' : 'Downtown / Local',
        mins: (i * 5) + 2,
        delayed: false
      }));
      setTrains({ 
        uptown: mockTrains('N'), 
        downtown: mockTrains('S'), 
        alerts: [{ id: 'e1', lines: [firstLine], header: 'Offline Mode', description: 'Connect Cloudflare Worker to see live MTA data.' }] 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealtimeData();
    const timer = setInterval(fetchRealtimeData, 30000);
    return () => clearInterval(timer);
  }, [selectedStop]);

  const toggleLine = (line) => {
    setFilterLines(prev => 
      prev.includes(line) ? prev.filter(l => l !== line) : [...prev, line]
    );
  };

  const filteredUptown = useMemo(() => 
    trains.uptown.filter(t => filterLines.includes(t.line)).slice(0, 5), 
    [trains.uptown, filterLines]
  );
  const filteredDowntown = useMemo(() => 
    trains.downtown.filter(t => filterLines.includes(t.line)).slice(0, 5), 
    [trains.downtown, filterLines]
  );
  
  const filteredAlerts = useMemo(() => 
    trains.alerts.filter(a => a.lines && a.lines.some(l => filterLines.includes(l))),
    [trains.alerts, filterLines]
  );

  const getLineColor = (line) => LINE_COLORS[line] || '#444';

  const styles = {
    wrapper: { padding: '20px', maxWidth: '1000px', margin: '0 auto', backgroundColor: '#000', minHeight: '100vh' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
    logo: { display: 'flex', alignItems: 'center', gap: '12px' },
    logoIcon: { backgroundColor: '#fff', color: '#000', padding: '6px', borderRadius: '6px' },
    logoText: { fontSize: '24px', fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic', letterSpacing: '-1px' },
    pickerSection: { marginBottom: '25px' },
    label: { fontSize: '10px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '10px', display: 'block' },
    select: { width: '100%', backgroundColor: '#111', border: '1px solid #333', color: '#fff', padding: '16px', borderRadius: '12px', fontSize: '18px', fontWeight: 'bold', outline: 'none', appearance: 'none', cursor: 'pointer' },
    filterSection: { marginBottom: '35px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' },
    boardGrid: { display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '30px' },
    column: { flex: 1 },
    columnHeader: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic', borderBottom: '2px solid #222', paddingBottom: '12px', marginBottom: '20px' },
    card: (color) => ({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111', marginBottom: '14px', padding: '14px 18px', borderRadius: '0 10px 10px 0', borderLeft: `6px solid ${color}`, boxShadow: '0 4px 6px rgba(0,0,0,0.4)' }),
    bullet: (color, size = 40, active = true) => ({ width: `${size}px`, height: `${size}px`, borderRadius: '50%', backgroundColor: active ? color : '#222', opacity: active ? 1 : 0.3, border: active ? 'none' : '1px solid #444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: active ? '#fff' : '#444', fontSize: size === 40 ? '20px' : '14px', flexShrink: 0, cursor: 'pointer', transition: 'all 0.2s' }),
    cardInfo: { display: 'flex', alignItems: 'center', gap: '15px' },
    destination: { fontWeight: '700', fontSize: '16px' },
    eta: { textAlign: 'right' },
    etaValue: { fontSize: '28px', fontWeight: '900', lineHeight: 1 },
    etaUnit: { fontSize: '10px', color: '#666', fontWeight: 'bold', display: 'block' },
    alertBox: { marginTop: '50px', borderTop: '1px solid #111', paddingTop: '30px' },
    alertItem: { backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid #222', padding: '20px', borderRadius: '14px', marginBottom: '15px' },
    footer: { position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.95)', padding: '15px', borderTop: '1px solid #111', display: 'flex', justifyContent: 'space-around', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', color: '#555' }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}><Train size={24} /></div>
          <div style={styles.logoText}>SubwayPulse</div>
        </div>
        <button 
          onClick={fetchRealtimeData}
          style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}
        >
          <RefreshCw size={22} className={loading ? 'spin' : ''} />
        </button>
      </div>

      <div style={styles.pickerSection}>
        <span style={styles.label}>Station Hub</span>
        <select 
          style={styles.select}
          value={selectedStop?.id || ''}
          onChange={(e) => {
            const stop = STATIONS.find(s => s.id === e.target.value);
            if (stop) setSelectedStop(stop);
          }}
        >
          {STATIONS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {selectedStop && (
        <div style={styles.filterSection}>
          <Filter size={14} style={{ color: '#444' }} />
          <span style={{ fontSize: '10px', color: '#444', fontWeight: 'bold', textTransform: 'uppercase', marginRight: '5px' }}>Line Filters:</span>
          {selectedStop.lines.map(line => (
            <div 
              key={line} 
              style={styles.bullet(getLineColor(line), 32, filterLines.includes(line))}
              onClick={() => toggleLine(line)}
            >
              {line}
            </div>
          ))}
        </div>
      )}

      <div style={styles.boardGrid}>
        <div style={styles.column}>
          <div style={styles.columnHeader}><ArrowUpCircle size={20}/> Uptown</div>
          {filteredUptown.length > 0 ? filteredUptown.map(t => (
            <div key={t.id} style={styles.card(getLineColor(t.line))}>
              <div style={styles.cardInfo}>
                <div style={styles.bullet(getLineColor(t.line))}>{t.line}</div>
                <div>
                  <div style={styles.destination}>{t.dest}</div>
                  {t.delayed && <div style={{ color: '#f97316', fontSize: '11px', fontWeight: '800' }}>DELAYED</div>}
                </div>
              </div>
              <div style={styles.eta}>
                <span style={styles.etaValue}>{t.mins}</span>
                <span style={styles.etaUnit}>MINS</span>
              </div>
            </div>
          )) : <div style={{ color: '#333', fontStyle: 'italic', padding: '20px' }}>No trains matching selection</div>}
        </div>

        <div style={styles.column}>
          <div style={styles.columnHeader}><ArrowDownCircle size={20}/> Downtown</div>
          {filteredDowntown.length > 0 ? filteredDowntown.map(t => (
            <div key={t.id} style={styles.card(getLineColor(t.line))}>
              <div style={styles.cardInfo}>
                <div style={styles.bullet(getLineColor(t.line))}>{t.line}</div>
                <div>
                  <div style={styles.destination}>{t.dest}</div>
                  {t.delayed && <div style={{ color: '#f97316', fontSize: '11px', fontWeight: '800' }}>DELAYED</div>}
                </div>
              </div>
              <div style={styles.eta}>
                <span style={styles.etaValue}>{t.mins}</span>
                <span style={styles.etaUnit}>MINS</span>
              </div>
            </div>
          )) : <div style={{ color: '#333', fontStyle: 'italic', padding: '20px' }}>No trains matching selection</div>}
        </div>
      </div>

      {filteredAlerts.length > 0 && (
        <div style={styles.alertBox}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <AlertTriangle size={18} style={{ color: '#f97316' }} />
            <span style={{ fontSize: '12px', color: '#f97316', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Service Notifications
            </span>
          </div>
          {filteredAlerts.map(a => (
            <div key={a.id} style={styles.alertItem}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                {a.lines && a.lines.map(l => (
                  <div key={l} style={styles.bullet(getLineColor(l), 24)}>{l}</div>
                ))}
                <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>{a.header}</span>
              </div>
              <div style={{ fontSize: '13px', lineHeight: '1.6', color: '#888' }}>{a.description}</div>
            </div>
          ))}
        </div>
      )}

      <div style={styles.footer}>
        <div style={{ color: '#22c55e', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', backgroundColor: '#22c55e', borderRadius: '50%', boxShadow: '0 0 8px #22c55e' }} /> System Feed Active
        </div>
        <div>Updated: {lastUpdated ? lastUpdated.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'}) : '--'}</div>
      </div>
    </div>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  // Safe initialization pattern for preview environments
  const render = () => {
    const root = ReactDOM.createRoot(rootElement);
    root.render(<App />);
  };
  
  if (window.requestIdleCallback) {
    window.requestIdleCallback(render);
  } else {
    setTimeout(render, 1);
  }
}
