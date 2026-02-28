
import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { User, UserRole, Vehicle, Transaction, VerificationLog, NotificationPreferences, Ticket, Task, TaskPriority, TaskStatus } from '../../types';
import { db } from '../../services/mockDb';
import { Logo } from '../../constants';

const AdminDashboard: React.FC<{ user: User; onLogout: () => void }> = ({ user, onLogout }) => {
  // Fix Leaflet icon issue
  useEffect(() => {
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }, []);

  const [activeTab, setActiveTab] = useState<'users' | 'workers' | 'vehicles' | 'transactions' | 'logs' | 'enforcement' | 'intelligence' | 'audit' | 'add-worker' | 'tasks'>('users');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>(db.getTickets());
  const [trackedVehicles, setTrackedVehicles] = useState<Vehicle[]>(db.getVehicles());
  const [intelligenceFilter, setIntelligenceFilter] = useState<'All' | 'Active' | 'Expired' | 'Flagged'>('All');
  const [tasks, setTasks] = useState<Task[]>(db.getTasks());
  const [taskFilter, setTaskFilter] = useState<TaskStatus | 'ALL'>('ALL');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: TaskPriority.MEDIUM,
    dueDate: '',
    assignedTo: ''
  });

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
      setTrackedVehicles(prev => prev.map(v => ({
        ...v,
        location: v.location ? {
          lat: v.location.lat + (Math.random() - 0.5) * 0.0001,
          lng: v.location.lng + (Math.random() - 0.5) * 0.0001
        } : undefined
      })));
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  
  // Performance Section State
  const [sortField, setSortField] = useState<'badge' | 'verifications' | 'tickets'>('badge');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Preferences Modal State
  const [editingPrefsUser, setEditingPrefsUser] = useState<User | null>(null);
  const [tempPrefs, setTempPrefs] = useState<NotificationPreferences | null>(null);

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUserForm, setEditUserForm] = useState<Partial<User>>({});

  // Add Worker Form State
  const [workerForm, setWorkerForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    role: UserRole.LICENSE_DEPT,
    badgeNumber: '',
    unitNumber: '',
    address: ''
  });

  const [users, setUsers] = useState<User[]>(db.getUsers());
  const loginHistory = db.getLoginHistory();
  const logs = db.getLogs();
  const vehicles = db.getVehicles();

  // Clear notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleToggleUserStatus = (id: string, name: string, currentState: boolean) => {
    db.toggleUserStatus(id, user);
    setUsers(db.getUsers());
    setNotification({
      message: `Account for ${name} has been ${currentState ? 'deactivated' : 'activated'}.`,
      type: 'success'
    });
    setRefreshTrigger(prev => prev + 1);
  };

  const handleDeleteUser = (id: string, name: string) => {
    if (confirm(`CRITICAL ACTION: Are you sure you want to PERMANENTLY delete the account and all associated data for: ${name}? This action cannot be undone.`)) {
      db.deleteUser(id, user);
      setUsers(db.getUsers());
      setNotification({
        message: `Account for ${name} has been permanently removed from the system.`,
        type: 'success'
      });
      setRefreshTrigger(prev => prev + 1);
    }
  };

  const handleOpenPrefs = (u: User) => {
    setEditingPrefsUser(u);
    setTempPrefs(u.notificationPreferences || {
      emailLicense: true,
      emailInsurance: true,
      emailFinance: false,
      emailSystem: true
    });
  };

  const handleSavePrefs = () => {
    if (editingPrefsUser && tempPrefs) {
      db.updateUserPreferences(editingPrefsUser.id, tempPrefs);
      setNotification({ message: `Notification preferences for ${editingPrefsUser.fullName} updated.`, type: 'success' });
      setEditingPrefsUser(null);
      setRefreshTrigger(prev => prev + 1);
    }
  };

  const togglePref = (key: keyof NotificationPreferences) => {
    if (tempPrefs) {
      setTempPrefs({ ...tempPrefs, [key]: !tempPrefs[key] });
    }
  };

  const handleOpenEditUser = (u: User) => {
    setEditingUser(u);
    setEditUserForm({
      fullName: u.fullName,
      email: u.email,
      phone: u.phone,
      address: u.address,
      badgeNumber: u.badgeNumber,
      unitNumber: u.unitNumber,
      role: u.role,
      password: u.password
    });
  };

  const handleSaveUserEdit = () => {
    if (editingUser) {
      db.updateUser(editingUser.id, editUserForm, user);
      setUsers(db.getUsers());
      setNotification({ message: `Account information for ${editingUser.fullName} has been updated.`, type: 'success' });
      setEditingUser(null);
      setRefreshTrigger(prev => prev + 1);
    }
  };

  const generateLawEnforcementDetails = (isEdit: boolean = false) => {
    const badge = `SLP-${Math.floor(1000 + Math.random() * 9000)}`;
    const unit = `UNIT-${Math.floor(10 + Math.random() * 90)}`;
    const passNum = Math.floor(112 + Math.random() * (130 - 112 + 1));
    const password = `SLP${passNum}`;
    
    if (isEdit) {
      setEditUserForm(prev => ({
        ...prev,
        badgeNumber: badge,
        unitNumber: unit,
        password: password
      }));
    } else {
      setWorkerForm(prev => ({
        ...prev,
        badgeNumber: badge,
        unitNumber: unit,
        password: password
      }));
    }
  };

  const handleAddWorker = (e: React.FormEvent) => {
    e.preventDefault();
    const newWorker: User = {
      id: `STAFF-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      fullName: workerForm.fullName,
      email: workerForm.email,
      phone: workerForm.phone,
      password: workerForm.password,
      role: workerForm.role,
      badgeNumber: workerForm.badgeNumber || undefined,
      unitNumber: workerForm.unitNumber || undefined,
      address: workerForm.address,
      isActive: true
    };

    db.addUser(newWorker);
    setUsers(db.getUsers());
    db.addAuditLog({
      action: 'WORKER_CREATED',
      adminId: user.id,
      adminName: user.fullName,
      affectedId: newWorker.id,
      affectedName: newWorker.fullName,
      details: `New worker added to ${workerForm.role} department`,
      department: user.role,
      newValue: JSON.stringify({ role: newWorker.role, email: newWorker.email })
    });

    setNotification({ message: `Successfully added ${workerForm.fullName} to the system.`, type: 'success' });
    setWorkerForm({
      fullName: '',
      email: '',
      phone: '',
      password: '',
      role: UserRole.LICENSE_DEPT,
      badgeNumber: '',
      unitNumber: '',
      address: ''
    });
    setActiveTab('users');
    setRefreshTrigger(prev => prev + 1);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    const newTask: Task = {
      id: `TASK-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      title: taskForm.title,
      description: taskForm.description,
      priority: taskForm.priority,
      status: TaskStatus.PENDING,
      progress: 0,
      assignedTo: taskForm.assignedTo || undefined,
      createdBy: user.id,
      createdAt: new Date().toLocaleString(),
      dueDate: taskForm.dueDate
    };
    db.addTask(newTask);
    setTasks(db.getTasks());
    setIsTaskModalOpen(false);
    setTaskForm({ title: '', description: '', priority: TaskPriority.MEDIUM, dueDate: '', assignedTo: '' });
    setNotification({ message: 'Administrative task created successfully.', type: 'success' });
  };

  const handleUpdateTaskStatus = (id: string, status: TaskStatus) => {
    let progress = 0;
    if (status === TaskStatus.COMPLETED) progress = 100;
    else if (status === TaskStatus.IN_PROGRESS) progress = 50;
    
    db.updateTask(id, { status, progress });
    setTasks(db.getTasks());
    setNotification({ message: `Task status updated to ${status.replace('_', ' ')}.`, type: 'success' });
  };

  const handleUpdateTaskProgress = (id: string, progress: number) => {
    let status = TaskStatus.IN_PROGRESS;
    if (progress === 0) status = TaskStatus.PENDING;
    else if (progress === 100) status = TaskStatus.COMPLETED;

    db.updateTask(id, { progress, status });
    setTasks(db.getTasks());
  };

  const handleAssignTask = (taskId: string, userId: string) => {
    db.updateTask(taskId, { assignedTo: userId || undefined });
    setTasks(db.getTasks());
    const assignedUser = users.find(u => u.id === userId);
    setNotification({ 
      message: userId ? `Task assigned to ${assignedUser?.fullName}.` : 'Task unassigned.', 
      type: 'success' 
    });
  };

  const openTaskModalForUser = (userId: string) => {
    setTaskForm({
      title: '',
      description: '',
      priority: TaskPriority.MEDIUM,
      dueDate: '',
      assignedTo: userId
    });
    setIsTaskModalOpen(true);
  };

  const handleDeleteTask = (id: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      db.deleteTask(id);
      setTasks(db.getTasks());
      setNotification({ message: 'Task removed from the system.', type: 'success' });
    }
  };

  // Performance calculation logic
  const enforcerMetrics = useMemo(() => {
    const enforcers = users.filter(u => u.role === UserRole.LAW_ENFORCER);
    
    return enforcers.map(officer => {
      const officerLogs = logs.filter(log => {
        const isBadgeMatch = log.enforcerId === officer.badgeNumber;
        if (!dateRange.start || !dateRange.end) return isBadgeMatch;
        const logDate = new Date(log.timestamp);
        return isBadgeMatch && logDate >= new Date(dateRange.start) && logDate <= new Date(dateRange.end);
      });

      let ticketsCount = 0;
      vehicles.forEach(v => {
        v.violationHistory.forEach(violation => {
          if (violation.includes(`Officer ${officer.fullName}`) && violation.includes('Ticket')) {
             ticketsCount++;
          }
        });
      });

      return {
        id: officer.id,
        fullName: officer.fullName,
        badge: officer.badgeNumber || 'N/A',
        unit: officer.unitNumber || 'Patrol',
        verifications: officerLogs.length,
        tickets: ticketsCount,
        resolved: Math.floor(ticketsCount * 0.6)
      };
    }).sort((a, b) => {
      let comparison = 0;
      if (sortField === 'badge') comparison = a.badge.localeCompare(b.badge);
      if (sortField === 'verifications') comparison = a.verifications - b.verifications;
      if (sortField === 'tickets') comparison = a.tickets - b.tickets;
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [users, logs, vehicles, sortField, sortOrder, dateRange, refreshTrigger]);

  const staffMembers = useMemo(() => {
    return users.filter(u => u.role !== UserRole.CITIZEN && u.id !== user.id);
  }, [users, user.id]);

  const filteredVehicles = useMemo(() => {
    if (intelligenceFilter === 'All') return trackedVehicles;
    return trackedVehicles.filter(v => v.status === intelligenceFilter);
  }, [trackedVehicles, intelligenceFilter]);

  // System Activity Chart Data
  const systemActivityData = useMemo(() => {
    const grouped = logs.reduce((acc: any, log) => {
      const date = new Date(log.timestamp).toLocaleDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(grouped).map(([date, count]) => ({
      date,
      activity: count
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [logs]);

  // Dynamic Theme Classes
  const isBeigeTab = activeTab === 'transactions' || activeTab === 'audit';
  const theme = {
    bg: isDarkMode ? 'bg-slate-950 text-white' : (isBeigeTab ? 'bg-[#fcf8f3] text-slate-900' : 'bg-slate-100 text-slate-900'),
    header: isDarkMode ? 'bg-slate-900/80 border-slate-800' : (isBeigeTab ? 'bg-[#fcf8f3]/80 border-[#e5e0d8]' : 'bg-white/80 border-slate-200'),
    card: isDarkMode ? 'bg-slate-900/60 border-slate-800 backdrop-blur-xl' : (isBeigeTab ? 'bg-white border-[#e5e0d8]' : 'bg-white border-slate-100'),
    tableHead: isDarkMode ? 'bg-slate-900 border-slate-800' : (isBeigeTab ? 'bg-[#f5f0e8] border-[#e5e0d8]' : 'bg-slate-50 border-slate-100'),
    tableRowHover: isDarkMode ? 'hover:bg-slate-800/50' : (isBeigeTab ? 'hover:bg-[#f5f0e8]' : 'hover:bg-slate-50'),
    tabPanel: isDarkMode ? 'bg-slate-950/50' : (isBeigeTab ? 'bg-[#fcf8f3]/50' : 'bg-slate-50/50'),
    mutedText: isDarkMode ? 'text-slate-400' : 'text-slate-500',
    subtleBorder: isDarkMode ? 'border-slate-800' : (isBeigeTab ? 'border-[#e5e0d8]' : 'border-slate-50'),
    primaryText: isDarkMode ? 'text-white' : 'text-slate-900',
    secondaryText: isDarkMode ? 'text-slate-100' : 'text-slate-800',
  };

  return (
    <div className={`flex h-screen overflow-hidden font-sans transition-colors duration-500 ${theme.bg}`}>
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-24 right-10 z-[100] animate-in slide-in-from-right-10 duration-300">
          <div className={`px-8 py-4 rounded-2xl shadow-2xl border flex items-center gap-4 ${notification.type === 'success' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-red-600 border-red-500 text-white'}`}>
            <i className={`fa-solid ${notification.type === 'success' ? 'fa-check-circle' : 'fa-triangle-exclamation'} text-xl`}></i>
            <p className="font-black text-sm uppercase tracking-wider">{notification.message}</p>
          </div>
        </div>
      )}

      {/* Sidebar - Always Dark for Brand Identity */}
      <div className="w-80 bg-slate-900 text-white flex flex-col shadow-2xl relative z-10">
        <div className="p-10 border-b border-slate-800">
          <div className="flex items-center gap-4 mb-4">
             <Logo size="sm" />
             <div>
               <h2 className="text-2xl font-black tracking-tight">Veritas</h2>
               <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Master Admin</p>
             </div>
          </div>
          <div className="bg-slate-800 p-4 rounded-2xl">
            <p className="text-xs text-slate-400 font-bold mb-1">Signed in as:</p>
            <p className="font-black text-sm text-slate-100">{user.fullName}</p>
          </div>
        </div>
        
        <nav className="flex-grow p-6 space-y-3 overflow-y-auto scrollbar-hide">
          <NavBtn active={activeTab === 'users'} onClick={() => setActiveTab('users')} icon="fa-users" label="User Directory" />
          <NavBtn active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} icon="fa-list-check" label="Task Management" />
          <NavBtn active={activeTab === 'add-worker'} onClick={() => setActiveTab('add-worker')} icon="fa-user-plus" label="Add New Worker" />
          <NavBtn active={activeTab === 'enforcement'} onClick={() => setActiveTab('enforcement')} icon="fa-chart-line" label="Officer Performance" />
          <NavBtn active={activeTab === 'intelligence'} onClick={() => setActiveTab('intelligence')} icon="fa-satellite" label="Live Intelligence" />
          <NavBtn active={activeTab === 'workers'} onClick={() => setActiveTab('workers')} icon="fa-user-clock" label="Staff Activity" />
          <NavBtn active={activeTab === 'vehicles'} onClick={() => setActiveTab('vehicles')} icon="fa-database" label="Master Registry" />
          <NavBtn active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} icon="fa-money-bill-transfer" label="Revenue Control" />
          <NavBtn active={activeTab === 'audit'} onClick={() => setActiveTab('audit')} icon="fa-clipboard-list" label="Audit Trail" />
          <NavBtn active={activeTab === 'logs'} onClick={() => setActiveTab('logs')} icon="fa-tower-observation" label="System Logs" />
        </nav>
        
        <div className="p-10 border-t border-slate-800 bg-black/20">
          <button onClick={onLogout} className="w-full flex items-center justify-center gap-4 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white py-4 rounded-2xl font-black transition-all duration-300">
            <i className="fa-solid fa-power-off"></i> System Logout
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col overflow-hidden">
        <header className={`backdrop-blur-md border-b p-10 flex justify-between items-center shadow-sm transition-all duration-500 ${theme.header}`}>
          <div>
            <h1 className={`text-4xl font-black tracking-tight ${theme.primaryText}`}>
              {activeTab === 'users' && "Master User Registry"}
              {activeTab === 'tasks' && "Administrative Task Center"}
              {activeTab === 'add-worker' && "Onboard New Personnel"}
              {activeTab === 'enforcement' && "Officer Performance Metrics"}
              {activeTab === 'workers' && "Personnel Login Logs"}
              {activeTab === 'vehicles' && "Vehicle Inventory Database"}
              {activeTab === 'transactions' && "Financial Audit Trail"}
              {activeTab === 'audit' && "Administrative Audit Trail"}
              {activeTab === 'logs' && "Law Enforcement History"}
            </h1>
            <p className={`font-bold text-sm uppercase tracking-widest mt-2 ${theme.mutedText}`}>Sierra Leone Road Safety Authority • Administrative Control</p>
          </div>
          <div className="flex items-center gap-10">
            {/* Dark Mode Toggle */}
            <div className={`flex items-center gap-4 px-6 py-3 rounded-2xl border transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
              <i className={`fa-solid ${isDarkMode ? 'fa-moon text-blue-400' : 'fa-sun text-amber-500'} text-xl`}></i>
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`w-14 h-7 rounded-full transition-all relative shadow-inner ${isDarkMode ? 'bg-blue-500' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-500 ${isDarkMode ? 'left-8' : 'left-1'}`}></div>
              </button>
              <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-blue-400' : 'text-slate-500'}`}>
                {isDarkMode ? 'Dark' : 'Light'}
              </span>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right hidden md:block">
                <p className={`text-xs font-bold ${theme.mutedText}`}>Database Integrity</p>
                <p className="font-black text-emerald-600 uppercase tracking-tighter">Encrypted & Active</p>
              </div>
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-700 text-blue-400' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                <i className="fa-solid fa-shield-check text-xl"></i>
              </div>
            </div>
          </div>
        </header>

        <div className={`flex-grow p-12 overflow-y-auto transition-colors duration-500 ${theme.tabPanel}`}>
          
          {activeTab === 'users' && (
            <div className={`rounded-[2.5rem] shadow-2xl border overflow-hidden animate-in fade-in duration-500 transition-all ${theme.card}`}>
              <div className={`p-8 border-b flex justify-between items-center ${theme.subtleBorder} ${isDarkMode ? 'bg-white/5' : 'bg-slate-50/30'}`}>
                 <h3 className={`font-black text-xl ${theme.secondaryText}`}>Account Management Center</h3>
                 <div className="flex gap-4">
                   <span className="bg-slate-900 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest">Total Users: {users.length}</span>
                 </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[1200px]">
                <thead className={`border-b ${theme.tableHead}`}>
                  <tr>
                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">User Profile</th>
                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Account Status</th>
                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Credential ID</th>
                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Last Login</th>
                    <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Management Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme.subtleBorder}`}>
                  {users.map((u) => (
                    <tr key={u.id} className={`transition duration-300 ${theme.tableRowHover} ${u.isActive === false ? (isDarkMode ? 'bg-red-900/10' : 'bg-red-50/30') : ''}`}>
                      <td className="px-10 py-6">
                        <div>
                          <div className={`font-black ${theme.secondaryText} ${u.isActive === false ? 'opacity-50 line-through' : ''}`}>{u.fullName}</div>
                          <div className={`text-[9px] font-black uppercase tracking-widest mt-1 ${
                            u.role === UserRole.ADMIN ? 'text-red-500' :
                            u.role === UserRole.CITIZEN ? 'text-blue-500' :
                            u.role === UserRole.LAW_ENFORCER ? 'text-emerald-500' : 'text-purple-500'
                          }`}>{u.role.replace('_', ' ')}</div>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <div className={`text-sm font-bold mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{u.email || 'N/A'}</div>
                        <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${u.isActive !== false ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                          {u.isActive !== false ? 'Verified Active' : 'Access Suspended'}
                        </span>
                      </td>
                      <td className="px-10 py-6 font-mono text-xs text-slate-500">
                        {u.badgeNumber || u.id.substr(0, 8)}
                      </td>
                      <td className="px-10 py-6">
                        <div className={`text-xs font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          {u.lastLogin || 'Never'}
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex gap-3">
                          <button 
                            onClick={() => handleOpenPrefs(u)}
                            className={`w-11 h-11 rounded-xl transition-all flex items-center justify-center shadow-sm ${isDarkMode ? 'bg-slate-800 text-slate-400 hover:bg-white hover:text-slate-900' : 'bg-slate-100 text-slate-600 hover:bg-slate-900 hover:text-white'}`}
                            title="Notification Preferences"
                          >
                            <i className="fa-solid fa-gear text-lg"></i>
                          </button>
                          {u.role !== UserRole.CITIZEN && (
                            <>
                              <button 
                                onClick={() => openTaskModalForUser(u.id)}
                                className={`w-11 h-11 rounded-xl transition-all flex items-center justify-center shadow-sm ${isDarkMode ? 'bg-slate-800 text-emerald-400 hover:bg-emerald-600 hover:text-white' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'}`}
                                title="Assign New Task"
                              >
                                <i className="fa-solid fa-list-check text-lg"></i>
                              </button>
                              <button 
                                onClick={() => handleOpenEditUser(u)}
                                className={`w-11 h-11 rounded-xl transition-all flex items-center justify-center shadow-sm ${isDarkMode ? 'bg-slate-800 text-blue-400 hover:bg-blue-600 hover:text-white' : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'}`}
                                title="Edit User Information"
                              >
                                <i className="fa-solid fa-user-pen text-lg"></i>
                              </button>
                            </>
                          )}
                          {u.role !== UserRole.ADMIN && (
                            <>
                              <button 
                                onClick={() => handleToggleUserStatus(u.id, u.fullName, u.isActive !== false)}
                                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all shadow-sm ${u.isActive !== false ? 'bg-amber-100 text-amber-600 hover:bg-amber-600 hover:text-white' : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white'}`}
                                title={u.isActive !== false ? "Suspend Access" : "Restore Access"}
                              >
                                <i className={`fa-solid ${u.isActive !== false ? 'fa-user-slash' : 'fa-user-check'} text-lg`}></i>
                              </button>
                              <button 
                                onClick={() => handleDeleteUser(u.id, u.fullName)}
                                className="w-11 h-11 bg-red-100 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all flex items-center justify-center shadow-md hover:shadow-red-600/20"
                                title="Delete Account Permanently"
                              >
                                <i className="fa-solid fa-trash-can text-lg"></i>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

          {activeTab === 'tasks' && (
            <div className="space-y-10 animate-in fade-in duration-500">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <h3 className={`text-2xl font-black tracking-tight ${theme.secondaryText}`}>Administrative Duties</h3>
                  <p className={`text-xs font-bold uppercase tracking-widest mt-1 ${theme.mutedText}`}>Track and manage critical system tasks</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className={`flex p-1 rounded-xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                    {['ALL', TaskStatus.PENDING, TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED].map((status) => (
                      <button
                        key={status}
                        onClick={() => setTaskFilter(status as any)}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                          taskFilter === status 
                            ? (isDarkMode ? 'bg-slate-800 text-white shadow-lg' : 'bg-white text-slate-900 shadow-md') 
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        {status.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={() => setIsTaskModalOpen(true)}
                    className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-500 transition-all shadow-xl flex items-center gap-3"
                  >
                    <i className="fa-solid fa-plus"></i> Create New Task
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {tasks
                  .filter(t => taskFilter === 'ALL' || t.status === taskFilter)
                  .map(task => {
                    const assignedUser = users.find(u => u.id === task.assignedTo);
                    const progress = task.progress ?? (task.status === TaskStatus.COMPLETED ? 100 : task.status === TaskStatus.IN_PROGRESS ? 50 : 0);
                    
                    return (
                      <div key={task.id} className={`p-8 rounded-[2.5rem] border shadow-xl transition-all duration-300 group hover:-translate-y-2 ${theme.card}`}>
                        <div className="flex justify-between items-start mb-6">
                          <div className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                            task.priority === TaskPriority.CRITICAL ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' :
                            task.priority === TaskPriority.HIGH ? 'bg-orange-100 text-orange-600' :
                            task.priority === TaskPriority.MEDIUM ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {task.priority} Priority
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleDeleteTask(task.id)}
                              className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all"
                            >
                              <i className="fa-solid fa-trash-can text-xs"></i>
                            </button>
                          </div>
                        </div>

                        <h4 className={`text-xl font-black mb-2 ${theme.secondaryText}`}>{task.title}</h4>
                        <p className={`text-sm font-medium mb-6 line-clamp-2 ${theme.mutedText}`}>{task.description}</p>

                        <div className="mb-6">
                          <div className="flex justify-between items-center mb-2">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${theme.mutedText}`}>Progress Control</span>
                            <span className={`text-[10px] font-black ${theme.secondaryText}`}>{progress}%</span>
                          </div>
                          <div className="relative group/progress">
                            <input 
                              type="range" 
                              min="0" 
                              max="100" 
                              value={progress}
                              onChange={(e) => handleUpdateTaskProgress(task.id, parseInt(e.target.value))}
                              className="w-full h-3 bg-transparent appearance-none cursor-pointer z-10 relative [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-500 [&::-webkit-slider-thumb]:-mt-1"
                            />
                            <div className={`absolute top-0 left-0 w-full h-3 rounded-full overflow-hidden p-0.5 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                              <div 
                                className={`h-full rounded-full transition-all duration-300 ease-out shadow-inner ${
                                  task.status === TaskStatus.COMPLETED ? 'bg-emerald-500 shadow-emerald-400/50' : 
                                  task.status === TaskStatus.IN_PROGRESS ? 'bg-blue-500 shadow-blue-400/50' : 'bg-amber-500 shadow-amber-400/50'
                                }`} 
                                style={{ width: `${progress}%` }}
                              >
                                <div className="w-full h-full bg-white/20 animate-pulse"></div>
                              </div>
                            </div>
                          </div>
                          <p className={`text-[9px] font-bold uppercase mt-2 text-center opacity-0 group-hover/progress:opacity-100 transition-opacity ${theme.mutedText}`}>Drag to update progress</p>
                        </div>

                        <div className={`pt-6 border-t ${theme.subtleBorder} space-y-4`}>
                          <div className="flex justify-between items-center">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${theme.mutedText}`}>Assigned To</span>
                            <select
                              value={task.assignedTo || ''}
                              onChange={(e) => handleAssignTask(task.id, e.target.value)}
                              className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg outline-none cursor-pointer border-none bg-transparent hover:bg-slate-100 transition-colors ${theme.secondaryText}`}
                            >
                              <option value="">Unassigned</option>
                              {staffMembers.map(staff => (
                                <option key={staff.id} value={staff.id}>{staff.fullName.split(' ')[0]}</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${theme.mutedText}`}>Status</span>
                            <select 
                              value={task.status}
                              onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value as TaskStatus)}
                              className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg outline-none cursor-pointer transition-colors ${
                                task.status === TaskStatus.COMPLETED ? 'bg-emerald-100 text-emerald-600' :
                                task.status === TaskStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'
                              }`}
                            >
                              <option value={TaskStatus.PENDING}>Pending</option>
                              <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
                              <option value={TaskStatus.COMPLETED}>Completed</option>
                              <option value={TaskStatus.ARCHIVED}>Archived</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {activeTab === 'enforcement' && (
            <div className="space-y-10 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <MetricCard icon="fa-shield-halved" label="Total Force" value={users.filter(u => u.role === UserRole.LAW_ENFORCER).length.toString()} color="bg-blue-600" isDark={isDarkMode} />
                <MetricCard icon="fa-barcode" label="Total Scans" value={logs.length.toString()} color="bg-emerald-600" isDark={isDarkMode} />
                <MetricCard icon="fa-file-invoice-dollar" label="Tickets Issued" value={vehicles.reduce((acc, v) => acc + v.violationHistory.filter(vh => vh.includes('Ticket')).length, 0).toString()} color="bg-red-600" isDark={isDarkMode} />
                <MetricCard icon="fa-check-double" label="Compliance Rate" value="92%" color="bg-slate-900" isDark={isDarkMode} />
              </div>

              {/* KPI Section */}
              <div className={`p-10 rounded-[3rem] border shadow-2xl transition-all ${theme.card}`}>
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
                    <i className="fa-solid fa-gauge-high text-xl"></i>
                  </div>
                  <div>
                    <h3 className={`text-2xl font-black tracking-tight ${theme.secondaryText}`}>Operational KPIs</h3>
                    <p className={`text-[10px] font-black uppercase tracking-[0.4em] ${theme.mutedText}`}>Real-time performance indicators</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <p className={`text-[10px] font-black uppercase tracking-widest ${theme.mutedText}`}>Avg. Response Time</p>
                      <div className="flex items-center gap-1 text-emerald-500 font-black text-[10px]">
                        <i className="fa-solid fa-caret-down"></i> 12%
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-4xl font-black tracking-tighter ${theme.primaryText}`}>6.2</span>
                      <span className={`text-sm font-bold ${theme.mutedText}`}>minutes</span>
                    </div>
                    <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                      <div className="h-full bg-blue-500 w-[65%]"></div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <p className={`text-[10px] font-black uppercase tracking-widest ${theme.mutedText}`}>Ticket Resolution</p>
                      <div className="flex items-center gap-1 text-emerald-500 font-black text-[10px]">
                        <i className="fa-solid fa-caret-up"></i> 5%
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-4xl font-black tracking-tighter ${theme.primaryText}`}>84</span>
                      <span className={`text-sm font-bold ${theme.mutedText}`}>% rate</span>
                    </div>
                    <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                      <div className="h-full bg-emerald-500 w-[84%]"></div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <p className={`text-[10px] font-black uppercase tracking-widest ${theme.mutedText}`}>Verifications / Shift</p>
                      <div className="flex items-center gap-1 text-emerald-500 font-black text-[10px]">
                        <i className="fa-solid fa-caret-up"></i> 8%
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-4xl font-black tracking-tighter ${theme.primaryText}`}>42</span>
                      <span className={`text-sm font-bold ${theme.mutedText}`}>avg scans</span>
                    </div>
                    <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                      <div className="h-full bg-purple-500 w-[72%]"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Bar Chart: Tickets vs Verifications */}
                <div className={`p-8 rounded-[2.5rem] shadow-2xl border transition-all ${theme.card}`}>
                  <h3 className={`font-black text-xl tracking-tight mb-6 ${theme.secondaryText}`}>Officer Output: Tickets vs Verifications</h3>
                  <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={enforcerMetrics}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#e2e8f0'} vertical={false} />
                        <XAxis 
                          dataKey="fullName" 
                          stroke={isDarkMode ? '#94a3b8' : '#64748b'} 
                          fontSize={10} 
                          fontWeight="bold"
                          tickFormatter={(value) => value.split(' ')[0]}
                        />
                        <YAxis stroke={isDarkMode ? '#94a3b8' : '#64748b'} fontSize={10} fontWeight="bold" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: isDarkMode ? '#0f172a' : '#ffffff', 
                            borderColor: isDarkMode ? '#1e293b' : '#e2e8f0',
                            borderRadius: '1rem',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }} 
                        />
                        <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '20px' }} />
                        <Bar dataKey="verifications" name="Verifications" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="tickets" name="Tickets Issued" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Line Chart: System Activity */}
                <div className={`p-8 rounded-[2.5rem] shadow-2xl border transition-all ${theme.card}`}>
                  <h3 className={`font-black text-xl tracking-tight mb-6 ${theme.secondaryText}`}>Overall System Activity Trend</h3>
                  <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={systemActivityData}>
                        <defs>
                          <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#334155' : '#e2e8f0'} vertical={false} />
                        <XAxis dataKey="date" stroke={isDarkMode ? '#94a3b8' : '#64748b'} fontSize={10} fontWeight="bold" />
                        <YAxis stroke={isDarkMode ? '#94a3b8' : '#64748b'} fontSize={10} fontWeight="bold" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: isDarkMode ? '#0f172a' : '#ffffff', 
                            borderColor: isDarkMode ? '#1e293b' : '#e2e8f0',
                            borderRadius: '1rem',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }} 
                        />
                        <Area type="monotone" dataKey="activity" name="Verifications" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorActivity)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className={`rounded-[2.5rem] shadow-2xl border overflow-hidden transition-all ${theme.card}`}>
                <div className={`p-10 border-b flex flex-col md:flex-row justify-between items-center gap-6 ${theme.subtleBorder} ${isDarkMode ? 'bg-white/5' : 'bg-slate-50/30'}`}>
                  <div>
                    <h3 className={`font-black text-2xl tracking-tight ${theme.secondaryText}`}>Operational Performance Grid</h3>
                    <p className={`font-bold text-xs uppercase tracking-widest mt-1 ${theme.mutedText}`}>Audit individual officer efficacy and field output</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className={`flex p-1 rounded-xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                      <input 
                        type="date" 
                        value={dateRange.start}
                        onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                        className={`bg-transparent text-[10px] font-black uppercase p-2 outline-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
                      />
                      <span className="self-center px-1 text-slate-300">to</span>
                      <input 
                        type="date" 
                        value={dateRange.end}
                        onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                        className={`bg-transparent text-[10px] font-black uppercase p-2 outline-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
                      />
                    </div>
                    <select 
                      value={sortField}
                      onChange={(e) => setSortField(e.target.value as any)}
                      className={`text-[10px] font-black uppercase p-3 rounded-xl border outline-none cursor-pointer ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'}`}
                    >
                      <option value="badge">Sort by Badge ID</option>
                      <option value="verifications">Sort by Verifications</option>
                      <option value="tickets">Sort by Tickets</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className={theme.tableHead}>
                      <tr>
                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Officer</th>
                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Badge ID</th>
                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Verifications</th>
                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Tickets Issued</th>
                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Compliance Rate</th>
                        <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${theme.subtleBorder}`}>
                      {enforcerMetrics.map((m) => (
                        <tr key={m.id} className={`transition group ${theme.tableRowHover}`}>
                          <td className="px-10 py-7">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                                <i className="fa-solid fa-user-shield text-xl"></i>
                              </div>
                              <div>
                                <div className={`font-black ${theme.secondaryText}`}>{m.fullName}</div>
                                <div className={`text-[10px] font-bold uppercase ${theme.mutedText}`}>{m.unit} Unit</div>
                              </div>
                            </div>
                          </td>
                          <td className={`px-10 py-7 font-mono text-sm font-black text-blue-600 ${isDarkMode ? 'bg-blue-900/10' : 'bg-blue-50/30'}`}>
                            {m.badge}
                          </td>
                          <td className="px-10 py-7">
                            <div className={`text-xl font-black ${theme.primaryText}`}>{m.verifications}</div>
                            <div className={`w-24 h-1.5 rounded-full mt-2 overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                               <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, (m.verifications / 10) * 100)}%` }}></div>
                            </div>
                          </td>
                          <td className="px-10 py-7">
                            <div className="text-xl font-black text-red-600">{m.tickets}</div>
                            <div className={`text-[10px] font-bold uppercase mt-1 ${theme.mutedText}`}>Official Tickets</div>
                          </td>
                          <td className="px-10 py-7">
                            <div className="flex items-center gap-3">
                               <span className="text-lg font-black text-emerald-600">{m.resolved}</span>
                               <div className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                 {Math.round((m.tickets > 0 ? (m.resolved / m.tickets) * 100 : 100))}% Rate
                               </div>
                            </div>
                          </td>
                          <td className="px-10 py-7">
                            <button 
                              onClick={() => handleDeleteUser(m.id, m.fullName)}
                              className="w-10 h-10 bg-red-100 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all flex items-center justify-center shadow-sm"
                              title="Delete Officer"
                            >
                              <i className="fa-solid fa-trash-can"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* WORKER LOGS TAB */}
          {activeTab === 'workers' && (
            <div className="space-y-10 animate-in fade-in duration-500">
              {/* Staff Directory */}
              <div className={`rounded-[2.5rem] shadow-2xl border overflow-hidden transition-all ${theme.card}`}>
                <div className={`p-8 border-b ${theme.subtleBorder} ${isDarkMode ? 'bg-white/5' : 'bg-slate-50/30'}`}>
                  <h3 className={`font-black text-xl ${theme.secondaryText}`}>Official Staff Directory</h3>
                  <p className={`text-xs font-bold uppercase tracking-widest mt-1 ${theme.mutedText}`}>Manage departmental personnel and access rights</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className={theme.tableHead}>
                      <tr>
                        <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Staff Member</th>
                        <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Department</th>
                        <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Credential ID</th>
                        <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${theme.subtleBorder}`}>
                      {staffMembers.map(staff => (
                        <tr key={staff.id} className={`transition ${theme.tableRowHover}`}>
                          <td className="px-10 py-6">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${
                                staff.role === UserRole.ADMIN ? 'bg-red-600' :
                                staff.role === UserRole.LAW_ENFORCER ? 'bg-emerald-600' : 'bg-slate-900'
                              }`}>
                                <i className={`fa-solid ${staff.role === UserRole.LAW_ENFORCER ? 'fa-user-shield' : 'fa-user-tie'}`}></i>
                              </div>
                              <div>
                                <div className={`font-black ${theme.secondaryText}`}>{staff.fullName}</div>
                                <div className={`text-[10px] font-bold ${theme.mutedText}`}>{staff.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-10 py-6">
                            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${
                              staff.role === UserRole.ADMIN ? 'bg-red-100 text-red-600' :
                              staff.role === UserRole.LAW_ENFORCER ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                            }`}>
                              {staff.role.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-10 py-6 font-mono text-xs text-slate-500">
                            {staff.badgeNumber || 'N/A'}
                          </td>
                          <td className="px-10 py-6">
                            <button 
                              onClick={() => handleDeleteUser(staff.id, staff.fullName)}
                              className="w-10 h-10 bg-red-100 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all flex items-center justify-center shadow-sm"
                              title="Delete Staff Member"
                            >
                              <i className="fa-solid fa-trash-can"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Login Audit Trail */}
              <div className={`rounded-[2.5rem] shadow-2xl border overflow-hidden transition-all ${theme.card}`}>
                <div className={`p-8 border-b ${theme.subtleBorder} ${isDarkMode ? 'bg-white/5' : 'bg-slate-50/30'}`}>
                  <h3 className={`font-black text-xl ${theme.secondaryText}`}>Official Login Audit Trail</h3>
                </div>
              <div className={`divide-y ${theme.subtleBorder}`}>
                {loginHistory.length > 0 ? loginHistory.map((log) => (
                  <div key={log.id} className={`p-8 flex items-center justify-between transition duration-300 ${theme.tableRowHover}`}>
                    <div className="flex items-center gap-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white ${
                        log.role === UserRole.ADMIN ? 'bg-red-600 shadow-xl shadow-red-500/20' :
                        log.role === UserRole.LAW_ENFORCER ? 'bg-emerald-600 shadow-xl shadow-emerald-500/20' : 
                        log.role === UserRole.CITIZEN ? 'bg-blue-600 shadow-xl shadow-blue-500/20' : 'bg-slate-900 shadow-xl shadow-slate-900/20'
                      }`}>
                        <i className={`fa-solid ${
                          log.role === UserRole.LAW_ENFORCER ? 'fa-user-shield' :
                          log.role === UserRole.CITIZEN ? 'fa-user' : 'fa-user-tie'
                        }`}></i>
                      </div>
                      <div>
                        <div className={`font-black text-lg ${theme.secondaryText}`}>{log.userName}</div>
                        <div className={`text-xs font-bold uppercase tracking-widest ${theme.mutedText}`}>{log.role.replace('_', ' ')} • {log.deviceInfo}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-black ${theme.primaryText}`}>{log.timestamp}</p>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${isDarkMode ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-500'}`}>Validated Session</span>
                    </div>
                  </div>
                )) : (
                  <div className="py-32 text-center">
                    <i className="fa-solid fa-clock-rotate-left text-slate-200 text-6xl mb-6 block"></i>
                    <p className={`font-bold text-xl ${theme.mutedText}`}>No system access recorded yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          )}

          {activeTab === 'vehicles' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
              {db.getVehicles().map(v => (
                <div key={v.vin} className={`p-8 rounded-[2rem] border shadow-xl hover:-translate-y-2 transition-all duration-300 group ${theme.card}`}>
                  <div className="flex justify-between items-start mb-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl transition-colors ${isDarkMode ? 'bg-slate-800 text-emerald-400' : 'bg-slate-900 text-white'}`}>
                      <i className="fa-solid fa-car"></i>
                    </div>
                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${v.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {v.status}
                    </span>
                  </div>
                  <h3 className={`font-black text-2xl mb-1 ${theme.secondaryText}`}>{v.plateNumber}</h3>
                  <p className={`text-xs font-black uppercase tracking-widest mb-6 ${theme.mutedText}`}>{v.make} {v.model}</p>
                  
                  <div className={`space-y-3 pt-6 border-t ${theme.subtleBorder}`}>
                    <div className="flex justify-between">
                      <span className={`text-xs font-bold uppercase tracking-widest ${theme.mutedText}`}>Owner:</span>
                      <span className={`text-xs font-black ${theme.secondaryText}`}>{v.ownerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`text-xs font-bold uppercase tracking-widest ${theme.mutedText}`}>License:</span>
                      <span className={`text-xs font-black ${theme.secondaryText}`}>{v.licenseExpiry}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                <MetricCard icon="fa-sack-dollar" label="Total Revenue" value={db.getTransactions().reduce((acc, t) => acc + t.amount, 0).toLocaleString()} color="bg-emerald-600" isDark={isDarkMode} />
                <MetricCard icon="fa-clipboard-check" label="Audits" value="100%" color="bg-blue-600" isDark={isDarkMode} />
                <MetricCard icon="fa-mobile-screen" label="Count" value={db.getTransactions().length.toString()} color="bg-slate-900" isDark={isDarkMode} />
              </div>

              <div className={`rounded-[2.5rem] shadow-xl border overflow-hidden transition-all ${theme.card}`}>
                <table className="w-full text-left">
                  <thead className={`border-b ${theme.tableHead}`}>
                    <tr>
                      <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Transaction ID</th>
                      <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Type</th>
                      <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Amount</th>
                      <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Method</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${theme.subtleBorder}`}>
                    {db.getTransactions().map(t => (
                      <tr key={t.id} className={`transition ${theme.tableRowHover}`}>
                        <td className="px-10 py-6 font-mono text-xs font-bold text-slate-500">{t.id}</td>
                        <td className={`px-10 py-6 font-black ${theme.secondaryText}`}>{t.type} Payment</td>
                        <td className="px-10 py-6 text-emerald-600 font-black">{t.amount} NLe</td>
                        <td className={`px-10 py-6 font-bold ${theme.mutedText}`}>{t.method}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-6 animate-in fade-in duration-500">
               {db.getLogs().map(l => (
                <div key={l.id} className={`p-10 rounded-[2.5rem] border shadow-xl flex justify-between items-center group transition-all ${theme.card}`}>
                   <div className="flex items-center gap-8">
                     <div className={`w-16 h-16 rounded-[1.25rem] flex items-center justify-center text-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-900 text-white'}`}>
                       <i className="fa-solid fa-shield-halved"></i>
                     </div>
                     <div>
                       <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${theme.mutedText}`}>{l.timestamp}</p>
                       <h4 className={`text-2xl font-black ${theme.secondaryText}`}>Verification ID: {l.vin}</h4>
                       <p className={`text-sm font-bold ${theme.mutedText}`}>Executing Officer: <span className={`font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{l.enforcerId}</span></p>
                     </div>
                   </div>
                   <div className="text-right">
                     <span className={`px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${l.status.includes('Verified') ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                       {l.status}
                     </span>
                   </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'intelligence' && (
            <div className={`rounded-[3.5rem] shadow-2xl border p-1 p-md-12 animate-in zoom-in-95 duration-500 transition-all h-[800px] relative overflow-hidden ${theme.card}`}>
              {/* Stylized Map Background */}
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#10b981 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] border border-emerald-500/20 rounded-full animate-pulse"></div>
              </div>

              <div className="relative z-10 h-full flex flex-col p-12">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className={`text-4xl font-black tracking-tighter ${theme.primaryText}`}>National Risk Intelligence</h3>
                    <p className={`font-bold text-xs uppercase tracking-widest mt-2 ${theme.mutedText}`}>Real-time tracking of flagged vehicles & active citations</p>
                  </div>
                  <div className="flex gap-4">
                    <div className={`flex p-1 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                      {(['All', 'Active', 'Expired', 'Flagged'] as const).map((f) => (
                        <button
                          key={f}
                          onClick={() => setIntelligenceFilter(f)}
                          className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            intelligenceFilter === f 
                              ? 'bg-emerald-600 text-white shadow-lg' 
                              : `text-slate-400 hover:${isDarkMode ? 'text-white' : 'text-slate-900'}`
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                    <div className="bg-red-500/10 border border-red-500/20 px-6 py-3 rounded-2xl flex items-center gap-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
                      <span className="text-red-500 font-black text-xs uppercase tracking-widest">Active Violations: {tickets.length}</span>
                    </div>
                  </div>
                </div>

                <div className={`flex-grow relative rounded-[3rem] border shadow-inner overflow-hidden z-0 ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <MapContainer 
                    center={[8.48, -13.23]} 
                    zoom={13} 
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                  >
                    <TileLayer
                      attribution='&copy; Google Maps'
                      url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                      subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
                    />
                    
                    {filteredVehicles.map((v) => {
                      if (!v.location) return null;
                      
                      const statusColor = v.status === 'Active' ? '#10b981' : v.status === 'Expired' ? '#f59e0b' : '#ef4444';
                      
                      const customIcon = L.divIcon({
                        className: 'custom-div-icon',
                        html: `<div style="background-color: ${statusColor}; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 0 15px rgba(0,0,0,0.3); transform: translate(-25%, -25%);">
                                <i class="fa-solid ${v.status === 'Active' ? 'fa-car' : v.status === 'Expired' ? 'fa-hourglass-end' : 'fa-car-burst'}" style="font-size: 12px;"></i>
                              </div>`,
                        iconSize: [30, 30],
                        iconAnchor: [15, 15]
                      });

                      return (
                        <Marker 
                          key={v.vin} 
                          position={[v.location.lat, v.location.lng]} 
                          icon={customIcon}
                          eventHandlers={{
                            click: () => {
                              const t = tickets.find(ticket => ticket.vehicleVin === v.vin);
                              if (t) setSelectedTicket(t);
                              else {
                                setSelectedTicket({
                                  id: 'INFO-' + v.vin,
                                  vehicleVin: v.vin,
                                  plateNumber: v.plateNumber,
                                  violationType: v.status === 'Active' ? 'Compliant Vehicle' : v.status + ' Status',
                                  fineAmount: 0,
                                  issuingOfficer: 'System Monitor',
                                  officerBadge: 'SYS-001',
                                  date: new Date().toLocaleString(),
                                  location: v.location!
                                });
                              }
                            }
                          }}
                        >
                          <Popup>
                            <div className="p-2">
                              <p className="font-black text-slate-900">{v.plateNumber}</p>
                              <p className="text-[10px] font-bold uppercase text-slate-500">{v.make} {v.model}</p>
                              <p className={`text-[10px] font-black uppercase mt-1 ${v.status === 'Active' ? 'text-emerald-600' : 'text-red-600'}`}>{v.status} Status</p>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    })}
                  </MapContainer>

                  {/* Legend */}
                  <div className={`absolute bottom-8 left-8 backdrop-blur-md border p-6 rounded-3xl z-[1000] ${isDarkMode ? 'bg-slate-900/80 border-slate-700' : 'bg-white/80 border-slate-200'}`}>
                    <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-4 ${theme.mutedText}`}>Intelligence Legend</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-red-600 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${theme.primaryText}`}>Flagged (High Risk)</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${theme.primaryText}`}>Expired Status</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${theme.primaryText}`}>Active / Compliant</span>
                      </div>
                    </div>
                  </div>

                  {/* Scanner Effect */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="w-full h-1 bg-emerald-500/20 absolute animate-[scan_4s_ease-in-out_infinite]"></div>
                  </div>
                </div>
              </div>

              {/* Ticket Detail Modal (Nested) */}
              {selectedTicket && (
                <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm z-[100] flex items-center justify-center p-12 animate-in fade-in duration-300">
                  <div className={`w-full max-w-lg rounded-[4rem] p-12 shadow-[0_50px_200px_rgba(0,0,0,0.5)] border relative overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-100'}`}>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
                    
                    <div className="flex justify-between items-start mb-10 relative z-10">
                      <div>
                        <div className="bg-red-100 text-red-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 inline-block">
                          Violation Intelligence
                        </div>
                        <h3 className={`text-4xl font-black tracking-tighter ${theme.primaryText}`}>{selectedTicket.plateNumber}</h3>
                        <p className={`font-bold uppercase tracking-widest text-xs mt-1 ${theme.mutedText}`}>Case ID: {selectedTicket.id}</p>
                      </div>
                      <button onClick={() => setSelectedTicket(null)} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 ${isDarkMode ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-900 hover:text-white'}`}>
                        <i className="fa-solid fa-xmark text-xl"></i>
                      </button>
                    </div>

                    <div className="space-y-8 relative z-10">
                      <div className={`p-8 rounded-[2.5rem] border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                        <p className={`text-[10px] font-black uppercase tracking-widest mb-4 ${theme.mutedText}`}>Violation Category</p>
                        <p className={`text-xl font-black leading-tight ${theme.primaryText}`}>{selectedTicket.violationType}</p>
                        <div className={`mt-6 pt-6 border-t flex justify-between items-center ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                          <span className={`text-sm font-bold ${theme.mutedText}`}>Outstanding Fine</span>
                          <span className="text-2xl font-black text-red-600">{selectedTicket.fineAmount.toLocaleString()} SLL</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                          <p className={`text-[9px] font-black uppercase tracking-widest mb-2 ${theme.mutedText}`}>Issuing Officer</p>
                          <p className={`text-sm font-black ${theme.primaryText}`}>{selectedTicket.issuingOfficer}</p>
                          <p className="text-[10px] font-bold text-emerald-600 uppercase mt-1">{selectedTicket.officerBadge}</p>
                        </div>
                        <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                          <p className={`text-[9px] font-black uppercase tracking-widest mb-2 ${theme.mutedText}`}>Timestamp</p>
                          <p className={`text-sm font-black ${theme.primaryText}`}>{selectedTicket.date}</p>
                        </div>
                      </div>

                      <button 
                        onClick={() => {
                          setActiveTab('logs');
                          setSelectedTicket(null);
                        }}
                        className={`w-full py-6 rounded-[2.5rem] font-black text-lg transition-all shadow-2xl active:scale-95 ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-slate-900 hover:bg-black text-white'}`}
                      >
                        View Full Investigation Log
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'audit' && (
            <div className={`rounded-[2.5rem] shadow-2xl border overflow-hidden animate-in fade-in duration-500 transition-all ${theme.card}`}>
              <div className={`p-8 border-b ${theme.subtleBorder} ${isDarkMode ? 'bg-white/5' : 'bg-slate-50/30'}`}>
                 <h3 className={`font-black text-xl ${theme.secondaryText}`}>System-Wide Administrative Audit Trail</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className={theme.tableHead}>
                    <tr>
                      <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Timestamp</th>
                      <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Administrator</th>
                      <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Action</th>
                      <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Affected Entity</th>
                      <th className="px-10 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Details</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${theme.subtleBorder}`}>
                    {db.getAuditLogs().length > 0 ? db.getAuditLogs().map((log) => (
                      <tr key={log.id} className={`transition ${theme.tableRowHover}`}>
                        <td className="px-10 py-6 text-xs font-bold text-slate-500">{log.timestamp}</td>
                        <td className="px-10 py-6">
                          <div className={`font-black text-sm ${theme.secondaryText}`}>{log.adminName}</div>
                          <div className="text-[9px] font-black text-slate-400 uppercase">ID: {log.adminId}</div>
                        </td>
                        <td className="px-10 py-6">
                          <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                            log.action.includes('DELETED') ? 'bg-red-100 text-red-600' :
                            log.action.includes('DEACTIVATED') ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                          }`}>
                            {log.action.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-10 py-6">
                          <div className={`font-black text-sm ${theme.secondaryText}`}>{log.affectedName}</div>
                          <div className="text-[9px] font-black text-slate-400 uppercase">ID: {log.affectedId}</div>
                        </td>
                        <td className={`px-10 py-6 text-xs font-medium ${theme.mutedText}`}>
                          {log.details || 'No additional details provided.'}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="py-32 text-center">
                          <i className="fa-solid fa-clipboard-check text-slate-200 text-6xl mb-6 block"></i>
                          <p className={`font-bold text-xl ${theme.mutedText}`}>No administrative actions logged yet.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'add-worker' && (
            <div className={`max-w-4xl mx-auto rounded-[3.5rem] shadow-2xl border p-12 animate-in slide-in-from-bottom-10 duration-500 transition-all ${theme.card}`}>
              <div className="mb-12">
                <h3 className={`text-3xl font-black tracking-tighter ${theme.primaryText}`}>Personnel Onboarding</h3>
                <p className={`font-bold text-xs uppercase tracking-widest mt-2 ${theme.mutedText}`}>Register new departmental staff and field officers</p>
              </div>

              <form onSubmit={handleAddWorker} className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <label className={`block text-[10px] font-black uppercase tracking-widest mb-3 ml-2 ${theme.mutedText}`}>Full Legal Name</label>
                      <input 
                        required 
                        type="text" 
                        value={workerForm.fullName}
                        onChange={e => setWorkerForm({...workerForm, fullName: e.target.value})}
                        className={`w-full px-8 py-5 rounded-[2rem] border-2 outline-none transition font-bold ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-emerald-500'}`}
                        placeholder="e.g. John Doe"
                      />
                    </div>
                    <div>
                      <label className={`block text-[10px] font-black uppercase tracking-widest mb-3 ml-2 ${theme.mutedText}`}>Email Address</label>
                      <input 
                        required 
                        type="email" 
                        value={workerForm.email}
                        onChange={e => setWorkerForm({...workerForm, email: e.target.value})}
                        className={`w-full px-8 py-5 rounded-[2rem] border-2 outline-none transition font-bold ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-emerald-500'}`}
                        placeholder="staff@slrsa.gov.sl"
                      />
                    </div>
                    <div>
                      <label className={`block text-[10px] font-black uppercase tracking-widest mb-3 ml-2 ${theme.mutedText}`}>Phone Number</label>
                      <input 
                        required 
                        type="tel" 
                        value={workerForm.phone}
                        onChange={e => setWorkerForm({...workerForm, phone: e.target.value})}
                        className={`w-full px-8 py-5 rounded-[2rem] border-2 outline-none transition font-bold ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-emerald-500'}`}
                        placeholder="23277000000"
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className={`block text-[10px] font-black uppercase tracking-widest mb-3 ml-2 ${theme.mutedText}`}>Departmental Role</label>
                      <select 
                        value={workerForm.role}
                        onChange={e => setWorkerForm({...workerForm, role: e.target.value as UserRole})}
                        className={`w-full px-8 py-5 rounded-[2rem] border-2 outline-none transition font-black ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-emerald-500'}`}
                      >
                        <option value={UserRole.LICENSE_DEPT}>License Department</option>
                        <option value={UserRole.INSURANCE_DEPT}>Insurance Department</option>
                        <option value={UserRole.FINANCE_DEPT}>Finance Department</option>
                        <option value={UserRole.LAW_ENFORCER}>Law Enforcement (SLP)</option>
                      </select>
                    </div>
                    
                    {workerForm.role === UserRole.LAW_ENFORCER && (
                      <div className="space-y-4 animate-in slide-in-from-top-4">
                        <div className="flex justify-end">
                          <button 
                            type="button"
                            onClick={() => generateLawEnforcementDetails(false)}
                            className="text-[9px] font-black uppercase tracking-widest bg-emerald-600/10 text-emerald-600 px-4 py-2 rounded-xl hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-2"
                          >
                            <i className="fa-solid fa-wand-magic-sparkles"></i>
                            Auto-Generate Credentials
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className={`block text-[10px] font-black uppercase tracking-widest mb-3 ml-2 ${theme.mutedText}`}>Badge ID</label>
                            <input 
                              required 
                              type="text" 
                              value={workerForm.badgeNumber}
                              onChange={e => setWorkerForm({...workerForm, badgeNumber: e.target.value})}
                              className={`w-full px-6 py-5 rounded-[1.5rem] border-2 outline-none transition font-bold ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-emerald-500'}`}
                              placeholder="SLP-..."
                            />
                          </div>
                          <div>
                            <label className={`block text-[10px] font-black uppercase tracking-widest mb-3 ml-2 ${theme.mutedText}`}>Unit No.</label>
                            <input 
                              required 
                              type="text" 
                              value={workerForm.unitNumber}
                              onChange={e => setWorkerForm({...workerForm, unitNumber: e.target.value})}
                              className={`w-full px-6 py-5 rounded-[1.5rem] border-2 outline-none transition font-bold ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-emerald-500'}`}
                              placeholder="Unit"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className={`block text-[10px] font-black uppercase tracking-widest mb-3 ml-2 ${theme.mutedText}`}>
                        Access Password
                      </label>
                      <input 
                        required 
                        type={workerForm.role === UserRole.LAW_ENFORCER ? "text" : "password"} 
                        value={workerForm.password}
                        onChange={e => setWorkerForm({...workerForm, password: e.target.value})}
                        className={`w-full px-8 py-5 rounded-[2rem] border-2 outline-none transition font-bold ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-emerald-500'}`}
                        placeholder={workerForm.role === UserRole.LAW_ENFORCER ? "e.g. SLP115" : "••••••••"}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className={`block text-[10px] font-black uppercase tracking-widest mb-3 ml-2 ${theme.mutedText}`}>Residential Address</label>
                  <textarea 
                    required 
                    rows={3}
                    value={workerForm.address}
                    onChange={e => setWorkerForm({...workerForm, address: e.target.value})}
                    className={`w-full px-8 py-5 rounded-[2rem] border-2 outline-none transition font-bold resize-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-emerald-500'}`}
                    placeholder="Enter full home address"
                  />
                </div>

                <div className="pt-6">
                  <button 
                    type="submit"
                    className="w-full bg-emerald-600 text-white py-6 rounded-[2.5rem] font-black text-xl hover:bg-emerald-500 transition-all shadow-2xl shadow-emerald-900/40 flex items-center justify-center gap-4 active:scale-95"
                  >
                    <i className="fa-solid fa-user-plus"></i> Complete Onboarding
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* TASK CREATION MODAL */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className={`w-full max-w-xl rounded-[4rem] shadow-[0_50px_200px_rgba(0,0,0,0.3)] border p-12 relative overflow-hidden transition-all duration-500 ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-white/80'}`}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
            
            <div className="flex justify-between items-center mb-12 relative z-10">
              <div>
                <h3 className={`text-3xl font-black tracking-tighter ${theme.primaryText}`}>New Administrative Task</h3>
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.4em] mt-2">Define system duties</p>
              </div>
              <button onClick={() => setIsTaskModalOpen(false)} className={`w-14 h-14 rounded-full flex items-center justify-center transition shadow-lg border active:scale-90 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white/50 border-white/80 text-slate-900'}`}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleAddTask} className="space-y-6 relative z-10">
              <div>
                <label className={`block text-[10px] font-black uppercase tracking-widest mb-3 ml-2 ${theme.mutedText}`}>Task Title</label>
                <input 
                  required 
                  type="text" 
                  value={taskForm.title}
                  onChange={e => setTaskForm({...taskForm, title: e.target.value})}
                  className={`w-full px-6 py-4 rounded-2xl border-2 outline-none transition font-bold ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-emerald-500'}`}
                  placeholder="e.g. Audit Western Area Registrations"
                />
              </div>
              <div>
                <label className={`block text-[10px] font-black uppercase tracking-widest mb-3 ml-2 ${theme.mutedText}`}>Description</label>
                <textarea 
                  required 
                  rows={3}
                  value={taskForm.description}
                  onChange={e => setTaskForm({...taskForm, description: e.target.value})}
                  className={`w-full px-6 py-4 rounded-2xl border-2 outline-none transition font-bold resize-none ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-emerald-500'}`}
                  placeholder="Provide detailed instructions..."
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className={`block text-[10px] font-black uppercase tracking-widest mb-3 ml-2 ${theme.mutedText}`}>Priority Level</label>
                  <select 
                    value={taskForm.priority}
                    onChange={e => setTaskForm({...taskForm, priority: e.target.value as TaskPriority})}
                    className={`w-full px-6 py-4 rounded-2xl border-2 outline-none transition font-black ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-emerald-500'}`}
                  >
                    <option value={TaskPriority.LOW}>Low</option>
                    <option value={TaskPriority.MEDIUM}>Medium</option>
                    <option value={TaskPriority.HIGH}>High</option>
                    <option value={TaskPriority.CRITICAL}>Critical</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-[10px] font-black uppercase tracking-widest mb-3 ml-2 ${theme.mutedText}`}>Due Date</label>
                  <input 
                    type="date" 
                    value={taskForm.dueDate}
                    onChange={e => setTaskForm({...taskForm, dueDate: e.target.value})}
                    className={`w-full px-6 py-4 rounded-2xl border-2 outline-none transition font-bold ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-emerald-500'}`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-[10px] font-black uppercase tracking-widest mb-3 ml-2 ${theme.mutedText}`}>Assign To Personnel</label>
                <select 
                  value={taskForm.assignedTo}
                  onChange={e => setTaskForm({...taskForm, assignedTo: e.target.value})}
                  className={`w-full px-6 py-4 rounded-2xl border-2 outline-none transition font-black ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-emerald-500' : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-emerald-500'}`}
                >
                  <option value="">Select Staff Member (Optional)</option>
                  {staffMembers.map(staff => (
                    <option key={staff.id} value={staff.id}>{staff.fullName} ({staff.role.replace('_', ' ')})</option>
                  ))}
                </select>
              </div>

              <button 
                type="submit"
                className="w-full py-5 rounded-[2rem] bg-emerald-600 text-white font-black text-lg hover:bg-emerald-500 transition shadow-2xl active:scale-95 mt-4"
              >
                Create Task
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className={`w-full max-w-2xl rounded-[4rem] shadow-[0_50px_200px_rgba(0,0,0,0.3)] border p-12 relative overflow-hidden transition-all duration-500 ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-white/80'}`}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
            
            <div className="flex justify-between items-center mb-12 relative z-10">
              <div>
                <h3 className={`text-3xl font-black tracking-tighter ${theme.primaryText}`}>Edit User Account</h3>
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.4em] mt-2">Modifying: {editingUser.fullName}</p>
              </div>
              <button onClick={() => setEditingUser(null)} className={`w-14 h-14 rounded-full flex items-center justify-center transition shadow-lg border active:scale-90 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white/50 border-white/80 text-slate-900'}`}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="space-y-6 relative z-10 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={`block text-[10px] font-black uppercase tracking-widest mb-3 ml-2 ${theme.mutedText}`}>Full Name</label>
                  <input 
                    type="text" 
                    value={editUserForm.fullName}
                    onChange={e => setEditUserForm({...editUserForm, fullName: e.target.value})}
                    className={`w-full px-6 py-4 rounded-2xl border-2 outline-none transition font-bold ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-blue-500'}`}
                  />
                </div>
                <div>
                  <label className={`block text-[10px] font-black uppercase tracking-widest mb-3 ml-2 ${theme.mutedText}`}>Email Address</label>
                  <input 
                    type="email" 
                    value={editUserForm.email}
                    onChange={e => setEditUserForm({...editUserForm, email: e.target.value})}
                    className={`w-full px-6 py-4 rounded-2xl border-2 outline-none transition font-bold ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-blue-500'}`}
                  />
                </div>
                <div>
                  <label className={`block text-[10px] font-black uppercase tracking-widest mb-3 ml-2 ${theme.mutedText}`}>Phone Number</label>
                  <input 
                    type="tel" 
                    value={editUserForm.phone}
                    onChange={e => setEditUserForm({...editUserForm, phone: e.target.value})}
                    className={`w-full px-6 py-4 rounded-2xl border-2 outline-none transition font-bold ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-blue-500'}`}
                  />
                </div>
                <div>
                  <label className={`block text-[10px] font-black uppercase tracking-widest mb-3 ml-2 ${theme.mutedText}`}>Account Role</label>
                  <select 
                    value={editUserForm.role}
                    onChange={e => setEditUserForm({...editUserForm, role: e.target.value as UserRole})}
                    className={`w-full px-6 py-4 rounded-2xl border-2 outline-none transition font-black ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-blue-500'}`}
                  >
                    <option value={UserRole.CITIZEN}>Citizen</option>
                    <option value={UserRole.LICENSE_DEPT}>License Dept</option>
                    <option value={UserRole.INSURANCE_DEPT}>Insurance Dept</option>
                    <option value={UserRole.FINANCE_DEPT}>Finance Dept</option>
                    <option value={UserRole.LAW_ENFORCER}>Law Enforcer</option>
                  </select>
                </div>
              </div>

              {editUserForm.role === UserRole.LAW_ENFORCER && (
                <div className={`p-6 rounded-[2rem] border-2 ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-blue-50/30 border-blue-100'}`}>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-600">Enforcement Credentials</h4>
                    <button 
                      type="button"
                      onClick={() => generateLawEnforcementDetails(true)}
                      className="text-[9px] font-black uppercase tracking-widest bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                    >
                      <i className="fa-solid fa-wand-magic-sparkles"></i>
                      Regenerate
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-[9px] font-black uppercase tracking-widest mb-2 ml-2 ${theme.mutedText}`}>Badge ID</label>
                      <input 
                        type="text" 
                        value={editUserForm.badgeNumber}
                        onChange={e => setEditUserForm({...editUserForm, badgeNumber: e.target.value})}
                        className={`w-full px-5 py-3 rounded-xl border-2 outline-none transition font-bold ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white focus:border-blue-500' : 'bg-white border-slate-100 text-slate-900 focus:border-blue-500'}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-[9px] font-black uppercase tracking-widest mb-2 ml-2 ${theme.mutedText}`}>Unit No.</label>
                      <input 
                        type="text" 
                        value={editUserForm.unitNumber}
                        onChange={e => setEditUserForm({...editUserForm, unitNumber: e.target.value})}
                        className={`w-full px-5 py-3 rounded-xl border-2 outline-none transition font-bold ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white focus:border-blue-500' : 'bg-white border-slate-100 text-slate-900 focus:border-blue-500'}`}
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className={`block text-[9px] font-black uppercase tracking-widest mb-2 ml-2 ${theme.mutedText}`}>
                      Access Password
                    </label>
                    <input 
                      type="text" 
                      value={editUserForm.password}
                      onChange={e => setEditUserForm({...editUserForm, password: e.target.value})}
                      className={`w-full px-5 py-3 rounded-xl border-2 outline-none transition font-bold ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white focus:border-blue-500' : 'bg-white border-slate-100 text-slate-900 focus:border-blue-500'}`}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className={`block text-[10px] font-black uppercase tracking-widest mb-3 ml-2 ${theme.mutedText}`}>Residential Address</label>
                <textarea 
                  rows={2}
                  value={editUserForm.address}
                  onChange={e => setEditUserForm({...editUserForm, address: e.target.value})}
                  className={`w-full px-6 py-4 rounded-2xl border-2 outline-none transition font-bold resize-none ${isDarkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-blue-500' : 'bg-slate-50 border-slate-100 text-slate-900 focus:border-blue-500'}`}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={handleSaveUserEdit}
                  className="flex-1 py-5 rounded-[2rem] bg-slate-900 text-white font-black text-lg hover:bg-black transition shadow-2xl active:scale-95"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* USER PROFILE & PREFERENCES MODAL */}
      {editingPrefsUser && tempPrefs && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className={`w-full max-w-lg rounded-[4rem] shadow-[0_50px_200px_rgba(0,0,0,0.3)] border p-12 relative overflow-hidden transition-all duration-500 ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-white/80'}`}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
            
            <div className="flex justify-between items-center mb-12 relative z-10">
              <div>
                <h3 className={`text-3xl font-black tracking-tighter ${theme.primaryText}`}>Profile Preferences</h3>
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.4em] mt-2">Manage settings for: {editingPrefsUser.fullName}</p>
              </div>
              <button onClick={() => setEditingPrefsUser(null)} className={`w-14 h-14 rounded-full flex items-center justify-center transition shadow-lg border active:scale-90 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white/50 border-white/80 text-slate-900'}`}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="space-y-8 relative z-10">
              <div className={`p-8 rounded-[3rem] border shadow-inner ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white/50 border-white/60'}`}>
                <h4 className={`text-sm font-black uppercase tracking-widest mb-8 border-b pb-4 ${theme.mutedText} ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>Email Alert Settings</h4>
                
                <div className="space-y-6">
                  <ToggleItem label="License Expiry Alerts" active={tempPrefs.emailLicense} onClick={() => togglePref('emailLicense')} isDarkMode={isDarkMode} />
                  <ToggleItem label="Insurance Renewal Alerts" active={tempPrefs.emailInsurance} onClick={() => togglePref('emailInsurance')} isDarkMode={isDarkMode} />
                  <ToggleItem label="Financial Settlement Alerts" active={tempPrefs.emailFinance} onClick={() => togglePref('emailFinance')} isDarkMode={isDarkMode} />
                  <ToggleItem label="General System Alerts" active={tempPrefs.emailSystem} onClick={() => togglePref('emailSystem')} isDarkMode={isDarkMode} />
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={handleSavePrefs}
                  className={`flex-1 py-6 rounded-[2.5rem] font-black text-lg transition shadow-2xl active:scale-95 ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-slate-900 hover:bg-black text-white'}`}
                >
                  Apply Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ToggleItem: React.FC<{ label: string; active: boolean; onClick: () => void; isDarkMode: boolean }> = ({ label, active, onClick, isDarkMode }) => (
  <div className="flex items-center justify-between group">
    <span className={`text-lg font-black tracking-tight group-hover:text-emerald-600 transition-colors ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{label}</span>
    <button 
      onClick={onClick}
      className={`w-16 h-8 rounded-full transition-all relative shadow-inner ${active ? 'bg-emerald-500' : 'bg-slate-700/50'}`}
    >
      <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${active ? 'left-9' : 'left-1'}`}></div>
    </button>
  </div>
);

const MetricCard: React.FC<{ icon: string; label: string; value: string; color: string; isDark: boolean }> = ({ icon, label, value, color, isDark }) => (
  <div className={`p-8 rounded-[2.25rem] border shadow-xl relative overflow-hidden group transition-all duration-500 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
    <div className={`absolute -right-4 -top-4 w-20 h-20 ${color} opacity-5 rounded-full transition-transform group-hover:scale-150 duration-500`}></div>
    <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-current/20`}>
      <i className={`fa-solid ${icon} text-xl`}></i>
    </div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <p className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{value}</p>
  </div>
);

const NavBtn: React.FC<{ active: boolean; onClick: () => void; icon: string; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-6 px-8 py-5 rounded-[1.5rem] font-black transition-all duration-300 relative group ${
      active 
        ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-[0_20px_40px_-10px_rgba(16,185,129,0.3)] scale-[1.02] border border-emerald-400/30' 
        : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/50'
    }`}
  >
    {active && (
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-white rounded-r-full shadow-[0_0_15px_rgba(255,255,255,0.8)]"></div>
    )}
    <i className={`fa-solid ${icon} text-xl transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}></i>
    <span className="tracking-tight">{label}</span>
  </button>
);

export default AdminDashboard;
