
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '../constants';
import { User, UserRole } from '../types';
import { db } from '../services/mockDb';

const SignUp: React.FC<{ onSignup: (user: User) => void }> = ({ onSignup }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    address: ''
  });
  const [error, setError] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      role: UserRole.CITIZEN,
      password: formData.password,
      profileImage: profileImage || undefined,
      isActive: true
    };

    db.addUser(newUser);
    onSignup(newUser);
    navigate('/dashboard/citizen');
  };

  return (
    <div className="min-h-screen py-20 px-6 flex items-center justify-center font-sans relative overflow-hidden transition-all duration-700">
      {/* REQUESTED BACKGROUND IMAGE */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 scale-105"
        style={{ backgroundImage: 'url("https://c8.alamy.com/comp/E7WE8H/policeman-talking-with-a-driver-about-a-traffic-violation-E7WE8H.jpg")' }}
      ></div>
      
      {/* PROFESSIONAL OVERLAY */}
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[4px] z-[1]"></div>

      {/* Background Decor Orbs */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-[2]">
        <div className="absolute -top-1/4 -right-1/4 w-[800px] h-[800px] bg-emerald-500/10 rounded-full blur-[160px] opacity-40"></div>
        <div className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] opacity-40"></div>
      </div>

      {/* DARK BLUE CARD CONTAINER */}
      <div className="max-w-3xl w-full bg-[#0a192f]/95 backdrop-blur-2xl rounded-[4rem] shadow-[0_48px_100px_-20px_rgba(0,0,0,0.8)] p-12 border border-white/10 relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="mb-12 text-center">
          <Logo size="lg" textClassName="text-2xl text-emerald-500" />
          <h2 className="text-4xl font-black mt-8 text-white tracking-tight">Create an Account</h2>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-3">Unified Digital Identity for Vehicle Governance</p>
        </div>

        {error && (
          <div className="mb-10 p-6 bg-red-950/50 text-red-400 rounded-[2.5rem] text-sm font-bold border border-red-900/50 flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
            <i className="fa-solid fa-circle-exclamation text-xl"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="flex flex-col items-center mb-8">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`relative w-32 h-32 rounded-full border-4 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden group ${profileImage ? 'border-emerald-500' : 'border-slate-700 bg-slate-800/40 hover:border-emerald-500'}`}
            >
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center text-slate-500 group-hover:text-emerald-500 transition-colors">
                  <i className="fa-solid fa-camera text-2xl mb-1"></i>
                  <span className="text-[8px] font-black uppercase tracking-widest">Add Photo</span>
                </div>
              )}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
            </div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-4">Official Profile Portrait</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Full Legal Name</label>
                <input required type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full px-8 py-5 rounded-[2rem] bg-slate-800/40 border-2 border-slate-700/50 focus:border-emerald-500 focus:bg-slate-800 outline-none transition font-bold text-white placeholder-slate-600" placeholder="" />
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Email Address</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-8 py-5 rounded-[2rem] bg-slate-800/40 border-2 border-slate-700/50 focus:border-emerald-500 focus:bg-slate-800 outline-none transition font-bold text-white placeholder-slate-600" placeholder="" />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Phone Number</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-500">+232</span>
                  <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full pl-16 pr-8 py-5 rounded-[2rem] bg-slate-800/40 border-2 border-slate-700/50 focus:border-emerald-500 focus:bg-slate-800 outline-none transition font-bold text-white placeholder-slate-600" placeholder="77-000-000" />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Security Password</label>
                <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-8 py-5 rounded-[2rem] bg-slate-800/40 border-2 border-slate-700/50 focus:border-emerald-500 outline-none transition font-bold text-white" placeholder="••••••••" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Verify Password</label>
                <input required type="password" value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} className="w-full px-8 py-5 rounded-[2rem] bg-slate-800/40 border-2 border-slate-700/50 focus:border-emerald-500 outline-none transition font-bold text-white" placeholder="••••••••" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Residential Address</label>
                <textarea required rows={4} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-8 py-5 rounded-[2rem] bg-slate-800/40 border-2 border-slate-700/50 focus:border-emerald-500 outline-none transition font-bold text-white resize-none placeholder-slate-600" placeholder="Enter Full Home Address" />
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col items-center gap-8 border-t border-white/5">
            <button type="submit" className="w-full bg-emerald-600 text-white py-6 rounded-[2.5rem] font-black text-xl hover:bg-emerald-500 transition-all shadow-2xl shadow-emerald-900/40 flex items-center justify-center gap-4 group active:scale-95">
              <i className="fa-solid fa-user-plus"></i> Join Auto-Veritas
            </button>
            <div className="flex gap-10">
              <Link to="/" className="text-slate-500 hover:text-emerald-500 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all group">
                <i className="fa-solid fa-arrow-left group-hover:-translate-x-1 transition-transform"></i>
                Homepage
              </Link>
              <Link to="/signin" className="text-slate-500 hover:text-emerald-500 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all">
                Existing User? Sign In
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignUp;
