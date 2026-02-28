
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { User, Vehicle, Transaction, Inspection, InspectionStatus, AppNotification, UserRole } from '../../types';
import { db } from '../../services/mockDb';

const LicenseDashboard: React.FC<{ user: User; onLogout: () => void }> = ({ user, onLogout }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>(db.getVehicles());
  const [showAddModal, setShowAddModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'plate' | 'vin'>('plate');
  
  // Edit State
  const [editMode, setEditMode] = useState(false);
  const [editingVin, setEditingVin] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'registry' | 'inspections'>('registry');
  const [inspections, setInspections] = useState<Inspection[]>(db.getInspections());
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState<AppNotification | null>(null);
  const [responseForm, setResponseForm] = useState({
    status: 'Granted' as 'Granted' | 'Denied',
    reviewDate: '',
    message: ''
  });

  useEffect(() => {
    const fetchNotifications = () => {
      setNotifications(db.getNotifications(user.id, user.role));
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 3000);
    return () => clearInterval(interval);
  }, [user.id, user.role]);

  const handleMarkRead = (id: string) => {
    db.markNotificationRead(id);
    setNotifications(db.getNotifications(user.id, user.role));
  };

  const handleOpenResponse = (notif: AppNotification) => {
    setSelectedNotif(notif);
    setShowResponseModal(true);
  };

  const handleSendResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNotif) return;

    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 1500));

    db.addNotification({
      recipientId: selectedNotif.senderId,
      senderId: user.id,
      senderName: 'License Department',
      title: `License Application ${responseForm.status}`,
      message: responseForm.message || `Your license application has been ${responseForm.status.toLowerCase()}.`,
      type: 'License_Response',
      metadata: {
        testPassed: responseForm.status === 'Granted',
        reviewDate: responseForm.reviewDate,
        vehicleVin: selectedNotif.metadata?.vehicleVin
      }
    });

    db.markNotificationRead(selectedNotif.id);
    setIsProcessing(false);
    setShowResponseModal(false);
    setSelectedNotif(null);
    setResponseForm({ status: 'Granted', reviewDate: '', message: '' });
  };
  
  const [newVehicle, setNewVehicle] = useState({ 
    vin: '', 
    plate: '', 
    owner: '', 
    make: '', 
    model: '',
    licenseExpiry: '',
    insuranceExpiry: '',
    documents: [] as string[],
    paymentMethod: null as 'Afri-money' | 'Orange-Money' | null,
    phoneNumber: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const REGISTRATION_FEE = 2500;

  // Derive detailed status for display
  const getDetailedStatus = (v: Vehicle) => {
    const now = new Date();
    const lExpiry = new Date(v.licenseExpiry);
    const iExpiry = new Date(v.insuranceExpiry);

    if (lExpiry < now) return { label: 'Expired License', color: 'bg-red-500', text: 'text-red-500', bg: 'bg-red-50/50' };
    if (iExpiry < now) return { label: 'Insurance Pending', color: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-50/50' };
    return { label: 'Active', color: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50/50' };
  };

  // Filtered vehicles list based on search and criteria
  const filteredVehicles = useMemo(() => {
    let list = vehicles;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter(v => {
        if (filterType === 'plate') {
          return v.plateNumber.toLowerCase().includes(query);
        }
        return v.vin.toLowerCase().includes(query);
      });
    }
    return list;
  }, [vehicles, searchQuery, filterType]);

  const resetFilters = () => {
    setSearchQuery('');
    setFilterType('plate');
  };

  // Simulate real-time updates / notifications
  useEffect(() => {
    const interval = setInterval(() => {
      const txs = db.getTransactions();
      if (txs.length > 0) {
        const lastTx = txs[txs.length - 1];
        // We don't need this local simulation anymore as we use the real db notifications
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileNames = Array.from(e.target.files).map((f: File) => f.name);
      setNewVehicle(prev => ({ ...prev, documents: [...prev.documents, ...fileNames] }));
    }
  };

  const removeFile = (index: number) => {
    setNewVehicle(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate if not editing
    if (!editMode) {
      if (!newVehicle.paymentMethod || !newVehicle.phoneNumber) {
        alert("Please complete payment details for new registration.");
        return;
      }
    }

    setIsProcessing(true);
    
    if (editMode && editingVin) {
      // Direct update for edit mode
      db.updateVehicle(editingVin, {
        vin: newVehicle.vin,
        plateNumber: newVehicle.plate,
        ownerName: newVehicle.owner,
        make: newVehicle.make,
        model: newVehicle.model,
        licenseExpiry: newVehicle.licenseExpiry,
        insuranceExpiry: newVehicle.insuranceExpiry,
        documents: newVehicle.documents
      });
      
      db.addNotification({
        recipientId: UserRole.LICENSE_DEPT,
        senderId: user.id,
        senderName: user.fullName,
        title: 'Registry Modified',
        message: `Record ${newVehicle.plate} updated by ${user.fullName}.`,
        type: 'System'
      });
      setVehicles([...db.getVehicles()]);
      setIsProcessing(false);
      closeModal();
    } else {
      // New Registration with payment simulation
      await new Promise(resolve => setTimeout(resolve, 2500));

      const v: Vehicle = {
        vin: newVehicle.vin,
        plateNumber: newVehicle.plate,
        ownerName: newVehicle.owner,
        make: newVehicle.make,
        model: newVehicle.model,
        year: new Date().getFullYear(),
        licenseExpiry: newVehicle.licenseExpiry || new Date(Date.now() + 31536000000).toISOString().split('T')[0],
        insuranceExpiry: newVehicle.insuranceExpiry || new Date(Date.now() + 31536000000).toISOString().split('T')[0],
        insuranceProvider: 'Ritcorp',
        status: 'Active',
        violationHistory: [],
        documents: newVehicle.documents
      };

      // Add Transaction to Finance DB
      const tx: Transaction = {
        id: `TX-${Math.floor(100000 + Math.random() * 900000)}`,
        citizenId: 'STAFF-REG',
        amount: REGISTRATION_FEE,
        type: 'Registration',
        status: 'Completed',
        method: newVehicle.paymentMethod!,
        date: new Date().toLocaleDateString()
      };

      db.addTransaction(tx);
      db.addVehicle(v);
      
      setVehicles([...db.getVehicles()]);
      setPaymentSuccess(true);
      setIsProcessing(false);
      
      db.addNotification({
        recipientId: UserRole.LICENSE_DEPT,
        senderId: user.id,
        senderName: user.fullName,
        title: 'Revenue Secured',
        message: `${REGISTRATION_FEE} NLe received for new asset ${v.plateNumber}.`,
        type: 'System'
      });
    }
  };

  const handleEditClick = (v: Vehicle) => {
    setEditMode(true);
    setEditingVin(v.vin);
    setNewVehicle({
      vin: v.vin,
      plate: v.plateNumber,
      owner: v.ownerName,
      make: v.make,
      model: v.model,
      licenseExpiry: v.licenseExpiry,
      insuranceExpiry: v.insuranceExpiry,
      documents: v.documents || [],
      paymentMethod: null,
      phoneNumber: ''
    });
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setPaymentSuccess(false);
    setEditMode(false);
    setEditingVin(null);
    setNewVehicle({ 
      vin: '', plate: '', owner: '', make: '', model: '', 
      licenseExpiry: '', insuranceExpiry: '',
      documents: [], paymentMethod: null, phoneNumber: '' 
    });
  };

  const deleteVehicle = (vin: string) => {
    if (confirm('CRITICAL ACTION: Permanently remove this vehicle from the national registry? This deletion will be logged for administrative audit.')) {
      db.deleteVehicle(vin);
      setVehicles([...db.getVehicles()]);
      
      db.addNotification({
        recipientId: UserRole.LICENSE_DEPT,
        senderId: user.id,
        senderName: user.fullName,
        title: 'Audit Event',
        message: `Vehicle record (VIN: ${vin}) purged by departmental authority.`,
        type: 'System'
      });
    }
  };

  const handleConductInspection = (insp: Inspection) => {
    setSelectedInspection(insp);
    setShowInspectionModal(true);
  };

  const submitInspectionResult = async (status: InspectionStatus, notes: string, checkpoints: Inspection['checkpoints']) => {
    if (!selectedInspection) return;
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 1500));

    const update: Partial<Inspection> = {
      status,
      notes,
      checkpoints,
      conductedDate: new Date().toISOString().split('T')[0],
      inspectorName: user.fullName,
      inspectorId: user.id
    };

    db.updateInspection(selectedInspection.id, update);
    setInspections([...db.getInspections()]);
    setIsProcessing(false);
    setShowInspectionModal(false);
    setSelectedInspection(null);

    db.addNotification({
      recipientId: UserRole.LICENSE_DEPT,
      senderId: user.id,
      senderName: user.fullName,
      title: 'Inspection Complete',
      message: `${selectedInspection.plateNumber} marked as ${status}.`,
      type: 'System'
    });
  };

  return (
    <div className="flex min-h-screen bg-[#fcf8f3] relative">
      {/* Background iOS Aesthetic Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-100 rounded-full blur-[100px] opacity-40"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-100 rounded-full blur-[120px] opacity-30"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 relative z-10">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">License Management</h1>
            <div className="flex gap-4 mt-4">
              <button 
                onClick={() => setActiveTab('registry')}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'registry' ? 'bg-slate-900 text-white shadow-xl' : 'bg-white/40 text-slate-500 hover:bg-white/60'}`}
              >
                Vehicle Registry
              </button>
              <button 
                onClick={() => setActiveTab('inspections')}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'inspections' ? 'bg-slate-900 text-white shadow-xl' : 'bg-white/40 text-slate-500 hover:bg-white/60'}`}
              >
                Inspections
              </button>
            </div>
          </div>
          <div className="flex gap-4">
            {activeTab === 'registry' && (
              <button onClick={() => setShowAddModal(true)} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-emerald-700 transition shadow-xl shadow-emerald-600/20 flex items-center gap-2">
                <i className="fa-solid fa-plus"></i> New Registration
              </button>
            )}
            <button onClick={onLogout} className="bg-white/40 backdrop-blur-md border-2 border-white/60 text-slate-700 px-6 py-4 rounded-2xl font-bold hover:bg-white/60 transition shadow-lg">Logout</button>
          </div>
        </div>

        {activeTab === 'registry' ? (
          <>
            {/* Search & Filter Bar - Glassmorphism */}
            <div className="bg-white/40 backdrop-blur-2xl p-8 rounded-[3rem] shadow-[0_32px_120px_-20px_rgba(0,0,0,0.08)] border border-white/60 mb-10 flex flex-col md:flex-row gap-6 items-end">
          <div className="flex-grow space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Search Central Registry</label>
            <div className="relative group">
              <i className="fa-solid fa-magnifying-glass absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors"></i>
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search by ${filterType === 'plate' ? 'Plate Number' : 'VIN'}...`}
                className="w-full pl-14 pr-6 py-5 rounded-2xl bg-white/50 border-2 border-white focus:border-emerald-500 outline-none transition font-bold text-slate-900 placeholder:text-slate-300 shadow-inner"
              />
            </div>
          </div>
          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Filter Matrix</label>
             <div className="flex bg-white/50 p-1.5 rounded-2xl border border-white/60 shadow-inner">
               <button 
                 onClick={() => setFilterType('plate')}
                 className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterType === 'plate' ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 Plate
               </button>
               <button 
                 onClick={() => setFilterType('vin')}
                 className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterType === 'vin' ? 'bg-white text-emerald-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 VIN
               </button>
             </div>
          </div>
          <button 
            onClick={resetFilters}
            className="bg-slate-900 text-white px-8 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition flex items-center gap-2 shadow-xl"
          >
            <i className="fa-solid fa-rotate-left"></i> Reset
          </button>
        </div>

        {/* Main Table - Glassmorphism */}
        <div className="bg-white/40 backdrop-blur-3xl rounded-[4rem] shadow-[0_40px_140px_-40px_rgba(0,0,0,0.1)] border border-white/60 overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/20 border-b border-white/40">
                <tr>
                  <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Plate / VIN</th>
                  <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Ownership</th>
                  <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Status</th>
                  <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Expirations</th>
                  <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/20">
                {filteredVehicles.map(v => {
                  const statusInfo = getDetailedStatus(v);
                  return (
                    <tr key={v.vin} className="hover:bg-white/30 transition-all duration-300 group">
                      <td className="px-10 py-8">
                        <div className="font-black text-slate-900 text-xl tracking-tighter group-hover:text-emerald-700 transition-colors">{v.plateNumber}</div>
                        <div className="text-[10px] text-slate-400 font-mono tracking-tighter uppercase mt-1">{v.vin}</div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="text-sm font-black text-slate-800">{v.ownerName}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{v.make} • {v.model}</div>
                      </td>
                      <td className="px-10 py-8">
                        <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border-2 border-white/60 ${statusInfo.bg} ${statusInfo.text} font-black text-[10px] uppercase tracking-widest shadow-sm`}>
                          <span className={`w-2 h-2 rounded-full ${statusInfo.color} animate-pulse`}></span>
                          {statusInfo.label}
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-slate-500">License: <span className="text-slate-900 font-black">{v.licenseExpiry}</span></p>
                          <p className="text-xs font-bold text-slate-500">Insurance: <span className="text-slate-900 font-black">{v.insuranceExpiry}</span></p>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex gap-3">
                          <button 
                            onClick={() => handleEditClick(v)}
                            className="w-12 h-12 bg-white/60 text-slate-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition flex items-center justify-center shadow-lg hover:-translate-y-1 active:scale-95 border border-white"
                            title="Edit Vehicle Details"
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                          </button>
                          <button 
                            onClick={() => deleteVehicle(v.vin)} 
                            className="w-12 h-12 bg-white/60 text-slate-600 rounded-2xl hover:bg-red-600 hover:text-white transition flex items-center justify-center shadow-lg hover:-translate-y-1 active:scale-95 border border-white"
                            title="Delete Vehicle Record"
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredVehicles.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-10 py-32 text-center">
                      <div className="w-24 h-24 bg-white/40 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                        <i className="fa-solid fa-folder-open text-4xl"></i>
                      </div>
                      <p className="text-slate-400 font-black text-xl tracking-tighter uppercase">No matching records found.</p>
                      <button onClick={resetFilters} className="text-emerald-600 font-black text-xs uppercase tracking-[0.4em] mt-4 hover:underline">Sync Registry</button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </>
    ) : (
      <div className="space-y-10">
        <div className="bg-white/40 backdrop-blur-3xl rounded-[4rem] shadow-[0_40px_140px_-40px_rgba(0,0,0,0.1)] border border-white/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/20 border-b border-white/40">
                <tr>
                  <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Vehicle</th>
                  <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Owner</th>
                  <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Scheduled</th>
                  <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Status</th>
                  <th className="px-10 py-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/20">
                {inspections.map(insp => (
                  <tr key={insp.id} className="hover:bg-white/30 transition-all duration-300 group">
                    <td className="px-10 py-8">
                      <div className="font-black text-slate-900 text-xl tracking-tighter">{insp.plateNumber}</div>
                      <div className="text-[10px] text-slate-400 font-mono tracking-tighter uppercase mt-1">{insp.vehicleVin}</div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="text-sm font-black text-slate-800">{insp.ownerName}</div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="text-sm font-black text-slate-900">{insp.scheduledDate}</div>
                    </td>
                    <td className="px-10 py-8">
                      <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border-2 border-white/60 font-black text-[10px] uppercase tracking-widest shadow-sm ${
                        insp.status === InspectionStatus.PASSED ? 'bg-emerald-50 text-emerald-600' :
                        insp.status === InspectionStatus.FAILED ? 'bg-red-50 text-red-600' :
                        insp.status === InspectionStatus.SCHEDULED ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-600'
                      }`}>
                        {insp.status}
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      {insp.status === InspectionStatus.SCHEDULED && (
                        <button 
                          onClick={() => handleConductInspection(insp)}
                          className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition shadow-lg"
                        >
                          Conduct Inspection
                        </button>
                      )}
                      {insp.status !== InspectionStatus.SCHEDULED && (
                        <button 
                          onClick={() => { setSelectedInspection(insp); setShowInspectionModal(true); }}
                          className="text-slate-400 hover:text-slate-600 font-black text-[10px] uppercase tracking-widest"
                        >
                          View Details
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )}
      </div>

      {/* Notifications Sidebar - Deep Glassmorphism */}
      <div className="w-[400px] sticky top-0 h-screen bg-white/20 backdrop-blur-2xl border-l border-white/60 flex flex-col shadow-2xl relative z-10">
        <div className="p-10 border-b border-white/40 flex justify-between items-center bg-white/20">
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3 tracking-tighter">
            <i className="fa-solid fa-tower-broadcast text-emerald-600"></i>
            Live Pulse
          </h2>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Active</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
          {notifications.length > 0 ? (
            notifications.map(notif => (
              <div 
                key={notif.id} 
                onClick={() => handleMarkRead(notif.id)}
                className={`p-6 rounded-[2.5rem] border-2 animate-in slide-in-from-right-8 duration-700 shadow-xl cursor-pointer transition-all ${
                  notif.status === 'Unread' ? 'bg-emerald-100/40 border-emerald-200/40' : 'bg-white/40 border-white/60 opacity-60'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em]">
                    {notif.type.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] font-black text-slate-400 opacity-60 uppercase">{notif.date}</span>
                </div>
                <p className="text-base font-black text-slate-800 leading-tight tracking-tight mb-4">
                  {notif.message}
                </p>
                {notif.type === 'License_Application' && notif.status === 'Unread' && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleOpenResponse(notif); }}
                    className="w-full bg-slate-900 text-white py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition"
                  >
                    Review & Respond
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="py-20 text-center opacity-40">
              <i className="fa-solid fa-bell-slash text-4xl mb-4"></i>
              <p className="font-black text-xs uppercase tracking-widest">No new alerts</p>
            </div>
          )}
          
          <div className="pt-10 border-t border-white/40">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-6 ml-2">Real-time Metrics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/40 backdrop-blur-md p-6 rounded-[2rem] border border-white shadow-lg text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Database</p>
                <p className="text-3xl font-black text-slate-900 tracking-tighter">{vehicles.length}</p>
              </div>
              <div className="bg-white/40 backdrop-blur-md p-6 rounded-[2rem] border border-white shadow-lg text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Anomalies</p>
                <p className="text-3xl font-black text-red-600 tracking-tighter">
                  {vehicles.filter(v => new Date(v.licenseExpiry) < new Date()).length}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-10 bg-slate-900/95 m-6 rounded-[3rem] text-white shadow-2xl relative overflow-hidden border border-white/20 mt-auto">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
          <h4 className="text-sm font-black mb-3 flex items-center gap-2 tracking-tight">
            <i className="fa-solid fa-fingerprint text-emerald-500"></i> Secure Terminal
          </h4>
          <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-tighter opacity-80">
            Node: SL-REG-026. Data streams are encrypted via IOS 26 protocols. Unauthorized data export is strictly monitored.
          </p>
        </div>
      </div>

      {/* Deep Glass Modal - iOS 26 Aesthetic - Optimized for Scrolling */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-2xl z-[200] flex items-start justify-center p-6 overflow-y-auto animate-in fade-in duration-500">
          <div className="bg-white/40 backdrop-blur-[80px] w-full max-w-2xl rounded-[4rem] shadow-[0_50px_200px_-50px_rgba(0,0,0,0.3)] my-12 relative overflow-hidden border border-white/60">
            {/* Modal Inner Gradient Glow */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/30 to-transparent pointer-events-none"></div>
            
            {!paymentSuccess ? (
              <div className="relative z-10 p-12 flex flex-col">
                <div className="flex justify-between items-center mb-10">
                  <div>
                    <h3 className="text-4xl font-black text-slate-900 tracking-tighter">
                      {editMode ? 'Registry Modification' : 'Asset Registration'}
                    </h3>
                    <p className="text-emerald-600 font-black text-[10px] uppercase tracking-[0.4em] mt-2">
                      {editMode ? 'Updating Sovereign Ledger' : 'New Entry Initialization'}
                    </p>
                  </div>
                  <button onClick={closeModal} className="w-16 h-16 rounded-full bg-white/60 backdrop-blur-md flex items-center justify-center hover:bg-white transition shadow-xl border border-white/80 active:scale-90">
                    <i className="fa-solid fa-xmark text-slate-800 text-2xl"></i>
                  </button>
                </div>

                <form onSubmit={handleAddVehicle} className="space-y-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 block">VIN Identifier</label>
                      <input 
                        required 
                        placeholder="17-digit ISO Code" 
                        className="w-full px-8 py-5 rounded-[2rem] bg-white/60 border-2 border-white/80 outline-none focus:border-emerald-500 transition font-black text-slate-900 shadow-inner" 
                        value={newVehicle.vin} 
                        onChange={e => setNewVehicle({...newVehicle, vin: e.target.value})} 
                        disabled={editMode}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 block">Plate Assignment</label>
                      <input required placeholder="ABC-123" className="w-full px-8 py-5 rounded-[2rem] bg-white/60 border-2 border-white/80 outline-none focus:border-emerald-500 transition font-black text-slate-900 shadow-inner" value={newVehicle.plate} onChange={e => setNewVehicle({...newVehicle, plate: e.target.value})} />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 block">Primary Policy Holder</label>
                      <input required placeholder="Full Legal Identity" className="w-full px-8 py-5 rounded-[2rem] bg-white/60 border-2 border-white/80 outline-none focus:border-emerald-500 transition font-black text-slate-900 shadow-inner" value={newVehicle.owner} onChange={e => setNewVehicle({...newVehicle, owner: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 block">Manufacturer</label>
                      <input required placeholder="Make (e.g. Toyota)" className="w-full px-8 py-5 rounded-[2rem] bg-white/60 border-2 border-white/80 outline-none focus:border-emerald-500 transition font-black text-slate-900 shadow-inner" value={newVehicle.make} onChange={e => setNewVehicle({...newVehicle, make: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 block">Asset Model</label>
                      <input required placeholder="Model & Version" className="w-full px-8 py-5 rounded-[2rem] bg-white/60 border-2 border-white/80 outline-none focus:border-emerald-500 transition font-black text-slate-900 shadow-inner" value={newVehicle.model} onChange={e => setNewVehicle({...newVehicle, model: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 block">Registry Valid Until</label>
                      <input required type="date" className="w-full px-8 py-5 rounded-[2rem] bg-white/60 border-2 border-white/80 outline-none focus:border-emerald-500 transition font-black text-slate-900 shadow-inner" value={newVehicle.licenseExpiry} onChange={e => setNewVehicle({...newVehicle, licenseExpiry: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2 block">Insurance Valid Until</label>
                      <input required type="date" className="w-full px-8 py-5 rounded-[2rem] bg-white/60 border-2 border-white/80 outline-none focus:border-emerald-500 transition font-black text-slate-900 shadow-inner" value={newVehicle.insuranceExpiry} onChange={e => setNewVehicle({...newVehicle, insuranceExpiry: e.target.value})} />
                    </div>
                  </div>

                  {!editMode && (
                    <div className="bg-white/40 backdrop-blur-md p-10 rounded-[3.5rem] border-2 border-white/60 shadow-xl space-y-8">
                      <div className="flex justify-between items-center">
                        <div>
                           <h4 className="text-lg font-black text-slate-900 tracking-tight">Revenue Settlement</h4>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Official Registration Surcharge</p>
                        </div>
                        <div className="text-right">
                          <p className="text-4xl font-black text-slate-900 tracking-tighter">{REGISTRATION_FEE.toLocaleString()} <span className="text-sm font-bold opacity-40">NLe</span></p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <button 
                          type="button"
                          onClick={() => setNewVehicle({...newVehicle, paymentMethod: 'Afri-money'})}
                          className={`p-6 rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-4 ${newVehicle.paymentMethod === 'Afri-money' ? 'border-emerald-500 bg-white shadow-xl shadow-emerald-500/10' : 'border-white/80 bg-white/30 hover:bg-white/50'}`}
                        >
                          <img src="https://tse2.mm.bing.net/th/id/OIP.G5aDh56qnfI9zaHtTncbMAHaHa?rs=1&pid=ImgDetMain&o=7&rm=3" alt="Afri-money" className="w-12 h-12 object-contain rounded-xl" />
                          <span className="font-black text-slate-800 text-xs uppercase tracking-[0.2em]">Afri-money</span>
                        </button>
                        <button 
                          type="button"
                          onClick={() => setNewVehicle({...newVehicle, paymentMethod: 'Orange-Money'})}
                          className={`p-6 rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-4 ${newVehicle.paymentMethod === 'Orange-Money' ? 'border-orange-500 bg-white shadow-xl shadow-orange-500/10' : 'border-white/80 bg-white/30 hover:bg-white/50'}`}
                        >
                          <img src="https://tse2.mm.bing.net/th/id/OIP.87uYW5-goSpiSRJSXoYw9AHaHa?rs=1&pid=ImgDetMain&o=7&rm=3" alt="Orange Money" className="w-12 h-12 object-contain rounded-xl" />
                          <span className="font-black text-slate-800 text-xs uppercase tracking-[0.2em]">Orange</span>
                        </button>
                      </div>

                      {newVehicle.paymentMethod && (
                        <div className="animate-in slide-in-from-top-6 duration-500 space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4 block">Merchant Wallet Number</label>
                          <div className="relative">
                            <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-400 text-lg">+232</span>
                            <input 
                              required 
                              type="tel" 
                              className="w-full pl-20 pr-8 py-6 rounded-[2.25rem] bg-white border-2 border-white outline-none focus:border-slate-900 transition font-black text-xl shadow-xl" 
                              placeholder="00-000-000" 
                              value={newVehicle.phoneNumber}
                              onChange={e => setNewVehicle({...newVehicle, phoneNumber: e.target.value})}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="pt-4 space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4 block">Official Documentation</label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-12 border-4 border-dashed border-white/60 rounded-[3.5rem] bg-white/20 hover:bg-white/40 hover:border-emerald-300 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 group shadow-inner"
                    >
                      <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all">
                        <i className="fa-solid fa-cloud-arrow-up text-emerald-600 text-3xl"></i>
                      </div>
                      <div className="text-center">
                        <p className="font-black text-slate-900 text-xl tracking-tight">
                          {editMode ? 'Modify Registry Vault' : 'Sync Physical Title Documents'}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.4em] mt-2">ISO 26 Compliant Uploads • MAX 50MB</p>
                      </div>
                      <input 
                        type="file" 
                        multiple 
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={handleFileChange} 
                      />
                    </div>

                    {newVehicle.documents.length > 0 && (
                      <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-500 p-2">
                        {newVehicle.documents.map((name, i) => (
                          <div key={i} className="flex justify-between items-center p-5 bg-white/80 backdrop-blur-md border border-white rounded-[1.5rem] shadow-xl">
                            <div className="flex items-center gap-3 overflow-hidden">
                              <i className="fa-solid fa-file-invoice text-emerald-600 text-lg"></i>
                              <span className="text-[10px] font-black text-slate-800 truncate uppercase tracking-tighter">{name}</span>
                            </div>
                            <button 
                              type="button" 
                              onClick={() => removeFile(i)}
                              className="text-slate-300 hover:text-red-600 transition-all"
                            >
                              <i className="fa-solid fa-circle-xmark text-xl"></i>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions Footer - Made Sticky at bottom of modal container for consistency */}
                  <div className="pt-10 flex gap-6 sticky bottom-0 bg-white/20 backdrop-blur-3xl p-6 -mx-12 -mb-12 border-t border-white/60 relative z-20">
                    <button 
                      type="submit" 
                      onClick={handleAddVehicle}
                      disabled={isProcessing}
                      className="flex-grow bg-slate-900 text-white py-8 rounded-[2.5rem] font-black text-2xl hover:bg-black transition-all shadow-[0_20px_60px_-10px_rgba(0,0,0,0.4)] flex items-center justify-center gap-4 active:scale-[0.98]"
                    >
                      {isProcessing ? (
                        <>
                          <i className="fa-solid fa-atom fa-spin"></i> {editMode ? 'Syncing...' : 'Encrypting...'}
                        </>
                      ) : (
                        <>
                          <i className={`fa-solid ${editMode ? 'fa-floppy-disk' : 'fa-receipt'}`}></i> 
                          {editMode ? 'Commit to Registry' : 'Authorize & Register'}
                        </>
                      )}
                    </button>
                    <button type="button" onClick={closeModal} className="px-12 bg-white/60 backdrop-blur-md text-slate-800 py-8 rounded-[2.5rem] font-black text-xl hover:bg-white transition border border-white/80 active:scale-95 shadow-xl">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="text-center py-24 animate-in zoom-in-95 duration-500 relative z-10 px-12">
                <div className="w-32 h-32 bg-emerald-500 text-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-emerald-500/40 rotate-12 transition-transform hover:rotate-0 duration-500">
                  <i className="fa-solid fa-check-double text-5xl"></i>
                </div>
                <h3 className="text-5xl font-black text-slate-900 mb-4 tracking-tighter leading-none">Registry Updated</h3>
                <p className="text-slate-500 font-bold mb-12 max-w-sm mx-auto text-lg leading-relaxed">Asset <span className="text-emerald-600 font-black">{newVehicle.plate}</span> is now synchronized with the national sovereign database.</p>
                
                <div className="bg-white/60 backdrop-blur-md p-10 rounded-[3.5rem] mb-12 text-left border-2 border-white shadow-2xl space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Official UID:</span>
                    <span className="text-2xl font-black text-slate-900 tracking-tighter">{newVehicle.plate}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Legal Proxy:</span>
                    <span className="text-lg font-black text-slate-700">{newVehicle.owner}</span>
                  </div>
                  <div className="pt-6 border-t border-white/80 flex justify-between items-center">
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.4em]">Verification:</span>
                    <span className="px-4 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">Sovereign Certified</span>
                  </div>
                </div>

                <button 
                  onClick={closeModal}
                  className="w-full bg-slate-900 text-white py-7 rounded-[2.5rem] font-black text-2xl hover:bg-black transition-all shadow-2xl active:scale-95"
                >
                  Confirm & Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Response Modal */}
      {showResponseModal && selectedNotif && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-2xl z-[300] flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="bg-white/90 backdrop-blur-[80px] w-full max-w-xl rounded-[4rem] shadow-2xl p-12 relative border border-white/60">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h3 className="text-4xl font-black text-slate-900 tracking-tighter">Application Review</h3>
                <p className="text-emerald-600 font-black text-[10px] uppercase tracking-[0.4em] mt-2">Responding to {selectedNotif.senderName}</p>
              </div>
              <button onClick={() => setShowResponseModal(false)} className="w-16 h-16 rounded-full bg-white/60 flex items-center justify-center hover:bg-white transition shadow-xl border border-white/80">
                <i className="fa-solid fa-xmark text-slate-800 text-2xl"></i>
              </button>
            </div>

            <form onSubmit={handleSendResponse} className="space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Decision</label>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    type="button"
                    onClick={() => setResponseForm({...responseForm, status: 'Granted'})}
                    className={`p-6 rounded-3xl border-2 transition-all font-black text-xs uppercase tracking-widest ${responseForm.status === 'Granted' ? 'bg-emerald-600 text-white border-emerald-600 shadow-xl' : 'bg-white/50 border-white text-slate-400'}`}
                  >
                    Grant License
                  </button>
                  <button 
                    type="button"
                    onClick={() => setResponseForm({...responseForm, status: 'Denied'})}
                    className={`p-6 rounded-3xl border-2 transition-all font-black text-xs uppercase tracking-widest ${responseForm.status === 'Denied' ? 'bg-red-600 text-white border-red-600 shadow-xl' : 'bg-white/50 border-white text-slate-400'}`}
                  >
                    Deny License
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Review / Appointment Date</label>
                <input 
                  type="date" 
                  required
                  className="w-full px-8 py-5 rounded-[2rem] bg-white border-2 border-white outline-none focus:border-emerald-500 transition font-black text-slate-900 shadow-inner"
                  value={responseForm.reviewDate}
                  onChange={e => setResponseForm({...responseForm, reviewDate: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Official Remarks</label>
                <textarea 
                  placeholder="Enter review notes or instructions for the citizen..."
                  className="w-full px-8 py-6 rounded-[2.5rem] bg-white border-2 border-white outline-none focus:border-emerald-500 transition font-black text-slate-900 shadow-inner resize-none"
                  rows={4}
                  value={responseForm.message}
                  onChange={e => setResponseForm({...responseForm, message: e.target.value})}
                />
              </div>

              <button 
                type="submit"
                disabled={isProcessing}
                className="w-full bg-slate-900 text-white py-8 rounded-[2.5rem] font-black text-2xl hover:bg-black transition-all shadow-2xl flex items-center justify-center gap-4"
              >
                {isProcessing ? <i className="fa-solid fa-atom fa-spin"></i> : <i className="fa-solid fa-paper-plane"></i>}
                {isProcessing ? 'Processing...' : 'Send Official Response'}
              </button>
            </form>
          </div>
        </div>
      )}
      {showInspectionModal && selectedInspection && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-2xl z-[200] flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="bg-white/90 backdrop-blur-[80px] w-full max-w-2xl rounded-[4rem] shadow-[0_50px_200px_-50px_rgba(0,0,0,0.3)] p-12 relative overflow-hidden border border-white/60">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h3 className="text-4xl font-black text-slate-900 tracking-tighter">
                  {selectedInspection.status === InspectionStatus.SCHEDULED ? 'Conduct Inspection' : 'Inspection Details'}
                </h3>
                <p className="text-blue-600 font-black text-[10px] uppercase tracking-[0.4em] mt-2">
                  Vehicle: {selectedInspection.plateNumber} • VIN: {selectedInspection.vehicleVin}
                </p>
              </div>
              <button onClick={() => setShowInspectionModal(false)} className="w-16 h-16 rounded-full bg-white/60 backdrop-blur-md flex items-center justify-center hover:bg-white transition shadow-xl border border-white/80 active:scale-90">
                <i className="fa-solid fa-xmark text-slate-800 text-2xl"></i>
              </button>
            </div>

            <InspectionForm 
              inspection={selectedInspection} 
              isReadOnly={selectedInspection.status !== InspectionStatus.SCHEDULED}
              onSubmit={submitInspectionResult}
              isProcessing={isProcessing}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const InspectionForm: React.FC<{ 
  inspection: Inspection; 
  isReadOnly: boolean; 
  isProcessing: boolean;
  onSubmit: (status: InspectionStatus, notes: string, checkpoints: Inspection['checkpoints']) => void 
}> = ({ inspection, isReadOnly, isProcessing, onSubmit }) => {
  const [notes, setNotes] = useState(inspection.notes || '');
  const [checkpoints, setCheckpoints] = useState(inspection.checkpoints || {
    brakes: false,
    lights: false,
    tires: false,
    engine: false,
    emissions: false
  });

  const toggleCheckpoint = (key: keyof Inspection['checkpoints']) => {
    if (isReadOnly) return;
    setCheckpoints(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const allPassed = Object.values(checkpoints).every(v => v);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(checkpoints).map(([key, value]) => (
          <button 
            key={key}
            type="button"
            onClick={() => toggleCheckpoint(key as any)}
            className={`p-6 rounded-[2rem] border-2 transition-all flex items-center justify-between ${
              value ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 bg-white/50'
            } ${isReadOnly ? 'cursor-default' : 'hover:border-emerald-300'}`}
          >
            <span className="font-black text-slate-800 text-xs uppercase tracking-widest">{key}</span>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${value ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-300'}`}>
              <i className={`fa-solid ${value ? 'fa-check' : 'fa-circle'}`}></i>
            </div>
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4 block">Inspector Notes</label>
        <textarea 
          readOnly={isReadOnly}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Enter detailed inspection findings..."
          className="w-full px-8 py-5 rounded-[2rem] bg-white/60 border-2 border-white/80 outline-none focus:border-blue-500 transition font-bold text-slate-900 shadow-inner resize-none h-32"
        />
      </div>

      {!isReadOnly && (
        <div className="flex gap-4">
          <button 
            onClick={() => onSubmit(InspectionStatus.PASSED, notes, checkpoints)}
            disabled={isProcessing || !allPassed}
            className="flex-grow bg-emerald-600 text-white py-6 rounded-[2.5rem] font-black text-xl hover:bg-emerald-700 transition shadow-xl disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {isProcessing ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-circle-check"></i>}
            Pass Vehicle
          </button>
          <button 
            onClick={() => onSubmit(InspectionStatus.FAILED, notes, checkpoints)}
            disabled={isProcessing}
            className="flex-grow bg-red-600 text-white py-6 rounded-[2.5rem] font-black text-xl hover:bg-red-700 transition shadow-xl disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {isProcessing ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-circle-xmark"></i>}
            Fail Vehicle
          </button>
        </div>
      )}

      {isReadOnly && (
        <div className="p-6 bg-slate-100 rounded-[2rem] border border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Conducted By</span>
            <span className="text-sm font-black text-slate-900">{inspection.inspectorName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</span>
            <span className="text-sm font-black text-slate-900">{inspection.conductedDate}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LicenseDashboard;
