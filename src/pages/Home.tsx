import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import ParkingGrid from '../components/ParkingGrid';
import Features from '../components/Features';
import Footer from '../components/Footer';
import { collection, getDocs, setDoc, doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Zap, Camera, Radio } from 'lucide-react';

export default function Home() {
  const [isSimulating, setIsSimulating] = useState(false);

  const simulateSensor = async (slotId: string, status: 'occupied' | 'available') => {
    try {
      await updateDoc(doc(db, 'slots', slotId), {
        status: status,
        finalStatus: status,
        ultrasonicStatus: status === 'occupied',
        cameraStatus: status === 'occupied',
        lastSensorUpdate: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `slots/${slotId}`);
    }
  };

  const triggerRandomSimulation = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'slots'));
      const slots = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      if (slots.length === 0) return;

      const randomSlot = slots[Math.floor(Math.random() * slots.length)];
      const newStatus = randomSlot.status === 'occupied' ? 'available' : 'occupied';
      
      await simulateSensor(randomSlot.id, newStatus);
    } catch (error) {
      console.error('Simulation error:', error);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSimulating) {
      interval = setInterval(() => {
        triggerRandomSimulation();
      }, 5000); // Every 5 seconds
    }
    return () => clearInterval(interval);
  }, [isSimulating]);

  useEffect(() => {
    // Seed initial slots if collection is empty
    const seedSlots = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'slots'));
        if (querySnapshot.size < 20) {
          const initialSlots = [
            // Floor 1 (Ground) - 12 Slots
            { slotNumber: 1, label: 'A-01', status: 'available', type: 'standard', pricePerHour: 50, floor: 1, coordinates: { lat: 12.9716, lng: 77.5946 } },
            { slotNumber: 2, label: 'A-02', status: 'available', type: 'ev', pricePerHour: 75, floor: 1, coordinates: { lat: 12.9717, lng: 77.5947 } },
            { slotNumber: 3, label: 'A-03', status: 'occupied', type: 'standard', pricePerHour: 50, floor: 1, coordinates: { lat: 12.9718, lng: 77.5948 } },
            { slotNumber: 4, label: 'A-04', status: 'available', type: 'standard', pricePerHour: 50, floor: 1, coordinates: { lat: 12.9719, lng: 77.5949 } },
            { slotNumber: 5, label: 'A-05', status: 'available', type: 'disabled', pricePerHour: 40, floor: 1, coordinates: { lat: 12.9720, lng: 77.5950 } },
            { slotNumber: 6, label: 'A-06', status: 'available', type: 'standard', pricePerHour: 50, floor: 1, coordinates: { lat: 12.9721, lng: 77.5951 } },
            { slotNumber: 14, label: 'A-07', status: 'available', type: 'standard', pricePerHour: 50, floor: 1, coordinates: { lat: 12.9722, lng: 77.5952 } },
            { slotNumber: 15, label: 'A-08', status: 'occupied', type: 'standard', pricePerHour: 50, floor: 1, coordinates: { lat: 12.9723, lng: 77.5953 } },
            { slotNumber: 16, label: 'A-09', status: 'available', type: 'ev', pricePerHour: 75, floor: 1, coordinates: { lat: 12.9724, lng: 77.5954 } },
            { slotNumber: 17, label: 'A-10', status: 'available', type: 'standard', pricePerHour: 50, floor: 1, coordinates: { lat: 12.9725, lng: 77.5955 } },
            { slotNumber: 18, label: 'A-11', status: 'available', type: 'standard', pricePerHour: 50, floor: 1, coordinates: { lat: 12.9726, lng: 77.5956 } },
            { slotNumber: 19, label: 'A-12', status: 'available', type: 'disabled', pricePerHour: 40, floor: 1, coordinates: { lat: 12.9727, lng: 77.5957 } },

            // Floor 2 - 12 Slots
            { slotNumber: 7, label: 'B-01', status: 'available', type: 'standard', pricePerHour: 60, floor: 2, coordinates: { lat: 12.9722, lng: 77.5952 } },
            { slotNumber: 8, label: 'B-02', status: 'available', type: 'standard', pricePerHour: 60, floor: 2, coordinates: { lat: 12.9723, lng: 77.5953 } },
            { slotNumber: 9, label: 'B-03', status: 'available', type: 'ev', pricePerHour: 85, floor: 2, coordinates: { lat: 12.9724, lng: 77.5954 } },
            { slotNumber: 10, label: 'B-04', status: 'available', type: 'standard', pricePerHour: 60, floor: 2, coordinates: { lat: 12.9725, lng: 77.5955 } },
            { slotNumber: 20, label: 'B-05', status: 'available', type: 'standard', pricePerHour: 60, floor: 2, coordinates: { lat: 12.9726, lng: 77.5956 } },
            { slotNumber: 21, label: 'B-06', status: 'occupied', type: 'standard', pricePerHour: 60, floor: 2, coordinates: { lat: 12.9727, lng: 77.5957 } },
            { slotNumber: 22, label: 'B-07', status: 'available', type: 'standard', pricePerHour: 60, floor: 2, coordinates: { lat: 12.9728, lng: 77.5958 } },
            { slotNumber: 23, label: 'B-08', status: 'available', type: 'ev', pricePerHour: 85, floor: 2, coordinates: { lat: 12.9729, lng: 77.5959 } },
            { slotNumber: 24, label: 'B-09', status: 'available', type: 'standard', pricePerHour: 60, floor: 2, coordinates: { lat: 12.9730, lng: 77.5960 } },
            { slotNumber: 25, label: 'B-10', status: 'available', type: 'standard', pricePerHour: 60, floor: 2, coordinates: { lat: 12.9731, lng: 77.5961 } },
            { slotNumber: 26, label: 'B-11', status: 'available', type: 'standard', pricePerHour: 60, floor: 2, coordinates: { lat: 12.9732, lng: 77.5962 } },
            { slotNumber: 27, label: 'B-12', status: 'available', type: 'standard', pricePerHour: 60, floor: 2, coordinates: { lat: 12.9733, lng: 77.5963 } },

            // Floor 3 - 12 Slots
            { slotNumber: 11, label: 'C-01', status: 'available', type: 'standard', pricePerHour: 100, floor: 3, coordinates: { lat: 12.9726, lng: 77.5956 } },
            { slotNumber: 12, label: 'C-02', status: 'available', type: 'standard', pricePerHour: 100, floor: 3, coordinates: { lat: 12.9727, lng: 77.5957 } },
            { slotNumber: 13, label: 'C-03', status: 'available', type: 'standard', pricePerHour: 100, floor: 3, coordinates: { lat: 12.9728, lng: 77.5958 } },
            { slotNumber: 28, label: 'C-04', status: 'available', type: 'ev', pricePerHour: 125, floor: 3, coordinates: { lat: 12.9729, lng: 77.5959 } },
            { slotNumber: 29, label: 'C-05', status: 'available', type: 'standard', pricePerHour: 100, floor: 3, coordinates: { lat: 12.9730, lng: 77.5960 } },
            { slotNumber: 30, label: 'C-06', status: 'occupied', type: 'standard', pricePerHour: 100, floor: 3, coordinates: { lat: 12.9731, lng: 77.5961 } },
            { slotNumber: 31, label: 'C-07', status: 'available', type: 'standard', pricePerHour: 100, floor: 3, coordinates: { lat: 12.9732, lng: 77.5962 } },
            { slotNumber: 32, label: 'C-08', status: 'available', type: 'standard', pricePerHour: 100, floor: 3, coordinates: { lat: 12.9733, lng: 77.5963 } },
            { slotNumber: 33, label: 'C-09', status: 'available', type: 'standard', pricePerHour: 100, floor: 3, coordinates: { lat: 12.9734, lng: 77.5964 } },
            { slotNumber: 34, label: 'C-10', status: 'available', type: 'ev', pricePerHour: 125, floor: 3, coordinates: { lat: 12.9735, lng: 77.5965 } },
            { slotNumber: 35, label: 'C-11', status: 'available', type: 'standard', pricePerHour: 100, floor: 3, coordinates: { lat: 12.9736, lng: 77.5966 } },
            { slotNumber: 36, label: 'C-12', status: 'available', type: 'standard', pricePerHour: 100, floor: 3, coordinates: { lat: 12.9737, lng: 77.5967 } },
          ];
          
          for (const slot of initialSlots) {
            await setDoc(doc(db, 'slots', `S${slot.slotNumber}`), slot);
          }
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'slots');
      }
    };
    seedSlots();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <Hero />
        
        {/* Simulation Control (Developer View) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
           <div className="bg-gray-900 text-white p-6 rounded-[2rem] shadow-2xl flex flex-wrap items-center justify-between gap-6 overflow-hidden">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center">
                  <Radio className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                   <h4 className="font-bold">Dual-Sensor Hub</h4>
                   <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Live IoT Simulation</p>
                </div>
             </div>
             
             <div className="flex items-center gap-4">
                <button 
                  onClick={() => simulateSensor('S1', 'occupied')}
                  className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/10 transition-all flex items-center gap-2"
                >
                  <Zap className="w-3 h-3 text-warning" /> Trigger S1 Ultrasonic
                </button>
                <button 
                  onClick={() => simulateSensor('S3', 'available')}
                  className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/10 transition-all flex items-center gap-2"
                >
                  <Camera className="w-3 h-3 text-primary" /> AI Vision Clear S3
                </button>
                <button 
                  onClick={() => setIsSimulating(!isSimulating)}
                  className={`px-6 py-3 border rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    isSimulating 
                    ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/20' 
                    : 'bg-white/10 border-white/20 hover:bg-white/20'
                  }`}
                >
                  <div className={`w-3 h-3 rounded-full ${isSimulating ? 'bg-white animate-ping' : 'bg-gray-500'}`} />
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase opacity-60">Background Hub</p>
                    <p className="tracking-widest">{isSimulating ? 'SIMULATION ACTIVE' : 'RANDOM ARRIVAL INIT'}</p>
                  </div>
                </button>
             </div>
           </div>
        </div>

        <Features />
        <ParkingGrid />
      </main>
      <Footer />
    </div>
  );
}
