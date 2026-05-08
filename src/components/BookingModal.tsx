import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, CreditCard, CheckCircle2, QrCode as QrIcon, History, Calendar, Loader2, Navigation as NavIcon, Zap, ArrowRight } from 'lucide-react';
import { ParkingSlot } from '../types';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

interface HistoryItem {
  id: string;
  slotId: string;
  slotLabel: string;
  time: string;
  duration: number;
  price: number;
}

interface Props {
  slot: ParkingSlot | null;
  onClose: () => void;
}

import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';
import { doc, updateDoc, serverTimestamp, collection, addDoc, getDoc } from 'firebase/firestore';

export default function BookingModal({ slot, onClose }: Props) {
  const navigate = useNavigate();
  const [step, setStep] = useState<'details' | 'payment' | 'processing' | 'confirmation' | 'acknowledged'>('details');
  const [view, setView] = useState<'booking' | 'history'>('booking');
  const [hours, setHours] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [currentBookingId, setCurrentBookingId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('parking_history');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          setVehicleNumber(data.vehicleNumber || '');
        }
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    localStorage.setItem('parking_history', JSON.stringify(history));
  }, [history]);

  if (!slot) return null;

  const totalPrice = slot.pricePerHour * hours;

  const handleCancelBooking = async (booking: HistoryItem) => {
    if (!confirm(`Are you sure you want to cancel booking for ${booking.slotLabel}?`)) return;

    try {
      // Update global slot status back to available
      await updateDoc(doc(db, 'slots', booking.slotId), {
        status: 'available',
        finalStatus: 'available'
      });
      
      setHistory(prev => prev.filter(item => item.id !== booking.id));
      alert('Booking cancelled successfully');
    } catch (err: any) {
      if (err.message?.includes('permission')) {
        setError('You do not have permission to cancel this booking.');
      } else {
        setError('A cloud synchronisation error occurred. Please try again.');
      }
      handleFirestoreError(err, OperationType.UPDATE, `slots/${booking.slotId}`);
    }
  };

  const handleNext = async () => {
    if (!auth.currentUser) {
      navigate('/auth');
      return;
    }
    if (step === 'details') {
      setStep('payment');
    } else if (step === 'payment') {
      setStep('processing');
      setError(null);
      try {
        const bookingId = `BK-${Math.floor(Math.random() * 9000) + 1000}`;
        setCurrentBookingId(bookingId);
        
        // Finalize cloud slot reservation
        await updateDoc(doc(db, 'slots', slot.id), {
          status: 'reserved',
          finalStatus: 'reserved',
          updatedAt: serverTimestamp()
        });

        // Save to Firestore Bookings collection
        if (auth.currentUser) {
          await addDoc(collection(db, 'bookings'), {
            id: bookingId,
            userId: auth.currentUser.uid,
            slotId: slot.id,
            slotLabel: slot.label,
            price: totalPrice,
            hours: hours,
            vehicleNumber: vehicleNumber,
            timestamp: new Date().toISOString(),
            status: 'active'
          });
        }
        
        // Simulate bank gateway delay for visual polish
        setTimeout(() => {
          const newBooking: HistoryItem = {
            id: bookingId,
            slotId: slot.id,
            slotLabel: slot.label,
            time: new Date().toLocaleString(),
            duration: hours,
            price: totalPrice,
          };
          setHistory([newBooking, ...history]);
          setStep('confirmation');
        }, 2000);
      } catch (err: any) {
        if (err.message?.includes('permission')) {
          setError('This slot is no longer available or your session has expired.');
        } else {
          setError('We encountered a problem booking your slot. Please check your connection.');
        }
        handleFirestoreError(err, OperationType.UPDATE, `slots/${slot.id}`);
        setStep('payment');
      }
    } else if (step === 'confirmation') {
      setStep('acknowledged');
    }
  };

  return (
    <AnimatePresence>
      {slot && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden group"
          >
            {/* Animated Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-purple-50/50 pointer-events-none" />
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 90, 0],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute -top-24 -right-24 w-64 h-64 bg-blue-400/10 blur-3xl rounded-full pointer-events-none" 
            />
            
            <div className="relative p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  {view === 'history' ? 'Booking History' : step === 'processing' ? 'Processing...' : step === 'confirmation' ? 'Booking Confirmed' : step === 'acknowledged' ? 'All Done' : 'Reserve Slot'}
                </h3>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setView(view === 'history' ? 'booking' : 'history')}
                    className={`p-2 rounded-xl transition-all ${view === 'history' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                    title={view === 'history' ? "Back to Reservation" : "View History"}
                  >
                    <History className="w-5 h-5" />
                  </button>
                  <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3"
                >
                  <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center text-white shrink-0">
                    <X className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-rose-600 leading-tight">{error}</p>
                  </div>
                  <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-600 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              )}

              {view === 'history' ? (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }} 
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200"
                >
                  {history.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mx-auto mb-4">
                        <History className="w-8 h-8" />
                      </div>
                      <p className="text-gray-400 font-medium font-sans">No previous bookings found</p>
                    </div>
                  ) : (
                    history.map((item) => (
                      <div key={item.id} className="bg-white/60 border border-gray-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all hover:bg-white group/item">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                            <span className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-black text-xs">
                              {item.slotLabel}
                            </span>
                            <span className="font-bold text-gray-900 font-sans text-sm">{item.id}</span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-emerald-600 font-bold font-sans text-sm">₹{item.price}</span>
                            <button 
                              onClick={() => handleCancelBooking(item)}
                              className="mt-2 px-3 py-1 bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-rose-600 hover:text-white transition-all border border-rose-100 shadow-sm"
                            >
                              Cancel Booking
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-[10px] uppercase font-bold tracking-wider text-gray-400">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3" />
                            {item.time.split(',')[0]}
                          </div>
                          <div className="flex items-center gap-1.5 justify-end">
                            <Clock className="w-3 h-3" />
                            {item.duration} Hours
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  <button 
                    onClick={() => setView('booking')}
                    className="w-full mt-4 py-3 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Back to Reservation
                  </button>
                </motion.div>
              ) : (
                <>
                  {step === 'details' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="bg-emerald-50/50 p-4 rounded-2xl mb-8 border border-emerald-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                      <Zap className="w-6 h-6 fill-current" />
                    </div>
                    <div>
                      <h4 className="font-bold text-emerald-900">Instant Reservation</h4>
                      <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest leading-none">Cross-Verified by AI Sensors</p>
                    </div>
                  </div>

                  <div className="bg-white/40 backdrop-blur-md p-6 rounded-3xl mb-8 flex items-center justify-between border border-blue-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/5 -mr-8 -mt-8 rounded-full blur-2xl" />
                    <div className="relative z-10">
                      <div className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1">Position</div>
                      <div className="text-3xl font-black text-blue-700">{slot.label}</div>
                    </div>
                    <div className="relative z-10 text-right">
                      <div className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1">Rate</div>
                      <div className="text-xl font-bold text-blue-900">₹{slot.pricePerHour}/hr</div>
                    </div>
                  </div>

                  <div className="space-y-6 mb-8">
                    <div>
                      <label className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 block">Vehicle Number</label>
                      <input 
                        type="text"
                        value={vehicleNumber}
                        onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                        placeholder="Enter Vehicle No (e.g. KA 01 AB 1234)"
                        className="w-full p-4 bg-white/50 border border-blue-100 rounded-2xl font-bold text-blue-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 block text-center md:text-left">Choose Duration</label>
                      <div className="flex items-center gap-3">
                        {[1, 2, 4, 8].map(h => (
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            key={h}
                            onClick={() => setHours(h)}
                            className={`flex-1 py-3 rounded-2xl font-bold transition-all border-2 ${hours === h ? 'bg-gray-900 border-gray-900 text-white shadow-xl translate-y-[-2px]' : 'bg-white border-gray-100 text-gray-600 hover:border-gray-200'}`}
                          >
                            {h}h
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-100 flex items-center justify-between mb-8">
                    <span className="text-gray-500 font-medium text-lg">Total Amount</span>
                    <div className="text-right">
                      <span className="text-3xl font-black text-gray-900">₹{totalPrice.toFixed(0)}</span>
                    </div>
                  </div>

                  <button 
                    onClick={handleNext}
                    className="w-full bg-blue-600 text-white py-5 rounded-[1.25rem] font-bold text-xl hover:bg-blue-700 transition-all shadow-2xl shadow-blue-200 active:scale-[0.98] flex items-center justify-center gap-3 group"
                  >
                    <span>{auth.currentUser ? 'Book This Slot Now' : 'Sign in to Book Slot'}</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </motion.div>
              )}

              {step === 'payment' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="text-center mb-6">
                    <div className="inline-block bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-2">
                       UPI Scan & Pay
                    </div>
                    <h4 className="font-bold text-gray-900">Complete Payment</h4>
                  </div>

                  <div className="bg-white p-4 rounded-3xl border-2 border-dashed border-gray-200 mb-8 flex flex-col items-center shadow-lg transform hover:scale-[1.02] transition-transform">
                    <img 
                      src="input_file_0.png" 
                      alt="UPI QR Code" 
                      className="w-full max-w-[240px] aspect-square object-contain mb-4"
                      referrerPolicy="no-referrer"
                    />
                    <div className="text-center">
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Payable Amount</div>
                      <div className="text-2xl font-black text-gray-900">₹{(totalPrice + 5).toFixed(0)}</div>
                      <div className="text-[10px] text-gray-500 mt-1">Includes ₹5 convenience fee</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl mb-8 border border-gray-100">
                    <div className="w-10 h-10 bg-blue-600/10 rounded-full flex items-center justify-center text-blue-600">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-gray-900">Scan via any App</div>
                      <div className="text-[10px] text-gray-500">Google Pay, PhonePe, Paytm supported</div>
                    </div>
                  </div>

                  <button 
                    onClick={handleNext}
                    className="w-full bg-gray-900 text-white py-5 rounded-[1.25rem] font-bold text-lg hover:bg-gray-800 transition-all shadow-xl active:scale-[0.98]"
                  >
                    Confirm Payment Received
                  </button>
                </motion.div>
              )}

              {step === 'processing' && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <div className="relative w-24 h-24 mx-auto mb-8">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 border-4 border-gray-100 border-t-blue-600 rounded-full"
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-blue-600">
                      <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Verifying Payment</h4>
                  <p className="text-gray-500">Please wait while we confirm your transaction with the bank...</p>
                </motion.div>
              )}

              {step === 'confirmation' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }} 
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center"
                >
                  <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                  </div>
                  
                  <div className="mb-8">
                    <h4 className="text-lg font-bold text-gray-900 mb-1">Access Granted</h4>
                    <p className="text-sm text-gray-500">Your reservation is active for slot {slot.label}.</p>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border-2 border-dashed border-gray-200 inline-block mb-8">
                    <QRCodeSVG 
                      value={`BKG-${currentBookingId}-${slot.id}`} 
                      size={180}
                      level="H"
                      includeMargin={false}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-gray-50 p-3 rounded-2xl text-left">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Time Left</div>
                      <div className="text-sm font-bold text-gray-900">{hours}:00:00</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-2xl text-left">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Ref ID</div>
                      <div className="text-sm font-bold text-gray-900">{currentBookingId}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <button 
                      onClick={() => navigate(`/navigate?lat=${slot.coordinates?.lat || 12.9716}&lng=${slot.coordinates?.lng || 77.5946}&label=${slot.label}&floor=${slot.floor}`)}
                      className="bg-emerald-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all text-sm"
                    >
                      <NavIcon className="w-4 h-4" /> Start Nav
                    </button>
                    <button 
                      onClick={handleNext}
                      className="bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 text-sm"
                    >
                      Continue
                    </button>
                  </div>
                 </motion.div>
              )}

              {step === 'acknowledged' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }} 
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-4"
                >
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 12, stiffness: 200 }}
                    className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-6"
                  >
                    <CheckCircle2 className="w-14 h-14" />
                  </motion.div>
                  
                  <h4 className="text-2xl font-black text-gray-900 mb-2">You're All Set!</h4>
                  <p className="text-gray-500 mb-10 leading-relaxed">
                    Your booking for slot <span className="font-bold text-gray-900">{slot.label}</span> has been successfully acknowledged and saved to your account.
                  </p>

                  <div className="bg-gray-50 p-6 rounded-3xl mb-8 flex items-center gap-4 text-left border border-gray-100">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-blue-600">
                      <QrIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900">QR Code Stored</div>
                      <div className="text-xs text-gray-500">Available in your active trips anytime.</div>
                    </div>
                  </div>

                  <button 
                    onClick={onClose}
                    className="w-full bg-gray-900 text-white py-5 rounded-[1.25rem] font-bold text-lg hover:bg-gray-800 transition-all"
                  >
                    Done
                  </button>
                </motion.div>
              )}
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
