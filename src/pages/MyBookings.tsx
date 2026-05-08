import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, where, getDocs, orderBy, doc, updateDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Navbar from '../components/Navbar';
import { Calendar, Clock, Car, Tag, ChevronRight, AlertCircle, CheckCircle2, XCircle, MapPin, QrCode, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface Booking {
  id: string;
  slotId: string;
  slotLabel: string;
  price: number;
  hours: number;
  vehicleNumber: string;
  timestamp: string;
  status: 'active' | 'cancelled' | 'completed';
  userId: string;
}

export default function MyBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedQR, setSelectedQR] = useState<Booking | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        fetchBookings(u.uid);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchBookings = async (uid: string) => {
    try {
      const q = query(
        collection(db, 'bookings'),
        where('userId', '==', uid),
        orderBy('timestamp', 'desc')
      );
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      setBookings(docs);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (booking: Booking) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;

    try {
      // Update booking status
      const bookingRef = doc(db, 'bookings', booking.id);
      await updateDoc(bookingRef, { status: 'cancelled' });

      // Update slot status back to available
      const slotRef = doc(db, 'slots', booking.slotId);
      await updateDoc(slotRef, { 
        status: 'available',
        finalStatus: 'available'
      });

      // Update local state
      setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, status: 'cancelled' } : b));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `bookings/${booking.id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-10">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-black text-gray-900 mb-2"
          >
            My Bookings
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-500 font-medium"
          >
            Manage your active reservations and history
          </motion.p>
        </div>

        {!user ? (
          <div className="bg-white p-12 rounded-[2.5rem] shadow-xl shadow-gray-200 border border-gray-100 text-center">
            <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Please Sign In</h2>
            <p className="text-gray-500 mb-8">You need to be logged in to view your bookings.</p>
            <a href="/auth" className="inline-block bg-primary text-white px-8 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all">
              Sign In Now
            </a>
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white p-12 rounded-[2.5rem] shadow-xl shadow-gray-200 border border-gray-100 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-gray-300">
              <Calendar className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Bookings Found</h2>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto">You haven't made any parking reservations yet. Find a spot and book it today!</p>
            <a href="/#dashboard" className="inline-block bg-primary text-white px-8 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all">
              Find a Spot
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {bookings.map((booking, index) => (
                <motion.div
                  key={booking.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white p-6 rounded-[2rem] shadow-lg shadow-gray-100 border border-gray-100 hover:border-blue-100 transition-all group"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${
                        booking.status === 'active' ? 'bg-blue-50 text-blue-600' : 
                        booking.status === 'cancelled' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        <MapPin className="w-8 h-8" />
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg font-black text-gray-900">Slot {booking.slotLabel}</span>
                          <div className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            booking.status === 'active' ? 'bg-blue-100 text-blue-700' : 
                            booking.status === 'cancelled' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {booking.status}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-400 font-medium">
                          <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {new Date(booking.timestamp).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {booking.hours} Hours</span>
                          <span className="flex items-center gap-1.5 font-bold text-gray-700"><Car className="w-3.5 h-3.5" /> {booking.vehicleNumber}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-4 md:pt-0">
                      <div className="text-right">
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Paid Amount</div>
                        <div className="text-xl font-black text-gray-900">₹{booking.price}</div>
                      </div>
                      
                      {booking.status === 'active' && (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setSelectedQR(booking)}
                            className="bg-blue-50 text-blue-600 px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm flex items-center gap-2"
                          >
                            <QrCode className="w-4 h-4" /> QR
                          </button>
                          <button 
                            onClick={() => handleCancel(booking)}
                            className="bg-rose-50 text-rose-600 px-4 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      <AnimatePresence>
        {selectedQR && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedQR(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 text-center">
                <button 
                  onClick={() => setSelectedQR(null)}
                  className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>

                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                    <QrCode className="w-8 h-8" />
                  </div>
                </div>

                <h3 className="text-2xl font-black text-gray-900 mb-2">Access Ticket</h3>
                <p className="text-gray-500 text-sm mb-8 font-medium">Scan this at the entry gate of Slot {selectedQR.slotLabel}</p>

                <div className="bg-white p-6 rounded-3xl border-2 border-dashed border-gray-200 inline-block mb-8">
                  <QRCodeSVG 
                    value={`BKG-${selectedQR.id}-${selectedQR.slotId}`} 
                    size={200}
                    level="H"
                  />
                </div>

                <div className="bg-gray-50 p-6 rounded-2xl text-left space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Booking ID</span>
                    <span className="font-bold text-gray-900">{selectedQR.id}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-t border-gray-100 pt-4">
                    <span className="text-gray-500 font-medium">Vehicle</span>
                    <span className="font-bold text-gray-900 uppercase">{selectedQR.vehicleNumber}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 font-medium">Spot Label</span>
                    <span className="font-bold text-blue-600">A-{selectedQR.slotLabel}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
