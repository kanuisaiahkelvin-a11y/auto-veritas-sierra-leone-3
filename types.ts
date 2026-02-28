
export enum UserRole {
  CITIZEN = 'CITIZEN',
  ADMIN = 'ADMIN',
  LAW_ENFORCER = 'LAW_ENFORCER',
  LICENSE_DEPT = 'LICENSE_DEPT',
  INSURANCE_DEPT = 'INSURANCE_DEPT',
  FINANCE_DEPT = 'FINANCE_DEPT'
}

export interface NotificationPreferences {
  emailLicense: boolean;
  emailInsurance: boolean;
  emailFinance: boolean;
  emailSystem: boolean;
}

export enum InspectionStatus {
  SCHEDULED = 'SCHEDULED',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export interface Inspection {
  id: string;
  vehicleVin: string;
  plateNumber: string;
  ownerName: string;
  scheduledDate: string;
  conductedDate?: string;
  inspectorName?: string;
  inspectorId?: string;
  status: InspectionStatus;
  notes?: string;
  checkpoints?: {
    brakes: boolean;
    lights: boolean;
    tires: boolean;
    engine: boolean;
    emissions: boolean;
  };
}

export interface User {
  id: string;
  fullName: string;
  email?: string;
  phone: string;
  address: string;
  role: UserRole;
  badgeNumber?: string;
  unitNumber?: string;
  lastLogin?: string;
  profileImage?: string;
  isActive?: boolean;
  password?: string;
  notificationPreferences?: NotificationPreferences;
}

export interface Vehicle {
  vin: string;
  plateNumber: string;
  ownerName: string;
  make: string;
  model: string;
  year: number;
  licenseExpiry: string;
  insuranceExpiry: string;
  insuranceProvider: string;
  status: 'Active' | 'Expired' | 'Flagged' | 'Pending';
  violationHistory: string[];
  location?: { lat: number; lng: number };
  documents?: string[];
}

export interface Transaction {
  id: string;
  citizenId: string;
  amount: number;
  type: 'License' | 'Insurance' | 'Registration';
  status: 'Completed' | 'Pending' | 'Failed';
  method: 'Afri-money' | 'Orange-Money';
  date: string;
}

export interface VerificationLog {
  id: string;
  enforcerId: string;
  vin: string;
  timestamp: string;
  status: string;
  location: string;
}

export interface Ticket {
  id: string;
  vehicleVin: string;
  plateNumber: string;
  violationType: string;
  fineAmount: number;
  issuingOfficer: string;
  officerBadge: string;
  date: string;
  location: { lat: number; lng: number };
}

export interface AuditLog {
  id: string;
  action: string;
  adminId: string;
  adminName: string;
  timestamp: string;
  affectedId: string;
  affectedName: string;
  details?: string;
  ipAddress?: string;
  deviceInfo?: string;
  department?: string;
  oldValue?: string;
  newValue?: string;
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED'
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignedTo?: string;
  createdBy: string;
  createdAt: string;
  dueDate?: string;
  progress?: number;
}

export interface AppNotification {
  id: string;
  recipientId: string; // User ID or UserRole
  senderId: string;
  senderName: string;
  title: string;
  message: string;
  type: 'License_Application' | 'License_Response' | 'System';
  status: 'Unread' | 'Read';
  date: string;
  metadata?: {
    testPassed?: boolean;
    reviewDate?: string;
    vehicleVin?: string;
  };
}
