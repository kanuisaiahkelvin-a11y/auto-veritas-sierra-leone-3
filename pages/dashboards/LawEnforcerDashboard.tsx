
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { User, Vehicle, VerificationLog, Ticket } from '../../types';
import { db } from '../../services/mockDb';

const LawEnforcerDashboard: React.FC<{ user: User; onLogout: () => void }> = ({ user, onLogout }) => {
  const [searchVal, setSearchVal] = useState('');
  const [result, setResult] = useState<Vehicle | null>(null);
  const [checked, setChecked] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [logs, setLogs] = useState<VerificationLog[]>(db.getLogs().filter(l => l.enforcerId === user.badgeNumber));
  const [issuingTicket, setIssuingTicket] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>(db.getTickets());
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // Simulate real-time movement for tracking
  useEffect(() => {
    const interval = setInterval(() => {
      setTickets(prev => prev.map(t => ({
        ...t,
        location: {
          lat: t.location.lat + (Math.random() - 0.5) * 0.0001,
          lng: t.location.lng + (Math.random() - 0.5) * 0.0001
        }
      })));
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  
  // Scanner & UI State
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [coords, setCoords] = useState<{ lat: number, lng: number } | null>(null);

  const handleVerify = async (val?: string) => {
    const query = val || searchVal;
    if (!query) return;
    
    setIsAnalyzing(true);
    // Simulate deep database analysis
    await new Promise(resolve => setTimeout(resolve, 800));

    const found = db.getVehicles().find(v => 
      v.vin.toLowerCase() === query.toLowerCase() || 
      v.plateNumber.toLowerCase() === query.toLowerCase()
    );
    
    setResult(found || null);
    setChecked(true);
    setIsAnalyzing(false);
    
    const newLog: VerificationLog = {
      id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
      enforcerId: user.badgeNumber || 'SLP-UNKNOWN',
      vin: found?.vin || query,
      timestamp: new Date().toLocaleString(),
      status: found ? (found.status === 'Active' ? 'Verified' : 'Flagged (Expired)') : 'Not Registered',
      location: 'Mobile Check'
    };
    
    db.addLog(newLog);
    setLogs([newLog, ...logs]);
  };

  const startScanner = async () => {
    setIsScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      setIsScanning(false);
    }
  };

  const stopScanner = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setIsScanning(false);
  };

  const simulateScan = () => {
    const randomVehicle = db.getVehicles()[Math.floor(Math.random() * db.getVehicles().length)];
    setSearchVal(randomVehicle.plateNumber);
    handleVerify(randomVehicle.plateNumber);
    stopScanner();
  };

  const requestLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setShowMap(true);
      }
    );
  };

  // --- Automated Penalty & Safety Score Logic ---
  const assessment = useMemo(() => {
    if (!result) return null;

    const penalties: { title: string; fine: number; severity: 'High' | 'Medium' | 'Low'; reason: string }[] = [];
    let score = 100;

    const isLicenseExpired = new Date(result.licenseExpiry) < new Date();
    const isInsuranceExpired = new Date(result.insuranceExpiry) < new Date();

    if (isLicenseExpired) {
      penalties.push({ title: 'License: Expired', fine: 750, severity: 'High', reason: 'Unlicensed operation of motor vehicle on public roads.' });
      score -= 40;
    }
    if (isInsuranceExpired) {
      penalties.push({ title: 'Insurance: Void', fine: 450, severity: 'Medium', reason: 'Missing mandatory liability coverage policy.' });
      score -= 30;
    }

    // Historical Violation Penalties
    result.violationHistory.forEach(violation => {
      penalties.push({ title: 'Past Infraction', fine: 200, severity: 'Low', reason: violation });
      score -= 10;
    });

    // Recidivism Surcharge
    let surcharge = 0;
    if (result.violationHistory.length >= 2) {
      surcharge = Math.floor(penalties.reduce((acc, p) => acc + p.fine, 0) * 0.15);
      score -= 5;
    }

    const totalFine = penalties.reduce((acc, p) => acc + p.fine, 0) + surcharge;

    return {
      penalties,
      surcharge,
      totalFine,
      score: Math.max(0, score),
      isHighRisk: score < 50
    };
  }, [result]);

  const handleIssueTicket = async () => {
    if (!result || !assessment) return;
    setIssuingTicket(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const newViolation = `Official Penalty Ticket #${Math.floor(Math.random()*10000)} Issued by Officer ${user.fullName} for total ${assessment.totalFine} SLL`;
    
    const ticketId = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;
    const newTicket: Ticket = {
      id: ticketId,
      vehicleVin: result.vin,
      plateNumber: result.plateNumber,
      violationType: assessment.penalties.map(p => p.title).join(', '),
      fineAmount: assessment.totalFine,
      issuingOfficer: user.fullName,
      officerBadge: user.badgeNumber || 'N/A',
      date: new Date().toLocaleString(),
      location: { 
        lat: 8.484 + (Math.random() - 0.5) * 0.05, 
        lng: -13.234 + (Math.random() - 0.5) * 0.05 
      }
    };

    db.addTicket(newTicket);
    setTickets(prev => [...prev, newTicket]);

    db.updateVehicle(result.vin, { 
      violationHistory: [...result.violationHistory, newViolation],
      status: 'Expired'
    });

    setResult(prev => prev ? ({ ...prev, violationHistory: [...prev.violationHistory, newViolation] }) : null);
    setIssuingTicket(false);
    alert('Citation issued and synced with National Revenue Registry.');
  };

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen pt-32 font-sans bg-slate-50">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-8">
        <div className="flex items-center gap-6">
          {user.profileImage ? (
            <img src={user.profileImage} alt="Officer" className="w-24 h-24 rounded-3xl object-cover border-4 border-slate-900/10 shadow-2xl" />
          ) : (
            <div className="w-24 h-24 rounded-3xl bg-slate-200 flex items-center justify-center border-4 border-slate-300 shadow-2xl">
              <i className="fa-solid fa-user-shield text-4xl text-slate-400"></i>
            </div>
          )}
          <div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter">Enforcement Hub</h1>
            <div className="flex items-center gap-4 mt-4">
              <span className="bg-slate-900 text-white px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest">
                Officer: {user.fullName}
              </span>
              <span className="bg-emerald-100 text-emerald-700 px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-emerald-200">
                ID: {user.badgeNumber}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={showMap ? () => setShowMap(false) : requestLocation}
            className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl ${showMap ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'}`}
          >
            <i className={`fa-solid ${showMap ? 'fa-list-check' : 'fa-satellite-dish'} mr-2`}></i>
            {showMap ? 'Show Dashboard' : 'Risk Intelligence Map'}
          </button>
          <button onClick={onLogout} className="bg-red-50 text-red-600 px-8 py-4 rounded-2xl font-black text-xs uppercase hover:bg-red-600 hover:text-white transition-all border border-red-100 shadow-sm active:scale-95">
            Exit System
          </button>
        </div>
      </div>

      {showMap ? (
        <div className="bg-slate-900 rounded-[4rem] p-12 shadow-2xl min-h-[700px] relative overflow-hidden animate-in zoom-in-95 duration-500">
           {/* Stylized Map Background */}
           <div className="absolute inset-0 opacity-20 pointer-events-none">
             <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#10b981 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-emerald-500/30 rounded-full animate-pulse"></div>
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-emerald-500/20 rounded-full"></div>
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-emerald-500/10 rounded-full"></div>
           </div>

           <div className="relative z-10 h-full flex flex-col">
             <div className="flex justify-between items-start mb-12">
               <div>
                 <h2 className="text-4xl font-black text-white tracking-tighter flex items-center gap-4">
                   <i className="fa-solid fa-radar text-emerald-500 animate-pulse"></i>
                   Active Sector Surveillance
                 </h2>
                 <p className="text-slate-500 mt-2 font-medium uppercase tracking-widest text-xs">Freetown Sector-26 • Real-time Risk Assessment</p>
               </div>
               <div className="bg-emerald-500/10 border border-emerald-500/20 px-6 py-3 rounded-2xl">
                 <span className="text-emerald-500 font-black text-xs uppercase tracking-widest">Targets Identified: {tickets.length}</span>
               </div>
             </div>

             <div className="flex-grow relative bg-slate-950/50 rounded-[3rem] border border-white/5 shadow-inner overflow-hidden">
               {/* Map Markers */}
               {tickets.map((t) => {
                 // Simple mapping of lat/lng to percentage for visualization
                 // Freetown approx: lat 8.48, lng -13.23
                 const x = ((t.location.lng + 13.28) / 0.1) * 100;
                 const y = ((8.52 - t.location.lat) / 0.1) * 100;

                 return (
                   <button
                     key={t.id}
                     onClick={() => setSelectedTicket(t)}
                     className="absolute group transition-all hover:scale-125 z-20"
                     style={{ left: `${x}%`, top: `${y}%` }}
                   >
                     <div className="relative">
                       <div className="absolute -inset-4 bg-red-500/20 rounded-full animate-ping"></div>
                       <div className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.5)] border-2 border-white relative z-10">
                         <i className="fa-solid fa-triangle-exclamation text-xs"></i>
                       </div>
                       <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                         <div className="bg-slate-900 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/10 shadow-2xl">
                           {t.plateNumber}
                         </div>
                       </div>
                     </div>
                   </button>
                 );
               })}

               {/* Map Legend */}
               <div className="absolute bottom-8 left-8 bg-slate-900/80 backdrop-blur-md border border-white/10 p-6 rounded-3xl z-30">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Map Intelligence</h4>
                 <div className="space-y-3">
                   <div className="flex items-center gap-3">
                     <div className="w-3 h-3 bg-red-600 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                     <span className="text-[10px] font-black text-white uppercase tracking-widest">Flagged Violation</span>
                   </div>
                   <div className="flex items-center gap-3">
                     <div className="w-3 h-3 bg-emerald-500 rounded-full opacity-50"></div>
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Compliant Asset</span>
                   </div>
                 </div>
               </div>
             </div>

             <div className="mt-12 flex justify-center">
               <button onClick={() => setShowMap(false)} className="bg-white text-slate-900 px-12 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition shadow-2xl active:scale-95">
                 Return to field ops
               </button>
             </div>
           </div>

           {/* Ticket Detail Modal */}
           {selectedTicket && (
             <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[300] flex items-center justify-center p-6 animate-in fade-in duration-300">
               <div className="w-full max-w-lg bg-white rounded-[4rem] p-12 shadow-[0_50px_200px_rgba(0,0,0,0.5)] relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                 
                 <div className="flex justify-between items-start mb-10 relative z-10">
                   <div>
                     <div className="bg-red-100 text-red-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 inline-block">
                       Violation Record
                     </div>
                     <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{selectedTicket.plateNumber}</h3>
                     <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-1">ID: {selectedTicket.id}</p>
                   </div>
                   <button onClick={() => setSelectedTicket(null)} className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all active:scale-90">
                     <i className="fa-solid fa-xmark text-xl"></i>
                   </button>
                 </div>

                 <div className="space-y-8 relative z-10">
                   <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Violation Details</p>
                     <p className="text-xl font-black text-slate-900 leading-tight">{selectedTicket.violationType}</p>
                     <div className="mt-6 pt-6 border-t border-slate-200 flex justify-between items-center">
                       <span className="text-sm font-bold text-slate-500">Fine Amount</span>
                       <span className="text-2xl font-black text-red-600">{selectedTicket.fineAmount.toLocaleString()} SLL</span>
                     </div>
                   </div>

                   <div className="grid grid-cols-2 gap-6">
                     <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Issuing Officer</p>
                       <p className="text-sm font-black text-slate-900">{selectedTicket.issuingOfficer}</p>
                       <p className="text-[10px] font-bold text-emerald-600 uppercase mt-1">{selectedTicket.officerBadge}</p>
                     </div>
                     <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Date & Time</p>
                       <p className="text-sm font-black text-slate-900">{selectedTicket.date}</p>
                     </div>
                   </div>

                   <button 
                    onClick={() => {
                      setSearchVal(selectedTicket.plateNumber);
                      setShowMap(false);
                      handleVerify(selectedTicket.plateNumber);
                      setSelectedTicket(null);
                    }}
                    className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black text-lg hover:bg-emerald-600 transition-all shadow-2xl active:scale-95"
                   >
                     Initiate Intercept
                   </button>
                 </div>
               </div>
             </div>
           )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* LEFT COLUMN: SEARCH & SCAN */}
          <div className="space-y-12">
            <div className="bg-white/40 backdrop-blur-3xl p-12 rounded-[4rem] shadow-[0_40px_100px_rgba(0,0,0,0.04)] border border-white">
              <h2 className="text-3xl font-black mb-10 text-slate-900 tracking-tighter">Registry Acquisition</h2>
              
              <form onSubmit={(e) => { e.preventDefault(); handleVerify(); }} className="space-y-8">
                <div className="relative group">
                  <i className="fa-solid fa-barcode absolute left-8 top-1/2 -translate-y-1/2 text-slate-300 text-2xl"></i>
                  <input 
                    required 
                    placeholder="Enter Plate or VIN Identifier..." 
                    className="w-full pl-20 pr-32 py-8 text-2xl border-2 border-slate-100 bg-white rounded-[3rem] outline-none focus:border-emerald-500 transition-all font-black placeholder:text-slate-200 shadow-inner" 
                    value={searchVal}
                    onChange={e => setSearchVal(e.target.value)}
                  />
                  <button 
                    type="button"
                    onClick={startScanner}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-16 h-16 bg-slate-900 text-white rounded-[2rem] flex items-center justify-center hover:bg-emerald-600 transition-all shadow-xl active:scale-90"
                    title="Camera Scan"
                  >
                    <i className="fa-solid fa-qrcode text-2xl"></i>
                  </button>
                </div>
                <button type="submit" className="w-full bg-emerald-600 text-white py-8 rounded-[3rem] font-black text-2xl hover:bg-emerald-700 transition-all shadow-2xl shadow-emerald-600/20 active:scale-95">
                  Verify Record
                </button>
              </form>

              {checked && (
                <div className="mt-12 animate-in slide-in-from-bottom-8 duration-700">
                  {isAnalyzing ? (
                    <div className="py-20 text-center">
                       <i className="fa-solid fa-atom fa-spin text-emerald-600 text-6xl mb-6"></i>
                       <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-xs">Decrypting Sovereign Registry...</p>
                    </div>
                  ) : result ? (
                    <div className="space-y-10">
                      {/* Safety Score Meter */}
                      <div className="bg-slate-900 text-white p-12 rounded-[3.5rem] relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                        <div className="flex justify-between items-center relative z-10">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500 mb-4">Integrity Diagnostics</p>
                            <h4 className="text-7xl font-black tracking-tighter">{result.plateNumber}</h4>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-2">{result.make} {result.model}</p>
                          </div>
                          <div className="text-right">
                            <div className={`text-6xl font-black mb-2 ${assessment!.score > 70 ? 'text-emerald-500' : assessment!.score > 40 ? 'text-amber-500' : 'text-red-500'}`}>
                              {assessment!.score}%
                            </div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Safety Score</div>
                          </div>
                        </div>
                      </div>

                      {/* Automated Fine Breakdown */}
                      <div className="bg-amber-50/50 border-2 border-amber-100 p-10 rounded-[3.5rem] relative overflow-hidden">
                        <h5 className="text-sm font-black text-amber-800 uppercase tracking-widest mb-8 flex items-center gap-3">
                          <i className="fa-solid fa-calculator text-xl text-amber-600"></i> Automated Penalty Assessment
                        </h5>
                        
                        <div className="space-y-4">
                          {assessment!.penalties.map((p, i) => (
                            <div key={i} className="bg-white p-6 rounded-3xl border border-amber-100 flex justify-between items-center group hover:border-amber-400 transition-colors">
                              <div>
                                <p className="font-black text-slate-900 text-lg tracking-tight">{p.title}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{p.reason}</p>
                              </div>
                              <p className="text-2xl font-black text-red-600">{p.fine} SLL</p>
                            </div>
                          ))}
                          
                          {assessment!.surcharge > 0 && (
                            <div className="p-6 bg-red-50 rounded-3xl border border-red-100 flex justify-between items-center">
                              <div>
                                <p className="font-black text-red-900 text-lg">Recidivism Surcharge (15%)</p>
                                <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mt-1">Multi-incident offender loading</p>
                              </div>
                              <p className="text-2xl font-black text-red-600">+{assessment!.surcharge} SLL</p>
                            </div>
                          )}

                          <div className="mt-10 pt-8 border-t-2 border-dashed border-amber-200 flex justify-between items-center">
                            <div>
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grand Total Penalty</p>
                               <p className="text-5xl font-black text-slate-900 tracking-tighter">{assessment!.totalFine.toLocaleString()} SLL</p>
                            </div>
                            <button 
                              onClick={handleIssueTicket}
                              disabled={issuingTicket || assessment!.totalFine === 0}
                              className="bg-red-600 text-white px-10 py-5 rounded-[2.25rem] font-black text-lg hover:bg-black transition-all shadow-2xl shadow-red-600/20 active:scale-95 disabled:opacity-30 disabled:grayscale"
                            >
                              {issuingTicket ? <i className="fa-solid fa-spinner fa-spin mr-3"></i> : <i className="fa-solid fa-gavel mr-3"></i>}
                              Issue Ticket
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-24 bg-red-50/50 rounded-[4rem] border-4 border-dashed border-red-100">
                      <i className="fa-solid fa-ban text-red-200 text-8xl mb-8"></i>
                      <p className="text-4xl font-black text-slate-900 tracking-tighter">Record Not Found</p>
                      <p className="text-slate-500 font-bold max-w-xs mx-auto text-lg leading-relaxed mt-4">The target ID is not registered in the digital SLRSA sovereign database.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: PATROL HISTORY */}
          <div className="space-y-10">
            <div className="flex justify-between items-center px-6">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Active Patrol Log</h2>
              <span className="bg-white px-4 py-1.5 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border border-slate-100 shadow-sm">Shift History</span>
            </div>
            
            <div className="bg-white rounded-[4rem] shadow-xl border border-slate-100 overflow-hidden">
              <div className="max-h-[950px] overflow-y-auto custom-scrollbar">
                {logs.length > 0 ? logs.map((l, i) => (
                  <div key={l.id} className={`p-10 flex justify-between items-center hover:bg-slate-50 transition-colors border-b border-slate-50 group ${i === 0 ? 'bg-emerald-50/30' : ''}`}>
                    <div className="flex items-center gap-8">
                      <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${l.status.includes('Verified') ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
                        <i className={`fa-solid ${l.status.includes('Verified') ? 'fa-shield-check' : 'fa-triangle-exclamation'} text-2xl`}></i>
                      </div>
                      <div>
                        <p className="font-black text-slate-900 text-2xl tracking-tighter mb-2">{l.vin}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{l.timestamp} • Registry Scan</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-5 py-2 rounded-xl border ${l.status.includes('Verified') ? 'text-emerald-600 bg-white border-emerald-100' : 'text-red-600 bg-white border-red-100'}`}>
                        {l.status}
                      </span>
                    </div>
                  </div>
                )) : (
                  <div className="py-40 text-center">
                    <i className="fa-solid fa-clipboard-list text-slate-100 text-9xl mb-10"></i>
                    <p className="text-slate-400 font-black text-xl uppercase tracking-[0.3em]">No Activity Recorded</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Camera Scanner Overlay */}
      {isScanning && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-3xl z-[200] flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="w-full max-w-2xl bg-white/5 backdrop-blur-md rounded-[4rem] overflow-hidden shadow-2xl border border-white/10 relative">
            <div className="p-10 border-b border-white/10 flex justify-between items-center">
              <div>
                <h3 className="text-3xl font-black text-white tracking-tighter">Tactical Acquisition</h3>
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] mt-2">Active Laser Analysis Enabled</p>
              </div>
              <button onClick={stopScanner} className="w-16 h-16 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white hover:text-slate-900 transition-all border border-white/20">
                <i className="fa-solid fa-xmark text-2xl"></i>
              </button>
            </div>
            
            <div className="relative aspect-square bg-black group overflow-hidden">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover opacity-80" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-80 h-80 border-2 border-emerald-500/50 rounded-[3rem] relative animate-pulse">
                   <div className="absolute top-0 left-0 w-16 h-16 border-t-8 border-l-8 border-emerald-500 -ml-2 -mt-2 rounded-tl-3xl shadow-[0_0_20px_rgba(16,185,129,0.5)]"></div>
                   <div className="absolute top-0 right-0 w-16 h-16 border-t-8 border-r-8 border-emerald-500 -mr-2 -mt-2 rounded-tr-3xl shadow-[0_0_20px_rgba(16,185,129,0.5)]"></div>
                   <div className="absolute bottom-0 left-0 w-16 h-16 border-b-8 border-l-8 border-emerald-500 -ml-2 -mb-2 rounded-bl-3xl shadow-[0_0_20px_rgba(16,185,129,0.5)]"></div>
                   <div className="absolute bottom-0 right-0 w-16 h-16 border-b-8 border-r-8 border-emerald-500 -mr-2 -mb-2 rounded-br-3xl shadow-[0_0_20px_rgba(16,185,129,0.5)]"></div>
                   <div className="absolute left-0 right-0 h-1 bg-emerald-500/30 top-1/2 -translate-y-1/2 shadow-[0_0_20px_rgba(16,185,129,1)]"></div>
                </div>
              </div>
            </div>
            
            <div className="p-12 text-center bg-white/5 space-y-8">
              <p className="text-xl font-medium text-slate-400 leading-relaxed max-w-sm mx-auto"> Align license plate or <span className="text-white font-black">Digital Barcode</span> for sovereign decryption.</p>
              <button onClick={simulateScan} className="w-full bg-emerald-600 text-white py-6 rounded-[2.5rem] font-black text-xl hover:bg-white hover:text-slate-900 transition-all shadow-2xl shadow-emerald-600/20 active:scale-95 border border-white/10">Simulate Acquisition</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LawEnforcerDashboard;
