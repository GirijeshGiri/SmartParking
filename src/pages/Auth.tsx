import { motion } from 'motion/react';
import { Car, Smartphone, Zap, Camera, Shield, Phone, Hash, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { setDoc, doc, getDoc } from 'firebase/firestore';

export default function Auth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if user exists in Firestore
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          name: user.displayName,
          email: user.email,
          createdAt: new Date().toISOString(),
          isGoogleAuth: true
        });
      }
      navigate('/');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/network-request-failed') {
        setError('Network Error: Please try opening the app in a new tab if you are using the preview iframe, or check your internet connection.');
      } else {
        setError(err.message || 'An unexpected error occurred during Google sign-in.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Update Firebase Auth profile
        await updateProfile(user, { displayName: name });

        // Save extra details to Firestore
        await setDoc(doc(db, 'users', user.uid), {
          name,
          email,
          phone,
          vehicleNumber,
          createdAt: new Date().toISOString()
        });
      }
      navigate('/');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/network-request-failed') {
        setError('Network Error: Please check your internet connection. If you are in the preview, try opening in a new tab.');
      } else {
        setError(err.message || 'An error occurred during authentication.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 relative">
      <button 
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 z-[100] lg:hidden w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-900 border border-gray-100 active:scale-95 transition-all"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>
      {/* Left Side: Illustration & Branding */}
      <div className="hidden lg:flex bg-blue-600 p-12 flex-col justify-between text-white relative overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10"
        >
          <div className="flex items-center gap-2 mb-12">
            <Car className="w-10 h-10" />
            <span className="text-3xl font-black tracking-tight">SmartParkAI</span>
          </div>
          <h2 className="text-5xl font-bold leading-tight mb-6">
            The Future of <br /> Urban Mobility.
          </h2>
          <p className="text-blue-100 text-lg max-w-md">
            Seamlessly book, pay, and park with India's most advanced AI-powered parking infrastructure.
          </p>
        </motion.div>

        <div className="relative z-10 grid grid-cols-2 gap-6">
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
            <Camera className="w-6 h-6 mb-2" />
            <div className="text-sm font-bold">AI Vision</div>
            <div className="text-xs text-blue-200">Dual slot verification</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
            <Shield className="w-6 h-6 mb-2" />
            <div className="text-sm font-bold">Secure Pay</div>
            <div className="text-xs text-blue-200">encrypted transactions</div>
          </div>
        </div>

        {/* Decorative background shape */}
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500 rounded-full mix-blend-soft-light opacity-50 blur-3xl"></div>
      </div>

      {/* Right Side: Form */}
      <div className="flex items-center justify-center p-8 bg-gray-50 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md bg-white p-6 md:p-10 rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100"
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-gray-900 mb-2">
              {isLogin ? 'Welcome Back' : 'Join SmartParkAI'}
            </h1>
            <p className="text-gray-500 font-medium font-sans">
              {isLogin ? 'Please enter your account details' : 'Create an account to start parking'}
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl text-xs font-bold font-sans border border-rose-100">
                {error}
              </div>
            )}
            {!isLogin && (
              <>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block mb-1">Full Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary focus:bg-white outline-none transition-all font-medium text-gray-900" 
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block mb-1">Phone Number</label>
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary focus:bg-white outline-none transition-all font-medium text-gray-900" 
                    placeholder="+91 99999 99999"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block mb-1">Vehicle Number</label>
                  <input 
                    type="text" 
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary focus:bg-white outline-none transition-all font-medium text-gray-900" 
                    placeholder="KA 01 AB 1234"
                    required
                  />
                </div>
              </>
            )}
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block mb-1">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary focus:bg-white outline-none transition-all font-medium text-gray-900" 
                placeholder="name@company.com"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block mb-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary focus:bg-white outline-none transition-all font-medium text-gray-900" 
                placeholder="••••••••"
                required
              />
            </div>

            <button 
              disabled={loading}
              className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 mt-4 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100"></div>
              </div>
              <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.2em]">
                <span className="bg-white px-4 text-gray-400">Or continue with</span>
              </div>
            </div>

            <button 
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 py-4 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 transition-all active:scale-[0.98]"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
              Google Authentication
            </button>
          </form>

          <div className="mt-8 text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm font-bold text-gray-400 hover:text-blue-600 transition-colors underline underline-offset-4"
            >
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
