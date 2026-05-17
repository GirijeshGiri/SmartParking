import { motion, AnimatePresence } from 'motion/react';
import { Car, Menu, X, LogOut, User, Phone, Hash, ChevronDown, Edit3, Save, XCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, signOut, User as FirebaseUser, updateProfile } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', vehicleNumber: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const userDoc = await getDoc(doc(db, 'users', u.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          setEditForm({ 
            name: data.name || u.displayName || '', 
            phone: data.phone || '', 
            vehicleNumber: data.vehicleNumber || '' 
          });
        }
      } else {
        setUserData(null);
      }
    });

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
        setIsEditing(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      unsubscribe();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSignOut = () => {
    signOut(auth);
    setProfileOpen(false);
    setIsEditing(false);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    if (!editForm.name.trim()) {
      alert('Please enter your name');
      return;
    }
    setSaving(true);
    try {
      // Update Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        name: editForm.name,
        phone: editForm.phone,
        vehicleNumber: editForm.vehicleNumber.toUpperCase(),
        updatedAt: new Date().toISOString()
      });

      // Update Firebase Auth profile if name changed
      if (editForm.name !== user.displayName) {
        await updateProfile(user, { displayName: editForm.name });
      }

      setUserData({ 
        ...userData, 
        name: editForm.name,
        phone: editForm.phone,
        vehicleNumber: editForm.vehicleNumber.toUpperCase()
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Please check your permissions.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditForm({
      name: userData?.name || user?.displayName || '',
      phone: userData?.phone || '',
      vehicleNumber: userData?.vehicleNumber || ''
    });
    setIsEditing(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.href = '/'}>
            <div className="bg-primary p-2 rounded-lg">
              <Car className="text-white w-6 h-6" />
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">SmartParkAI</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 font-medium text-sm text-gray-600">
            <a href="/#features" className="hover:text-primary transition-colors">Features</a>
            <a href="/#dashboard" className="hover:text-primary transition-colors">Dashboard</a>
            <a href="/gate" className="hover:text-primary transition-colors">Gate Entry</a>
            <a href="/display" className="hover:text-primary transition-colors">Display Board</a>
            {user && <a href="/bookings" className="hover:text-primary transition-colors">My Bookings</a>}
            
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-full border border-gray-100 hover:bg-gray-100 transition-all group"
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || ''} className="w-6 h-6 rounded-full" />
                  ) : (
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                  <span className="text-xs font-bold text-gray-900">{userData?.name || user.displayName?.split(' ')[0] || 'User'}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-72 bg-white rounded-3xl shadow-2xl shadow-gray-200 border border-gray-100 p-4 space-y-4"
                    >
                      <div className="flex items-center justify-between p-2 border-b border-gray-50 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl">
                            {(userData?.name || user.displayName || 'U')[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900">{userData?.name || user.displayName || 'Smart User'}</div>
                            <div className="text-xs text-gray-400 font-medium">{user.email}</div>
                          </div>
                        </div>
                        {!isEditing && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsEditing(true);
                            }}
                            className="flex items-center gap-1 text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700 underline underline-offset-4 bg-blue-50 px-2 py-1 rounded-lg"
                          >
                            <Edit3 className="w-3 h-3" />
                            Edit
                          </button>
                        )}
                      </div>

                      <div className="space-y-4 p-1">
                        {isEditing ? (
                          <div className="space-y-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 mb-1">
                                <User className="w-3 h-3 text-gray-400" />
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Full Name</label>
                              </div>
                              <input 
                                type="text"
                                value={editForm.name}
                                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                                placeholder="Your name"
                              />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Phone className="w-3 h-3 text-gray-400" />
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mobile Number</label>
                              </div>
                              <input 
                                type="tel"
                                value={editForm.phone}
                                onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                                placeholder="+91 00000 00000"
                              />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Hash className="w-3 h-3 text-gray-400" />
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Vehicle Number</label>
                              </div>
                              <input 
                                type="text"
                                value={editForm.vehicleNumber}
                                onChange={(e) => setEditForm({...editForm, vehicleNumber: e.target.value})}
                                className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none uppercase font-bold"
                                placeholder="KA 01 AB 1234"
                              />
                            </div>
                            <div className="flex gap-2 pt-2">
                              <button 
                                onClick={handleCancelEdit}
                                className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all border border-gray-200"
                              >
                                <XCircle className="w-4 h-4" />
                                Cancel
                              </button>
                              <button 
                                onClick={handleSaveProfile}
                                disabled={saving}
                                className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
                              >
                                {saving ? (
                                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                  <Save className="w-4 h-4" />
                                )}
                                {saving ? 'Saving...' : 'Save'}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-3 text-sm">
                              <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
                                <Phone className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mobile</div>
                                <div className="font-bold text-gray-700">{userData?.phone || 'Not provided'}</div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 text-sm">
                              <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
                                <Hash className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Vehicle No</div>
                                <div className="font-bold text-gray-700 uppercase">{userData?.vehicleNumber || 'Not provided'}</div>
                              </div>
                            </div>

                            <button 
                              onClick={handleSignOut}
                              className="w-full flex items-center justify-center gap-2 py-3 bg-rose-50 text-rose-600 rounded-2xl font-bold text-sm hover:bg-rose-600 hover:text-white transition-all group mt-2"
                            >
                              <LogOut className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                              Sign Out
                            </button>
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <a href="/auth" className="bg-primary text-white px-5 py-2 rounded-full hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
                Get Started
              </a>
            )}
          </div>

          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-gray-600">
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden bg-white border-b border-gray-100 p-4 flex flex-col gap-4 shadow-xl"
        >
          <a href="/#features" className="text-gray-600 font-medium" onClick={() => setIsOpen(false)}>Features</a>
          <a href="/#dashboard" className="text-gray-600 font-medium" onClick={() => setIsOpen(false)}>Dashboard</a>
          <a href="/gate" className="text-gray-600 font-medium" onClick={() => setIsOpen(false)}>Gate Entry</a>
          <a href="/display" className="text-gray-600 font-medium" onClick={() => setIsOpen(false)}>Display Board</a>
          {user && (
            <a href="/bookings" className="text-gray-600 font-medium" onClick={() => setIsOpen(false)}>My Bookings</a>
          )}
          {!user && (
            <a href="/auth" className="w-full bg-blue-600 text-white px-5 py-3 rounded-xl font-bold flex justify-center text-center" onClick={() => setIsOpen(false)}>
              Get Started
            </a>
          )}
        </motion.div>
      )}
    </nav>
  );
}
