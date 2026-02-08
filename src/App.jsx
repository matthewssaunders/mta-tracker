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

  return (
    <div className="subway-app">
      <style>{`
        /* Global Reset to force styles */
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        html, body {
          background-color: #000 !important;
          color: #e5e5e5 !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
        }
        .subway-app {
          min-height: 100vh;
          background-color: #000;
          padding: 20px;
          padding-bottom: 80px;
        }
        .header {
          max-width: 900px;
          margin: 0 auto 30px auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .logo-box {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .mta-icon {
          background: #fff;
          padding: 6px;
          border-radius: 6px;
          color: #000;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .logo-text {
          font-size: 24px;
          font-weight: 900;
          font-style: italic;
          text-transform: uppercase;
          letter-spacing: -1px;
          color: #fff;
        }
        .station-picker {
          max-width: 900px;
          margin: 0 auto 40px auto;
        }
        .label {
          font-size: 10px;
          font-weight: bold;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 2px;
          margin-bottom: 10px;
          display: block;
        }
        .select-wrapper {
          position: relative;
        }
        select {
          width: 100%;
          background: #111;
          border: 1px solid #333;
          color: #fff;
          padding: 18px;
          border-radius: 14px;
          font-size: 18px;
          font-weight: bold;
          appearance: none;
          cursor: pointer;
          transition: border-color 0.2s;
        }
        select:focus {
          border-color: #555;
          outline: none;
        }
        .board-container {
          max-width: 900px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 30px;
        }
        @media (min-width: 768px) {
          .board-container { flex-direction: row; }
        }
        .column { flex: 1; }
        .col-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 900;
          text-transform: uppercase;
          font-style: italic;
          border-bottom: 2px solid #222;
          padding-bottom: 12px;
          margin-bottom: 20px;
          color: #fff;
          font-size: 18px;
        }
        .train-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #111;
          margin-bottom: 14px;
          padding: 14px 18px;
          border-radius: 0 10px 10px 0;
          border-left: 6px solid #888;
          box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        }
        .bullet {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          color: #fff;
          font-size: 20px;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
        }
        .train-info { display: flex; align-items: center; gap: 15px; }
        .dest { font-weight: 700; color: #fff; font-size: 16px; }
        .delay-tag { color: #f97316; font-size: 11px; font-weight: 800; text-transform: uppercase; margin-top: 2px; }
        .eta { text-align: right; }
        .eta-val { font-size: 28px; font-weight: 900; color: #fff; line-height: 1; }
        .eta-unit { font-size: 10px; color: #666; font-weight: bold; display: block; margin-top: 2px; }
        .alert-box {
          margin-top: 50px;
          max-width: 900px;
          margin-left: auto;
          margin-right: auto;
        }
        .alert-item {
          background: rgba(249, 115, 22, 0.08);
          border: 1px solid rgba(249, 115, 22, 0.2);
          padding: 18px;
          border-radius: 14px;
          display: flex;
          gap: 15px;
          align-items: flex-start;
          margin-bottom: 15px;
        }
        .footer {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(0,0,0,0.9);
          backdrop-filter: blur(15px);
          padding: 15px;
          border-top: 1px solid #111;
          font-size: 10px;
          font-weight: 800;
          color: #555;
          text-transform: uppercase;
          display: flex;
          justify-content: space-around;
          letter-spacing: 1px;
        }
        .live-indicator { display: flex; align-items: center; gap: 8px; color: #22c55e; }
        .dot { width: 8px; height: 8px; background: #22c55e; border-radius: 50%; box-shadow: 0 0 8px #22c55e; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      <div className="header">
        <div className="logo-box">
          <div className="mta-icon"><Train size={24} /></div>
          <div className="logo-text">SubwayPulse</div>
        </div>
        <RefreshCw 
          size={22} 
          className={loading ? 'spin' : ''} 
          onClick={fetchRealtimeData}
          style={{ cursor: 'pointer', color: '#888' }}
        />
      </div>

      <div className="station-picker">
        <span className="label">Station Monitor</span>
        <div className="select-wrapper">
          <select 
            value={selectedStop.id}
            onChange={(e) => setSelectedStop(STATIONS.find(s => s.id === e.target.value))}
          >
            {STATIONS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>

      <div className="board-container">
        <div className="column">
          <div className="col-header"><ArrowUpCircle size={20}/> Uptown</div>
          {trains.uptown.map(t => (
            <div key={t.id} className="train-card" style={{ borderLeftColor: LINE_COLORS[t.line] }}>
              <div className="train-info">
                <div className="bullet" style={{ backgroundColor: LINE_COLORS[t.line] }}>{t.line}</div>
                <div>
                  <div className="dest">{t.dest}</div>
                  {t.delayed && <div className="delay-tag">Delayed</div>}
                </div>
              </div>
              <div className="eta">
                <span className="eta-val">{t.mins}</span>
                <span className="eta-unit">MINS</span>
              </div>
            </div>
          ))}
        </div>

        <div className="column">
          <div className="col-header"><ArrowDownCircle size={20}/> Downtown</div>
          {trains.downtown.map(t => (
            <div key={t.id} className="train-card" style={{ borderLeftColor: LINE_COLORS[t.line] }}>
              <div className="train-info">
                <div className="bullet" style={{ backgroundColor: LINE_COLORS[t.line] }}>{t.line}</div>
                <div>
                  <div className="dest">{t.dest}</div>
                  {t.delayed && <div className="delay-tag">Delayed</div>}
                </div>
              </div>
              <div className="eta">
                <span className="eta-val">{t.mins}</span>
                <span className="eta-unit">MINS</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {trains.alerts.length > 0 && (
        <div className="alert-box">
          <span className="label" style={{ color: '#f97316' }}>Service Alerts</span>
          {trains.alerts.map(a => (
            <div key={a.id} className="alert-item">
              <div className="bullet" style={{ backgroundColor: LINE_COLORS[a.line], width: 28, height: 28, fontSize: 14, flexShrink: 0 }}>{a.line}</div>
              <div style={{ fontSize: 14, lineHeight: 1.5, color: '#ccc' }}>{a.msg}</div>
            </div>
          ))}
        </div>
      )}

      <div className="footer">
        <div className="live-indicator"><div className="dot" /> Live Feed</div>
        <div>Updated: {lastUpdated ? lastUpdated.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'}) : '--'}</div>
      </div>
    </div>
  );
};

export default App;
