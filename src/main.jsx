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
  { id: '120', name: '96 St', lines: ['1', '2', '3'] },
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
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  // Inject Global Styles once to handle background and font issues
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const style = document.createElement('style');
      style.textContent = `
        body, html, #root { 
          background-color: #000 !important; 
          margin: 0; 
          padding: 0; 
          color: #fff;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        @keyframes spin { 
          from { transform: rotate(0deg); } 
          to { transform: rotate(360deg); } 
        }
      `;
      document.head.appendChild(style);
    }

    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchRealtimeData = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    
    const lines = selectedStop.lines;
    const mockTrains = (dir) => Array.from({ length: 5 }, (_, i) => ({
      id: `${dir}-${i}-${Math.random()}`,
      line: lines[Math.floor(Math.random() * lines.length)],
      dest: dir === 'N' ? 'Uptown / Bronx' : 'Downtown / Brooklyn',
      mins: (i * 4) + Math.floor(Math.random() * 5) + 2,
      delayed: Math.random() > 0.8
    })).sort((a, b) => a.mins - b.mins);

    setTrains({
      uptown: mockTrains('N'),
      downtown: mockTrains('S'),
      alerts: [
        { id: 1, line: selectedStop.lines[0], msg: `Good Service reported on the ${selectedStop.lines.join('/')} lines.` }
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

  // Styles defined as constants to avoid build-time CSS issues
  const styles = {
    wrapper: {
      padding: '20px',
      maxWidth: '1000px',
      margin: '0 auto',
      backgroundColor: '#000',
      minHeight: '100vh',
      boxSizing: 'border-box'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '30px'
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    logoIcon: {
      backgroundColor: '#fff',
      color: '#000',
      padding: '6px',
      borderRadius: '6px'
    },
    logoText: {
      fontSize: '24px',
      fontWeight: '900',
      textTransform: 'uppercase',
      fontStyle: 'italic',
      letterSpacing: '-1px'
    },
    pickerSection: {
      marginBottom: '40px'
    },
    label: {
      fontSize: '10px',
      fontWeight: 'bold',
      color: '#666',
      textTransform: 'uppercase',
      letterSpacing: '2px',
      marginBottom: '10px',
      display: 'block'
    },
    select: {
      width: '100%',
      backgroundColor: '#111',
      border: '1px solid #333',
      color: '#fff',
      padding: '16px',
      borderRadius: '12px',
      fontSize: '18px',
      fontWeight: 'bold',
      outline: 'none',
      appearance: 'none',
      cursor: 'pointer'
    },
    boardGrid: {
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      gap: '30px'
    },
    column: {
      flex: 1
    },
    columnHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '18px',
      fontWeight: '900',
      textTransform: 'uppercase',
      fontStyle: 'italic',
      borderBottom: '2px solid #222',
      paddingBottom: '12px',
      marginBottom: '20px'
    },
    card: (color) => ({
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: '#111',
      marginBottom: '14px',
      padding: '14px 18px',
      borderRadius: '0 10px 10px 0',
      borderLeft: `6px solid ${color}`,
      boxShadow: '0 4px 6px rgba(0,0,0,0.4)'
    }),
    bullet: (color, size = 40) => ({
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '50%',
      backgroundColor: color,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: '900',
      color: '#fff',
      fontSize: size === 40 ? '20px' : '14px',
      flexShrink: 0
    }),
    cardInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '15px'
    },
    destination: {
      fontWeight: '700',
      fontSize: '16px'
    },
    eta: {
      textAlign: 'right'
    },
    etaValue: {
      fontSize: '28px',
      fontWeight: '900',
      lineHeight: 1
    },
    etaUnit: {
      fontSize: '10px',
      color: '#666',
      fontWeight: 'bold',
      display: 'block'
    },
    alertBox: {
      marginTop: '50px'
    },
    alertItem: {
      backgroundColor: 'rgba(249, 115, 22, 0.08)',
      border: '1px solid rgba(249, 115, 22, 0.2)',
      padding: '18px',
      borderRadius: '14px',
      display: 'flex',
      gap: '15px',
      marginBottom: '15px'
    },
    footer: {
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0,0,0,0.95)',
      padding: '15px',
      borderTop: '1px solid #111',
      display: 'flex',
      justifyContent: 'space-around',
      fontSize: '10px',
      fontWeight: '900',
      textTransform: 'uppercase',
      color: '#555'
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}><Train size={24} /></div>
          <div style={styles.logoText}>SubwayPulse</div>
        </div>
        <RefreshCw 
          size={22} 
          style={{ 
            cursor: 'pointer', 
            color: '#888', 
            animation: loading ? 'spin 1s linear infinite' : 'none' 
          }} 
          onClick={fetchRealtimeData}
        />
      </div>

      <div style={styles.pickerSection}>
        <span style={styles.label}>Station Monitor</span>
        <select 
          style={styles.select}
          value={selectedStop.id}
          onChange={(e) => setSelectedStop(STATIONS.find(s => s.id === e.target.value))}
        >
          {STATIONS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div style={styles.boardGrid}>
        <div style={styles.column}>
          <div style={styles.columnHeader}><ArrowUpCircle size={20}/> Uptown</div>
          {trains.uptown.map(t => (
            <div key={t.id} style={styles.card(LINE_COLORS[t.line])}>
              <div style={styles.cardInfo}>
                <div style={styles.bullet(LINE_COLORS[t.line])}>{t.line}</div>
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
          ))}
        </div>

        <div style={styles.column}>
          <div style={styles.columnHeader}><ArrowDownCircle size={20}/> Downtown</div>
          {trains.downtown.map(t => (
            <div key={t.id} style={styles.card(LINE_COLORS[t.line])}>
              <div style={styles.cardInfo}>
                <div style={styles.bullet(LINE_COLORS[t.line])}>{t.line}</div>
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
          ))}
        </div>
      </div>

      {trains.alerts.length > 0 && (
        <div style={styles.alertBox}>
          <span style={{ ...styles.label, color: '#f97316', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '15px', display: 'block' }}>
            Service Alerts
          </span>
          {trains.alerts.map(a => (
            <div key={a.id} style={styles.alertItem}>
              <div style={styles.bullet(LINE_COLORS[a.line], 28)}>{a.line}</div>
              <div style={{ fontSize: '14px', lineHeight: '1.5', color: '#ccc' }}>{a.msg}</div>
            </div>
          ))}
        </div>
      )}

      <div style={styles.footer}>
        <div style={{ color: '#22c55e', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', backgroundColor: '#22c55e', borderRadius: '50%', boxShadow: '0 0 8px #22c55e' }} /> Live Feed
        </div>
        <div>Updated: {lastUpdated ? lastUpdated.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'}) : '--'}</div>
      </div>
    </div>
  );
};

export default App;
