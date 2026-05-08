import { motion } from 'motion/react';
import { Camera, Cpu, Smartphone, ShieldCheck, Zap, Globe } from 'lucide-react';

const FEATURES = [
  {
    icon: <Camera className="w-6 h-6" />,
    title: "AI Vision System",
    description: "Deep learning models cross-verify vehicle occupancy and license plates for enhanced security.",
    color: "bg-purple-50 text-purple-600"
  },
  {
    icon: <Cpu className="w-6 h-6" />,
    title: "Sensor Verification",
    description: "Industrial-grade ultrasonic sensors provide 24/7 detection even in low visibility conditions.",
    color: "bg-blue-50 text-blue-600"
  },
  {
    icon: <Smartphone className="w-6 h-6" />,
    title: "Seamless Access",
    description: "Generate instant QR codes for gate access. No more physical tickets or lost cards.",
    color: "bg-emerald-50 text-emerald-600"
  },
  {
    icon: <ShieldCheck className="w-6 h-6" />,
    title: "Secure Payments",
    description: "Enterprise-grade encryption for all financial transactions and sensitive user data.",
    color: "bg-amber-50 text-amber-600"
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Real-time Updates",
    description: "Occupancy status updates every 1.5 seconds across all connected interfaces.",
    color: "bg-rose-50 text-rose-600"
  },
  {
    icon: <Globe className="w-6 h-6" />,
    title: "Eco Optimized",
    description: "Smart routing reduces circling time, cutting down on emissions and fuel wastage.",
    color: "bg-cyan-50 text-cyan-600"
  }
];

export default function Features() {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">Built for Modern Cities</h2>
          <p className="text-lg text-gray-500">Our proprietary dual-verification stack ensures unmatched accuracy and a frictionless parking experience for everyone.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-8 rounded-[2rem] border border-gray-100 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-500/5 transition-all group"
            >
              <div className={`w-14 h-14 rounded-2xl ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
              <p className="text-gray-500 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
