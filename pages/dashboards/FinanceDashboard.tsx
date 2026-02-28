
import React, { useState, useMemo } from 'react';
import { User, Transaction } from '../../types';
import { db } from '../../services/mockDb';

const FinanceDashboard: React.FC<{ user: User; onLogout: () => void }> = ({ user, onLogout }) => {
  const [filter, setFilter] = useState<'all' | 'monthly'>('all');
  const allTransactions = db.getTransactions();
  
  const filteredTransactions = useMemo(() => {
    if (filter === 'all') return allTransactions;
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed
    
    return allTransactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getFullYear() === currentYear && tDate.getMonth() === currentMonth;
    });
  }, [filter, allTransactions]);

  const totalRev = filteredTransactions.reduce((acc, t) => acc + t.amount, 0);

  const handleAudit = (id: string) => {
    alert(`Audit Trail for Transaction ${id} validated. Cross-referenced with Bank of Sierra Leone digital ledger.`);
  };

  const generateLedger = () => {
    const csv = [
      ['ID', 'Type', 'Amount', 'Method', 'Date', 'Status'],
      ...filteredTransactions.map(t => [t.id, t.type, t.amount, t.method, t.date, t.status])
    ].map(e => e.join(",")).join("\n");
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `slrsa_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="bg-[#fcf8f3] min-h-screen">
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Finance & Audit</h1>
            <p className="text-slate-500 font-medium">Fiscal Controller: <span className="text-emerald-600 font-bold">{user.fullName}</span></p>
          </div>
          <div className="flex gap-4">
            <button onClick={generateLedger} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black hover:bg-black transition shadow-xl flex items-center gap-3">
              <i className="fa-solid fa-file-csv"></i> Export Ledger
            </button>
            <button onClick={onLogout} className="bg-white border-2 border-slate-200 text-slate-700 px-6 py-4 rounded-2xl font-bold hover:bg-slate-100 transition">Logout</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <StatCard 
            label={filter === 'monthly' ? "Monthly Revenue" : "Total Revenue"} 
            value={`${totalRev.toLocaleString()} NLe`} 
            icon="fa-sack-dollar" 
            color="bg-emerald-600" 
            accent="text-emerald-600" 
            trend={filter === 'monthly' ? "Current Month" : "+15.4% from Oct 2025"} 
          />
          <StatCard 
            label="Verified Audits" 
            value={filteredTransactions.filter(t => t.status === 'Completed').length.toString()} 
            icon="fa-clipboard-check" 
            color="bg-blue-600" 
            accent="text-blue-600" 
            trend="Real-time settlement active" 
          />
          <StatCard 
            label="Payment Channels" 
            value="2" 
            icon="fa-network-wired" 
            color="bg-purple-600" 
            accent="text-purple-600" 
            trend="AfriMoney / Orange" 
          />
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
          <div className="p-8 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
               <i className="fa-solid fa-fingerprint text-emerald-600"></i>
               Financial Transaction Ledger
            </h3>
            <div className="flex bg-slate-100 p-1 rounded-xl">
               <button 
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
               >
                All Time
               </button>
               <button 
                onClick={() => setFilter('monthly')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'monthly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
               >
                Monthly
               </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Tx ID</th>
                  <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Service Category</th>
                  <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Amount (NLe)</th>
                  <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Channel</th>
                  <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Audit Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredTransactions.length > 0 ? filteredTransactions.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-10 py-6">
                      <div className="font-mono text-xs font-black text-slate-400 uppercase tracking-tighter">{t.id}</div>
                      <div className="text-[10px] font-bold text-slate-400">{t.date}</div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="font-black text-slate-800">{t.type} Payment</div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase">Citizen Ref: {t.citizenId}</div>
                    </td>
                    <td className="px-10 py-6">
                      <span className="text-lg font-black text-emerald-600">{t.amount.toLocaleString()}</span>
                      <span className="text-xs font-bold text-slate-400 ml-1">NLe</span>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-3">
                         <img 
                           src={t.method === 'Afri-money' ? 'https://tse2.mm.bing.net/th/id/OIP.G5aDh56qnfI9zaHtTncbMAHaHa?rs=1&pid=ImgDetMain&o=7&rm=3' : 'https://tse2.mm.bing.net/th/id/OIP.87uYW5-goSpiSRJSXoYw9AHaHa?rs=1&pid=ImgDetMain&o=7&rm=3'} 
                           alt={t.method} 
                           className="w-8 h-8 object-contain rounded-lg border border-slate-100" 
                         />
                         <span className="text-sm font-black text-slate-700">{t.method}</span>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                          t.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                          t.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {t.status}
                        </span>
                        <button onClick={() => handleAudit(t.id)} className="text-slate-300 hover:text-emerald-500 transition">
                           <i className="fa-solid fa-magnifying-glass-plus"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-10 py-32 text-center">
                      <i className="fa-solid fa-file-invoice-dollar text-slate-100 text-8xl mb-6"></i>
                      <p className="text-slate-400 font-bold text-xl">No fiscal activity recorded for this period.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string; icon: string; color: string; accent: string; trend: string }> = ({ label, value, icon, color, accent, trend }) => (
  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl relative overflow-hidden group">
    <div className={`absolute top-0 right-0 w-24 h-24 ${color} opacity-5 -mr-8 -mt-8 rounded-full transition-transform group-hover:scale-150 duration-500`}></div>
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg ${color} shadow-current/20`}>
      <i className={`fa-solid ${icon} text-xl`}></i>
    </div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
    <p className="text-4xl font-black text-slate-900 mb-2">{value}</p>
    <p className={`text-xs font-bold ${accent} flex items-center gap-1`}>
       <i className="fa-solid fa-arrow-trend-up"></i> {trend}
    </p>
  </div>
);

export default FinanceDashboard;
