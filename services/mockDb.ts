
import { User, Vehicle, UserRole, Transaction, VerificationLog, NotificationPreferences, AuditLog, Ticket, Inspection, InspectionStatus, Task, TaskPriority, TaskStatus, AppNotification } from '../types';

export interface LoginRecord {
  id: string;
  userName: string;
  role: UserRole;
  timestamp: string;
  deviceInfo: string;
}

const defaultPrefs: NotificationPreferences = {
  emailLicense: true,
  emailInsurance: true,
  emailFinance: false,
  emailSystem: true
};

class MockDatabase {
  private users: User[] = [
    { 
      id: 'ADMIN-001', 
      fullName: 'Mr. Kelvin Isaiah Kanu', 
      email: 'adminsl@gmail.com', 
      phone: '23277000000', 
      address: 'SLRSA Headquarters, Freetown', 
      role: UserRole.ADMIN,
      isActive: true,
      password: 'Inhuman12',
      lastLogin: '2026-02-25 09:15',
      profileImage: 'https://picsum.photos/seed/admin/200',
      notificationPreferences: { ...defaultPrefs, emailFinance: true }
    },
    {
      id: 'LICENSE-001',
      fullName: 'License Department Official',
      email: 'slrsa@gmail.com',
      phone: '23277111222',
      address: 'SLRSA License Dept, Freetown',
      role: UserRole.LICENSE_DEPT,
      isActive: true,
      password: 'SLRSA001',
      badgeNumber: 'REG-KB-2026',
      lastLogin: '2026-02-24 14:30',
      profileImage: 'https://picsum.photos/seed/license/200',
      notificationPreferences: { ...defaultPrefs }
    },
    {
      id: 'INSURANCE-001',
      fullName: 'Insurance Department Official',
      email: 'slrsa@gmail.com',
      phone: '23277888999',
      address: 'SLRSA Insurance Dept, Freetown',
      role: UserRole.INSURANCE_DEPT,
      isActive: true,
      password: 'SLRSA002',
      lastLogin: '2026-02-23 11:00',
      profileImage: 'https://picsum.photos/seed/insurance/200',
      notificationPreferences: { ...defaultPrefs }
    },
    {
      id: 'FINANCE-001',
      fullName: 'Finance Department Official',
      email: 'slrsa@gmail.com',
      phone: '23277333444',
      address: 'SLRSA Finance Dept, Freetown',
      role: UserRole.FINANCE_DEPT,
      isActive: true,
      password: 'SLRSA003',
      lastLogin: '2026-02-22 16:45',
      profileImage: 'https://picsum.photos/seed/finance/200',
      notificationPreferences: { ...defaultPrefs, emailFinance: true }
    },
    {
      id: 'ENFORCER-001',
      fullName: 'Officer Mohamed Bangura',
      email: 'bangura.m@slp.gov.sl',
      phone: '23277999888',
      address: 'Central Police Station, Freetown',
      role: UserRole.LAW_ENFORCER,
      isActive: true,
      password: 'SLP115',
      badgeNumber: 'SLP-9921',
      unitNumber: 'UNIT-26',
      lastLogin: '2026-02-25 08:00',
      profileImage: 'https://picsum.photos/seed/enforcer/200',
      notificationPreferences: { ...defaultPrefs }
    }
  ];

  private vehicles: Vehicle[] = [
    {
      vin: 'V123456789',
      plateNumber: 'ABC 123',
      ownerName: 'Mr. Kelvin Isaiah Kanu',
      make: 'Toyota',
      model: 'Land Cruiser',
      year: 2025,
      licenseExpiry: '2024-12-31', 
      insuranceExpiry: '2026-12-31',
      insuranceProvider: 'Ritcorp',
      status: 'Expired',
      violationHistory: ['Over-speeding (Kissi Rd)', 'Illegal Parking (Lumley)'],
      location: { lat: 8.484, lng: -13.234 }
    },
    {
      vin: 'V987654321',
      plateNumber: 'SL 442',
      ownerName: 'John Doe',
      make: 'Honda',
      model: 'Civic',
      year: 2022,
      licenseExpiry: '2027-01-01',
      insuranceExpiry: '2027-01-01',
      insuranceProvider: 'Aureol',
      status: 'Active',
      violationHistory: [],
      location: { lat: 8.465, lng: -13.250 }
    },
    {
      vin: 'V555666777',
      plateNumber: 'PZ 990',
      ownerName: 'Sarah Smith',
      make: 'Nissan',
      model: 'Patrol',
      year: 2023,
      licenseExpiry: '2025-05-20',
      insuranceExpiry: '2025-05-20',
      insuranceProvider: 'Ritcorp',
      status: 'Flagged',
      violationHistory: ['Reckless Driving'],
      location: { lat: 8.490, lng: -13.220 }
    }
  ];

  private transactions: Transaction[] = [
    {
      id: 'TX-882190',
      citizenId: 'ADMIN-001',
      amount: 1200,
      type: 'Registration',
      status: 'Completed',
      method: 'Afri-money',
      date: '2025-10-15'
    },
    {
      id: 'TX-882191',
      citizenId: 'CITIZEN-001',
      amount: 450,
      type: 'License',
      status: 'Pending',
      method: 'Orange-Money',
      date: '2026-02-20'
    },
    {
      id: 'TX-882192',
      citizenId: 'CITIZEN-002',
      amount: 800,
      type: 'Insurance',
      status: 'Failed',
      method: 'Afri-money',
      date: '2026-02-22'
    },
    {
      id: 'TX-882193',
      citizenId: 'CITIZEN-003',
      amount: 1200,
      type: 'Registration',
      status: 'Completed',
      method: 'Orange-Money',
      date: '2026-02-23'
    }
  ];
  private logs: VerificationLog[] = [
    { id: 'LOG-001', enforcerId: 'SLP112', vin: 'V123456789', timestamp: '2026-02-20T10:00:00Z', status: 'Verified', location: 'Freetown' },
    { id: 'LOG-002', enforcerId: 'SLP112', vin: 'V987654321', timestamp: '2026-02-20T11:30:00Z', status: 'Flagged', location: 'Freetown' },
    { id: 'LOG-003', enforcerId: 'SLP113', vin: 'V123456789', timestamp: '2026-02-21T09:15:00Z', status: 'Verified', location: 'Bo' },
    { id: 'LOG-004', enforcerId: 'SLP114', vin: 'V987654321', timestamp: '2026-02-21T14:45:00Z', status: 'Verified', location: 'Kenema' },
    { id: 'LOG-005', enforcerId: 'SLP112', vin: 'V123456789', timestamp: '2026-02-22T08:00:00Z', status: 'Verified', location: 'Freetown' },
    { id: 'LOG-006', enforcerId: 'SLP113', vin: 'V987654321', timestamp: '2026-02-22T16:20:00Z', status: 'Flagged', location: 'Makeni' },
    { id: 'LOG-007', enforcerId: 'SLP115', vin: 'V123456789', timestamp: '2026-02-23T10:10:00Z', status: 'Verified', location: 'Freetown' },
    { id: 'LOG-008', enforcerId: 'SLP112', vin: 'V987654321', timestamp: '2026-02-23T12:00:00Z', status: 'Verified', location: 'Freetown' },
    { id: 'LOG-009', enforcerId: 'SLP114', vin: 'V123456789', timestamp: '2026-02-24T11:00:00Z', status: 'Verified', location: 'Kono' },
    { id: 'LOG-010', enforcerId: 'SLP113', vin: 'V987654321', timestamp: '2026-02-24T15:30:00Z', status: 'Verified', location: 'Freetown' },
    { id: 'LOG-011', enforcerId: 'SLP112', vin: 'V123456789', timestamp: '2026-02-25T09:00:00Z', status: 'Verified', location: 'Freetown' },
  ];
  private loginHistory: LoginRecord[] = [];
  private auditLogs: AuditLog[] = [];
  private inspections: Inspection[] = [
    {
      id: 'INSP-001',
      vehicleVin: 'V123456789',
      plateNumber: 'ABC 123',
      ownerName: 'Mr. Kelvin Isaiah Kanu',
      scheduledDate: '2026-03-01',
      status: InspectionStatus.SCHEDULED
    }
  ];
  private tickets: Ticket[] = [
    {
      id: 'TKT-4491',
      vehicleVin: 'V123456789',
      plateNumber: 'ABC 123',
      violationType: 'Expired License & Insurance',
      fineAmount: 1200,
      issuingOfficer: 'Officer Mohamed Bangura',
      officerBadge: 'SLP-9921',
      date: '2026-02-20 14:30',
      location: { lat: 8.484, lng: -13.234 }
    },
    {
      id: 'TKT-5502',
      vehicleVin: 'V987654321',
      plateNumber: 'SL 442',
      violationType: 'Illegal Parking',
      fineAmount: 200,
      issuingOfficer: 'Officer Sarah Conteh',
      officerBadge: 'SLP-1102',
      date: '2026-02-22 09:15',
      location: { lat: 8.465, lng: -13.250 }
    }
  ];
  private tasks: Task[] = [
    {
      id: 'TASK-001',
      title: 'Review Pending Registrations',
      description: 'Audit the queue of 15 new vehicle registrations from the Western Area.',
      priority: TaskPriority.HIGH,
      status: TaskStatus.PENDING,
      progress: 0,
      createdBy: 'ADMIN-001',
      createdAt: '2026-02-25 10:00',
      dueDate: '2026-02-28'
    },
    {
      id: 'TASK-002',
      title: 'Update Vehicle Database',
      description: 'Sync the master registry with the latest insurance provider updates.',
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.IN_PROGRESS,
      progress: 45,
      createdBy: 'ADMIN-001',
      createdAt: '2026-02-24 15:30',
      dueDate: '2026-03-05'
    },
    {
      id: 'TASK-003',
      title: 'System Security Audit',
      description: 'Perform a full audit of administrative access logs for the last quarter.',
      priority: TaskPriority.CRITICAL,
      status: TaskStatus.PENDING,
      progress: 0,
      createdBy: 'ADMIN-001',
      createdAt: '2026-02-26 08:00',
      dueDate: '2026-02-27'
    }
  ];
  private notifications: AppNotification[] = [];

  getUsers() { return this.users; }
  
  addUser(user: User) { 
    this.users.push({ 
      ...user, 
      isActive: user.isActive ?? true,
      notificationPreferences: user.notificationPreferences ?? { ...defaultPrefs }
    }); 
  }

  updateUserPreferences(id: string, prefs: NotificationPreferences) {
    const user = this.users.find(u => u.id === id);
    if (user) {
      user.notificationPreferences = prefs;
    }
  }

  toggleUserStatus(id: string, admin?: User) {
    const user = this.users.find(u => u.id === id);
    if (user && user.role !== UserRole.ADMIN) {
      const oldStatus = user.isActive;
      user.isActive = !user.isActive;
      if (admin) {
        this.addAuditLog({
          action: user.isActive ? 'ACCOUNT_ACTIVATED' : 'ACCOUNT_DEACTIVATED',
          adminId: admin.id,
          adminName: admin.fullName,
          affectedId: user.id,
          affectedName: user.fullName,
          details: `Status changed to ${user.isActive ? 'Active' : 'Inactive'}`,
          oldValue: oldStatus ? 'Active' : 'Inactive',
          newValue: user.isActive ? 'Active' : 'Inactive',
          department: admin.role
        });
      }
    }
  }

  deleteUser(id: string, admin?: User) {
    const user = this.users.find(u => u.id === id);
    if (user && user.role !== UserRole.ADMIN) {
      this.users = this.users.filter(u => u.id !== id);
      if (admin) {
        this.addAuditLog({
          action: 'ACCOUNT_DELETED',
          adminId: admin.id,
          adminName: admin.fullName,
          affectedId: user.id,
          affectedName: user.fullName,
          details: 'Account permanently removed from system',
          department: admin.role,
          oldValue: 'Active',
          newValue: 'Deleted'
        });
      }
    }
  }

  updateUser(id: string, data: Partial<User>, admin?: User) {
    const idx = this.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      const oldUser = { ...this.users[idx] };
      this.users[idx] = { ...this.users[idx], ...data };
      if (admin) {
        this.addAuditLog({
          action: 'ACCOUNT_UPDATED',
          adminId: admin.id,
          adminName: admin.fullName,
          affectedId: id,
          affectedName: this.users[idx].fullName,
          details: `Account details updated: ${Object.keys(data).join(', ')}`,
          department: admin.role,
          oldValue: JSON.stringify(oldUser),
          newValue: JSON.stringify(this.users[idx])
        });
      }
    }
  }
  
  getVehicles() { return this.vehicles; }
  updateVehicle(vin: string, data: Partial<Vehicle>) {
    const idx = this.vehicles.findIndex(v => v.vin === vin);
    if (idx !== -1) this.vehicles[idx] = { ...this.vehicles[idx], ...data };
  }
  addVehicle(v: Vehicle) { this.vehicles.push(v); }
  deleteVehicle(vin: string) { this.vehicles = this.vehicles.filter(v => v.vin !== vin); }

  getTransactions() { return this.transactions; }
  addTransaction(t: Transaction) { this.transactions.push(t); }

  getLogs() { return this.logs; }
  addLog(l: VerificationLog) { this.logs.push(l); }

  getLoginHistory() { return this.loginHistory; }
  
  recordLogin(user: User) {
    const record: LoginRecord = {
      id: `LOGIN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      userName: user.fullName,
      role: user.role,
      timestamp: new Date().toLocaleString(),
      deviceInfo: navigator.userAgent.split(')')[0] + ')'
    };
    this.loginHistory.unshift(record);
    if (this.loginHistory.length > 50) this.loginHistory.pop();
  }

  getWorkerLogs() { 
    return this.loginHistory.filter(l => l.role !== UserRole.CITIZEN);
  }

  getAuditLogs() { return this.auditLogs; }

  getNotifications(userId: string, role?: UserRole) {
    return this.notifications.filter(n => n.recipientId === userId || n.recipientId === role);
  }

  addNotification(n: Omit<AppNotification, 'id' | 'date' | 'status'>) {
    const newNotification: AppNotification = {
      ...n,
      id: `NOTIF-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      date: new Date().toLocaleString(),
      status: 'Unread'
    };
    this.notifications.unshift(newNotification);
    return newNotification;
  }

  markNotificationRead(id: string) {
    const n = this.notifications.find(notif => notif.id === id);
    if (n) n.status = 'Read';
  }

  getInspections() { return this.inspections; }
  addInspection(i: Inspection) { this.inspections.push(i); }
  updateInspection(id: string, data: Partial<Inspection>) {
    const idx = this.inspections.findIndex(i => i.id === id);
    if (idx !== -1) this.inspections[idx] = { ...this.inspections[idx], ...data };
  }

  getTickets() { return this.tickets; }
  addTicket(t: Ticket) { this.tickets.push(t); }

  getTasks() { return this.tasks; }
  addTask(t: Task) { this.tasks.unshift(t); }
  updateTask(id: string, data: Partial<Task>) {
    const idx = this.tasks.findIndex(t => t.id === id);
    if (idx !== -1) this.tasks[idx] = { ...this.tasks[idx], ...data };
  }
  deleteTask(id: string) {
    this.tasks = this.tasks.filter(t => t.id !== id);
  }

  addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>) {
    const newLog: AuditLog = {
      deviceInfo: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server',
      ipAddress: '192.168.1.' + Math.floor(Math.random() * 255), // Mocked IP
      ...log,
      id: `AUDIT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      timestamp: new Date().toLocaleString()
    };
    this.auditLogs.unshift(newLog);
  }
}

export const db = new MockDatabase();