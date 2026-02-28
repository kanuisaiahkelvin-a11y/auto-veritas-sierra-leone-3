
import React, { useState } from 'react';
import { db } from '../services/mockDb';
import { Vehicle } from '../types';

const Home: React.FC = () => {
  const [search, setSearch] = useState('');
  const [result, setResult] = useState<Vehicle | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const found = db.getVehicles().find(v => v.plateNumber.toLowerCase() === search.toLowerCase() || v.vin.toLowerCase() === search.toLowerCase());
    setResult(found || null);
    setSearched(true);
  };

  return (
    <div className="relative min-h-screen font-sans bg-[#fcf8f3] dark:bg-[#0a192f] transition-colors duration-700 selection:bg-emerald-200 overflow-x-hidden">
      {/* PERSISTENT GLASSMISM BACKGROUND ELEMENT WITH REQUESTED IMAGE - BRIGHTENED */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-75 dark:opacity-60 pointer-events-none scale-110 transition-all duration-1000 brightness-110"
        style={{ backgroundImage: 'url("https://dm0qx8t0i9gc9.cloudfront.net/thumbnails/video/msqd2XJ/videoblocks-police-officer-stopping-the-driver-of-a-vehicle-and-questioning-him-over-an-alleged-offence-through-the-open-window-of-the-car_h54wsdg6w_thumbnail-1080_01.png")' }} 
      />
      
      {/* DYNAMIC VIGNETTE OVERLAYS */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#fcf8f3]/10 via-transparent to-emerald-100/5 dark:from-[#0a192f]/30 dark:via-transparent dark:to-blue-900/10 z-[1] pointer-events-none transition-colors duration-700"></div>
      <div className="fixed inset-0 backdrop-blur-[4px] z-[2] pointer-events-none"></div>

      <div className="relative z-10">
        {/* HERO SECTION */}
        <section className="min-h-screen flex flex-col items-center justify-center px-6 py-32 text-center">
          {/* Glass Badge */}
          <div className="inline-flex items-center gap-3 bg-white/20 dark:bg-white/10 backdrop-blur-3xl text-emerald-900 dark:text-emerald-400 px-10 py-4 rounded-full text-[11px] font-black uppercase tracking-[0.4em] mb-14 shadow-2xl border border-white/40 dark:border-white/10 animate-in fade-in slide-in-from-top-8 duration-1000">
            <i className="fa-solid fa-shield-halved text-emerald-600"></i> SLRSA Digital Enforcement Node
          </div>
          
          <h1 className="text-8xl md:text-[9rem] font-black text-slate-900 dark:text-white mb-10 tracking-tighter leading-[0.85] transition-colors animate-in fade-in slide-in-from-bottom-4 duration-1000 drop-shadow-sm">
            Auto-Veritas <span className="text-emerald-700 dark:text-emerald-600 drop-shadow-[0_10px_10px_rgba(16,185,129,0.15)]">Registration System</span>
          </h1>
          
          <p className="text-2xl md:text-3xl text-slate-800 dark:text-slate-200 mb-20 max-w-5xl mx-auto font-black leading-relaxed tracking-tight transition-colors bg-white/30 dark:bg-black/20 backdrop-blur-md inline-block px-10 py-4 rounded-[2rem]">
            Unified digital intelligence for the Sierra Leone Road Safety Authority.
          </p>

          {/* THE ULTIMATE GLASS SEARCH BAR */}
          <div className="w-full max-w-5xl mx-auto relative group">
            {/* Background Glow */}
            <div className="absolute -inset-10 bg-gradient-to-r from-emerald-500/30 via-blue-500/20 to-emerald-500/30 rounded-[5rem] blur-[120px] opacity-40 group-hover:opacity-60 transition duration-1000"></div>
            
            <form onSubmit={handleSearch} className="relative flex flex-col md:flex-row gap-6 p-6 bg-white/40 dark:bg-white/10 backdrop-blur-[100px] rounded-[4rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] dark:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.4)] border border-white/40 dark:border-white/20 transition-all">
              <div className="flex-grow relative flex items-center">
                <i className="fa-solid fa-magnifying-glass absolute left-10 text-slate-600 dark:text-slate-500 text-3xl"></i>
                <input 
                  type="text" 
                  placeholder="Enter Plate Number or VIN..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-24 pr-10 py-9 bg-transparent outline-none text-3xl font-black text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-700 transition-colors"
                />
              </div>
              <button type="submit" className="bg-slate-900 dark:bg-emerald-600 text-white px-20 py-8 rounded-[3rem] font-black text-2xl hover:bg-black dark:hover:bg-emerald-500 transition-all shadow-[0_20px_60px_-10px_rgba(0,0,0,0.4)] active:scale-95 flex items-center justify-center gap-5 border border-white/20">
                <i className="fa-solid fa-fingerprint"></i> Verify
              </button>
            </form>
          </div>

          {/* SEARCH RESULT PANEL - Deep Glass */}
          {searched && (
            <div className="mt-20 w-full max-w-5xl mx-auto bg-white/60 dark:bg-white/10 backdrop-blur-[120px] p-20 rounded-[6rem] shadow-[0_60px_150px_-30px_rgba(0,0,0,0.2)] text-left animate-in fade-in zoom-in-95 duration-700 border border-white/60 dark:border-white/20 relative overflow-hidden">
              {/* Inner ambient glow */}
              <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none"></div>
              
              {result ? (
                <div className="relative z-10">
                  <div className="absolute -top-10 -right-10 w-36 h-36 bg-white/80 dark:bg-white/20 backdrop-blur-3xl rounded-full flex items-center justify-center text-emerald-600 border-[12px] border-[#fcf8f3] dark:border-[#0a192f] shadow-2xl transition-all">
                    <i className="fa-solid fa-circle-check text-5xl"></i>
                  </div>
                  
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-10">
                    <div>
                      <h3 className="text-[12px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-[0.5em] mb-4">Official Registry Record</h3>
                      <p className="text-7xl font-black text-slate-900 dark:text-white tracking-tighter leading-none transition-colors">{result.make} {result.model}</p>
                    </div>
                    <span className={`px-10 py-5 rounded-[2rem] text-[12px] font-black uppercase tracking-[0.3em] backdrop-blur-md border shadow-xl ${result.status === 'Active' ? 'bg-emerald-500/40 text-emerald-950 dark:text-emerald-400 border-emerald-500/50' : 'bg-red-500/40 text-red-950 dark:text-red-400 border-red-500/50'}`}>
                      {result.status} Status
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-10">
                      <GlassInfoItem label="Plate Identity" value={result.plateNumber} />
                      <GlassInfoItem label="Legal Ownership" value={result.ownerName} />
                    </div>
                    <div className="space-y-10">
                      <GlassInfoItem label="License Validity" value={result.licenseExpiry} highlight="emerald" />
                      <GlassInfoItem label="Policy Status" value={result.insuranceProvider} highlight="blue" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-24 relative z-10">
                  <div className="w-32 h-32 bg-white/40 dark:bg-white/10 backdrop-blur-3xl text-red-600 rounded-full flex items-center justify-center mx-auto mb-12 border border-white/60 dark:border-white/20 shadow-inner">
                    <i className="fa-solid fa-triangle-exclamation text-6xl"></i>
                  </div>
                  <h4 className="text-6xl font-black text-slate-900 dark:text-white mb-6 tracking-tighter transition-colors">Record Not Found</h4>
                  <p className="text-slate-700 dark:text-slate-400 font-black text-2xl max-w-md mx-auto leading-relaxed tracking-tight">The credentials provided do not match our centralized sovereign database.</p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* SERVICE CARDS SECTION - COMPREHENSIVE GLASS LOOK */}
        <section className="py-48 px-6 relative bg-white/20 dark:bg-black/20 backdrop-blur-[30px] border-y border-white/40">
          <div className="max-w-7xl mx-auto text-center">
            <h2 className="text-8xl font-black text-slate-900 dark:text-white mb-10 tracking-tighter leading-none transition-colors">
              Governance <span className="text-blue-700 dark:text-blue-600">Reimagined</span>
            </h2>
            <p className="text-2xl md:text-3xl text-slate-800 dark:text-slate-300 max-w-4xl mx-auto mb-32 font-black leading-relaxed tracking-tight transition-colors">
              Deploying advanced digital protocols to secure the roads of Sierra Leone. 
              One system, one source of truth.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
              <ServiceGlassCard 
                icon="fa-car-side" 
                color="bg-emerald-600" 
                title="Asset Registry" 
                desc="End-to-end digital lifecycle management for every vehicle in the national territory."
                items={["Zero-Paper Enrollment", "Encrypted VIN Ledger"]}
              />
              <ServiceGlassCard 
                icon="fa-id-card" 
                color="bg-blue-600" 
                title="Credential Hub" 
                desc="Secured licensing protocols linked directly to the national biometric database."
                items={["iOS Mobile Wallet", "Automatic Renewals"]}
              />
              <ServiceGlassCard 
                icon="fa-building-shield" 
                color="bg-purple-600" 
                title="Policy Shield" 
                desc="Integrated risk verification system in partnership with top national insurers."
                items={["Underwriting API", "Coverage Monitoring"]}
              />
            </div>
          </div>
        </section>

        {/* FEATURE CARDS - MINI GLASS PANELS */}
        <section className="py-48 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-24">
              <FeatureGlassItem 
                icon="fa-shield-halved" 
                title="Sovereign Cloud" 
                desc="Records are secured with military-grade encryption within our domestic cloud." 
              />
              <FeatureGlassItem 
                icon="fa-bolt-lightning" 
                title="Instant Response" 
                desc="Optimized for real-time field operations with sub-300ms query latency." 
              />
              <FeatureGlassItem 
                icon="fa-fingerprint" 
                title="Unified ID" 
                desc="Seamless integration with the National Identification Registry (NIR)." 
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

const GlassInfoItem: React.FC<{ label: string; value: string; highlight?: 'emerald' | 'blue' }> = ({ label, value, highlight }) => (
  <div className="p-10 bg-white/40 dark:bg-white/10 backdrop-blur-2xl rounded-[3rem] border border-white/60 dark:border-white/20 shadow-sm group hover:scale-[1.02] transition-all duration-500">
    <p className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase mb-4 tracking-[0.4em]">{label}</p>
    <p className={`text-4xl font-black transition-colors ${
      highlight === 'emerald' ? 'text-emerald-800 dark:text-emerald-400' : 
      highlight === 'blue' ? 'text-blue-800 dark:text-blue-400' : 
      'text-slate-900 dark:text-slate-200'
    }`}>
      {value}
    </p>
  </div>
);

const ServiceGlassCard: React.FC<{ icon: string; color: string; title: string; desc: string; items: string[] }> = ({ icon, color, title, desc, items }) => (
  <div className="bg-white/40 dark:bg-white/10 backdrop-blur-3xl rounded-[5rem] p-20 shadow-[0_20px_50px_rgba(0,0,0,0.1)] text-left flex flex-col items-start transition-all hover:-translate-y-6 hover:bg-white/50 dark:hover:bg-white/20 duration-700 border border-white/60 dark:border-white/20 group">
    <div className={`w-28 h-28 ${color} rounded-[2.5rem] flex items-center justify-center text-white text-4xl mb-14 shadow-2xl shadow-current/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
      <i className={`fa-solid ${icon}`}></i>
    </div>
    <h3 className="text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tighter transition-colors">{title}</h3>
    <p className="text-slate-800 dark:text-slate-300 font-black text-xl mb-16 leading-relaxed tracking-tight transition-colors">
      {desc}
    </p>
    <ul className="space-y-6 w-full">
      {items.map((item, idx) => (
        <li key={idx} className="flex items-center gap-6 text-slate-900 dark:text-slate-200 font-black text-xs uppercase tracking-[0.2em]">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center bg-white/60 dark:bg-white/20 text-slate-600 group-hover:bg-emerald-600 group-hover:text-white transition-all border border-white/60 dark:border-white/20 shadow-md`}>
            <i className="fa-solid fa-check"></i>
          </div>
          {item}
        </li>
      ))}
    </ul>
  </div>
);

const FeatureGlassItem: React.FC<{ icon: string; title: string; desc: string }> = ({ icon, title, desc }) => (
  <div className="group text-center md:text-left">
    <div className="bg-white/40 dark:bg-white/10 backdrop-blur-2xl w-32 h-32 rounded-[3rem] flex items-center justify-center mb-14 mx-auto md:mx-0 transition-all group-hover:bg-emerald-600 group-hover:text-white group-hover:shadow-3xl group-hover:-translate-y-4 group-hover:rotate-6 duration-700 border border-white/60 dark:border-white/20 shadow-lg">
      <i className={`fa-solid ${icon} text-6xl`}></i>
    </div>
    <h4 className="text-5xl font-black text-slate-900 dark:text-white mb-8 tracking-tighter leading-none transition-colors">{title}</h4>
    <p className="text-slate-800 dark:text-slate-300 font-black text-2xl leading-relaxed tracking-tight transition-colors bg-white/30 dark:bg-black/20 backdrop-blur-sm inline-block px-4 py-2 rounded-xl">{desc}</p>
  </div>
);

export default Home;
