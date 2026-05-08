import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ParkingSlot } from '../types';
import { Car, Zap, Accessibility, Info, RefreshCw, ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import BookingModal from './BookingModal';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

export default function ParkingGrid() {
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null);
  const [filter, setFilter] = useState<'all' | 'available' | 'ev'>('all');
  const [selectedFloor, setSelectedFloor] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  useEffect(() => {
    const q = query(collection(db, 'slots'), orderBy('slotNumber', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const slotsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ParkingSlot[];
      
      if (slotsData.length > 0) {
        setSlots(slotsData);
        setLastUpdated(new Date());
        setIsLoading(false);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'slots');
    });

    return () => unsubscribe();
  }, []);

  const filteredSlots = slots.filter(slot => {
    const matchesFloor = slot.floor === selectedFloor;
    const matchesType = filter === 'all' ? true : 
                       filter === 'available' ? slot.status === 'available' :
                       filter === 'ev' ? slot.type === 'ev' : true;
    return matchesFloor && matchesType;
  });

  const getSlotIcon = (type: ParkingSlot['type']) => {
    switch (type) {
      case 'ev': return <Zap className="w-4 h-4" />;
      case 'disabled': return <Accessibility className="w-4 h-4" />;
      default: return <Car className="w-4 h-4" />;
    }
  };

  const getStatusStyles = (status: ParkingSlot['status']) => {
    switch (status) {
      case 'available': return 'bg-white border-success/30 text-success hover:bg-success hover:text-white';
      case 'occupied': return 'bg-alert text-white border-alert cursor-not-allowed';
      case 'reserved': return 'bg-warning text-white border-warning cursor-not-allowed';
      default: return '';
    }
  };

  return (
    <section id="dashboard" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Live Parking Status</h2>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <p>Real-time occupancy data from dual-sensor verification.</p>
              <span className="w-1 h-1 rounded-full bg-gray-300"></span>
              <div className="flex items-center gap-1.5 min-w-[140px]">
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                Updated {lastUpdated.toLocaleTimeString()}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="w-4 h-4 text-gray-400" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Select Parking Level</span>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setSelectedFloor(prev => Math.max(1, prev - 1))}
                disabled={selectedFloor === 1}
                className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-blue-600 hover:border-blue-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-gray-200 text-sm font-semibold">
                {[1, 2, 3].map(floor => (
                  <button 
                    key={floor}
                    onClick={() => setSelectedFloor(floor)}
                    className={`px-6 py-2.5 rounded-xl transition-all relative ${selectedFloor === floor ? 'text-white' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    {selectedFloor === floor && (
                      <motion.div 
                        layoutId="activeFloor"
                        className="absolute inset-0 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <span className="relative z-10">L{floor}</span>
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setSelectedFloor(prev => Math.min(3, prev + 1))}
                disabled={selectedFloor === 3}
                className="w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-blue-600 hover:border-blue-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200 text-sm font-semibold">
            <button 
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition-all ${filter === 'all' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-900'}`}
            >
              All Slots
            </button>
            <button 
              onClick={() => setFilter('available')}
              className={`px-4 py-2 rounded-lg transition-all ${filter === 'available' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-900'}`}
            >
              Available
            </button>
            <button 
              onClick={() => setFilter('ev')}
              className={`px-4 py-2 rounded-lg transition-all ${filter === 'ev' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-900'}`}
            >
              EV Charging
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredSlots.map((slot) => (
              <motion.button
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                key={slot.id}
                disabled={slot.status !== 'available'}
                onClick={() => setSelectedSlot(slot)}
                className={`flex flex-col p-4 rounded-2xl border-2 transition-all text-left relative group ${getStatusStyles(slot.status)}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-white/50 rounded-lg backdrop-blur-sm">
                    {getSlotIcon(slot.type)}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                    {slot.id}
                  </span>
                </div>
                
                <div className="font-bold text-lg mb-1">{slot.label}</div>
                <div className="text-xs font-medium uppercase tracking-wider opacity-80 mb-3">
                  {slot.status}
                </div>

                {/* Dual Sensor Feedback */}
                <div className="flex gap-1.5 mb-4 p-1.5 bg-black/5 rounded-lg w-fit group-hover:bg-white/20 transition-colors">
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-2 h-2 rounded-full transition-all duration-500 ${slot.ultrasonicStatus ? 'bg-success shadow-sm shadow-success/50' : 'bg-gray-300'}`} />
                    <span className="text-[8px] font-black uppercase opacity-60">US</span>
                  </div>
                  <div className="w-[1px] bg-black/10 self-stretch" />
                  <div className="flex flex-col items-center gap-1">
                    <div className={`w-2 h-2 rounded-full transition-all duration-500 ${slot.cameraStatus ? 'bg-primary shadow-sm shadow-primary/50' : 'bg-gray-300'}`} />
                    <span className="text-[8px] font-black uppercase opacity-60">AI</span>
                  </div>
                </div>
                
                <div className="mt-auto pt-2 border-t border-current/10 flex items-center justify-between text-xs font-bold">
                  <span>₹{slot.pricePerHour}/hr</span>
                  {slot.type === 'ev' && <Zap className="w-3 h-3 text-blue-600 fill-current" />}
                </div>

                {slot.status === 'available' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-emerald-600/0 group-hover:bg-emerald-600/10 transition-all rounded-2xl pointer-events-none">
                    <div className="px-4 py-2 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all">
                      Book Now
                    </div>
                  </div>
                )}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>

        <div className="mt-12 p-6 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-8">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Info className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Dual-Verification System</h4>
              <p className="text-sm text-gray-500">Each slot is monitored by an ultrasonic sensor and cross-verified by AI camera vision for 99.9% accuracy.</p>
            </div>
          </div>
          <div className="flex gap-4 text-sm font-bold">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500"></div>
              <span>Occupied</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <span>Reserved</span>
            </div>
          </div>
        </div>
      </div>

      <BookingModal 
        slot={selectedSlot} 
        onClose={() => setSelectedSlot(null)} 
      />
    </section>
  );
}
