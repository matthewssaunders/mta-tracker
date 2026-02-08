import React, { useState, useEffect } from 'react';
import { 
  Train, MapPin, Clock, AlertTriangle, 
  ArrowUpCircle, ArrowDownCircle, RefreshCw 
} from 'lucide-react';

// Official MTA Subway Colors
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

  // Simulation of real-time data for the demo
  // In production, fetch from your Cloudflare Worker URL
  const fetchRealtimeData = async () => {
    setLoading(true);
    // Mimic API delay
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

  const TrainRow = ({ train }) => (
    <div className="flex items-center justify-between p-4 mb-3 bg-zinc-900/50 border-l-4 rounded-r-lg"
         style={{ borderLeftColor: LINE_COLORS[train.line] || '#808183' }}>
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-xl shadow-inner"
             style={{ backgroundColor: LINE_COLORS[train.line] || '#808183' }}>
          {train.line}
        </div>
        <div>
          <div className="text-zinc-100 font-semibold">{train.dest}</div>
          {train.delayed && <div className="text-[10px] text-orange-500 font-bold uppercase tracking-widest">Delayed</div>}
        </div>
      </div>
      <div className="text-right">
        <span className="text-2xl font-black text-white">{train.mins}</span>
        <span className="text-[10px] text-zinc-500 ml-1 font-bold">MIN</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-zinc-300 font-sans p-4 pb-20">
      {/* Header */}
      <div className="max-w-4xl mx-auto flex items-center justify-between mb-8 pt-4">
        <div className="flex items-center gap-2">
          <div className="bg-white p-1 rounded">
            <Train className="text-black" size={24} />
          </div>
          <h1 className="text-2xl font-black italic tracking-tighter text-white uppercase">SubwayPulse</h1>
        </div>
        <button onClick={fetchRealtimeData} className={`${loading ? 'animate-spin' : ''} text-zinc-500`}>
          <RefreshCw size={20} />
        </button>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Station Picker */}
        <div className="mb-8">
          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-2 block">Track Station</label>
          <select 
            className="w-full bg-zinc-900 border border-zinc-800 text-white p-4 rounded-xl text-lg font-bold outline-none focus:ring-2 focus:ring-white/20 transition-all appearance-none"
            value={selectedStop.id}
            onChange={(e) => setSelectedStop(STATIONS.find(s => s.id === e.target.value))}
          >
            {STATIONS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {/* Live Boards - Stacks in portrait, side-by-side in landscape */}
        <div className="flex flex-col md:flex-row gap-8 mb-12">
          {/* Uptown Section */}
          <div className="flex-1">
            <h2 className="flex items-center gap-2 text-white font-black uppercase italic mb-4 border-b border-zinc-800 pb-2">
              <ArrowUpCircle size={18} className="text-zinc-500" /> Uptown
            </h2>
            {trains.uptown.map(t => <TrainRow key={t.id} train={t} />)}
          </div>

          {/* Downtown Section */}
          <div className="flex-1">
            <h2 className="flex items-center gap-2 text-white font-black uppercase italic mb-4 border-b border-zinc-800 pb-2">
              <ArrowDownCircle size={18} className="text-zinc-500" /> Downtown
            </h2>
            {trains.downtown.map(t => <TrainRow key={t.id} train={t} />)}
          </div>
        </div>

        {/* Alerts Section - Always below boards */}
        {trains.alerts.length > 0 && (
          <div className="mt-8">
            <h2 className="flex items-center gap-2 text-orange-500 font-black uppercase italic mb-4">
              <AlertTriangle size={18} /> Service Alerts
            </h2>
            {trains.alerts.map(alert => (
              <div key={alert.id} className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-xl flex gap-4 mb-4">
                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-white text-sm"
                     style={{ backgroundColor: LINE_COLORS[alert.line] }}>
                  {alert.line}
                </div>
                <p className="text-sm text-zinc-100 leading-relaxed">{alert.msg}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Meta */}
      <footer className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-lg border-t border-zinc-900 p-3">
        <div className="max-w-4xl mx-auto flex justify-between items-center text-[10px] font-bold text-zinc-600 uppercase">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Live Feed: trains.matthewssaunders.com
          </div>
          <div>Updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : '--'}</div>
        </div>
      </footer>
    </div>
  );
};

export default App;
