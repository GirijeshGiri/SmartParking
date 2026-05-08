import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, CheckCircle2, XCircle, QrCode, RefreshCcw, Car } from 'lucide-react';
import jsQR from 'jsqr';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { updateDoc, doc, collection, query, where, getDocs, writeBatch, serverTimestamp } from 'firebase/firestore';

export default function GateScanner() {
  const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'failed' | 'opening'>('idle');
  const [bookingData, setBookingData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startScanner = async () => {
    setStatus('scanning');
    setErrorMessage('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        videoRef.current.play();
        requestAnimationFrame(tick);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Please allow camera access to scan.");
      setStatus('idle');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const tick = () => {
    if (status !== 'scanning') return;
    
    if (videoRef.current?.readyState === videoRef.current?.HAVE_ENOUGH_DATA && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      
      if (context) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code) {
          stopCamera();
          handleSuccess(code.data);
          return;
        }
      }
    }
    requestAnimationFrame(tick);
  };

  const handleSuccess = async (data: string) => {
    console.log("QR Code detected:", data);
    setStatus('scanning'); 
    
    try {
      if (data.startsWith('BKG-')) {
        const parts = data.split('-');
        const bookingId = `${parts[1]}-${parts[2]}`;
        const slotId = parts[3];

        console.log(`Verifying Booking: ${bookingId} for Slot: ${slotId}`);

        const q = query(collection(db, 'bookings'), 
          where('id', '==', bookingId), 
          where('status', '==', 'active')
        );
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const bookingDoc = snapshot.docs[0];
          const booking = bookingDoc.data();
          
          if (booking.slotId !== slotId) {
            throw new Error("Slot ID mismatch in QR data.");
          }

          const batch = writeBatch(db);
          
          batch.update(doc(db, 'bookings', bookingDoc.id), {
            checkedIn: true,
            checkInTime: serverTimestamp(),
          });

          batch.update(doc(db, 'slots', slotId), {
            status: 'occupied',
            finalStatus: 'occupied',
            lastGateCheck: serverTimestamp()
          });

          await batch.commit();

          setBookingData({
            id: bookingId,
            slotLabel: booking.slotLabel || slotId,
            vehicleNumber: booking.vehicleNumber || 'NOT PROVIDED',
            floor: booking.slotLabel?.split('-')[0] || '1',
            checkIn: new Date().toLocaleTimeString()
          });
          
          setStatus('success');
          
          setTimeout(() => setStatus('opening'), 1500);

          setTimeout(() => {
            setStatus('idle');
            setBookingData(null);
          }, 8000);
        } else {
          setErrorMessage("Booking not found or already used/expired.");
          setStatus('failed');
          setTimeout(() => setStatus('idle'), 4000);
        }
      } else {
        setErrorMessage("Invalid QR Code Format. Please use a SmartParkAI Booking QR.");
        setStatus('failed');
        setTimeout(() => setStatus('idle'), 4000);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "An error occurred during verification.");
      setStatus('failed');
      setTimeout(() => setStatus('idle'), 4000);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-6 pb-24 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className="flex items-center justify-center gap-3 mb-12">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Car className="w-7 h-7 text-white" />
          </div>
          <div>
            <span className="text-2xl font-black tracking-tight text-white block">SmartParkAI</span>
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Entry Access Point</span>
          </div>
        </div>

        <div className="relative aspect-square w-full bg-black rounded-[3rem] overflow-hidden border-8 border-gray-800 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] mb-10 group">
          {status === 'idle' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-10 text-center">
              <motion.div 
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="w-28 h-28 bg-blue-600/10 rounded-full flex items-center justify-center text-blue-500 mb-2"
              >
                <QrCode className="w-14 h-14" />
              </motion.div>
              <div>
                <h3 className="text-2xl font-black text-white mb-3">Entrance Monitor</h3>
                <p className="text-gray-400 text-sm leading-relaxed px-4">
                  Please scan your booking QR code to initiate gate activation.
                </p>
              </div>
              <button 
                onClick={startScanner}
                className="bg-blue-600 text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 active:scale-95 flex items-center gap-3"
              >
                <Camera className="w-6 h-6" />
                Scan QR Code
              </button>
            </div>
          )}

          {status === 'scanning' && (
            <div className="absolute inset-0">
              <video ref={videoRef} className="w-full h-full object-cover opacity-80" />
              <canvas ref={canvasRef} className="hidden" />
              
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-64 border-2 border-white/20 rounded-3xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-xl" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-xl" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-xl" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-xl" />
                  
                  <motion.div 
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-x-0 h-1 bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,1)]"
                  />
                  <div className="absolute inset-0 bg-blue-500/5 animate-pulse" />
                </div>
              </div>

              <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-blue-600/90 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg border border-white/10">
                Awaiting Signature
              </div>
            </div>
          )}

          <AnimatePresence>
            {status === 'success' && bookingData && (
              <motion.div 
                initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                animate={{ opacity: 1, backdropFilter: 'blur(10px)' }}
                className="absolute inset-0 bg-emerald-600/90 flex flex-col items-center justify-center p-10 text-white z-20"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', damping: 12 }}
                >
                  <CheckCircle2 className="w-28 h-28 mb-8 drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]" />
                </motion.div>
                <h2 className="text-4xl font-black mb-6 tracking-tight">VERIFIED</h2>
                
                <div className="bg-black/20 backdrop-blur-xl p-6 rounded-3xl w-full border border-white/10 space-y-4">
                  <div className="flex justify-between items-center group/field">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-100/60">Booking ID</span>
                    <span className="font-mono font-bold text-lg">{bookingData.id}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-100/60">Vehicle Plate</span>
                    <span className="font-mono font-bold text-lg bg-white/10 px-3 py-1 rounded-lg">{bookingData.vehicleNumber}</span>
                  </div>
                  <div className="h-px bg-white/10 w-full" />
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-100/60">Floor</span>
                    <span className="font-black text-xl">L{bookingData.floor}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-100/60">Target Slot</span>
                    <span className="bg-white text-emerald-600 px-3 py-1 rounded-xl font-black text-xl shadow-lg">{bookingData.slotLabel}</span>
                  </div>
                </div>
                
                <p className="mt-8 text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Arrival: {bookingData.checkIn}</p>
              </motion.div>
            )}

            {status === 'opening' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-gray-950 flex flex-col items-center justify-center p-8 text-white z-30"
              >
                <div className="relative w-full h-full flex flex-col items-center justify-center">
                  <div className="text-center mb-12">
                    <h2 className="text-5xl font-black mb-2 text-emerald-500">GATE OPEN</h2>
                    <p className="text-gray-500 font-bold uppercase tracking-widest">Proceed to Level {bookingData?.floor || '1'}</p>
                  </div>

                  <div className="relative w-full h-48 flex items-center justify-center">
                    <div className="absolute bottom-0 left-0 w-8 h-40 bg-gray-700 rounded-t-xl" />
                    <div className="absolute bottom-10 left-4 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
                    
                    <motion.div 
                      initial={{ rotate: 0 }}
                      animate={{ rotate: -75 }}
                      transition={{ duration: 1.5, ease: "circOut" }}
                      style={{ originX: "0px", originY: "10px" }}
                      className="absolute bottom-32 left-4 w-[120%] h-6 bg-yellow-500 rounded-r-2xl border-4 border-black/10 overflow-hidden shadow-2xl flex"
                    >
                      {[...Array(20)].map((_, i) => (
                        <div key={i} className="w-10 h-full bg-black skew-x-[30deg] -ml-2 first:ml-0" />
                      ))}
                    </motion.div>
                  </div>

                  <motion.div 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-12 bg-emerald-500/20 text-emerald-500 border border-emerald-500/50 px-8 py-3 rounded-2xl font-black text-xl flex items-center gap-3"
                  >
                    <Car className="w-6 h-6" />
                    DRIVE IN
                  </motion.div>
                </div>
              </motion.div>
            )}

            {status === 'failed' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 bg-rose-600 flex flex-col items-center justify-center p-10 text-white z-20"
              >
                <XCircle className="w-28 h-28 mb-8 animate-bounce" />
                <h2 className="text-4xl font-black mb-4 tracking-tight">ACCESS DENIED</h2>
                <div className="bg-black/20 backdrop-blur-md p-6 rounded-3xl w-full border border-white/10 text-center">
                  <p className="font-bold text-lg mb-2">Verification Failure</p>
                  <p className="text-sm opacity-80 leading-relaxed font-sans">{errorMessage || "The presented credential is not registered or has expired."}</p>
                </div>
                <button 
                  onClick={() => setStatus('idle')}
                  className="mt-8 flex items-center gap-2 font-bold uppercase tracking-widest text-xs hover:underline"
                >
                  <RefreshCcw className="w-4 h-4" /> Try Again
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 blur-2xl rounded-full" />
            <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 relative z-10">Gate Status</div>
            <div className="flex items-center gap-2 text-emerald-400 font-black text-lg relative z-10">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              OPERATIONAL
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 blur-2xl rounded-full" />
            <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">AI Sync</div>
            <div className="text-white font-black text-lg">ENFORCED</div>
          </div>
        </div>
        
        <p className="mt-12 text-center text-[10px] font-black text-gray-600 uppercase tracking-[0.4em]">
          Secure Infrastructure By SmartParkAI
        </p>
      </div>
    </div>
  );
}

