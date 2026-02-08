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
        .subway-app {
          min-height: 100vh;
          background-color: #000;
          color: #e5e5e5;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
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
          padding: 4px;
          border-radius: 4px;
          color: #000;
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
          margin-bottom: 8px;
          display: block;
        }
        .select-wrapper {
          position: relative;
        }
        select {
          width: 100%;
          background: #111;
          border: 1px solid #222;
          color: #fff;
          padding: 16px;
          border-radius: 12px;
          font-size: 18px;
          font-weight: bold;
          appearance: none;
          cursor: pointer;
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
          border-bottom: 1px solid #222;
          padding-bottom: 10px;
          margin-bottom: 15px;
          color: #fff;
        }
        .train-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #111;
          margin-bottom: 12px;
          padding: 12px 16px;
          border-radius: 0 8px 8px 0;
          border-left: 5px solid #888;
        }
        .bullet {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          color: #fff;
          font-size: 18px;
        }
        .train-info { display: flex; align-items: center; gap: 15px; }
        .dest { font-weight: 600; color: #fff; }
        .delay-tag { color: #f97316; font-size: 10px; font-weight: bold; text-transform: uppercase; }
        .eta { text-align: right; }
        .eta-val { font-size: 24px; font-weight: 900; color: #fff; }
        .eta-unit { font-size: 10px; color: #666; font-weight: bold; margin-left: 4px; }
        .alert-box {
          margin-top: 40px;
          max-width: 900px;
          margin-left: auto;
          margin-right: auto;
        }
        .alert-item {
          background: rgba(249, 115, 22, 0.1);
          border: 1px solid rgba(249, 115, 22, 0.2);
          padding: 15px;
          border-radius: 12px;
          display: flex;
          gap: 15px;
        }
        .footer {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(0,0,0,0.8);
          backdrop-filter: blur(10px);
          padding: 12px;
          border-top: 1px solid #111;
          font-size: 10px;
          font-weight: bold;
          color: #444;
          text-transform: uppercase;
          display: flex;
          justify-content: space-around;
        }
        .live-indicator { display: flex; align-items: center; gap: 6px; color: #22c55e; }
        .dot { width: 6px; height: 6px; background: #22c55e; border-radius: 50%; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      <div className="header">
        <div className="logo-box">
          <div className="mta-icon"><Train size={20} /></div>
          <div className="logo-text">SubwayPulse</div>
        </div>
        <RefreshCw 
          size={20} 
          className={loading ? 'spin' : ''} 
          onClick={fetchRealtimeData}
          style={{ cursor: 'pointer', color: '#666' }}
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
          <div className="col-header"><ArrowUpCircle size={18}/> Uptown</div>
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
                <span className="eta-unit">MIN</span>
              </div>
            </div>
          ))}
        </div>

        <div className="column">
          <div className="col-header"><ArrowDownCircle size={18}/> Downtown</div>
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
                <span className="eta-unit">MIN</span>
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
              <div className="bullet" style={{ backgroundColor: LINE_COLORS[a.line], width: 24, height: 24, fontSize: 12 }}>{a.line}</div>
              <div style={{ fontSize: 13, lineHeight: 1.4 }}>{a.msg}</div>
            </div>
          ))}
        </div>
      )}

      <div className="footer">
        <div className="live-indicator"><div className="dot" /> Live System Feed</div>
        <div>Updated: {lastUpdated ? lastUpdated.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--'}</div>
      </div>
    </div>
  );
};

export default App;
