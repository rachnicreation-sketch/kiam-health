export type UserRole = 'saas_admin' | 'clinic_admin' | 'doctor' | 'pharmacist' | 'receptionist';

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

export type ShiftQuart = 'morning' | 'afternoon' | 'night';

export interface GuardShift {
  id: string;
  clinicId: string;
  userId: string;
  date: string; // YYYY-MM-DD
  quart: ShiftQuart;
  serviceId?: string;
}

// Initial Data Seeds
const initialClinics: Clinic[] = [
  { 
    id: 'c1', 
    name: 'Clinique Fraternité', 
    status: 'active', 
    createdAt: new Date().toISOString(),
    logo: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=128&h=128&fit=crop",
    address: "Avenue de l'Indépendance, Brazzaville",
    phone: "+242 06 123 4567",
    email: "contact@fraternite.cg",
    website: "www.fraternite.cg",
    taxId: "RCCM CG-BZV-01-2024-B12-001"
  },
  { 
    id: 'c2', 
    name: 'Clinique Marion', 
    status: 'active', 
    createdAt: new Date().toISOString(),
    logo: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=128&h=128&fit=crop",
    address: "Quartier Mpila, Brazzaville",
    phone: "+242 05 987 6543",
    email: "info@cliniquemarion.cg",
    website: "www.marion.cg",
    taxId: "RCCM CG-BZV-01-2023-B11-005"
  }
];

const initialUsers: User[] = [
  { id: 'u1', email: 'admin@saas.com', passwordHash: 'password', role: 'saas_admin', clinicId: null, name: 'Super Admin' },
  { id: 'u2', email: 'admin@fraternite.com', passwordHash: 'password', role: 'clinic_admin', clinicId: 'c1', name: 'Admin Fraternité' },
  { id: 'u3', email: 'admin@marion.com', passwordHash: 'password', role: 'clinic_admin', clinicId: 'c2', name: 'Admin Marion' }
];

const initialPatients: Patient[] = [
  { 
    id: 'PT-2026-0001', 
    clinicId: 'c1', 
    name: 'NGOMA', 
    firstName: 'Marie', 
    age: 34, 
    dob: '1992-05-12', 
    gender: 'F', 
    phone: '+242 05 123 45 67', 
    address: 'Place de la République', 
    city: 'Pointe-Noire', 
    bloodGroup: 'O+', 
    lastVisit: '2026-04-12', 
    status: 'Actif',
    createdAt: new Date().toISOString()
  }
];

export const resetSystemData = () => {
  localStorage.removeItem('kiam_clinics');
  localStorage.removeItem('kiam_users');
  localStorage.removeItem('kiam_patients');
  localStorage.removeItem('kiam_medications');
  localStorage.removeItem('kiam_appointments');
  localStorage.removeItem('kiam_guards');
  localStorage.removeItem('kiam_consultations');
  localStorage.removeItem('kiam_invoices');
  localStorage.removeItem('kiam_transactions');
  localStorage.removeItem('kiam_lab_tests');
  localStorage.removeItem('kiam_beds');
  localStorage.removeItem('kiam_admissions');
  window.location.reload();
};

export const initializeStorage = () => {
  if (!localStorage.getItem('kiam_clinics')) localStorage.setItem('kiam_clinics', JSON.stringify(initialClinics));
  if (!localStorage.getItem('kiam_users')) localStorage.setItem('kiam_users', JSON.stringify(initialUsers));
  if (!localStorage.getItem('kiam_patients')) localStorage.setItem('kiam_patients', JSON.stringify(initialPatients));
  if (!localStorage.getItem('kiam_medications')) localStorage.setItem('kiam_medications', JSON.stringify([]));
  if (!localStorage.getItem('kiam_appointments')) localStorage.setItem('kiam_appointments', JSON.stringify([]));
  if (!localStorage.getItem('kiam_guards')) localStorage.setItem('kiam_guards', JSON.stringify([]));
  if (!localStorage.getItem('kiam_consultations')) localStorage.setItem('kiam_consultations', JSON.stringify([]));
  if (!localStorage.getItem('kiam_invoices')) localStorage.setItem('kiam_invoices', JSON.stringify([]));
  if (!localStorage.getItem('kiam_transactions')) localStorage.setItem('kiam_transactions', JSON.stringify([]));
  if (!localStorage.getItem('kiam_lab_tests')) localStorage.setItem('kiam_lab_tests', JSON.stringify([]));
  if (!localStorage.getItem('kiam_beds')) localStorage.setItem('kiam_beds', JSON.stringify(initialBeds));
  if (!localStorage.getItem('kiam_admissions')) localStorage.setItem('kiam_admissions', JSON.stringify([]));
};

const initialBeds: Bed[] = [
  { id: 'B1-01', clinicId: 'c1', ward: 'Pédiatrie', room: '101', bedNum: '1', status: 'available' },
  { id: 'B1-02', clinicId: 'c1', ward: 'Pédiatrie', room: '101', bedNum: '2', status: 'available' },
  { id: 'B1-03', clinicId: 'c1', ward: 'Chirurgie', room: '201', bedNum: '1', status: 'available' },
  { id: 'B1-04', clinicId: 'c1', ward: 'Maternité', room: '301', bedNum: '1', status: 'available' },
];



