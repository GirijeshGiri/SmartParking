import { motion } from 'motion/react';
import { Camera, Cpu, Zap, ArrowRight } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-8 ring-1 ring-blue-100">
              <Zap className="w-3 h-3 fill-current" />
              Advanced Smart Parking System
            </div>
            <h1 className="text-6xl lg:text-8xl font-black tracking-tighter text-gray-900 leading-[0.9] mb-8">
              AI-Powered <br />
              <span className="text-blue-600">Parking Solutions</span>
            </h1>
            <p className="text-lg text-gray-500 mb-10 max-w-lg leading-relaxed font-medium">
              Experience the future of parking with dual verification using ultrasonic sensors and AI computer vision. Real-time monitoring for maximum efficiency.
            </p>
            <div className="flex flex-col sm:flex-row gap-5">
              <a 
                href="#dashboard" 
                className="flex items-center justify-center gap-3 bg-blue-600 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition-all group shadow-2xl shadow-blue-500/40 active:scale-95"
              >
                Reserve a Slot
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
              <a 
                href="/display"
                className="flex items-center justify-center gap-3 bg-white text-gray-900 border border-gray-100 px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-50 transition-all shadow-xl shadow-gray-200/50 active:scale-95"
              >
                Entrance Board
              </a>
            </div>
            
            <div className="mt-12 flex items-center gap-8 text-[11px] text-gray-400 font-black uppercase tracking-widest">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-100 p-2 rounded-lg">
                  <Cpu className="w-4 h-4 text-emerald-600" />
                </div>
                Ultrasonic Sensors
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Camera className="w-4 h-4 text-purple-600" />
                </div>
                AI Vision
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative aspect-square rounded-[3rem] overflow-hidden shadow-[0_32px_128px_-32px_rgba(0,0,0,0.3)] bg-gray-100 group">
              <div className="absolute inset-0 bg-blue-600/5 mix-blend-overlay"></div>
              <img 
                src="https://images.unsplash.com/photo-1545179605-1296651e9d43?q=80&w=2000&auto=format&fit=crop" 
                alt="Modern Parking Lot" 
                className="w-full h-full object-cover grayscale-[0.2] group-hover:scale-110 transition-transform duration-1000"
                referrerPolicy="no-referrer"
              />
              
              {/* Floating UI Elements */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-8 left-8 bg-white/95 backdrop-blur-md p-6 rounded-[2rem] shadow-2xl border border-white/50"
              >
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Live Occupancy</div>
                <div className="text-4xl font-black text-gray-900 tracking-tighter">84%</div>
                <div className="mt-3 text-[10px] font-black text-emerald-500 flex items-center gap-2 uppercase tracking-widest">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  System Optimal
                </div>
              </motion.div>

              <motion.div 
                animate={{ x: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-12 right-8 bg-[#111827]/95 backdrop-blur-md p-6 rounded-[2rem] shadow-2xl border border-white/10 text-white min-w-[220px]"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-0.5">AI Verification</div>
                    <div className="text-sm font-black tracking-tight uppercase">Vehicle Detected</div>
                  </div>
                </div>
              </motion.div>
            </div>
            
            {/* Background decorative elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] -z-10">
              <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
              <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
