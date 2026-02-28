
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { User, UserRole } from './types';
import { db } from './services/mockDb';
import Home from './pages/Home';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import About from './pages/About';
import Help from './pages/Help';
import CitizenDashboard from './pages/dashboards/CitizenDashboard';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import LicenseDashboard from './pages/dashboards/LicenseDashboard';
import InsuranceDashboard from './pages/dashboards/InsuranceDashboard';
import FinanceDashboard from './pages/dashboards/FinanceDashboard';
import LawEnforcerDashboard from './pages/dashboards/LawEnforcerDashboard';
import { Logo, MovingVehicle } from './constants';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  const logout = () => {
    setUser(null);
  };

  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col bg-white dark:bg-[#0a192f] transition-colors duration-700">
        <Navbar user={user} onLogout={logout} />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/signin" element={<SignIn onLogin={setUser} />} />
            <Route path="/signup" element={<SignUp onSignup={setUser} />} />
            <Route path="/about" element={<About />} />
            <Route path="/help" element={<Help />} />
            
            {/* Protected Routes */}
            <Route path="/dashboard/citizen" element={user?.role === UserRole.CITIZEN ? <CitizenDashboard user={user} onLogout={logout} /> : <Navigate to="/" />} />
            <Route path="/dashboard/admin" element={user?.role === UserRole.ADMIN ? <AdminDashboard user={user} onLogout={logout} /> : <Navigate to="/" />} />
            <Route path="/dashboard/license" element={user?.role === UserRole.LICENSE_DEPT ? <LicenseDashboard user={user} onLogout={logout} /> : <Navigate to="/" />} />
            <Route path="/dashboard/insurance" element={user?.role === UserRole.INSURANCE_DEPT ? <InsuranceDashboard user={user} onLogout={logout} /> : <Navigate to="/" />} />
            <Route path="/dashboard/finance" element={user?.role === UserRole.FINANCE_DEPT ? <FinanceDashboard user={user} onLogout={logout} /> : <Navigate to="/" />} />
            <Route path="/dashboard/law-enforcer" element={user?.role === UserRole.LAW_ENFORCER ? <LawEnforcerDashboard user={user} onLogout={logout} /> : <Navigate to="/" />} />

            <Route path="/terms" element={<SimplePage title="Terms and Conditions" content="By using the Auto-Veritas platform, you agree to comply with the Sierra Leone Road Safety Act 2026. All data submitted is subject to verification by the License, Insurance, and Finance departments. Unauthorized access is strictly prohibited under the Digital Governance laws of Sierra Leone." />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </HashRouter>
  );
};

const Navbar: React.FC<{ user: User | null; onLogout: () => void }> = ({ user, onLogout }) => {
  return (
    <nav className="bg-black px-4 py-3 sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Logo size="sm" textClassName="text-sm text-white" />
        </Link>

        <div className="hidden md:block">
          <MovingVehicle />
        </div>

        <div className="flex items-center gap-6">
          <Link to="/about" className="text-white hover:text-emerald-400 font-bold transition text-sm uppercase tracking-wider">About</Link>
          <Link to="/help" className="text-white hover:text-emerald-400 font-bold transition text-sm uppercase tracking-wider">Help</Link>
          {!user ? (
            <>
              <Link to="/signin" className="text-white hover:text-emerald-400 font-bold transition text-sm uppercase tracking-wider">Sign In</Link>
              <Link to="/signup" className="bg-emerald-600 text-white px-5 py-2 rounded-xl font-bold hover:bg-emerald-700 transition shadow-lg shadow-emerald-600/20 text-sm uppercase tracking-wider">Sign Up</Link>
            </>
          ) : (
            <button onClick={onLogout} className="text-red-400 font-bold flex items-center gap-2 hover:bg-red-950/30 px-4 py-2 rounded-xl transition text-sm uppercase tracking-wider">
              <i className="fa-solid fa-right-from-bracket"></i>
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

const Footer: React.FC = () => (
  <footer className="bg-slate-900 relative z-[20] text-white py-16 px-6 shadow-[0_-10px_50px_-15px_rgba(0,0,0,0.5)]">
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
             <Logo size="sm" />
             <h3 className="text-2xl font-black tracking-tight">Auto-Veritas</h3>
          </div>
          <p className="text-slate-400 leading-relaxed font-black">
            Sierra Leone's official unified digital platform for vehicle governance. Modernizing the SLRSA for a safer, paperless tomorrow.
          </p>
        </div>
        
        <div className="space-y-4">
          <h4 className="font-black text-xs uppercase tracking-[0.2em] text-emerald-500">Department Portals</h4>
          <ul className="space-y-2 text-slate-400 font-black text-sm">
            <li><Link to="/signin" className="hover:text-white transition">License Department</Link></li>
            <li><Link to="/signin" className="hover:text-white transition">Insurance Department</Link></li>
            <li><Link to="/signin" className="hover:text-white transition">Finance Department</Link></li>
            <li><Link to="/signin" className="hover:text-white transition">Law Enforcement</Link></li>
          </ul>
        </div>

        <div className="space-y-4">
          <h4 className="font-black text-xs uppercase tracking-[0.2em] text-emerald-500">Legal Notes</h4>
          <p className="text-xs text-slate-400 leading-relaxed font-black italic">
            * Terms and Conditions Apply. By accessing this system, all personnel and citizens consent to digital record verification. 
            All financial transactions are audited by the Ministry of Finance.
          </p>
          <Link to="/terms" className="inline-block text-emerald-500 font-black text-xs uppercase tracking-widest hover:underline">
            View Full T&C's
          </Link>
        </div>
      </div>
      
      <div className="border-t border-white/5 pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="text-slate-500 text-sm font-black">
          &copy; 2026 Sierra Leone Road Safety Authority. All rights reserved.
        </p>
        <div className="flex gap-8">
          <Link to="/help" className="text-slate-500 hover:text-white text-xs font-black uppercase tracking-widest transition">Support</Link>
          <a href="https://www.slrsa.gov.sl" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-white text-xs font-black uppercase tracking-widest transition">About SLRSA</a>
          <a href="#" className="text-slate-500 hover:text-white text-xs font-black uppercase tracking-widest transition">Privacy Policy</a>
        </div>
      </div>
    </div>
  </footer>
);

const SimplePage: React.FC<{ title: string; content: string }> = ({ title, content }) => (
  <div className="max-w-4xl mx-auto py-24 px-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
    <div className="mb-8 inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
       <i className="fa-solid fa-circle-info"></i> Official Information
    </div>
    <h1 className="text-6xl font-black text-slate-900 mb-8 tracking-tighter">{title}</h1>
    <div className="bg-[#fcf8f3] p-12 rounded-[3rem] shadow-2xl border border-slate-100">
      <p className="text-xl text-slate-600 leading-relaxed font-medium">{content}</p>
    </div>
    <Link to="/" className="inline-flex items-center gap-3 mt-12 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black hover:bg-black transition shadow-xl group">
      <i className="fa-solid fa-arrow-left group-hover:-translate-x-1 transition-transform"></i>
      Back to Homepage
    </Link>
  </div>
);

export default App;
