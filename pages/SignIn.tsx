
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '../constants';
import { User, UserRole } from '../types';
import { db } from '../services/mockDb';

const SignIn: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
  const [identifier, setIdentifier] = useState(''); // Email or Badge ID
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    let detectedRole: UserRole | null = null;
    let path = '';

    // Role detection based on specialized passwords
    if (password === 'Inhuman12') {
      // Admin specific check
      if (identifier !== 'adminsl@gmail.com') {
        setError('Access Denied: Only adminsl@gmail.com is authorized for Admin access.');
        return;
      }
      detectedRole = UserRole.ADMIN;
      path = '/dashboard/admin';
    } else if (password === 'SLRSA001') {
      detectedRole = UserRole.LICENSE_DEPT;
      path = '/dashboard/license';
    } else if (password === 'SLRSA002') {
      detectedRole = UserRole.INSURANCE_DEPT;
      path = '/dashboard/insurance';
    } else if (password === 'SLRSA003') {
      detectedRole = UserRole.FINANCE_DEPT;
      path = '/dashboard/finance';
    } else if (/^SLP(11[2-9]|12[0-9]|130)$/.test(password)) {
      detectedRole = UserRole.LAW_ENFORCER;
      path = '/dashboard/law-enforcer';
    } else {
      detectedRole = UserRole.CITIZEN;
      path = '/dashboard/citizen';
    }

    // Validation
    const existingUser = db.getUsers().find(u => {
      const isCorrectId = (u.email === identifier || u.badgeNumber === identifier);
      return isCorrectId && u.password === password;
    });
    
    if (!existingUser) {
      setError('Invalid credentials. Check your ID/Email and password.');
      return;
    }

    if (existingUser.isActive === false) {
      setError('Account Deactivated: Access suspended by System Administrator.');
      return;
    }

    db.recordLogin(existingUser);
    
    const sessionUser = { ...existingUser };
    if (existingUser.role === UserRole.ADMIN && detectedRole && detectedRole !== UserRole.ADMIN) {
      sessionUser.role = detectedRole;
    }

    onLogin(sessionUser);
    navigate(path);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden transition-all duration-700">
      {/* GIF BACKGROUND */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url("https://media.giphy.com/media/p9BxvbfMnqlAk/giphy.gif")' }}
      ></div>
      
      {/* DARK OVERLAY FOR READABILITY */}
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] z-[1]"></div>

      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none z-[2]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-[#FFD700]/10 rounded-full blur-[100px] pointer-events-none z-[2]"></div>

      <div className="max-w-md w-full bg-white/95 backdrop-blur-xl rounded-[3.5rem] shadow-[0_32px_120px_-20px_rgba(0,0,0,0.5)] p-12 border border-white/20 relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="mb-12 text-center">
          <Logo size="lg" textClassName="text-2xl text-emerald-500" />
          <h2 className="text-4xl font-black mt-8 text-slate-900 tracking-tighter">Sign In</h2>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="h-px w-8 bg-[#FFD700]"></span>
            <p className="text-slate-500 font-black uppercase text-[10px] tracking-[0.3em]">Digital Registry</p>
            <span className="h-px w-8 bg-[#FFD700]"></span>
          </div>
        </div>

        {error && (
          <div className="mb-10 p-5 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-2xl text-xs font-bold animate-in slide-in-from-top-2">
            <i className="fa-solid fa-circle-exclamation mr-2"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-8">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Identifier</label>
            <div className="relative group">
              <i className="fa-solid fa-id-card absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#004C97] transition-colors"></i>
              <input 
                type="text" 
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full pl-14 pr-6 py-5 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-[#004C97] focus:bg-white outline-none transition font-bold shadow-inner"
                placeholder="Email or Badge ID"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Access Key</label>
            <div className="relative group">
              <i className="fa-solid fa-key absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#004C97] transition-colors"></i>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-14 pr-6 py-5 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-[#004C97] focus:bg-white outline-none transition font-bold shadow-inner"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button type="submit" className="w-full bg-[#0a192f] text-white py-6 rounded-[2rem] font-black text-xl hover:bg-black transition-all shadow-2xl shadow-blue-900/40 active:scale-95 flex items-center justify-center gap-3 group">
            <i className="fa-solid fa-shield-check group-hover:rotate-12 transition-transform"></i>
            Authenticate
          </button>
        </form>

        <div className="mt-12 pt-10 border-t border-slate-100 flex flex-col items-center gap-5">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">
            Law Enforcement: Use your assigned <span className="text-emerald-600">SLP Range Key</span> for tactical access.
          </p>
          <Link to="/signup" className="text-[#004C97] font-black text-xs uppercase tracking-widest hover:text-emerald-600 transition-colors">
            Register New Account
          </Link>
          <Link to="/" className="text-slate-400 hover:text-slate-600 font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-colors">
            <i className="fa-solid fa-house text-[10px]"></i>
            Homepage
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
