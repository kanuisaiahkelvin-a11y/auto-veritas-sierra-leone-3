
import React, { useState, useMemo, useEffect } from 'react';
import { User, Vehicle, Transaction } from '../../types';
import { db } from '../../services/mockDb';

interface Notification {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  time: string;
}

const InsuranceDashboard: React.FC<{ user: User; onLogout: () => void }> = ({ user, onLogout }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>(db.getVehicles());
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingVin, setEditingVin] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedVins, setSelectedVins] = useState<string[]>([]);
  
  const [form, setForm] = useState({
    vin: '',
    plate: '',
    provider: 'Ritcorp',
    expiry: '',
    owner: ''
  });

  const [notifications, setNotifications] = useState<Notification[]>([
    { id: '1', message: 'Insurance premium rates updated for 2026', type: 'info', time: '1h ago' },
    { id: '2', message: 'Quarterly compliance audit scheduled', type: 'warning', time: '3h ago' }
  ]);

  const pendingPayments = db.getTransactions().filter(t => t.type === 'Insurance' && t.status === 'Pending');

  // Sync notifications with pending payments
  useEffect(() => {
    if (pendingPayments.length > 0) {
      const last = pendingPayments[pendingPayments.length - 1];
      const newNotif: Notification = {
        id: last.id,
        message: `New Insurance Payment: ${last.amount} NLe from Citizen ID ${last.citizenId}`,
        type: 'success',
        time: 'Just now'
      };
      setNotifications(prev => [newNotif, ...prev.slice(0, 4)]);
    }
  }, [pendingPayments.length]);

  const handleEdit = (v: Vehicle) => {
    setEditMode(true);
    setEditingVin(v.vin);
    setForm({
      vin: v.vin,
      plate: v.plateNumber,
      provider: v.insuranceProvider,
      expiry: v.insuranceExpiry,
      owner: v.ownerName
    });
    setShowModal(true);
  };

  const handleRenew = (v: Vehicle) => {
    const currentExpiry = new Date(v.insuranceExpiry);
    // If expired, start from today, otherwise add to current expiry
    const baseDate = currentExpiry < new Date() ? new Date() : currentExpiry;
    const nextYear = new Date(baseDate.setFullYear(baseDate.getFullYear() + 1)).toISOString().split('T')[0];
    
    setEditMode(true);
    setEditingVin(v.vin);
    setForm({
      vin: v.vin,
      plate: v.plateNumber,
      provider: v.insuranceProvider,
      expiry: nextYear,
      owner: v.ownerName
    });
    setShowModal(true);
  };

  const handleDelete = (vin: string) => {
    if (confirm('CRITICAL: Permanently delete this vehicle record from the national registry due to non-renewal? This action cannot be undone.')) {
      db.deleteVehicle(vin);
      setVehicles([...db.getVehicles()]);
      setNotifications(prev => [{
        id: Date.now().toString(),
        message: `Record Purged: Vehicle (VIN: ${vin}) removed from registry.`,
        type: 'warning',
        time: 'Just now'
      }, ...prev]);
    }
  };

  const handleBulkRenew = async () => {
    if (selectedVins.length === 0) return;
    setIsProcessing(true);
    
    // Simulate API delay
    await new Promise(r => setTimeout(r, 1500));

    selectedVins.forEach(vin => {
      const v = vehicles.find(veh => veh.vin === vin);
      if (v) {
        const currentExpiry = new Date(v.insuranceExpiry);
        const baseDate = currentExpiry < new Date() ? new Date() : currentExpiry;
        const nextYear = new Date(baseDate.setFullYear(baseDate.getFullYear() + 1)).toISOString().split('T')[0];
        
        db.updateVehicle(vin, {
          insuranceExpiry: nextYear,
          status: 'Active'
        });
      }
    });

    setVehicles([...db.getVehicles()]);
    setSelectedVins([]);
    setIsProcessing(false);
    setNotifications(prev => [{
      id: Date.now().toString(),
      message: `Bulk Renewal Complete: ${selectedVins.length} policies extended.`,
      type: 'success',
      time: 'Just now'
    }, ...prev]);
  };

  const handleBulkDelete = () => {
    if (selectedVins.length === 0) return;
    if (confirm(`CRITICAL: Permanently delete ${selectedVins.length} vehicle records? This action cannot be undone.`)) {
      selectedVins.forEach(vin => db.deleteVehicle(vin));
      setVehicles([...db.getVehicles()]);
      setSelectedVins([]);
      setNotifications(prev => [{
        id: Date.now().toString(),
        message: `Bulk Purge: ${selectedVins.length} records removed from registry.`,
        type: 'warning',
        time: 'Just now'
      }, ...prev]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedVins.length === vehicles.length) {
      setSelectedVins([]);
    } else {
      setSelectedVins(vehicles.map(v => v.vin));
    }
  };

  const toggleSelect = (vin: string) => {
    setSelectedVins(prev => 
      prev.includes(vin) ? prev.filter(v => v !== vin) : [...prev, vin]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simulate API delay
    await new Promise(r => setTimeout(r, 1500));

    if (editMode && editingVin) {
      db.updateVehicle(editingVin, {
        insuranceProvider: form.provider,
        insuranceExpiry: form.expiry,
        ownerName: form.owner,
        status: new Date(form.expiry) > new Date() ? 'Active' : 'Expired'
      });
    } else {
      const existing = db.getVehicles().find(v => v.vin === form.vin);
      if (existing) {
        db.updateVehicle(form.vin, {
          insuranceProvider: form.provider,
          insuranceExpiry: form.expiry,
          status: new Date(form.expiry) > new Date() ? 'Active' : 'Expired'
        });
      } else {
        // Create new vehicle if it doesn't exist
        const newV: Vehicle = {
          vin: form.vin,
          plateNumber: form.plate,
          ownerName: form.owner,
          make: 'Pending',
          model: 'Pending',
          year: new Date().getFullYear(),
          licenseExpiry: new Date(Date.now() + 31536000000).toISOString().split('T')[0],
          insuranceExpiry: form.expiry,
          insuranceProvider: form.provider,
          status: new Date(form.expiry) > new Date() ? 'Active' : 'Expired',
          violationHistory: []
        };
        db.addVehicle(newV);
      }
    }

    setVehicles([...db.getVehicles()]);
    setIsProcessing(false);
    closeModal();
    setNotifications(prev => [{
      id: Date.now().toString(),
      message: `Policy ${editMode ? 'Updated' : 'Registered'}: ${form.plate} coverage verified.`,
      type: 'success',
      time: 'Just now'
    }, ...prev]);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditMode(false);
    setEditingVin(null);
    setForm({ vin: '', plate: '', provider: 'Ritcorp', expiry: '', owner: '' });
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Insurance Management</h1>
            <p className="text-slate-500 font-medium">Policy Officer: <span className="text-blue-600 font-black">{user.fullName}</span></p>
          </div>
          <div className="flex gap-4">
            {selectedVins.length > 0 && (
              <div className="flex gap-2 mr-4 animate-in slide-in-from-right-4">
                <button 
                  onClick={handleBulkRenew} 
                  disabled={isProcessing}
                  className="bg-emerald-600 text-white px-6 py-4 rounded-2xl font-black hover:bg-emerald-700 transition shadow-xl shadow-emerald-600/20 flex items-center gap-2 disabled:opacity-50"
                >
                  <i className="fa-solid fa-arrows-rotate"></i> Renew ({selectedVins.length})
                </button>
                <button 
                  onClick={handleBulkDelete} 
                  disabled={isProcessing}
                  className="bg-red-600 text-white px-6 py-4 rounded-2xl font-black hover:bg-red-700 transition shadow-xl shadow-red-600/20 flex items-center gap-2 disabled:opacity-50"
                >
                  <i className="fa-solid fa-trash"></i> Delete ({selectedVins.length})
                </button>
              </div>
            )}
            <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-blue-700 transition shadow-xl shadow-blue-600/20 flex items-center gap-2">
              <i className="fa-solid fa-plus"></i> New Policy
            </button>
            <button onClick={onLogout} className="bg-white border-2 border-slate-200 text-slate-700 px-6 py-4 rounded-2xl font-bold hover:bg-slate-100 transition">Logout</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Coverage</p>
            <p className="text-3xl font-black text-slate-900">{vehicles.length}</p>
          </div>
          <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Expired Policies</p>
            <p className="text-3xl font-black text-red-600">
              {vehicles.filter(v => new Date(v.insuranceExpiry) < new Date()).length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Market Provider</p>
            <p className="text-3xl font-black text-blue-600">Ritcorp</p>
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-8 py-6 w-10">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      checked={vehicles.length > 0 && selectedVins.length === vehicles.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Vehicle / Plate</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Insurer</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Expiration</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {vehicles.map(v => (
                  <tr key={v.vin} className={`hover:bg-slate-50 transition-colors ${selectedVins.includes(v.vin) ? 'bg-blue-50/50' : ''}`}>
                    <td className="px-8 py-7">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        checked={selectedVins.includes(v.vin)}
                        onChange={() => toggleSelect(v.vin)}
                      />
                    </td>
                    <td className="px-8 py-7">
                      <div className="font-black text-slate-900">{v.plateNumber}</div>
                      <div className="text-[10px] text-slate-400 font-mono tracking-tighter uppercase">{v.vin}</div>
                    </td>
                    <td className="px-8 py-7">
                      <div className="text-sm font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-lg inline-block">{v.insuranceProvider}</div>
                      <div className="text-xs text-slate-400 mt-1">{v.ownerName}</div>
                    </td>
                    <td className="px-8 py-7">
                      <div className={`text-sm font-black ${new Date(v.insuranceExpiry) < new Date() ? 'text-red-600' : 'text-slate-800'}`}>
                        {v.insuranceExpiry}
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Verified Policy</div>
                    </td>
                    <td className="px-8 py-7">
                      <div className="flex gap-2">
                        <button onClick={() => handleRenew(v)} className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition flex items-center justify-center shadow-sm" title="Quick Renew (+1 Year)">
                          <i className="fa-solid fa-arrows-rotate"></i>
                        </button>
                        <button onClick={() => handleEdit(v)} className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl hover:bg-blue-600 hover:text-white transition flex items-center justify-center shadow-sm" title="Edit Policy">
                          <i className="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button onClick={() => handleDelete(v.vin)} className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl hover:bg-red-600 hover:text-white transition flex items-center justify-center shadow-sm" title="Delete Record">
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-96 bg-white border-l border-slate-200 flex flex-col shadow-2xl">
        <div className="p-8 border-b border-slate-100">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
            <i className="fa-solid fa-tower-broadcast text-blue-600"></i>
            Policy Alerts
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {notifications.map(n => (
            <div key={n.id} className={`p-5 rounded-3xl border-2 ${n.type === 'success' ? 'bg-emerald-50 border-emerald-100' : n.type === 'warning' ? 'bg-amber-50 border-amber-100' : 'bg-blue-50 border-blue-100'}`}>
              <div className="flex justify-between items-center mb-1">
                <span className={`text-[9px] font-black uppercase tracking-widest ${n.type === 'success' ? 'text-emerald-600' : n.type === 'warning' ? 'text-amber-600' : 'text-blue-600'}`}>{n.type}</span>
                <span className="text-[9px] font-bold text-slate-400">{n.time}</span>
              </div>
              <p className="text-sm font-bold text-slate-700 leading-tight">{n.message}</p>
            </div>
          ))}
          
          {pendingPayments.length > 0 && (
            <div className="pt-6 border-t border-slate-100">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Pending Verifications</h3>
              {pendingPayments.map(p => (
                <div key={p.id} className="bg-slate-900 p-4 rounded-2xl text-white mb-2 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-black uppercase text-blue-400">Citizen: {p.citizenId}</p>
                    <p className="text-lg font-black">{p.amount} NLe</p>
                  </div>
                  <button className="bg-blue-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase hover:bg-blue-700 transition">Review</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-[3.5rem] shadow-2xl p-12 relative overflow-hidden">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-4xl font-black text-slate-900 tracking-tight">{editMode ? 'Edit Policy' : 'New Policy'}</h3>
                <p className="text-slate-400 font-bold text-sm uppercase mt-1">Underwriting Control Portal</p>
              </div>
              <button onClick={closeModal} className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition">
                <i className="fa-solid fa-xmark text-slate-600 text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">VIN / Asset ID</label>
                  <input required placeholder="VIN Code" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-blue-500 outline-none transition font-bold" value={form.vin} onChange={e => setForm({...form, vin: e.target.value})} disabled={editMode} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Plate Number</label>
                  <input required placeholder="ABC-123" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-blue-500 outline-none transition font-bold" value={form.plate} onChange={e => setForm({...form, plate: e.target.value})} />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Policy Holder Name</label>
                  <input required placeholder="Full Name" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-blue-500 outline-none transition font-bold" value={form.owner} onChange={e => setForm({...form, owner: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Provider</label>
                  <select className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-blue-500 outline-none transition font-bold" value={form.provider} onChange={e => setForm({...form, provider: e.target.value})}>
                    <option value="Ritcorp">Ritcorp Insurance</option>
                    <option value="Aureol">Aureol Insurance</option>
                    <option value="Reliance">Reliance Insurance</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Expiry Date</label>
                  <input required type="date" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-blue-500 outline-none transition font-bold" value={form.expiry} onChange={e => setForm({...form, expiry: e.target.value})} />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-50">
                <button type="submit" disabled={isProcessing} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg hover:bg-black transition shadow-xl disabled:opacity-50 flex items-center justify-center gap-3">
                  {isProcessing ? <><i className="fa-solid fa-spinner fa-spin"></i> Processing...</> : <><i className="fa-solid fa-shield-check"></i> {editMode ? 'Update Policy' : 'Confirm Coverage'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InsuranceDashboard;
