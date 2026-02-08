import React, { useState, useEffect } from 'react';
import { 
  Train, MapPin, AlertTriangle, 
  ArrowUpCircle, ArrowDownCircle, RefreshCw 
} from 'lucide-react';

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

const STATIONS = [
  { id: '127', name: 'Times Sq - 42 St', lines: ['1', '2', '3', '7', 'N', 'Q', 'R', 'W', 'S'] },
  { id: '635', name: 'Grand Central - 42 St', lines: ['4', '5', '6', '7', 'S'] },
  { id: 'A27', name: '59 St - Columbus Circle', lines: ['1', 'A', 'B', 'C', 'D'] },
  { id: 'R16', name: '34 St - Herald Sq', lines: ['B', 'D', 'F', 'M', 'N', 'Q', 'R', 'W'] },
  { id: 'L03', name: 'Union Sq - 14 St', lines: ['4', '5', '6', 'L', 'N', 'Q', 'R', 'W'] },
];

const App = () => {
  const [selectedStop, setSelectedStop] = useState(STATIONS[0]);
  const [trains, setTrains] = useState({ uptown: [], downtown: [], alerts: [] });
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle responsiveness via JS state for absolute reliability
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    document.body.style.backgroundColor = '#000';
    document.body.style.margin = '0';
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchRealtimeData = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    
    const lines = selectedStop.lines;
    const mockTrains = (dir) => Array.from({ length: 5 }, (_, i) => ({
      id: `${dir}-${i}`,
      line: lines[Math.floor(Math.random() * lines.length)],
      dest: dir === 'N' ? 'Uptown / Bronx' : 'Downtown / Brooklyn',
      mins: (i * 4) + Math.floor(Math.random() * 5) + 2,
      delayed: Math.random() > 0.8
    })).sort((a, b) => a.mins - b.mins);

    setTrains({
      uptown: mockTrains('N'),
      downtown: mockTrains('S'),
      alerts: [
        { id: 1, line: selectedStop.lines[0], msg: `Delays reported on ${selectedStop.lines[0]} line due to signal maintenance.` }
      ]
    });
    setLastUpdated(new Date());
    setLoading(false);
  };

  useEffect(() => {
    fetchRealtimeData();
    const timer = setInterval(fetchRealtimeData, 30000);
    return () => clearInterval(timer);
  }, [selectedStop]);

  // Styles Object
  const s = {
    app: {
      minHeight: '100vh',
      backgroundColor: '#000',
      color: '#e5e5e5',
      fontFamily: '-apple-system, system-ui, sans-serif',
      padding: '20px',
      paddingBottom: '100px',
    },
    header: {
      maxWidth: '900px',
      margin: '0 auto 30px auto',
      display: 'flex',
      justifyContent: spaceBetween('header'),
      alignItems: 'center',
    },
    logoBox: { display: 'flex', alignItems: 'center', gap: '12px' },
    mtaIcon: { background: '#fff', padding: '6px', borderRadius: '6px', color: '#000', display: 'flex' },
    logoText: { fontSize: '24px', fontWeight: '900', fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '-1px', color: '#fff' },
    picker: { maxWidth: '900px', margin: '0 auto 40px auto' },
    label: { fontSize: '10px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '10px', display: 'block' },
    select: { width: '100%', background: '#111', border: '1px solid #333', color: '#fff', padding: '18px', borderRadius: '14px', fontSize: '18px', fontWeight: 'bold', outline: 'none' },
    container: { maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '30px' },
    column: { flex: 1 },
    colHeader: { display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '900', textTransform: 'uppercase', fontStyle: 'italic', borderBottom: '2px solid #222', paddingBottom: '12px', marginBottom: '20px', color: '#fff', fontSize: '18px' },
    card: (color) => ({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111', marginBottom: '14px', padding: '14px 18px', borderRadius: '0 10px 10px 0', borderLeft: `6px solid ${color}`, boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }),
    bullet: (color, size = 40) => ({ width: `${size}px`, height: `${size}px`, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justify: 'center', fontWeight: '800', color: '#fff', fontSize: size === 40 ? '20px' : '14px', flexShrink: 0, justifyContent: 'center' }),
    info: { display: 'flex', alignItems: 'center', gap: '15px' },
    dest: { fontWeight: '700', color: '#fff', fontSize: '16px' },
    delay: { color: '#f97316', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginTop: '2px' },
    eta: { textAlign: 'right' },
    etaVal: { fontSize: '28px', fontWeight: '900', color: '#fff', lineHeight: 1 },
    etaUnit: { fontSize: '10px', color: '#666', fontWeight: 'bold', display: 'block', marginTop: '2px' },
    alertBox: { marginTop: '50px', maxWidth: '900px', marginLeft: 'auto', marginRight: 'auto' },
    alertItem: { background: 'rgba(249, 115, 22, 0.08)', border: '1px solid rgba(249, 115, 22, 0.2)', padding: '18px', borderRadius: '14px', display: 'flex', gap: '15px', marginBottom: '15px' },
    footer: { position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.95)', padding: '15px', borderTop: '1px solid #111', fontSize: '10px', fontWeight: '800', color: '#555', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-around' },
  };

  function spaceBetween(el) { return 'space-between'; }

  return (
    <div style={s.app}>
      <div style={s.header}>
        <div style={s.logoBox}>
          <div style={s.mtaIcon}><Train size={24} /></div>
          <div style={s.logoText}>SubwayPulse</div>
        </div>
        <RefreshCw 
          size={22} 
          style={{ cursor: 'pointer', color: '#888', animation: loading ? 'spin 1s linear infinite' : 'none' }} 
          onClick={fetchRealtimeData}
        />
      </div>

      <div style={s.picker}>
        <span style={s.label}>Station Monitor</span>
        <select 
          style={s.select}
          value={selectedStop.id}
          onChange={(e) => setSelectedStop(STATIONS.find(s => s.id === e.target.value))}
        >
          {STATIONS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div style={s.container}>
        <div style={s.column}>
          <div style={s.colHeader}><ArrowUpCircle size={20}/> Uptown</div>
          {trains.uptown.map(t => (
            <div key={t.id} style={s.card(LINE_COLORS[t.line])}>
              <div style={s.info}>
                <div style={s.bullet(LINE_COLORS[t.line])}>{t.line}</div>
                <div>
                  <div style={s.dest}>{t.dest}</div>
                  {t.delayed && <div style={s.delay}>Delayed</div>}
                </div>
              </div>
              <div style={s.eta}>
                <span style={s.etaVal}>{t.mins}</span>
                <span style={s.etaUnit}>MINS</span>
              </div>
            </div>
          ))}
        </div>

        <div style={s.column}>
          <div style={s.colHeader}><ArrowDownCircle size={20}/> Downtown</div>
          {trains.downtown.map(t => (
            <div key={t.id} style={s.card(LINE_COLORS[t.line])}>
              <div style={s.info}>
                <div style={s.bullet(LINE_COLORS[t.line])}>{t.line}</div>
                <div>
                  <div style={s.dest}>{t.dest}</div>
                  {t.delayed && <div style={s.delay}>Delayed</div>}
                </div>
              </div>
              <div style={s.eta}>
                <span style={s.etaVal}>{t.mins}</span>
                <span style={s.etaUnit}>MINS</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {trains.alerts.length > 0 && (
        <div style={s.alertBox}>
          <span style={s.label}>Service Alerts</span>
          {trains.alerts.map(a => (
            <div key={a.id} style={s.alertItem}>
              <div style={s.bullet(LINE_COLORS[a.line], 28)}>{a.line}</div>
              <div style={{ fontSize: '14px', lineHeight: '1.5', color: '#ccc' }}>{a.msg}</div>
            </div>
          ))}
        </div>
      )}

      <div style={s.footer}>
        <div style={{ color: '#22c55e', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', background: '#22c55e', borderRadius: '50%' }} /> Live Feed
        </div>
        <div>Updated: {lastUpdated ? lastUpdated.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'}) : '--'}</div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        body { margin: 0; padding: 0; background-color: #000; }
      `}</style>
    </div>
  );
};

export default App;
