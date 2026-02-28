
import React, { useState, useMemo, useEffect } from 'react';
import { User, Vehicle, Transaction, Inspection, InspectionStatus, UserRole, AppNotification } from '../../types';
import { db } from '../../services/mockDb';

const CitizenDashboard: React.FC<{ user: User; onLogout: () => void }> = ({ user, onLogout }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>(db.getVehicles().filter(v => v.ownerName === user.fullName));
  const [showPayment, setShowPayment] = useState(false);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [serviceFiles, setServiceFiles] = useState<{license?: string, nationalId?: string}>({});
  const [registrationForm, setRegistrationForm] = useState({ make: '', model: '', year: new Date().getFullYear(), vin: '' });
  const [paymentType, setPaymentType] = useState<'License' | 'Insurance' | 'Registration'>('License');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<'Afri-money' | 'Orange-Money' | null>(null);
  const [inspections, setInspections] = useState<Inspection[]>(db.getInspections().filter(i => i.ownerName === user.fullName));
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({ vin: '', date: '' });
  const [viewingInspection, setViewingInspection] = useState<Inspection | null>(null);
  const [viewingVehicle, setViewingVehicle] = useState<Vehicle | null>(null);
  const [showVehicleSelect, setShowVehicleSelect] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [selectedVehicleVin, setSelectedVehicleVin] = useState<string | null>(null);

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const fetchNotifications = () => {
      setNotifications(db.getNotifications(user.id, user.role));
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 3000);
    return () => clearInterval(interval);
  }, [user.id, user.role]);

  const unreadCount = notifications.filter(n => n.status === 'Unread').length;

  const handleMarkRead = (id: string) => {
    db.markNotificationRead(id);
    setNotifications(db.getNotifications(user.id, user.role));
  };

  const [activeTab, setActiveTab] = useState<'overview' | 'fleet' | 'license' | 'wallet' | 'settings'>('overview');
  const [walletStep, setWalletStep] = useState(1);
  const [walletPin, setWalletPin] = useState('');
  const [isWalletSetup, setIsWalletSetup] = useState(false);
  const [checkedRequirements, setCheckedRequirements] = useState<number[]>([]);
  const [licenseDocs, setLicenseDocs] = useState<{medicalReport?: string, trainingCert?: string, passportPhoto?: string, nationalIdDoc?: string}>({});
  const [licenseStep, setLicenseStep] = useState<'form' | 'test' | 'payment'>('form');
  const [testCurrentQuestion, setTestCurrentQuestion] = useState(0);
  const [testAnswers, setTestAnswers] = useState<Record<number, number>>({});
  const [testCompleted, setTestCompleted] = useState(false);

  const [settingsForm, setSettingsForm] = useState({
    fullName: user.fullName,
    email: user.email || '',
    address: user.address || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [profileImage, setProfileImage] = useState<string | null>(user.profileImage || null);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Profile updated successfully!');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (settingsForm.newPassword !== settingsForm.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    alert('Password changed successfully!');
  };

  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const roadSafetyQuestions = [
    {
      q: "What is the primary rule of the road in Sierra Leone?",
      options: ["Drive on the left", "Drive on the right", "Drive in the middle", "Overtake from the left"],
      correct: 0
    },
    {
      q: "What does a solid yellow line in the center of the road mean?",
      options: ["Overtaking allowed", "No overtaking allowed", "Parking allowed", "Speed limit 50km/h"],
      correct: 1
    },
    {
      q: "When approaching a roundabout, who has the right of way?",
      options: ["Vehicles entering", "Vehicles already in the roundabout", "The fastest vehicle", "Public transport"],
      correct: 1
    },
    {
      q: "What should you do when you see a flashing red light at an intersection?",
      options: ["Slow down and proceed", "Speed up to clear the intersection", "Stop completely and proceed when safe", "Ignore it if no traffic"],
      correct: 2
    },
    {
      q: "What is the legal blood alcohol limit for drivers in Sierra Leone?",
      options: ["0.05%", "0.08%", "0.00% (Zero Tolerance)", "0.10%"],
      correct: 2
    },
    {
      q: "When must you use your headlights?",
      options: ["Only at midnight", "From sunset to sunrise", "Only when it's raining", "When you want to look cool"],
      correct: 1
    },
    {
      q: "What does a 'Stop' sign require you to do?",
      options: ["Slow down", "Yield to others", "Come to a complete halt", "Honk your horn"],
      correct: 2
    },
    {
      q: "Which of these is a major cause of road accidents?",
      options: ["Driving too slow", "Over-speeding", "Using indicators", "Regular maintenance"],
      correct: 1
    },
    {
      q: "What is the meaning of a blue circular sign with a white arrow?",
      options: ["No entry", "Mandatory direction", "Parking area", "Hospital ahead"],
      correct: 1
    },
    {
      q: "When are you allowed to use your mobile phone while driving?",
      options: ["Always", "Only for emergencies", "Never, unless using hands-free", "When stopped at a red light"],
      correct: 2
    },
    {
      q: "What is the safe following distance behind another vehicle?",
      options: ["1 meter", "The 2-second rule", "10 meters", "As close as possible"],
      correct: 1
    },
    {
      q: "What should you do if your vehicle breaks down on a highway?",
      options: ["Leave it in the middle", "Push it to the side and use warning triangles", "Sit inside and wait", "Walk away"],
      correct: 1
    },
    {
      q: "What does a pedestrian crossing (Zebra crossing) mean?",
      options: ["Cars have priority", "Pedestrians have priority", "No stopping", "Speed up"],
      correct: 1
    },
    {
      q: "What is the maximum speed limit in a residential area?",
      options: ["30 km/h", "50 km/h", "80 km/h", "100 km/h"],
      correct: 0
    },
    {
      q: "What should you do when an emergency vehicle with sirens is approaching?",
      options: ["Race it", "Pull over to the side and stop", "Ignore it", "Follow it closely"],
      correct: 1
    },
    {
      q: "What is the purpose of a seatbelt?",
      options: ["To avoid fines", "To keep you in place during a collision", "To look professional", "To hold the seat"],
      correct: 1
    }
  ];

  const [licenseRegForm, setLicenseRegForm] = useState({
    fullName: user.fullName,
    nationalId: '',
    docRef: '',
    dob: '',
    address: user.address,
    bloodGroup: '',
    licenseType: 'Private' as 'Private' | 'Commercial' | 'Motorcycle'
  });

  const REGISTRATION_FEE = 2500;
  const LICENSE_FEE = 500;
  const INSURANCE_FEE = 750;

  const checkExpiryStatus = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return {
      isExpired: diffDays < 0,
      isNearing: diffDays >= 0 && diffDays <= 30,
      daysLeft: diffDays
    };
  };

  const expiringVehicles = useMemo(() => {
    return vehicles.filter(v => {
      const status = checkExpiryStatus(v.licenseExpiry);
      return status.isNearing || status.isExpired;
    });
  }, [vehicles]);

  const handlePaymentInitiation = (method: 'Afri-money' | 'Orange-Money') => {
    setSelectedMethod(method);
  };

  const processPayment = async () => {
    if (!phoneNumber || !selectedMethod) return;
    
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const amount = paymentType === 'License' ? LICENSE_FEE : paymentType === 'Insurance' ? INSURANCE_FEE : REGISTRATION_FEE;
    const newTx: Transaction = {
      id: `TX-${Math.floor(100000 + Math.random() * 900000)}`,
      citizenId: user.id,
      amount,
      type: paymentType,
      status: 'Completed',
      method: selectedMethod,
      date: new Date().toLocaleDateString()
    };
    
    db.addTransaction(newTx);
    
    // Send Notification to License Department
    db.addNotification({
      recipientId: UserRole.LICENSE_DEPT,
      senderId: user.id,
      senderName: user.fullName,
      title: `New ${paymentType} Application`,
      message: `${user.fullName} has submitted a ${paymentType} application for review.`,
      type: 'License_Application',
      metadata: {
        vehicleVin: paymentType === 'Registration' ? registrationForm.vin : selectedVehicleVin
      }
    });

    setIsProcessing(false);
    setPaymentSuccess(true);
    
    if (paymentType === 'Registration') {
      const newVehicle: Vehicle = {
        vin: registrationForm.vin || `V${Math.floor(100000000 + Math.random() * 900000000)}`,
        plateNumber: 'PENDING',
        ownerName: user.fullName,
        make: registrationForm.make || 'Unknown',
        model: registrationForm.model || 'Unknown',
        year: registrationForm.year,
        licenseExpiry: new Date(Date.now() + 31536000000).toISOString().split('T')[0],
        insuranceExpiry: new Date(Date.now() + 31536000000).toISOString().split('T')[0],
        insuranceProvider: 'Pending Assignment',
        status: 'Pending',
        violationHistory: [],
        documents: Object.values(serviceFiles)
      };
      db.addVehicle(newVehicle);
      setVehicles(db.getVehicles().filter(v => v.ownerName === user.fullName));
    } else {
      const targetVin = selectedVehicleVin || vehicles[0]?.vin; 
      if (targetVin) {
        db.updateVehicle(targetVin, {
          [paymentType === 'License' ? 'licenseExpiry' : 'insuranceExpiry']: new Date(Date.now() + 31536000000).toISOString().split('T')[0],
          status: 'Active'
        });
        setVehicles(db.getVehicles().filter(v => v.ownerName === user.fullName));
      }
    }
  };

  const closePayment = () => {
    setShowPayment(false);
    setShowServiceForm(false);
    setPaymentSuccess(false);
    setPhoneNumber('');
    setSelectedMethod(null);
    setServiceFiles({});
    setLicenseDocs({});
    setSelectedVehicleVin(null);
  };

  const handleRegisterClick = () => {
    if (vehicles.length === 0) {
      setRegError("No license Found");
      return;
    }
    setShowVehicleSelect(true);
  };

  const handleVehicleSelect = (vin: string) => {
    setSelectedVehicleVin(vin);
    setShowVehicleSelect(false);
    setShowServiceForm(true);
  };

  const handleScheduleInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 1500));

    const vehicle = vehicles.find(v => v.vin === scheduleForm.vin);
    if (!vehicle) return;

    const newInsp: Inspection = {
      id: `INSP-${Math.floor(1000 + Math.random() * 9000)}`,
      vehicleVin: vehicle.vin,
      plateNumber: vehicle.plateNumber,
      ownerName: user.fullName,
      scheduledDate: scheduleForm.date,
      status: InspectionStatus.SCHEDULED
    };

    db.addInspection(newInsp);
    setInspections([...db.getInspections().filter(i => i.ownerName === user.fullName)]);
    setIsProcessing(false);
    setShowScheduleModal(false);
    setScheduleForm({ vin: '', date: '' });
  };

  const requirementsList = [
    { icon: 'fa-id-card', title: 'National ID Card', desc: 'Valid Sierra Leonean National ID' },
    { icon: 'fa-stethoscope', title: 'Medical Report', desc: 'Certified eye and physical test' },
    { icon: 'fa-image', title: 'Passport Photos', desc: '2 recent color photographs' },
    { icon: 'fa-graduation-cap', title: 'Training Certificate', desc: 'From an accredited driving school' }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen bg-white dark:bg-[#0a192f] transition-colors duration-700 font-sans relative">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px] dark:opacity-20"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-blue-500/10 rounded-full blur-[100px] dark:opacity-20"></div>
      </div>

      {/* Inspection Details Modal */}
      {viewingInspection && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setViewingInspection(null)}></div>
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-xl rounded-[3rem] shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Inspection Report</h3>
                  <p className="text-emerald-600 font-black text-[10px] uppercase tracking-[0.4em] mt-1">SLRSA Official Record</p>
                </div>
                <button onClick={() => setViewingInspection(null)} className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                    <p className={`text-xl font-black ${
                      viewingInspection.status === InspectionStatus.PASSED ? 'text-emerald-600' :
                      viewingInspection.status === InspectionStatus.FAILED ? 'text-red-600' : 'text-blue-600'
                    }`}>{viewingInspection.status}</p>
                  </div>
                  <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Scheduled Date</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white">{viewingInspection.scheduledDate}</p>
                  </div>
                </div>

                {viewingInspection.conductedDate && (
                  <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Conducted On</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white">{viewingInspection.conductedDate}</p>
                  </div>
                )}

                <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Inspector</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white">{viewingInspection.inspectorName || 'Pending Assignment'}</p>
                </div>

                <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Inspector Notes</p>
                  <p className="text-slate-700 dark:text-slate-300 font-medium italic leading-relaxed">
                    {viewingInspection.notes ? `"${viewingInspection.notes}"` : 'No notes provided for this inspection.'}
                  </p>
                </div>

                {viewingInspection.checkpoints && (
                  <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Checkpoint Results</p>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(viewingInspection.checkpoints).map(([key, passed]) => (
                        <div key={key} className="flex items-center gap-3">
                          <i className={`fa-solid ${passed ? 'fa-circle-check text-emerald-500' : 'fa-circle-xmark text-red-500'}`}></i>
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 capitalize">{key}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle Details Modal */}
      {viewingVehicle && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setViewingVehicle(null)}></div>
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{viewingVehicle.make} {viewingVehicle.model}</h3>
                  <p className="text-emerald-600 font-black text-[10px] uppercase tracking-[0.4em] mt-1">Vehicle Registration Details</p>
                </div>
                <button onClick={() => setViewingVehicle(null)} className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Plate Number</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">{viewingVehicle.plateNumber}</p>
                  </div>
                  <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">VIN</p>
                    <p className="text-xl font-mono font-black text-slate-900 dark:text-white">{viewingVehicle.vin}</p>
                  </div>
                  <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Year of Manufacture</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white">{viewingVehicle.year}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">License Expiry</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white">{viewingVehicle.licenseExpiry}</p>
                  </div>
                  <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Insurance Policy</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white">{viewingVehicle.insuranceProvider}</p>
                    <p className="text-xs text-slate-500 font-bold mt-1">Expires: {viewingVehicle.insuranceExpiry}</p>
                  </div>
                  <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Violation History</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white">{viewingVehicle.violationHistory.length} Record(s)</p>
                  </div>
                </div>
              </div>

              {viewingVehicle.violationHistory.length > 0 && (
                <div className="mt-8 p-6 bg-red-500/5 border border-red-500/10 rounded-3xl">
                  <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-3">Recent Violations</p>
                  <ul className="space-y-2">
                    {viewingVehicle.violationHistory.map((v, i) => (
                      <li key={i} className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <i className="fa-solid fa-triangle-exclamation text-red-500"></i>
                        {v}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div className="flex items-center gap-6">
            {user.profileImage ? (
              <img src={user.profileImage} alt="Profile" className="w-20 h-20 rounded-full object-cover border-4 border-emerald-500/30 shadow-2xl" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center border-4 border-slate-300 dark:border-slate-700 shadow-2xl">
                <i className="fa-solid fa-user text-3xl text-slate-400 dark:text-slate-600"></i>
              </div>
            )}
            <div>
              <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">Citizen Portal</h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium uppercase text-[10px] tracking-[0.4em] mt-2">
                National Registry Access • <span className="text-emerald-600 dark:text-emerald-400 font-black">{user.fullName}</span>
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <button onClick={handleRegisterClick} className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-emerald-700 transition shadow-[0_20px_40px_-10px_rgba(16,185,129,0.3)] flex items-center gap-3 active:scale-95">
              <i className="fa-solid fa-rotate text-lg"></i> Renew Vehicle License
            </button>
            <button onClick={onLogout} className="bg-white/40 dark:bg-white/5 backdrop-blur-md border border-white/60 dark:border-white/10 text-slate-900 dark:text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white dark:hover:bg-white/10 transition shadow-lg active:scale-95">
              Logout
            </button>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative bg-white/40 dark:bg-white/5 backdrop-blur-md border border-white/60 dark:border-white/10 text-slate-900 dark:text-white w-14 h-14 rounded-2xl flex items-center justify-center hover:bg-white dark:hover:bg-white/10 transition shadow-lg active:scale-95"
            >
              <i className="fa-solid fa-bell text-xl"></i>
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* NOTIFICATIONS DROPDOWN */}
        {showNotifications && (
          <div className="absolute right-8 top-32 w-96 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-[3rem] shadow-2xl border border-white/20 z-[100] animate-in fade-in slide-in-from-top-4 duration-300 overflow-hidden">
            <div className="p-8 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
              <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Notifications</h4>
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full">Live Updates</span>
            </div>
            <div className="max-h-[400px] overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {notifications.length > 0 ? (
                notifications.map(n => (
                  <div 
                    key={n.id} 
                    onClick={() => handleMarkRead(n.id)}
                    className={`p-6 rounded-3xl border transition-all cursor-pointer ${
                      n.status === 'Unread' 
                        ? 'bg-emerald-500/5 border-emerald-500/20 shadow-sm' 
                        : 'bg-slate-50 dark:bg-white/5 border-transparent opacity-60'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{n.type.replace('_', ' ')}</span>
                      <span className="text-[10px] font-bold text-slate-400">{n.date}</span>
                    </div>
                    <h5 className="font-black text-slate-900 dark:text-white text-sm mb-1">{n.title}</h5>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-medium leading-relaxed">{n.message}</p>
                    {n.metadata?.reviewDate && (
                      <div className="mt-3 p-3 bg-white dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Scheduled Date</p>
                        <p className="text-sm font-black text-emerald-600">{n.metadata.reviewDate}</p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-12 text-center">
                  <i className="fa-solid fa-bell-slash text-slate-300 text-4xl mb-4"></i>
                  <p className="text-slate-400 font-black text-xs uppercase tracking-widest">No notifications yet</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB NAVIGATION */}
        <div className="flex gap-2 mb-12 p-2 bg-white/30 dark:bg-white/5 backdrop-blur-md rounded-[2.5rem] border border-white/60 dark:border-white/10 w-fit">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`px-10 py-4 rounded-[2rem] font-black text-xs uppercase tracking-widest transition-all duration-300 flex items-center gap-3 ${
              activeTab === 'overview' 
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl scale-105' 
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <i className="fa-solid fa-gauge-high"></i> Overview
          </button>
          <button 
            onClick={() => setActiveTab('fleet')}
            className={`px-10 py-4 rounded-[2rem] font-black text-xs uppercase tracking-widest transition-all duration-300 flex items-center gap-3 ${
              activeTab === 'fleet' 
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl scale-105' 
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <i className="fa-solid fa-car-side"></i> My Fleet
          </button>
          <button 
            onClick={() => setActiveTab('license')}
            className={`px-10 py-4 rounded-[2rem] font-black text-xs uppercase tracking-widest transition-all duration-300 flex items-center gap-3 ${
              activeTab === 'license' 
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl scale-105' 
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <i className="fa-solid fa-id-card"></i> License Registration
          </button>
          <button 
            onClick={() => setActiveTab('wallet')}
            className={`px-10 py-4 rounded-[2rem] font-black text-xs uppercase tracking-widest transition-all duration-300 flex items-center gap-3 ${
              activeTab === 'wallet' 
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl scale-105' 
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <i className="fa-solid fa-wallet"></i> Sovereign Wallet
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`px-10 py-4 rounded-[2rem] font-black text-xs uppercase tracking-widest transition-all duration-300 flex items-center gap-3 ${
              activeTab === 'settings' 
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl scale-105' 
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <i className="fa-solid fa-gear"></i> Settings
          </button>
        </div>

        {activeTab === 'fleet' && (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white/40 dark:bg-white/5 backdrop-blur-3xl p-8 rounded-[3rem] border border-white/60 dark:border-white/10 shadow-xl">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-2">Total Fleet</p>
                <p className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">{vehicles.length}</p>
                <p className="text-xs font-bold text-slate-500 mt-2">Registered Assets</p>
              </div>
              <div className="bg-white/40 dark:bg-white/5 backdrop-blur-3xl p-8 rounded-[3rem] border border-white/60 dark:border-white/10 shadow-xl">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-2">Active Licenses</p>
                <p className="text-5xl font-black text-emerald-600 tracking-tighter">
                  {vehicles.filter(v => !checkExpiryStatus(v.licenseExpiry).isExpired).length}
                </p>
                <p className="text-xs font-bold text-slate-500 mt-2">Compliant Vehicles</p>
              </div>
              <div className="bg-white/40 dark:bg-white/5 backdrop-blur-3xl p-8 rounded-[3rem] border border-white/60 dark:border-white/10 shadow-xl">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-2">Action Required</p>
                <p className="text-5xl font-black text-red-600 tracking-tighter">
                  {vehicles.filter(v => checkExpiryStatus(v.licenseExpiry).isExpired || checkExpiryStatus(v.licenseExpiry).isNearing).length}
                </p>
                <p className="text-xs font-bold text-slate-500 mt-2">Expired or Expiring</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {vehicles.map(v => {
                const licenseStatus = checkExpiryStatus(v.licenseExpiry);
                const insuranceStatus = checkExpiryStatus(v.insuranceExpiry);
                return (
                  <div key={v.vin} className="bg-white/40 dark:bg-white/5 backdrop-blur-md p-10 rounded-[4rem] border border-white/60 dark:border-white/10 shadow-2xl group hover:scale-[1.02] transition-all duration-500">
                    <div className="flex justify-between items-start mb-8">
                      <div>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{v.make} {v.model}</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{v.plateNumber}</p>
                      </div>
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${
                        licenseStatus.isExpired ? 'bg-red-500/10 text-red-600' : 
                        licenseStatus.isNearing ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600'
                      }`}>
                        <i className={`fa-solid ${licenseStatus.isExpired ? 'fa-circle-exclamation' : 'fa-circle-check'}`}></i>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="flex justify-between items-center p-5 bg-white/30 dark:bg-white/5 rounded-3xl border border-white/40 dark:border-white/10">
                        <div className="flex items-center gap-4">
                          <i className="fa-solid fa-id-card text-emerald-600"></i>
                          <span className="text-xs font-black text-slate-500 uppercase tracking-widest">License</span>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-black ${licenseStatus.isExpired ? 'text-red-600' : 'text-slate-900 dark:text-white'}`}>{v.licenseExpiry}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{licenseStatus.isExpired ? 'Expired' : 'Valid'}</p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center p-5 bg-white/30 dark:bg-white/5 rounded-3xl border border-white/40 dark:border-white/10">
                        <div className="flex items-center gap-4">
                          <i className="fa-solid fa-shield-halved text-blue-600"></i>
                          <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Insurance</span>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-black ${insuranceStatus.isExpired ? 'text-red-600' : 'text-slate-900 dark:text-white'}`}>{v.insuranceExpiry}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{v.insuranceProvider}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 flex gap-4">
                      <button 
                        onClick={() => { setViewingVehicle(v); }}
                        className="flex-1 bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white dark:hover:bg-white/10 transition-all"
                      >
                        View Details
                      </button>
                      <button 
                        onClick={() => { setPaymentType('License'); setSelectedVehicleVin(v.vin); setShowPayment(true); }}
                        className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
                      >
                        Renew Now
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'overview' && (
          <>
            {/* NOTIFICATION SYSTEM: Expiry Alerts Banner */}
            {regError && (
              <div className="mb-12 p-8 bg-red-500/10 dark:bg-red-500/5 backdrop-blur-3xl border border-red-500/30 rounded-[3rem] flex items-center justify-between shadow-2xl animate-in slide-in-from-top-6 duration-700 relative overflow-hidden">
                <div className="flex items-center gap-8">
                  <div className="w-16 h-16 bg-red-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-lg shadow-red-500/20">
                    <i className="fa-solid fa-ban text-2xl"></i>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-red-900 dark:text-red-400 tracking-tight">{regError}</h3>
                    <p className="text-red-800/80 dark:text-red-500/70 font-bold">Visit SLRSA Headquarters, Kissy Road, Freetown for your license</p>
                  </div>
                </div>
                <button onClick={() => setRegError(null)} className="w-12 h-12 rounded-full bg-red-600/10 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all">
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            )}

            {expiringVehicles.length > 0 && (
              <div className="mb-12 p-8 bg-amber-500/10 dark:bg-amber-500/5 backdrop-blur-3xl border border-amber-500/30 rounded-[3rem] flex flex-col md:flex-row items-center gap-8 shadow-2xl animate-in slide-in-from-top-6 duration-700 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
            <div className="w-16 h-16 bg-amber-500 rounded-[1.5rem] flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <i className="fa-solid fa-bell-exclamation text-2xl animate-bounce"></i>
            </div>
            <div className="flex-grow text-center md:text-left">
              <h3 className="text-2xl font-black text-amber-900 dark:text-amber-400 tracking-tight">License Renewal Required</h3>
              <p className="text-amber-800/80 dark:text-amber-500/70 font-bold text-lg">
                You have <span className="underline decoration-2 underline-offset-4">{expiringVehicles.length} vehicle(s)</span> approaching the mandatory renewal deadline.
              </p>
            </div>
            <button 
              onClick={() => { setPaymentType('License'); setShowPayment(true); }} 
              className="bg-amber-600 text-white px-10 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-amber-700 transition shadow-xl whitespace-nowrap active:scale-95"
            >
              Renew All Now
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content: Vehicle List */}
          <div className="lg:col-span-2 space-y-10">
            <h2 
              className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-4 tracking-tight cursor-pointer hover:text-emerald-600 transition-colors"
              onClick={handleRegisterClick}
            >
              <i className="fa-solid fa-car-rear text-emerald-600"></i> My Registered Assets
            </h2>
            
            {vehicles.length > 0 ? (
              vehicles.map(v => {
                const licenseStatus = checkExpiryStatus(v.licenseExpiry);
                const insuranceStatus = checkExpiryStatus(v.insuranceExpiry);
                
                return (
                  <div key={v.vin} className={`relative bg-white/40 dark:bg-white/5 backdrop-blur-[80px] p-10 rounded-[4rem] shadow-2xl border transition-all duration-500 group ${
                    licenseStatus.isExpired ? 'border-red-500/30 ring-4 ring-red-500/5' : 
                    licenseStatus.isNearing ? 'border-amber-500/30 ring-4 ring-amber-500/5' : 
                    'border-white/60 dark:border-white/10'
                  }`}>
                    
                    {/* Status Glow Overlay */}
                    <div className={`absolute inset-0 rounded-[4rem] opacity-0 group-hover:opacity-5 transition-opacity duration-700 pointer-events-none ${
                      licenseStatus.isExpired ? 'bg-red-500' : 
                      licenseStatus.isNearing ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}></div>

                    <div className="flex justify-between items-start mb-10 relative z-10">
                      <div className="cursor-pointer group/title" onClick={() => setViewingVehicle(v)}>
                        <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter group-hover/title:text-emerald-600 transition-colors">{v.make} {v.model}</h3>
                        <p className="text-slate-400 dark:text-slate-500 font-mono text-[10px] uppercase tracking-widest mt-2 flex items-center gap-2">
                          VIN: {v.vin}
                          <span className="text-emerald-500 opacity-0 group-hover/title:opacity-100 transition-opacity">(Click for full details)</span>
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        <span className={`px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border ${
                          v.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 
                          v.status === 'Pending' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                          'bg-red-500/10 text-red-600 border-red-500/20'
                        }`}>
                          {v.status} Status
                        </span>
                        
                        {/* VISUAL INDICATOR: Pulsing Countdown */}
                        {v.status === 'Pending' && (
                          <div className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20">
                            <i className="fa-solid fa-hourglass-half"></i>
                            Registration Pending
                          </div>
                        )}
                        {licenseStatus.isNearing && (
                          <div className="flex items-center gap-2 bg-amber-500 text-white px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 animate-pulse">
                            <i className="fa-solid fa-clock"></i>
                            Expiring in {licenseStatus.daysLeft} Days
                          </div>
                        )}
                        {licenseStatus.isExpired && (
                          <div className="flex items-center gap-2 bg-red-600 text-white px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-600/20">
                            <i className="fa-solid fa-circle-exclamation"></i>
                            License Expired
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10 relative z-10">
                      <div className={`p-8 rounded-[2.5rem] border transition-all duration-500 ${
                        licenseStatus.isNearing ? 'bg-amber-500/10 border-amber-500/20 shadow-inner' : 
                        licenseStatus.isExpired ? 'bg-red-500/10 border-red-500/20 shadow-inner' : 
                        'bg-white/30 dark:bg-white/5 border-white/60 dark:border-white/10'
                      }`}>
                        <div className="flex items-center gap-4 mb-3">
                          <i className={`fa-solid fa-id-card text-xl ${licenseStatus.isNearing ? 'text-amber-600' : 'text-emerald-600'}`}></i>
                          <p className={`text-[10px] font-black uppercase tracking-widest ${licenseStatus.isNearing ? 'text-amber-600' : 'text-slate-400'}`}>License Details</p>
                        </div>
                        <p className="text-2xl font-black text-slate-800 dark:text-white mb-1">{v.plateNumber}</p>
                        <p className={`text-xs font-bold ${licenseStatus.isNearing ? 'text-amber-700 dark:text-amber-400' : 'text-slate-500'}`}>
                          Valid Until: <span className="font-black">{v.licenseExpiry}</span>
                        </p>
                      </div>

                      <div className="p-8 bg-white/30 dark:bg-white/5 backdrop-blur-md rounded-[2.5rem] border border-white/60 dark:border-white/10">
                        <div className="flex items-center gap-4 mb-3">
                          <i className="fa-solid fa-shield-halved text-blue-600 text-xl"></i>
                          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Insurance Policy</p>
                        </div>
                        <p className="text-2xl font-black text-slate-800 dark:text-white mb-1">{v.insuranceProvider}</p>
                        <p className="text-xs text-slate-500 font-bold">
                          Valid Until: <span className="text-slate-800 dark:text-slate-200 font-black">{v.insuranceExpiry}</span>
                        </p>
                      </div>

                        <div 
                          className="p-8 bg-white/30 dark:bg-white/5 backdrop-blur-md rounded-[2.5rem] border border-white/60 dark:border-white/10 cursor-pointer hover:bg-white/50 dark:hover:bg-white/10 transition-all"
                          onClick={() => {
                            const vehicleInspection = inspections.find(i => i.vehicleVin === v.vin);
                            if (vehicleInspection) setViewingInspection(vehicleInspection);
                          }}
                        >
                          <div className="flex items-center gap-4 mb-3">
                            <i className="fa-solid fa-clipboard-check text-purple-600 text-xl"></i>
                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Inspection Status</p>
                          </div>
                          {(() => {
                            const vehicleInspection = inspections.find(i => i.vehicleVin === v.vin);
                            const status = vehicleInspection?.status || 'Not Scheduled';
                            const statusColor = 
                              status === 'Passed' ? 'text-emerald-600' : 
                              status === 'Failed' ? 'text-red-600' : 
                              status === 'Scheduled' ? 'text-amber-600' : 'text-slate-500';
                            
                            return (
                              <>
                                <p className={`text-2xl font-black mb-1 ${statusColor}`}>{status}</p>
                                <p className="text-xs text-slate-500 font-bold">
                                  {vehicleInspection ? `Last Update: ${vehicleInspection.scheduledDate}` : 'Action Required'}
                                </p>
                              </>
                            );
                          })()}
                        </div>
                    </div>

                    <div className="flex gap-4 relative z-10 mb-8">
                      <button 
                        onClick={() => { setPaymentType('License'); setShowPayment(true); }} 
                        className={`flex-1 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] transition shadow-xl active:scale-95 ${
                          licenseStatus.isNearing || licenseStatus.isExpired ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-slate-900 dark:bg-white dark:text-slate-900 text-white hover:bg-black'
                        }`}
                      >
                        {licenseStatus.isExpired ? 'Renew Expired License' : 'Renew License'}
                      </button>
                      <button 
                        onClick={() => { setPaymentType('Insurance'); setShowPayment(true); }} 
                        className="flex-1 bg-blue-600 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-700 transition shadow-xl active:scale-95"
                      >
                        Renew Policy
                      </button>
                    </div>

                    {/* Document Management Section */}
                    <div className="relative z-10 pt-8 border-t border-white/40 dark:border-white/5">
                      <div className="flex justify-between items-center mb-6">
                        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                          <i className="fa-solid fa-folder-open text-emerald-600"></i> Supporting Documents
                        </h4>
                        <label className="cursor-pointer bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                          <i className="fa-solid fa-upload mr-2"></i> Upload New
                          <input 
                            type="file" 
                            className="hidden" 
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                const fileName = e.target.files[0].name;
                                const currentDocs = v.documents || [];
                                db.updateVehicle(v.vin, { documents: [...currentDocs, fileName] });
                                setVehicles(db.getVehicles().filter(veh => veh.ownerName === user.fullName));
                              }
                            }}
                          />
                        </label>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {(v.documents && v.documents.length > 0) ? v.documents.map((doc, idx) => (
                          <div key={idx} className="flex items-center justify-between p-4 bg-white/30 dark:bg-white/5 rounded-2xl border border-white/60 dark:border-white/10 group/doc">
                            <div className="flex items-center gap-3 overflow-hidden">
                              <i className="fa-solid fa-file-pdf text-red-500"></i>
                              <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 truncate uppercase tracking-tighter">{doc}</span>
                            </div>
                            <button 
                              onClick={() => {
                                const newDocs = v.documents?.filter((_, i) => i !== idx);
                                db.updateVehicle(v.vin, { documents: newDocs });
                                setVehicles(db.getVehicles().filter(veh => veh.ownerName === user.fullName));
                              }}
                              className="text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <i className="fa-solid fa-circle-xmark"></i>
                            </button>
                          </div>
                        )) : (
                          <div className="col-span-2 py-6 text-center bg-slate-100/50 dark:bg-white/5 rounded-3xl border-2 border-dashed border-slate-200 dark:border-white/10">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No documents uploaded yet</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-white/20 dark:bg-white/5 backdrop-blur-3xl p-32 rounded-[5rem] text-center border-4 border-dashed border-white/40 dark:border-white/10">
                <div className="w-24 h-24 bg-white/40 dark:bg-white/10 rounded-full flex items-center justify-center mx-auto mb-10 text-slate-300 dark:text-slate-700">
                  <i className="fa-solid fa-car-rear text-6xl"></i>
                </div>
                <p className="text-2xl font-black text-slate-400 tracking-tight">No vehicles found in your registry.</p>
                <button 
                  onClick={handleRegisterClick} 
                  className="mt-8 text-emerald-600 dark:text-emerald-400 font-black text-lg hover:underline decoration-2 underline-offset-8"
                >
                  Renew your Assets
                </button>
              </div>
            )}

            {/* Inspections Section */}
            <div className="space-y-10 pt-10">
              <div className="flex justify-between items-center">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-4 tracking-tight">
                  <i className="fa-solid fa-clipboard-check text-blue-600"></i> Vehicle Inspections
                </h2>
                <button 
                  onClick={() => setShowScheduleModal(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition shadow-lg"
                >
                  Schedule Inspection
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {inspections.map(insp => (
                  <div key={insp.id} className="bg-white/40 dark:bg-white/5 backdrop-blur-md p-8 rounded-[3rem] border border-white/60 dark:border-white/10 shadow-xl">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">{insp.plateNumber}</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{insp.vehicleVin}</p>
                      </div>
                      <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                        insp.status === InspectionStatus.PASSED ? 'bg-emerald-100 text-emerald-600' :
                        insp.status === InspectionStatus.FAILED ? 'bg-red-100 text-red-600' :
                        insp.status === InspectionStatus.SCHEDULED ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {insp.status}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-500 font-bold">Scheduled Date</span>
                        <span className="text-slate-900 dark:text-white font-black">{insp.scheduledDate}</span>
                      </div>
                      {insp.conductedDate && (
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500 font-bold">Conducted Date</span>
                          <span className="text-slate-900 dark:text-white font-black">{insp.conductedDate}</span>
                        </div>
                      )}
                      {insp.notes && (
                        <div className="pt-4 border-t border-slate-200 dark:border-white/5">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Inspector Notes</p>
                          <p className="text-sm text-slate-700 dark:text-slate-300 font-medium italic">"{insp.notes}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {inspections.length === 0 && (
                  <div className="md:col-span-2 py-12 text-center bg-white/20 dark:bg-white/5 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-white/10">
                    <p className="text-slate-400 font-black text-sm uppercase tracking-widest">No inspection history found.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar: Transaction History */}
          <div className="space-y-10">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Financial Ledger</h2>
            <div className="bg-white/40 dark:bg-white/5 backdrop-blur-[100px] rounded-[4rem] shadow-2xl border border-white/60 dark:border-white/10 overflow-hidden divide-y divide-white/20 dark:divide-white/5">
              {db.getTransactions().filter(t => t.citizenId === user.id).length > 0 ? (
                db.getTransactions().filter(t => t.citizenId === user.id).map(t => (
                  <div key={t.id} className="p-8 flex items-center justify-between hover:bg-white/20 dark:hover:bg-white/5 transition duration-500">
                    <div className="flex items-center gap-5">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
                        t.type === 'License' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400' : 
                        t.type === 'Insurance' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' : 
                        'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400'
                      }`}>
                        <i className={`fa-solid ${t.type === 'License' ? 'fa-id-card' : t.type === 'Insurance' ? 'fa-shield-halved' : 'fa-car-side'}`}></i>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-black text-slate-800 dark:text-slate-200 text-base">{t.type} Settlement</p>
                          <span className="text-[8px] font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded uppercase">{t.id}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex items-center gap-1.5">
                            <i className="fa-solid fa-calendar-day text-[10px] text-slate-400"></i>
                            <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t.date}</p>
                          </div>
                          <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                          <div className="flex items-center gap-1.5">
                            <i className="fa-solid fa-wallet text-[10px] text-slate-400"></i>
                            <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t.method}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-slate-900 dark:text-white">{t.amount.toLocaleString()} <span className="text-xs text-slate-400 font-bold uppercase ml-1">NLe</span></p>
                      <span className="text-[9px] font-black uppercase text-emerald-500 tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded-lg">Settled</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-20 text-center">
                  <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em]">No Transactions Found</p>
                </div>
              )}
            </div>
            
            <div className="bg-slate-900 p-10 rounded-[4rem] text-white shadow-2xl relative overflow-hidden border border-white/10 group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32 transition-transform group-hover:scale-110 duration-1000"></div>
              <h3 className="text-2xl font-black mb-3 flex items-center gap-4 relative z-10">
                <i className="fa-solid fa-wallet text-emerald-500"></i>
                Digital Wallet
              </h3>
              <p className="text-slate-400 text-sm font-bold mb-10 leading-relaxed relative z-10"> Link your account for instantaneous, one-click renewals secured by national biometric standards.</p>
              <button 
                onClick={() => setActiveTab('wallet')}
                className="bg-emerald-600 text-white w-full py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl hover:bg-emerald-500 transition-all relative z-10"
              >
                {isWalletSetup ? 'Manage Sovereign Wallet' : 'Setup Sovereign Wallet'}
              </button>
            </div>
          </div>
        </div>
      </>
    )}

        {activeTab === 'license' && (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Requirements Panel */}
              <div className="lg:col-span-1">
                <div className="bg-white/40 dark:bg-white/5 backdrop-blur-3xl p-10 rounded-[4rem] border border-white/60 dark:border-white/10 sticky top-8">
                  <div className="w-20 h-20 bg-emerald-600 text-white rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl shadow-emerald-600/20">
                    <i className="fa-solid fa-list-check text-3xl"></i>
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">Requirements</h2>
                  <p className="text-emerald-600 dark:text-emerald-400 font-black text-[10px] uppercase tracking-[0.4em] mb-10">Pre-Registration Checklist</p>
                  
                  <ul className="space-y-6">
                    {requirementsList.map((item, i) => {
                      const isChecked = checkedRequirements.includes(i);
                      return (
                        <li 
                          key={i} 
                          className="flex gap-5 group cursor-pointer"
                          onClick={() => {
                            if (isChecked) {
                              setCheckedRequirements(checkedRequirements.filter(idx => idx !== i));
                            } else {
                              setCheckedRequirements([...checkedRequirements, i]);
                            }
                          }}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                            isChecked 
                              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' 
                              : 'bg-white/60 dark:bg-white/10 text-slate-400 group-hover:bg-emerald-600/20 group-hover:text-emerald-600'
                          }`}>
                            <i className={`fa-solid ${isChecked ? 'fa-check' : item.icon} text-sm`}></i>
                          </div>
                          <div>
                            <p className={`text-xs font-black uppercase tracking-wider transition-colors ${isChecked ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-white'}`}>{item.title}</p>
                            <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{item.desc}</p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  <div className="mt-12 p-6 bg-blue-600/10 rounded-3xl border border-blue-600/20">
                    <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                      <i className="fa-solid fa-circle-info"></i> Pro Tip
                    </p>
                    <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 leading-relaxed">
                      Ensure all documents are scanned in high resolution (PDF/JPG) before starting your application.
                    </p>
                  </div>
                </div>
              </div>

              {/* Registration Form */}
              <div className="lg:col-span-2">
                <div className="bg-white/40 dark:bg-white/5 backdrop-blur-3xl p-12 rounded-[4rem] border border-white/60 dark:border-white/10">
                  <div className="flex justify-between items-start mb-12">
                    <div>
                      <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Application Form</h3>
                      <p className="text-slate-500 dark:text-slate-400 font-black text-[10px] uppercase tracking-[0.4em] mt-2">New Driver Enrollment</p>
                    </div>
                    <div className="px-6 py-2 bg-emerald-600/10 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-600/20">
                      Step {licenseStep === 'form' ? '1' : licenseStep === 'test' ? '2' : '3'} of 3
                    </div>
                  </div>

                  {licenseStep === 'form' ? (
                    <form className="space-y-10" onSubmit={(e) => { e.preventDefault(); setLicenseStep('test'); }}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Full Legal Name</label>
                          <input 
                            type="text" 
                            readOnly
                            value={licenseRegForm.fullName}
                            className="w-full px-8 py-5 rounded-[2rem] bg-slate-100 dark:bg-slate-800/50 border-2 border-transparent text-slate-500 font-black outline-none cursor-not-allowed"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">National ID Number</label>
                          <input 
                            required
                            type="text" 
                            placeholder="e.g. 1234567890"
                            value={licenseRegForm.nationalId}
                            onChange={e => setLicenseRegForm({...licenseRegForm, nationalId: e.target.value})}
                            className="w-full px-8 py-5 rounded-[2rem] bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 focus:border-emerald-500 transition-all font-black text-slate-900 dark:text-white outline-none shadow-inner"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Date of Birth</label>
                          <input 
                            required
                            type="date" 
                            value={licenseRegForm.dob}
                            onChange={e => setLicenseRegForm({...licenseRegForm, dob: e.target.value})}
                            className="w-full px-8 py-5 rounded-[2rem] bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 focus:border-emerald-500 transition-all font-black text-slate-900 dark:text-white outline-none shadow-inner"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Blood Group</label>
                          <select 
                            required
                            value={licenseRegForm.bloodGroup}
                            onChange={e => setLicenseRegForm({...licenseRegForm, bloodGroup: e.target.value})}
                            className="w-full px-8 py-5 rounded-[2rem] bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 focus:border-emerald-500 transition-all font-black text-slate-900 dark:text-white outline-none shadow-inner"
                          >
                            <option value="">Select Group</option>
                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                              <option key={bg} value={bg}>{bg}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">License Category</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {(['Private', 'Commercial', 'Motorcycle'] as const).map(type => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setLicenseRegForm({...licenseRegForm, licenseType: type})}
                              className={`py-6 rounded-[2rem] border-2 font-black text-xs uppercase tracking-widest transition-all ${
                                licenseRegForm.licenseType === type 
                                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-xl scale-105' 
                                  : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-500 hover:border-emerald-500/30'
                              }`}
                            >
                              <i className={`fa-solid ${type === 'Private' ? 'fa-car' : type === 'Commercial' ? 'fa-truck' : 'fa-motorcycle'} mb-2 block text-lg`}></i>
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-6">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] ml-4">Required Documents</h4>
                        
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Document Reference Number (Optional)</label>
                          <input 
                            type="text" 
                            placeholder="e.g. MED-123456 or CERT-789012"
                            value={licenseRegForm.docRef}
                            onChange={e => setLicenseRegForm({...licenseRegForm, docRef: e.target.value})}
                            className="w-full px-8 py-5 rounded-[2rem] bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 focus:border-emerald-500 transition-all font-black text-slate-900 dark:text-white outline-none shadow-inner"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Medical Report</label>
                            <label className={`w-full h-32 border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${licenseDocs.medicalReport ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-emerald-500/30'}`}>
                              <i className={`fa-solid ${licenseDocs.medicalReport ? 'fa-check-circle text-emerald-500' : 'fa-stethoscope text-slate-300'} text-2xl`}></i>
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                {licenseDocs.medicalReport ? 'Uploaded' : 'Upload Report'}
                              </span>
                              <input 
                                type="file" 
                                className="hidden" 
                                onChange={(e) => e.target.files?.[0] && setLicenseDocs({...licenseDocs, medicalReport: e.target.files[0].name})}
                              />
                            </label>
                          </div>
                          <div className="space-y-4">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Training Certificate</label>
                            <label className={`w-full h-32 border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${licenseDocs.trainingCert ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-emerald-500/30'}`}>
                              <i className={`fa-solid ${licenseDocs.trainingCert ? 'fa-check-circle text-emerald-500' : 'fa-graduation-cap text-slate-300'} text-2xl`}></i>
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                {licenseDocs.trainingCert ? 'Uploaded' : 'Upload Certificate'}
                              </span>
                              <input 
                                type="file" 
                                className="hidden" 
                                onChange={(e) => e.target.files?.[0] && setLicenseDocs({...licenseDocs, trainingCert: e.target.files[0].name})}
                              />
                            </label>
                          </div>
                          <div className="space-y-4">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Passport Photo</label>
                            <label className={`w-full h-32 border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${licenseDocs.passportPhoto ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-emerald-500/30'}`}>
                              <i className={`fa-solid ${licenseDocs.passportPhoto ? 'fa-check-circle text-emerald-500' : 'fa-image text-slate-300'} text-2xl`}></i>
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                {licenseDocs.passportPhoto ? 'Uploaded' : 'Upload Passport'}
                              </span>
                              <input 
                                type="file" 
                                className="hidden" 
                                onChange={(e) => e.target.files?.[0] && setLicenseDocs({...licenseDocs, passportPhoto: e.target.files[0].name})}
                              />
                            </label>
                          </div>
                          <div className="space-y-4">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">National ID Card</label>
                            <label className={`w-full h-32 border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${licenseDocs.nationalIdDoc ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-emerald-500/30'}`}>
                              <i className={`fa-solid ${licenseDocs.nationalIdDoc ? 'fa-check-circle text-emerald-500' : 'fa-id-card text-slate-300'} text-2xl`}></i>
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                {licenseDocs.nationalIdDoc ? 'Uploaded' : 'Upload ID Card'}
                              </span>
                              <input 
                                type="file" 
                                className="hidden" 
                                onChange={(e) => e.target.files?.[0] && setLicenseDocs({...licenseDocs, nationalIdDoc: e.target.files[0].name})}
                              />
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="pt-10 border-t border-white/40 dark:border-white/5">
                        <button 
                          type="submit"
                          disabled={checkedRequirements.length < requirementsList.length || !licenseDocs.medicalReport || !licenseDocs.trainingCert || !licenseDocs.passportPhoto || !licenseDocs.nationalIdDoc}
                          className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white py-8 rounded-[3rem] font-black text-xl hover:bg-black transition shadow-2xl active:scale-95 flex items-center justify-center gap-4 group disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed"
                        >
                          {checkedRequirements.length < requirementsList.length ? (
                            <>Check All Requirements ({checkedRequirements.length}/{requirementsList.length})</>
                          ) : !licenseDocs.medicalReport || !licenseDocs.trainingCert || !licenseDocs.passportPhoto || !licenseDocs.nationalIdDoc ? (
                            <>Upload Required Documents</>
                          ) : (
                            <>
                              Proceed to License Test
                              <i className="fa-solid fa-arrow-right group-hover:translate-x-2 transition-transform"></i>
                            </>
                          )}
                        </button>
                        <p className="text-center text-[10px] font-bold text-slate-400 mt-6 uppercase tracking-widest">
                          By proceeding, you agree to the <span className="text-emerald-600 underline">Terms of Service</span> and <span className="text-emerald-600 underline">Privacy Policy</span>
                        </p>
                      </div>
                    </form>
                  ) : licenseStep === 'test' ? (
                    <div className="space-y-10 animate-in fade-in zoom-in-95 duration-500">
                      <div className="bg-emerald-600/5 p-8 rounded-[3rem] border border-emerald-600/20">
                        <div className="flex justify-between items-center mb-6">
                          <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">License Granting Test</h4>
                          <span className="px-4 py-2 bg-emerald-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest">
                            Question {testCurrentQuestion + 1} of {roadSafetyQuestions.length}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mb-10">
                          <div 
                            className="h-full bg-emerald-600 transition-all duration-500"
                            style={{ width: `${((testCurrentQuestion + 1) / roadSafetyQuestions.length) * 100}%` }}
                          ></div>
                        </div>
                        
                        <p className="text-xl font-black text-slate-900 dark:text-white mb-8 leading-tight">
                          {roadSafetyQuestions[testCurrentQuestion].q}
                        </p>

                        <div className="grid grid-cols-1 gap-4">
                          {roadSafetyQuestions[testCurrentQuestion].options.map((option, idx) => (
                            <button
                              key={idx}
                              onClick={() => setTestAnswers({...testAnswers, [testCurrentQuestion]: idx})}
                              className={`w-full p-6 rounded-[2rem] border-2 text-left font-bold transition-all flex items-center justify-between group ${
                                testAnswers[testCurrentQuestion] === idx
                                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-xl'
                                  : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-emerald-500/30'
                              }`}
                            >
                              <span>{option}</span>
                              {testAnswers[testCurrentQuestion] === idx && <i className="fa-solid fa-check-circle"></i>}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <button 
                          onClick={() => setTestCurrentQuestion(Math.max(0, testCurrentQuestion - 1))}
                          disabled={testCurrentQuestion === 0}
                          className="flex-1 py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-widest border-2 border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 transition-all disabled:opacity-30"
                        >
                          Previous
                        </button>
                        {testCurrentQuestion < roadSafetyQuestions.length - 1 ? (
                          <button 
                            onClick={() => setTestCurrentQuestion(testCurrentQuestion + 1)}
                            disabled={testAnswers[testCurrentQuestion] === undefined}
                            className="flex-[2] bg-slate-900 dark:bg-white dark:text-slate-900 text-white py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-widest hover:bg-black transition shadow-2xl disabled:opacity-30"
                          >
                            Next Question
                          </button>
                        ) : (
                          <button 
                            onClick={() => {
                              const correctAnswers = roadSafetyQuestions.filter((q, i) => testAnswers[i] === q.correct).length;
                              if (correctAnswers >= 12) { // 75% pass rate
                                setTestCompleted(true);
                                setLicenseStep('payment');
                                setPaymentType('License');
                                setShowPayment(true);
                              } else {
                                alert(`Test Failed. You got ${correctAnswers}/${roadSafetyQuestions.length} correct. You need at least 12 correct answers to pass. Please try again.`);
                                setTestCurrentQuestion(0);
                                setTestAnswers({});
                              }
                            }}
                            disabled={Object.keys(testAnswers).length < roadSafetyQuestions.length}
                            className="flex-[2] bg-emerald-600 text-white py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition shadow-2xl disabled:opacity-30"
                          >
                            Finish & Submit Test
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-20 animate-in fade-in zoom-in-95 duration-500">
                      <div className="w-32 h-32 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-8 text-4xl shadow-2xl shadow-emerald-600/20">
                        <i className="fa-solid fa-check-double"></i>
                      </div>
                      <h4 className="text-3xl font-black text-slate-900 dark:text-white mb-4">Test Passed Successfully!</h4>
                      <p className="text-slate-500 dark:text-slate-400 font-bold mb-10 max-w-md mx-auto">
                        You have successfully completed the road safety assessment. Please proceed to the final settlement to grant your license.
                      </p>
                      <button 
                        onClick={() => { setPaymentType('License'); setShowPayment(true); }}
                        className="bg-emerald-600 text-white px-12 py-6 rounded-[2.5rem] font-black text-xl hover:bg-emerald-700 transition shadow-2xl"
                      >
                        Proceed to Payment
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'wallet' && (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 max-w-4xl mx-auto">
            <div className="bg-white/40 dark:bg-white/5 backdrop-blur-3xl p-12 rounded-[5rem] border border-white/60 dark:border-white/10 shadow-2xl">
              <div className="flex justify-between items-center mb-12">
                <button 
                  onClick={() => setActiveTab('overview')}
                  className="w-14 h-14 rounded-full bg-white dark:bg-white/5 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/10 transition-all border border-slate-200 dark:border-white/10"
                >
                  <i className="fa-solid fa-arrow-left text-slate-600 dark:text-slate-400"></i>
                </button>
                <div className="text-center">
                  <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Sovereign Wallet</h3>
                  <p className="text-emerald-600 font-black text-[10px] uppercase tracking-[0.4em] mt-2">Biometric Financial Identity</p>
                </div>
                <div className="w-14 h-14"></div> {/* Spacer */}
              </div>

              {/* Progress Steps */}
              <div className="flex justify-center items-center gap-4 mb-16">
                {[1, 2, 3, 4].map(step => (
                  <div key={step} className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all duration-500 ${
                      walletStep >= step ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                    }`}>
                      {walletStep > step ? <i className="fa-solid fa-check"></i> : step}
                    </div>
                    {step < 4 && (
                      <div className={`w-12 h-1 rounded-full mx-2 transition-all duration-500 ${
                        walletStep > step ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-800'
                      }`}></div>
                    )}
                  </div>
                ))}
              </div>

              {/* Step 1: Link ID */}
              {walletStep === 1 && (
                <div className="animate-in fade-in zoom-in-95 duration-500 text-center">
                  <div className="w-32 h-32 bg-blue-600/10 text-blue-600 rounded-[3rem] flex items-center justify-center mx-auto mb-8 text-4xl">
                    <i className="fa-solid fa-id-card-clip"></i>
                  </div>
                  <h4 className="text-2xl font-black text-slate-900 dark:text-white mb-4">Link National Identity</h4>
                  <p className="text-slate-500 dark:text-slate-400 font-bold mb-10 max-w-md mx-auto">We will link your wallet to your verified National ID for secure, government-backed transactions.</p>
                  
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 mb-10 text-left">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</span>
                      <span className="font-black text-slate-900 dark:text-white">{user.fullName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID Status</span>
                      <span className="text-emerald-600 font-black text-[10px] uppercase tracking-widest bg-emerald-600/10 px-3 py-1 rounded-full">Verified</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => setWalletStep(2)}
                    className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white py-6 rounded-[2.5rem] font-black text-xl hover:bg-black transition shadow-2xl"
                  >
                    Confirm & Continue
                  </button>
                </div>
              )}

              {/* Step 2: Biometrics */}
              {walletStep === 2 && (
                <div className="animate-in fade-in zoom-in-95 duration-500 text-center">
                  <div className="relative w-48 h-48 mx-auto mb-12">
                    <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full animate-ping"></div>
                    <div className="absolute inset-0 border-2 border-emerald-500/50 rounded-full animate-pulse"></div>
                    <div className="relative w-full h-full bg-emerald-600 text-white rounded-full flex items-center justify-center text-6xl shadow-2xl shadow-emerald-600/40">
                      <i className="fa-solid fa-fingerprint"></i>
                    </div>
                  </div>
                  <h4 className="text-2xl font-black text-slate-900 dark:text-white mb-4">Biometric Enrollment</h4>
                  <p className="text-slate-500 dark:text-slate-400 font-bold mb-10 max-w-md mx-auto">Scan your fingerprint or face to secure your wallet with multi-factor biometric authentication.</p>
                  
                  <div className="flex justify-center gap-6 mb-12">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-2xl text-slate-400">
                      <i className="fa-solid fa-face-smile"></i>
                    </div>
                    <div className="w-16 h-16 bg-emerald-600 text-white rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-emerald-600/20">
                      <i className="fa-solid fa-fingerprint"></i>
                    </div>
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-2xl text-slate-400">
                      <i className="fa-solid fa-eye"></i>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      setIsProcessing(true);
                      setTimeout(() => {
                        setIsProcessing(false);
                        setWalletStep(3);
                      }, 2000);
                    }}
                    disabled={isProcessing}
                    className="w-full bg-emerald-600 text-white py-6 rounded-[2.5rem] font-black text-xl hover:bg-emerald-500 transition shadow-2xl flex items-center justify-center gap-4"
                  >
                    {isProcessing ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin"></i>
                        Scanning...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-bolt"></i>
                        Begin Scan
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Step 3: Security PIN */}
              {walletStep === 3 && (
                <div className="animate-in fade-in zoom-in-95 duration-500 text-center">
                  <div className="w-32 h-32 bg-purple-600/10 text-purple-600 rounded-[3rem] flex items-center justify-center mx-auto mb-8 text-4xl">
                    <i className="fa-solid fa-shield-halved"></i>
                  </div>
                  <h4 className="text-2xl font-black text-slate-900 dark:text-white mb-4">Set Security PIN</h4>
                  <p className="text-slate-500 dark:text-slate-400 font-bold mb-10 max-w-md mx-auto">Create a 6-digit PIN for manual authorization of high-value transactions.</p>
                  
                  <div className="flex justify-center gap-4 mb-12">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <div key={i} className={`w-12 h-16 rounded-2xl border-2 flex items-center justify-center text-2xl font-black transition-all ${
                        walletPin.length >= i ? 'border-emerald-500 bg-emerald-500/5 text-emerald-600' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                      }`}>
                        {walletPin.length >= i ? '•' : ''}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto mb-12">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'del'].map((num, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          if (num === 'del') setWalletPin(walletPin.slice(0, -1));
                          else if (num !== '' && walletPin.length < 6) setWalletPin(walletPin + num);
                        }}
                        className={`h-16 rounded-2xl font-black text-xl transition-all active:scale-90 ${
                          num === '' ? 'invisible' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white'
                        }`}
                      >
                        {num === 'del' ? <i className="fa-solid fa-backspace"></i> : num}
                      </button>
                    ))}
                  </div>

                  <button 
                    onClick={() => setWalletStep(4)}
                    disabled={walletPin.length < 6}
                    className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white py-6 rounded-[2.5rem] font-black text-xl hover:bg-black transition shadow-2xl disabled:opacity-30"
                  >
                    Finalize Setup
                  </button>
                </div>
              )}

              {/* Step 4: Success */}
              {walletStep === 4 && (
                <div className="animate-in fade-in zoom-in-95 duration-500 text-center">
                  <div className="w-40 h-40 bg-emerald-600 text-white rounded-full flex items-center justify-center mx-auto mb-12 text-6xl shadow-[0_0_60px_rgba(16,185,129,0.4)] animate-bounce">
                    <i className="fa-solid fa-check-double"></i>
                  </div>
                  <h4 className="text-4xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter">Wallet Activated</h4>
                  <p className="text-slate-500 dark:text-slate-400 font-bold mb-12 max-w-md mx-auto">Your Sovereign Wallet is now linked to your biometric identity. You can now perform one-click renewals.</p>
                  
                  <div className="p-8 bg-emerald-600/5 rounded-[3rem] border border-emerald-600/20 mb-12">
                    <div className="flex items-center gap-6 text-left">
                      <div className="w-16 h-16 bg-emerald-600 text-white rounded-2xl flex items-center justify-center text-2xl">
                        <i className="fa-solid fa-vault"></i>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Available Balance</p>
                        <p className="text-3xl font-black text-slate-900 dark:text-white">2,500.00 <span className="text-sm font-bold text-slate-400 uppercase">NLe</span></p>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      setIsWalletSetup(true);
                      setActiveTab('overview');
                    }}
                    className="w-full bg-emerald-600 text-white py-6 rounded-[2.5rem] font-black text-xl hover:bg-emerald-500 transition shadow-2xl"
                  >
                    Return to Dashboard
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Left Column: Profile & Theme */}
              <div className="space-y-10">
                <div className="bg-white/40 dark:bg-white/5 backdrop-blur-md p-10 rounded-[3rem] border border-white/60 dark:border-white/10 shadow-2xl">
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-8 tracking-tight">Profile Picture</h3>
                  <div className="flex flex-col items-center gap-6">
                    <div className="relative group">
                      <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-emerald-500/30 shadow-2xl">
                        {profileImage ? (
                          <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-5xl text-slate-400">
                            <i className="fa-solid fa-user"></i>
                          </div>
                        )}
                      </div>
                      <label className="absolute bottom-2 right-2 w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-emerald-500 transition shadow-lg">
                        <i className="fa-solid fa-camera"></i>
                        <input type="file" className="hidden" accept="image/*" onChange={handleProfileImageUpload} />
                      </label>
                    </div>
                    <p className="text-xs text-slate-500 font-bold text-center">Upload a high-quality photo for your digital ID verification.</p>
                  </div>
                </div>
              </div>

              {/* Right Column: Details & Password */}
              <div className="lg:col-span-2 space-y-10">
                <div className="bg-white/40 dark:bg-white/5 backdrop-blur-md p-10 rounded-[4rem] border border-white/60 dark:border-white/10 shadow-2xl">
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-10 tracking-tight">Profile Details</h3>
                  <form onSubmit={handleUpdateProfile} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Full Name</label>
                        <input 
                          type="text" 
                          value={settingsForm.fullName}
                          onChange={(e) => setSettingsForm({...settingsForm, fullName: e.target.value})}
                          className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-3xl p-6 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Email Address</label>
                        <input 
                          type="email" 
                          value={settingsForm.email}
                          onChange={(e) => setSettingsForm({...settingsForm, email: e.target.value})}
                          className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-3xl p-6 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Residential Address</label>
                      <textarea 
                        value={settingsForm.address}
                        onChange={(e) => setSettingsForm({...settingsForm, address: e.target.value})}
                        rows={3}
                        className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-3xl p-6 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 transition-all resize-none"
                      />
                    </div>
                    <button type="submit" className="bg-emerald-600 text-white px-10 py-5 rounded-2xl font-black hover:bg-emerald-700 transition shadow-xl active:scale-95">
                      Save Changes
                    </button>
                  </form>
                </div>

                <div className="bg-white/40 dark:bg-white/5 backdrop-blur-md p-10 rounded-[4rem] border border-white/60 dark:border-white/10 shadow-2xl">
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-10 tracking-tight">Security</h3>
                  <form onSubmit={handleChangePassword} className="space-y-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Current Password</label>
                      <input 
                        type="password" 
                        value={settingsForm.currentPassword}
                        onChange={(e) => setSettingsForm({...settingsForm, currentPassword: e.target.value})}
                        className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-3xl p-6 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">New Password</label>
                        <input 
                          type="password" 
                          value={settingsForm.newPassword}
                          onChange={(e) => setSettingsForm({...settingsForm, newPassword: e.target.value})}
                          className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-3xl p-6 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 transition-all"
                          placeholder="••••••••"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Confirm New Password</label>
                        <input 
                          type="password" 
                          value={settingsForm.confirmPassword}
                          onChange={(e) => setSettingsForm({...settingsForm, confirmPassword: e.target.value})}
                          className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-3xl p-6 font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 transition-all"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                    <button type="submit" className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-10 py-5 rounded-2xl font-black hover:bg-black dark:hover:bg-slate-200 transition shadow-xl active:scale-95">
                      Update Password
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Vehicle Selection Modal */}
      {showVehicleSelect && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowVehicleSelect(false)}></div>
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-xl rounded-[3rem] shadow-2xl border border-white/20 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Select Vehicle</h3>
                  <p className="text-emerald-600 font-black text-[10px] uppercase tracking-[0.4em] mt-1">Which asset are you registering?</p>
                </div>
                <button onClick={() => setShowVehicleSelect(false)} className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>

              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {vehicles.map(v => (
                  <button 
                    key={v.vin}
                    onClick={() => handleVehicleSelect(v.vin)}
                    className="w-full p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/10 flex items-center justify-between group hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center text-xl">
                        <i className="fa-solid fa-car"></i>
                      </div>
                      <div className="text-left">
                        <p className="font-black text-slate-900 dark:text-white">{v.make} {v.model}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{v.vin}</p>
                      </div>
                    </div>
                    <i className="fa-solid fa-chevron-right text-slate-300 group-hover:text-emerald-500 transition-colors"></i>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Service Request Modal */}
      {showServiceForm && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-3xl z-[100] flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="bg-[#fcf8f3] dark:bg-[#060e1a] w-full max-w-xl rounded-[5rem] shadow-[0_50px_200px_rgba(0,0,0,0.4)] p-14 relative overflow-hidden border border-white/20">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Service Request</h3>
              <button onClick={() => setShowServiceForm(false)} className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/10 transition-all active:scale-90 border border-white/10">
                <i className="fa-solid fa-xmark text-slate-600 dark:text-slate-400 text-2xl"></i>
              </button>
            </div>

            <div className="space-y-10">
              {/* Service Type Selection */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-4 tracking-[0.4em] ml-2">Select Service Type</label>
                <div className="grid grid-cols-3 gap-4">
                  {(['Registration', 'License', 'Insurance'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setPaymentType(type)}
                      className={`py-4 rounded-2xl font-black text-xs uppercase tracking-widest border-2 transition-all ${paymentType === type ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-500/20' : 'bg-white dark:bg-white/5 border-white/60 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/10'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {paymentType === 'Registration' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em] ml-2">Vehicle Details</label>
                  <div className="grid grid-cols-2 gap-4">
                    <input 
                      type="text" 
                      placeholder="Make (e.g. Toyota)"
                      value={registrationForm.make}
                      onChange={e => setRegistrationForm({...registrationForm, make: e.target.value})}
                      className="w-full px-6 py-4 rounded-2xl bg-white dark:bg-white/5 border border-white/60 dark:border-white/10 font-black text-xs outline-none focus:border-emerald-500 transition-all"
                    />
                    <input 
                      type="text" 
                      placeholder="Model (e.g. Camry)"
                      value={registrationForm.model}
                      onChange={e => setRegistrationForm({...registrationForm, model: e.target.value})}
                      className="w-full px-6 py-4 rounded-2xl bg-white dark:bg-white/5 border border-white/60 dark:border-white/10 font-black text-xs outline-none focus:border-emerald-500 transition-all"
                    />
                    <input 
                      type="number" 
                      placeholder="Year"
                      value={registrationForm.year}
                      onChange={e => setRegistrationForm({...registrationForm, year: parseInt(e.target.value)})}
                      className="w-full px-6 py-4 rounded-2xl bg-white dark:bg-white/5 border border-white/60 dark:border-white/10 font-black text-xs outline-none focus:border-emerald-500 transition-all"
                    />
                    <input 
                      type="text" 
                      placeholder="VIN Number"
                      value={registrationForm.vin}
                      onChange={e => setRegistrationForm({...registrationForm, vin: e.target.value})}
                      className="w-full px-6 py-4 rounded-2xl bg-white dark:bg-white/5 border border-white/60 dark:border-white/10 font-black text-xs outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Document Uploads */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em] ml-2">Proof of License</label>
                  <label className={`w-full h-32 border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${serviceFiles.license ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/40 dark:bg-white/5 border-white/60 dark:border-white/10 hover:bg-white/60'}`}>
                    <i className={`fa-solid ${serviceFiles.license ? 'fa-check-circle text-emerald-500' : 'fa-id-card text-slate-300'} text-2xl`}></i>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      {serviceFiles.license ? 'Uploaded' : 'Upload Proof'}
                    </span>
                    <input 
                      type="file" 
                      className="hidden" 
                      onChange={(e) => e.target.files?.[0] && setServiceFiles({...serviceFiles, license: e.target.files[0].name})}
                    />
                  </label>
                </div>
                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em] ml-2">National ID</label>
                  <label className={`w-full h-32 border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${serviceFiles.nationalId ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/40 dark:bg-white/5 border-white/60 dark:border-white/10 hover:bg-white/60'}`}>
                    <i className={`fa-solid ${serviceFiles.nationalId ? 'fa-check-circle text-emerald-500' : 'fa-passport text-slate-300'} text-2xl`}></i>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      {serviceFiles.nationalId ? 'Uploaded' : 'Upload ID'}
                    </span>
                    <input 
                      type="file" 
                      className="hidden" 
                      onChange={(e) => e.target.files?.[0] && setServiceFiles({...serviceFiles, nationalId: e.target.files[0].name})}
                    />
                  </label>
                </div>
              </div>

              <button 
                onClick={() => {
                  if (!serviceFiles.license || !serviceFiles.nationalId) {
                    alert("Please upload both Proof of License and National ID to proceed.");
                    return;
                  }
                  setShowServiceForm(false);
                  setShowPayment(true);
                }}
                className="w-full bg-slate-900 dark:bg-emerald-600 text-white py-8 rounded-[2.5rem] font-black text-2xl hover:bg-black dark:hover:bg-emerald-700 transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-4 border border-white/10"
              >
                Proceed to Payment <i className="fa-solid fa-arrow-right"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Gateway Modal: Refined Glass */}
      {showPayment && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-3xl z-[100] flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="bg-[#fcf8f3] dark:bg-[#060e1a] w-full max-w-lg rounded-[5rem] shadow-[0_50px_200px_rgba(0,0,0,0.4)] p-14 relative overflow-hidden border border-white/20">
            {!paymentSuccess ? (
              <>
                <div className="flex justify-between items-center mb-10">
                  <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Settlement Hub</h3>
                  <button onClick={closePayment} className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/10 transition-all active:scale-90 border border-white/10">
                    <i className="fa-solid fa-xmark text-slate-600 dark:text-slate-400 text-2xl"></i>
                  </button>
                </div>

                <div className="bg-white/40 dark:bg-white/5 p-10 rounded-[3rem] mb-10 flex justify-between items-center border-2 border-white/60 dark:border-white/10 border-dashed">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-2">Service Fee</p>
                    <p className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">
                      {(paymentType === 'License' ? LICENSE_FEE : paymentType === 'Insurance' ? INSURANCE_FEE : REGISTRATION_FEE).toLocaleString()} <span className="text-sm font-bold opacity-30">NLe</span>
                    </p>
                  </div>
                  <div className="bg-emerald-500 text-white px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                    {paymentType}
                  </div>
                </div>

                <p className="text-[10px] font-black text-slate-400 mb-6 uppercase tracking-[0.4em] ml-2">Secure Payment Provider</p>
                <div className="grid grid-cols-2 gap-6 mb-10">
                  <button 
                    onClick={() => handlePaymentInitiation('Afri-money')}
                    className={`p-8 rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-4 ${selectedMethod === 'Afri-money' ? 'border-emerald-500 bg-white dark:bg-white/10 shadow-2xl shadow-emerald-500/10' : 'border-white/60 dark:border-white/10 bg-white/20 hover:bg-white/40 dark:hover:bg-white/5'}`}
                  >
                    <img src="https://tse2.mm.bing.net/th/id/OIP.G5aDh56qnfI9zaHtTncbMAHaHa?rs=1&pid=ImgDetMain&o=7&rm=3" alt="Afri-money" className="w-16 h-16 object-contain rounded-2xl" />
                    <span className="font-black text-slate-700 dark:text-slate-300 text-[10px] uppercase tracking-widest">Afri-money</span>
                  </button>
                  <button 
                    onClick={() => handlePaymentInitiation('Orange-Money')}
                    className={`p-8 rounded-[2.5rem] border-2 transition-all flex flex-col items-center gap-4 ${selectedMethod === 'Orange-Money' ? 'border-orange-500 bg-white dark:bg-white/10 shadow-2xl shadow-orange-500/10' : 'border-white/60 dark:border-white/10 bg-white/20 hover:bg-white/40 dark:hover:bg-white/5'}`}
                  >
                    <img src="https://tse2.mm.bing.net/th/id/OIP.87uYW5-goSpiSRJSXoYw9AHaHa?rs=1&pid=ImgDetMain&o=7&rm=3" alt="Orange Money" className="w-16 h-16 object-contain rounded-2xl" />
                    <span className="font-black text-slate-700 dark:text-slate-300 text-[10px] uppercase tracking-widest">Orange</span>
                  </button>
                </div>

                {selectedMethod && (
                  <div className="space-y-8 animate-in slide-in-from-top-4 duration-500">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-3 tracking-[0.4em] ml-2">Merchant Phone Number</label>
                      <div className="relative">
                        <span className="absolute left-8 top-1/2 -translate-y-1/2 font-black text-slate-400 dark:text-slate-500 text-xl tracking-tighter">+232</span>
                        <input 
                          type="tel" 
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="00-000-000" 
                          className="w-full pl-24 pr-8 py-7 rounded-[2.5rem] bg-white dark:bg-white/5 border-2 border-white/80 dark:border-white/10 outline-none focus:border-slate-900 dark:focus:border-emerald-500 transition font-black text-2xl text-slate-900 dark:text-white shadow-inner"
                        />
                      </div>
                    </div>
                    <button 
                      onClick={processPayment}
                      disabled={isProcessing || !phoneNumber}
                      className="w-full bg-slate-900 dark:bg-emerald-600 text-white py-8 rounded-[2.5rem] font-black text-2xl hover:bg-black dark:hover:bg-emerald-700 transition-all shadow-2xl active:scale-95 disabled:opacity-40 disabled:grayscale flex items-center justify-center gap-4 border border-white/10"
                    >
                      {isProcessing ? (
                        <>
                          <i className="fa-solid fa-atom fa-spin text-3xl"></i> Authorizing...
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-lock text-xl"></i> Authorize Settlement
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16 animate-in zoom-in-95 duration-500">
                <div className="w-32 h-32 bg-emerald-500 text-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-emerald-500/40 rotate-12 transition-transform hover:rotate-0">
                  <i className="fa-solid fa-check-double text-5xl"></i>
                </div>
                <h3 className="text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tighter leading-none">Settled Successfully</h3>
                <p className="text-slate-500 dark:text-slate-400 font-bold mb-14 max-w-sm mx-auto text-lg leading-relaxed">Your digital credentials have been updated in the National Registry.</p>
                
                <div className="bg-white/40 dark:bg-white/5 backdrop-blur-md p-10 rounded-[4rem] mb-14 text-left border-2 border-white/60 dark:border-white/10 border-dashed space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Official UID:</span>
                    <span className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">#SLRSA-{Math.floor(100000 + Math.random() * 900000)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Status:</span>
                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                       <i className="fa-solid fa-circle-check"></i> Sovereign Verified
                    </span>
                  </div>
                </div>
                
                <button 
                  onClick={closePayment}
                  className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white py-7 rounded-[2.5rem] font-black text-2xl hover:bg-black transition shadow-2xl active:scale-95 border border-white/10"
                >
                  Return to Portal
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Schedule Inspection Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-2xl z-[200] flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="bg-white/90 backdrop-blur-[80px] w-full max-w-xl rounded-[4rem] shadow-[0_50px_200px_-50px_rgba(0,0,0,0.3)] p-12 relative overflow-hidden border border-white/60">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h3 className="text-4xl font-black text-slate-900 tracking-tighter">Schedule Inspection</h3>
                <p className="text-blue-600 font-black text-[10px] uppercase tracking-[0.4em] mt-2">Official Compliance Protocol</p>
              </div>
              <button onClick={() => setShowScheduleModal(false)} className="w-16 h-16 rounded-full bg-white/60 backdrop-blur-md flex items-center justify-center hover:bg-white transition shadow-xl border border-white/80 active:scale-90">
                <i className="fa-solid fa-xmark text-slate-800 text-2xl"></i>
              </button>
            </div>

            <form onSubmit={handleScheduleInspection} className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4 block">Select Vehicle</label>
                <select 
                  required
                  className="w-full px-8 py-5 rounded-[2rem] bg-white border-2 border-slate-200 outline-none focus:border-blue-500 transition font-black text-slate-900 shadow-inner"
                  value={scheduleForm.vin}
                  onChange={e => setScheduleForm({...scheduleForm, vin: e.target.value})}
                >
                  <option value="">Choose a vehicle...</option>
                  {vehicles.map(v => (
                    <option key={v.vin} value={v.vin}>{v.plateNumber} - {v.make} {v.model}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4 block">Preferred Date</label>
                <input 
                  required
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-8 py-5 rounded-[2rem] bg-white border-2 border-slate-200 outline-none focus:border-blue-500 transition font-black text-slate-900 shadow-inner"
                  value={scheduleForm.date}
                  onChange={e => setScheduleForm({...scheduleForm, date: e.target.value})}
                />
              </div>

              <button 
                type="submit"
                disabled={isProcessing}
                className="w-full bg-slate-900 text-white py-6 rounded-[2.5rem] font-black text-xl hover:bg-black transition shadow-xl disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {isProcessing ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-calendar-check"></i>}
                Confirm Schedule
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CitizenDashboard;
