import React from 'react';
import { Link } from 'react-router-dom';

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950 font-sans pb-24 text-white">
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden bg-slate-900">
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center opacity-40 scale-110"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1449965072335-65788494f271?auto=format&fit=crop&q=80&w=2000")' }} 
        />
        <div className="relative z-10 text-center px-6">
          <div className="inline-block bg-emerald-500 text-slate-900 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.4em] mb-8">
            Established 2026
          </div>
          <h1 className="text-7xl md:text-9xl font-black text-white tracking-tighter mb-6 leading-none">
            Auto-Veritas
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 max-w-2xl mx-auto font-medium leading-relaxed tracking-tight">
            Redefining vehicle governance in Sierra Leone through unified digital intelligence.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 -mt-32 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Mission Card */}
          <div className="lg:col-span-2 bg-slate-900 rounded-[4rem] p-16 shadow-2xl border border-slate-800">
            <h2 className="text-5xl font-black text-white mb-10 tracking-tighter">Our Digital Mission</h2>
            <div className="space-y-8 text-xl text-slate-400 leading-relaxed font-medium">
              <p>
                Auto-Veritas was born out of a critical necessity to modernize the <span className="text-emerald-500 font-bold">Sierra Leone Road Safety Authority (SLRSA)</span>. 
                For decades, vehicle registration and verification relied on archaic paperwork, leading to inefficiencies, lost records, and enforcement challenges.
              </p>
              <p>
                Developed specifically for SLRSA workers and Law Enforcers, our platform provides a "Franchise System" architecture. 
                This means every department—from License to Finance—operates within a single, unified source of truth, 
                eliminating redundant data entry and ensuring real-time compliance tracking across the nation.
              </p>
              <div className="pt-8 border-t border-slate-800 flex items-center gap-8">
                <div className="text-center">
                  <p className="text-4xl font-black text-white">100%</p>
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Paperless Goal</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-black text-white">24/7</p>
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Audit Accuracy</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-black text-white">300ms</p>
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Query Response</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tech Stack Card */}
          <div className="bg-slate-900 rounded-[4rem] p-16 text-white shadow-2xl border border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
            <h3 className="text-3xl font-black mb-12 tracking-tight flex items-center gap-4">
              <i className="fa-solid fa-microchip text-emerald-500"></i>
              Core Technology
            </h3>
            <div className="space-y-10">
              <TechItem icon="fa-leaf" label="MongoDB" desc="Scalable document storage for millions of vehicle records and logs." />
              <TechItem icon="fa-server" label="Express & Node" desc="High-performance backend API serving real-time requests to the field." />
              <TechItem icon="fa-react" label="React.js" desc="Dynamic, responsive interface for field officers and administrative staff." />
              <TechItem icon="fa-shield-halved" label="IOS 26" desc="Compliant with the latest digital governance and security protocols." />
            </div>
          </div>
        </div>

        {/* Governance Section */}
        <section className="mt-24">
          <div className="text-center mb-16">
            <h2 className="text-6xl font-black text-white tracking-tighter mb-4">A Multi-Tiered System</h2>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Empowering every wing of the authority</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <AboutFeature icon="fa-id-card" title="License Dept" desc="Renew, register, and manage vehicle identities with zero physical forms." />
            <AboutFeature icon="fa-building-shield" title="Insurance Dept" desc="Real-time policy verification linked to national insurance providers." />
            <AboutFeature icon="fa-vault" title="Finance Dept" desc="Automated revenue collection and auditing via Orange/AfriMoney." />
            <AboutFeature icon="fa-user-shield" title="Law Enforcers" desc="Instant roadside verification for police and safety wardens." />
          </div>
        </section>

        <div className="mt-24 text-center">
          <Link to="/" className="inline-flex items-center gap-3 bg-white text-slate-900 px-12 py-6 rounded-[2.5rem] font-black text-xl hover:bg-emerald-500 hover:text-white transition shadow-2xl group">
            <i className="fa-solid fa-arrow-left group-hover:-translate-x-1 transition-transform"></i>
            Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
};

const TechItem: React.FC<{ icon: string, label: string, desc: string }> = ({ icon, label, desc }) => (
  <div className="group">
    <div className="flex items-center gap-4 mb-2">
      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-slate-900 transition-colors">
        <i className={`fa-solid ${icon}`}></i>
      </div>
      <p className="text-lg font-black">{label}</p>
    </div>
    <p className="text-sm text-slate-400 leading-relaxed pl-14">{desc}</p>
  </div>
);

const AboutFeature: React.FC<{ icon: string, title: string, desc: string }> = ({ icon, title, desc }) => (
  <div className="bg-slate-900 p-12 rounded-[3.5rem] border border-slate-800 shadow-xl hover:-translate-y-4 transition-all duration-500 group">
    <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-500 text-2xl mb-8 group-hover:bg-emerald-600 group-hover:text-white transition-all">
      <i className={`fa-solid ${icon}`}></i>
    </div>
    <h4 className="text-2xl font-black text-white mb-4 tracking-tight">{title}</h4>
    <p className="text-slate-400 font-medium leading-relaxed">{desc}</p>
  </div>
);

export default About;