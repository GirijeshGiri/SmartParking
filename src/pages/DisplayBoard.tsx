import { motion } from 'motion/react';
import { Car, MapPin, ArrowUp, RefreshCcw, Layers } from 'lucide-react';
import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function DisplayBoard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState<any[]>([]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    // Subscribe to all slots to calculate real-time stats per floor
    const unsubscribe = onSnapshot(collection(db, 'slots'), (snapshot) => {
      const allSlots = snapshot.docs.map(doc => doc.data());
      
      const floorStats = [1, 2, 3].map(floorNum => {
        const floorSlots = allSlots.filter(s => s.floor === floorNum);
        const total = floorSlots.length || 60; // Fallback to 60 if empty
        const available = floorSlots.filter(s => s.status === 'available').length;
        return {
          name: floorNum === 1 ? 'GROUND FLOOR' : `FLOOR 0${floorNum}`,
          total,
          available,
          status: available === 0 ? 'FULL' : 'OPEN',
          floor: floorNum
        };
      });
      
      setStats(floorStats);
    });

    return () => {
      clearInterval(timer);
      unsubscribe();
    };
  }, []);

  const FLOORS = stats.length > 0 ? stats : [
    { name: 'LOADING...', total: 60, available: 0, status: 'SYNCING' }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans p-10 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-16 px-6">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-4 rounded-[1.5rem] shadow-2xl shadow-blue-500/20">
            <Car className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter">SmartParkAI</h1>
            <div className="flex items-center gap-2 text-blue-500 font-bold tracking-widest text-sm">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></div>
              ENTRANCE DISPLAY SYSTEM
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-5xl font-black tracking-tighter tabular-nums mb-1">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
          </div>
          <div className="text-gray-500 font-bold uppercase tracking-widest text-xs">
            {currentTime.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-10 flex-1">
        {/* Main Stats */}
        <div className="lg:col-span-2 space-y-8">
          {FLOORS.map((floor, idx) => (
            <motion.div 
              key={idx}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-gray-800/50 border-2 border-white/5 p-8 rounded-[2.5rem] flex items-center justify-between group hover:border-blue-500/30 transition-all"
            >
              <div className="flex items-center gap-6">
                <div className={`p-4 rounded-2xl ${floor.status === 'FULL' ? 'bg-rose-500/10 text-rose-500' : 'bg-blue-500/10 text-blue-500'}`}>
                  <Layers className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-3xl font-black tracking-tight">{floor.name}</h3>
                  <div className="text-sm font-bold text-gray-400">Total Capacity: {floor.total} Slots</div>
                </div>
              </div>

              <div className="flex items-center gap-10">
                <div className="text-right">
                  <div className={`text-6xl font-black tabular-nums ${floor.available === 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {floor.available < 10 ? `0${floor.available}` : floor.available}
                  </div>
                  <div className="text-xs font-black uppercase text-gray-500 tracking-widest">Available</div>
                </div>
                
                <div className={`w-36 py-4 rounded-2xl font-black text-center text-xl tracking-wider border-4 ${floor.status === 'FULL' ? 'border-rose-500/20 text-rose-500' : 'border-emerald-500/20 text-emerald-500'}`}>
                  {floor.status}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Sidebar Alerts/Info */}
        <div className="space-y-8">
          <div className="bg-blue-600 rounded-[2.5rem] p-8 relative overflow-hidden shadow-2xl shadow-blue-600/20 h-full max-h-[300px]">
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <MapPin className="w-10 h-10 mb-4" />
                <h3 className="text-3xl font-black leading-tight mb-2">Park Anywhere <br />in Seconds.</h3>
              </div>
              <p className="text-blue-100 font-medium">Use our mobile app to reserve a slot before arrival.</p>
            </div>
            {/* Background Icon */}
            <Car className="absolute -bottom-10 -right-10 w-48 h-48 text-white/10 rotate-12" />
          </div>

          <div className="bg-gray-800 border-2 border-emerald-500/30 rounded-[2.5rem] p-8 flex-1">
             <div className="flex items-center gap-4 mb-8">
               <div className="bg-emerald-500/10 p-3 rounded-xl text-emerald-500">
                 <RefreshCcw className="w-6 h-6 animate-spin" />
               </div>
               <h4 className="text-xl font-bold">Real-time Traffic</h4>
             </div>
             
             <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                   <div className="flex items-center gap-3">
                     <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                     <span className="font-bold text-sm">North Gate</span>
                   </div>
                   <span className="text-xs font-black text-gray-500">LOW TRAFFIC</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                   <div className="flex items-center gap-3">
                     <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                     <span className="font-bold text-sm">South Exit</span>
                   </div>
                   <span className="text-xs font-black text-gray-500">MODERATE</span>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Footer / Scrolling Ticker */}
      <div className="mt-16 bg-white/5 py-4 rounded-2xl px-10 flex items-center justify-between text-sm font-bold text-gray-400">
        <div className="flex items-center gap-4">
          <ArrowUp className="text-emerald-500 w-4 h-4" />
          SYSTEM OPTIMAL: Sensors & AI Vision cross-verified
        </div>
        <div className="flex items-center gap-8">
          <span>TEMPERATURE: 28°C</span>
          <span>HUMIDITY: 45%</span>
          <span className="text-blue-500">smartpark.ai/nav</span>
        </div>
      </div>
    </div>
  );
}
