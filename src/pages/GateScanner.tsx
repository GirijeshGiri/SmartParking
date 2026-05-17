import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Camera, CheckCircle2, XCircle, QrCode, RefreshCcw, Car, ArrowLeft, Loader2 } from 'lucide-react';
import jsQR from 'jsqr';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { updateDoc, doc, collection, query, where, getDocs, getDoc, writeBatch, serverTimestamp, onSnapshot } from 'firebase/firestore';

export default function GateScanner() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'idle' | 'scanning' | 'verifying' | 'success' | 'failed' | 'opening'>('idle');
  const statusRef = useRef(status);
  
  useEffect(() => {
    statusRef.current = status;
  }, [status]);
  const [bookingData, setBookingData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [selectedSlotId, setSelectedSlotId] = useState<string>('S1');
  const [manualProcessing, setManualProcessing] = useState(false);
  const [currentSlotStatus, setCurrentSlotStatus] = useState<string>('loading...');
  const [aiAnalysisStatus, setAiAnalysisStatus] = useState<'idle' | 'capturing' | 'analyzing' | 'done'>('idle');
  const [aiResult, setAiResult] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleAIVerification = async () => {
    setAiAnalysisStatus('capturing');
    setAiResult(null);
    setErrorMessage('');

    try {
      // 1. Ensure camera is on if it's not already (though usually it will be idle)
      let stream: MediaStream;
      if (!videoRef.current?.srcObject) {
         stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
         if (videoRef.current) {
           videoRef.current.srcObject = stream;
           videoRef.current.setAttribute("playsinline", "true");
           await videoRef.current.play();
         }
      } else {
         stream = videoRef.current.srcObject as MediaStream;
      }

      // Small delay to ensure camera is ready/adjusted
      await new Promise(r => setTimeout(r, 1000));

      // 2. Capture frame
      if (!canvasRef.current || !videoRef.current) throw new Error("Hardware reference lost");
      
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Canvas context failed");
      
      ctx.drawImage(video, 0, 0);
      const base64Image = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

      setAiAnalysisStatus('analyzing');

      // 3. Call Gemini AI via server
      const response = await fetch('/api/verify-vehicle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image })
      });

      if (!response.ok) throw new Error("AI Analysis request failed");
      
      const { isVehiclePresent } = await response.json();
      const newStatus = isVehiclePresent ? 'occupied' : 'available';

      // 4. Update Firestore
      await updateDoc(doc(db, 'slots', selectedSlotId), {
        status: newStatus,
        finalStatus: newStatus,
        lastGateCheck: serverTimestamp(),
      });

      setAiResult(isVehiclePresent ? "Vehicle Detected ✅" : "No Vehicle Found ❌");
      setAiAnalysisStatus('done');

      // Cleanup
      if (!status.includes('scanning')) {
        stopCamera();
      }

      // Reset after 3 seconds
      setTimeout(() => {
        setAiAnalysisStatus('idle');
        setAiResult(null);
      }, 3000);

    } catch (err: any) {
      console.error(err);
      setErrorMessage("AI Verification Failed: " + (err.message || "Unknown error"));
      setAiAnalysisStatus('idle');
      stopCamera();
    }
  };

  useEffect(() => {
    // Set up a real-time listener for the selected slot status
    const slotDocRef = doc(db, 'slots', selectedSlotId);
    const unsubscribe = onSnapshot(slotDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setCurrentSlotStatus(data.status || 'unknown');
      } else {
        setCurrentSlotStatus('not found');
      }
    }, (error) => {
      console.error("Error listening to slot status:", error);
      handleFirestoreError(error, OperationType.GET, `slots/${selectedSlotId}`);
    });

    return () => unsubscribe();
  }, [selectedSlotId]);

  const manualSlots = [
    { id: 'S1', label: 'A-01' },
    { id: 'S2', label: 'A-02' },
    { id: 'S3', label: 'A-03' },
    { id: 'S4', label: 'A-04' },
    { id: 'S5', label: 'A-05' },
    { id: 'S6', label: 'A-06' },
    { id: 'S7', label: 'A-07' },
    { id: 'S8', label: 'A-08' },
    { id: 'S9', label: 'A-09' },
    { id: 'S10', label: 'A-10' },
    { id: 'S11', label: 'A-11' },
    { id: 'S12', label: 'A-12' },
  ];

  const handleManualVerification = async (isOccupied: boolean) => {
    setManualProcessing(true);
    try {
      const status = isOccupied ? 'occupied' : 'available';
      await updateDoc(doc(db, 'slots', selectedSlotId), {
        status: status,
        finalStatus: status,
        lastGateCheck: serverTimestamp(),
      });
      
      if (isOccupied) {
        setStatus('success');
        setBookingData({
          id: 'MANUAL-ENTRY',
          slotLabel: manualSlots.find(s => s.id === selectedSlotId)?.label || selectedSlotId,
          vehicleNumber: 'MANUAL VERIFY',
          floor: '1',
          checkIn: new Date().toLocaleTimeString()
        });
        setTimeout(() => setStatus('opening'), 1500);
        setTimeout(() => {
          setStatus('idle');
          setBookingData(null);
        }, 6000);
      } else {
        // Just show a brief success if marking as available
        alert(`Slot ${selectedSlotId} marked as Available`);
      }
    } catch (err: any) {
      console.error(err);
      handleFirestoreError(err, OperationType.UPDATE, `slots/${selectedSlotId}`);
    } finally {
      setManualProcessing(false);
    }
  };

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

  const lastScanTime = useRef<number>(0);
  const scanInterval = 300; // Scan every 300ms for performance

  const tick = (time: number) => {
    if (statusRef.current !== 'scanning') return;
    
    if (time - lastScanTime.current > scanInterval) {
      lastScanTime.current = time;
      
      if (videoRef.current?.readyState === videoRef.current?.HAVE_ENOUGH_DATA && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        
        if (context) {
          // Cap canvas size for performance on high-res mobile cameras
          const MAX_SIZE = 1200;
          let scale = 1;
          if (video.videoWidth > MAX_SIZE || video.videoHeight > MAX_SIZE) {
            scale = MAX_SIZE / Math.max(video.videoWidth, video.videoHeight);
          }
          
          if (canvas.width !== video.videoWidth * scale || canvas.height !== video.videoHeight * scale) {
            canvas.width = video.videoWidth * scale;
            canvas.height = video.videoHeight * scale;
          }
          
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "attemptBoth",
          });

          if (code && code.data) {
            setStatus('verifying');
            handleSuccess(code.data);
            return;
          }
        }
      }
    }
    requestAnimationFrame(tick);
  };

  const handleSuccess = async (data: string) => {
    console.log("QR Code detected:", data);
    
    try {
      if (data.startsWith('PARK-AI:')) {
        const parts = data.split(':');
        if (parts.length < 3) throw new Error("Invalid format detected");
        
        const bookingDocId = parts[1];
        const slotId = parts[2];

        console.log(`Verifying Booking Doc: ${bookingDocId} for Slot: ${slotId}`);

        const bookingDocRef = doc(db, 'bookings', bookingDocId);
        const bookingSnapshot = await getDoc(bookingDocRef);

        if (bookingSnapshot.exists()) {
          const booking = bookingSnapshot.data();
          
          if (booking.status !== 'active') {
            throw new Error(`This booking is currently ${booking.status}.`);
          }

          if (booking.slotId !== slotId) {
            throw new Error("Mismatched security keys. Spot allocation error.");
          }

          const batch = writeBatch(db);
          
          batch.update(bookingDocRef, {
            checkedIn: true,
            checkInTime: serverTimestamp(),
            status: 'completed' // Mark as completed once checked in
          });

          batch.update(doc(db, 'slots', slotId), {
            status: 'occupied',
            finalStatus: 'occupied',
            lastGateCheck: serverTimestamp()
          });

          await batch.commit();
          stopCamera();

          setBookingData({
            id: booking.displayId || bookingDocId.slice(0, 8),
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
          throw new Error("Security verification failed. Booking record not found in system.");
        }
      } else if (data.startsWith('BKG-')) {
        // Fallback for older QR codes
        const parts = data.split('-');
        const bookingId = `${parts[1]}-${parts[2]}`;
        const slotId = parts[3];

        const q = query(collection(db, 'bookings'), 
          where('id', '==', bookingId), 
          where('status', '==', 'active')
        );
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const bookingDoc = snapshot.docs[0];
          const booking = bookingDoc.data();
          
          const batch = writeBatch(db);
          batch.update(doc(db, 'bookings', bookingDoc.id), {
            checkedIn: true,
            status: 'completed',
            checkInTime: serverTimestamp(),
          });
          batch.update(doc(db, 'slots', slotId), {
            status: 'occupied',
            finalStatus: 'occupied'
          });
          await batch.commit();

          stopCamera();
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
          throw new Error("Old format booking already used or expired.");
        }
      } else {
        throw new Error("Unrecognized QR signature. Please use official SmartParkAI codes.");
      }
    } catch (err: any) {
      console.error("Verification Error:", err);
      stopCamera();
      setErrorMessage(err.message || "An error occurred during verification.");
      setStatus('failed');
      setTimeout(() => setStatus('idle'), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-6 pb-24 overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-md w-full relative z-10">
        <button 
          onClick={() => navigate(-1)}
          className="mb-8 flex items-center gap-2 text-white/50 hover:text-white transition-colors font-black text-[10px] uppercase tracking-widest group"
        >
          <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </div>
          Return to Dashboard
        </button>

        <div className="flex items-center justify-center gap-3 mb-12">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <motion.div
              animate={status === 'success' || status === 'opening' ? { 
                scale: [1, 1.2, 1],
                x: [0, 3, -3, 0],
                rotate: [0, -5, 5, 0]
              } : status === 'verifying' ? {
                y: [0, -2, 0],
              } : {}}
              transition={{ 
                duration: 0.5, 
                repeat: status === 'verifying' ? Infinity : 0,
                ease: "easeInOut"
              }}
            >
              <Car className="w-7 h-7 text-white" />
            </motion.div>
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
                  Please scan your booking QR code from your app's "My Bookings" section to initiate gate activation.
                </p>
              </div>
              <div className="flex flex-col gap-3 w-full px-10">
                <button 
                  onClick={startScanner}
                  className="bg-blue-600 text-white w-full py-5 rounded-2xl font-black text-lg hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-3"
                >
                  <Camera className="w-6 h-6" />
                  Open Scanner
                </button>
                <div className="flex items-center gap-2 justify-center py-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black text-emerald-500/60 uppercase tracking-[0.2em]">Ready for Verification</span>
                </div>
              </div>
            </div>
          )}

          {(status === 'scanning' || status === 'verifying' || aiAnalysisStatus === 'capturing' || aiAnalysisStatus === 'analyzing') && (
            <div className="absolute inset-0">
              <video ref={videoRef} className="w-full h-full object-cover opacity-80" />
              <canvas ref={canvasRef} className="hidden" />
              
              {(status === 'scanning' || status === 'verifying') && (
                <>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-64 h-64 border-2 border-white/20 rounded-3xl relative overflow-hidden">
                      {/* Scanning Corners */}
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-xl shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-xl shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-xl shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-xl shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                      
                      {/* Scanning Line */}
                      <motion.div 
                        animate={{ top: ['10%', '90%', '10%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-x-4 h-0.5 bg-blue-500 opacity-80 shadow-[0_0_20px_rgba(59,130,246,1)] z-10"
                      />
                      
                      {/* Center Pulse Area */}
                      <div className="absolute inset-4 bg-blue-500/5 animate-pulse rounded-2xl" />
                    </div>
                  </div>

                  <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-full text-center px-8">
                    <p className="text-white font-black text-[10px] uppercase tracking-[0.2em] bg-black/60 backdrop-blur-md py-4 px-6 rounded-2xl border border-white/10 shadow-2xl">
                      {status === 'verifying' ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="w-3 h-3 animate-spin text-blue-400" />
                          Processing Security Keys...
                        </span>
                      ) : (
                        "Center QR Code in Frame"
                      )}
                    </p>
                  </div>

                  <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-blue-600/90 backdrop-blur-md text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl border border-white/20">
                    Active Scanner
                  </div>
                </>
              )}

              {(aiAnalysisStatus === 'capturing' || aiAnalysisStatus === 'analyzing') && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
                   <div className="text-center">
                      <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <Camera className="w-10 h-10 text-white" />
                      </div>
                      <p className="text-white font-black text-xl uppercase tracking-widest">
                        {aiAnalysisStatus === 'capturing' ? 'Aligning Vehicle...' : 'AI Processing...'}
                      </p>
                   </div>
                </div>
              )}
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
                <h2 className="text-4xl font-black mb-6 tracking-tight text-center">Entry Verified ✅</h2>
                
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
          
          {/* Scanner Close Button */}
          {status === 'scanning' && (
            <button 
              onClick={() => {
                stopCamera();
                setStatus('idle');
              }}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-rose-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-rose-500 transition-all active:scale-95 z-40 flex items-center gap-2"
            >
              <XCircle className="w-4 h-4" /> Cancel Scan
            </button>
          )}
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

        {/* Manual Gate Entry Verification */}
        <div className="mt-8 bg-white/5 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/10 relative overflow-hidden">
           <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center text-blue-400">
                <RefreshCcw className="w-5 h-5" />
              </div>
              <div>
                 <h4 className="font-bold text-white">Manual Verification</h4>
                 <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Entry Override Hub</p>
              </div>
           </div>

           <div className="space-y-6">
              <div className="flex justify-between items-end mb-1">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">Select Parking Slot</label>
                  <select 
                    value={selectedSlotId}
                    onChange={(e) => setSelectedSlotId(e.target.value)}
                    className="w-full bg-gray-950 border border-white/10 rounded-2xl py-4 px-6 text-white font-bold appearance-none focus:border-blue-500 transition-all outline-none min-w-[200px]"
                  >
                    {manualSlots.map(slot => (
                      <option key={slot.id} value={slot.id}>{slot.label}</option>
                    ))}
                  </select>
                </div>
                <div className="text-right pb-1">
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1">Live Status</span>
                  <span className={`text-xs font-black uppercase tracking-tighter px-3 py-1 rounded-full border ${
                    currentSlotStatus === 'occupied' 
                      ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' 
                      : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                  }`}>
                    {currentSlotStatus}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <button 
                  disabled={manualProcessing || aiAnalysisStatus !== 'idle'}
                  onClick={handleAIVerification}
                  className="bg-emerald-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                 >
                   {aiAnalysisStatus === 'analyzing' ? (
                     <Loader2 className="w-4 h-4 animate-spin" />
                   ) : (
                     <Camera className="w-4 h-4" />
                   )}
                   {aiAnalysisStatus === 'capturing' ? 'Capturing...' : 
                    aiAnalysisStatus === 'analyzing' ? 'Analyzing...' : 'Verify Vehicle'}
                 </button>
                 <button 
                  disabled={manualProcessing || aiAnalysisStatus !== 'idle'}
                  onClick={() => handleManualVerification(false)}
                  className="bg-rose-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-500 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                 >
                   No Vehicle
                 </button>
              </div>
              
              <AnimatePresence>
                {aiResult && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`p-4 rounded-2xl text-center font-black text-sm uppercase tracking-widest border ${
                      aiResult.includes('Detected') 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}
                  >
                    {aiResult}
                  </motion.div>
                )}
              </AnimatePresence>
           </div>
        </div>
        
        <p className="mt-8 text-center text-[10px] font-black text-gray-600 uppercase tracking-[0.4em]">
          Secure Infrastructure By SmartParkAI
        </p>
      </div>
    </div>
  );
}

