export type UserRole = 
  | 'saas_admin' 
  | 'clinic_admin' 
  | 'doctor' 
  | 'nurse' 
  | 'lab_tech' 
  | 'pharmacist' 
  | 'receptionist' 
  | 'medical_secretary' 
  | 'hr' 
  | 'inventory_manager' 
  | 'nurse_aide' 
  | 'agent';

export interface Clinic {
  id: string;
  name: string;
  status: 'active' | 'blocked';
  createdAt: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  taxId?: string;
}

export interface Branch {
  id: string;
  clinicId: string;
  name: string;
  type: 'headquarters' | 'branch' | 'department';
  address: string;
  phone: string;
  manager: string;
  status: 'open' | 'closed';
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  clinicId: string | null;
  name: string;
  specialty?: string;
  phone?: string;
}

export interface Patient {
  id: string;
  clinicId: string;
  name: string;
  firstName?: string;
  age: number;
  dob?: string;
  gender: 'M' | 'F';
  phone: string;
  address: string;
  city?: string;
  idNumber?: string; // CNI/Passport
  bloodGroup?: string;
  assurance?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  allergies?: string;
  history?: string;
  lastVisit: string;
  status: string;
  createdAt: string;
}

export interface Consultation {
  id: string;
  clinicId: string;
  patientId: string;
  date: string;
  doctorId: string;
  reason: string;
  symptoms?: string;
  vitals?: {
    temp?: string;
    bp?: string; // Blood Pressure
    weight?: string;
    hr?: string; // Heart Rate
  };
  diagnosis: string;
  prescription: string;
  notes?: string;
  status: 'pending' | 'completed';
}

export interface Medication {
  id: string;
  clinicId: string;
  name: string;
  category: string;
  stock: number;
  unit: string;
  threshold: number;
  price: string;
}

export interface Invoice {
  id: string;
  clinicId: string;
  patientId: string;
  date: string;
  items: { description: string, amount: number }[];
  total: number;
  status: 'paid' | 'pending' | 'cancelled';
  paymentMethod?: 'cash' | 'card' | 'transfer';
}

export interface Transaction {
  id: string;
  clinicId: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: string;
  description: string;
  paymentMethod: string;
}

export interface Appointment {
  id: string;
  clinicId: string;
  patientId: string;
  doctorId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  patient: string; // Name (denormalized)
  doctor: string; // Name (denormalized)
  type: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'attended';
}

export interface LabTest {
  id: string;
  clinicId: string;
  patientId: string;
  doctorId: string;
  testName: string;
  category: string;
  result?: string;
  unit?: string;
  normativeValue?: string;
  status: 'pending' | 'completed';
  date: string;
}

export interface Bed {
  id: string;
  clinicId: string;
  ward: string; // Service
  room: string;
  bedNum: string;
  status: 'available' | 'occupied' | 'maintenance';
}

export interface Admission {
  id: string;
  clinicId: string;
  patientId: string;
  bedId: string;
  dateIn: string;
  dateOut: string | null;
  reason: string;
  status: 'active' | 'discharged';
}

export interface Employee {
  id: string;
  clinicId: string;
  name: string;
  firstName?: string;
  department: string;
  position: string;
  baseSalary: number;
  hireDate: string;
  status: 'active' | 'on_leave' | 'terminated';
  cnssNumber?: string;
  bankAccount?: string;
}

export interface Payroll {
  id: string;
  clinicId: string;
  employeeId: string;
  month: string;
  baseSalary: number;
  bonuses: { name: string; amount: number }[];
  deductions: { name: string; amount: number }[];
  netSalary: number;
  status: 'draft' | 'paid';
  paymentDate?: string;
}

export interface MedicalAct {
  id: string;
  clinicId: string;
  name: string;
  category: string;
  price: number;
}

export interface LabService {
  id: string;
  clinic_id?: string;
  clinicId?: string;
  testName: string;
  category: string;
  price: number;
  unit?: string;
  normativeValue?: string;
}

export type ShiftQuart = 'morning' | 'afternoon' | 'night';

export interface GuardShift {
  id: string;
  clinicId: string;
  userId: string;
  date: string; // YYYY-MM-DD
  quart: ShiftQuart;
  serviceId?: string;
}



