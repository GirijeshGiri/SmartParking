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
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
              <Zap className="w-3 h-3 fill-current" />
              Advanced Smart Parking System
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-gray-900 leading-[1.1] mb-6">
              AI-Powered <br />
              <span className="text-blue-600">Parking Solutions</span>
            </h1>
            <p className="text-lg text-gray-600 mb-10 max-w-lg leading-relaxed">
              Experience the future of parking with dual verification using ultrasonic sensors and AI computer vision. Real-time monitoring for maximum efficiency.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a 
                href="#dashboard" 
                className="flex items-center justify-center gap-2 bg-primary text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all group shadow-xl shadow-blue-200"
              >
                Reserve a Slot
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a 
                href="/display"
                className="flex items-center justify-center gap-2 border-2 border-gray-200 px-8 py-4 rounded-2xl font-bold hover:bg-gray-50 transition-all"
              >
                Entrance Board
              </a>
            </div>
            
            <div className="mt-12 flex items-center gap-6 text-sm text-gray-500 font-medium">
              <div className="flex items-center gap-2">
                <div className="bg-emerald-100 p-1.5 rounded-full">
                  <Cpu className="w-4 h-4 text-emerald-600" />
                </div>
                Ultrasonic Sensors
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-purple-100 p-1.5 rounded-full">
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
            <div className="relative aspect-square rounded-[2rem] overflow-hidden shadow-2xl bg-gray-100 border-8 border-white">
              <div className="absolute inset-0 bg-blue-600/10 mix-blend-overlay"></div>
              <img 
                src="https://images.unsplash.com/photo-1506521781263-d8422e82f27a?q=80&w=2070&auto=format&fit=crop" 
                alt="Modern Parking Lot" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              
              {/* Floating UI Elements */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-8 left-8 bg-white/90 backdrop-blur p-4 rounded-2xl shadow-xl border border-white/20"
              >
                <div className="text-xs font-bold text-gray-400 uppercase mb-1">Live Occupancy</div>
                <div className="text-2xl font-black text-gray-900">84%</div>
                <div className="mt-2 text-xs font-medium text-emerald-600 flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  System Optimal
                </div>
              </motion.div>

              <motion.div 
                animate={{ x: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-12 right-8 bg-gray-900/90 backdrop-blur p-4 rounded-2xl shadow-xl border border-white/10 text-white"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-400 uppercase">AI Verification</div>
                    <div className="text-sm font-semibold tracking-wide">Vehicle Detected</div>
                  </div>
                </div>
              </motion.div>
            </div>
            
            {/* Background decorative elements */}
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
            <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
