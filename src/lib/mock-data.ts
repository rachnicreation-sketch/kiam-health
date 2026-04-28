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
  sector?: 'health' | 'hotel' | 'school' | 'erp' | 'shop';
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
  hairColor?: string;
  isHospitalized?: boolean;
  hospitalService?: string;
  hospitalRoom?: string;
  hospitalBed?: string;
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




export const DUMMY_STATS = {
  totalPatients: 1240,
  consultationsToday: 18,
  hospitalizedCount: 12,
  revenueToday: 450000,
  recentPatients: [
    { id: 'P-101', name: 'Jean Dupont', gender: 'M', bloodGroup: 'O+', city: 'Brazzaville' },
    { id: 'P-102', name: 'Marie Loumou', gender: 'F', bloodGroup: 'A-', city: 'Pointe-Noire' },
    { id: 'P-103', name: 'Koffi Anan', gender: 'M', bloodGroup: 'B+', city: 'Dolisie' },
    { id: 'P-104', name: 'Alice Mbemba', gender: 'F', bloodGroup: 'AB+', city: 'Brazzaville' },
  ],
  upcomingAppointments: [
    { id: 'A-1', patient: 'Jean Dupont', time: '09:00', doctor: 'Dr. Martin' },
    { id: 'A-2', patient: 'Marie Loumou', time: '10:30', doctor: 'Dr. Sarah' },
    { id: 'A-3', patient: 'Koffi Anan', time: '14:15', doctor: 'Dr. Martin' },
  ],
  dailyGuards: [
    { id: 'G-1', doctor_name: 'Dr. Martin', shift_type: 'Matin' },
    { id: 'G-2', doctor_name: 'Dr. Sarah', shift_type: 'Après-midi' },
  ],
  vitalsAlerts: [
    { id: 'V-1', patient_name: 'Koffi Anan', temp: '39.2' }
  ]
};

export const DUMMY_HOTEL_STATS = {
  total_rooms: 45,
  occupied: 32,
  available: 10,
  cleaning: 3,
  recent_bookings: [
    { id: 'B-101', guest: 'M. Ibrahim', room: '102', status: 'checked_in' },
    { id: 'B-102', guest: 'Mme. Sissoko', room: '205', status: 'checked_in' },
    { id: 'B-103', guest: 'Dr. Kouame', room: '304', status: 'confirmed' },
  ]
};

export const DUMMY_HOTEL_ROOMS = [
  { id: 'R-101', room_number: '101', type: 'Standard', price: 45000, status: 'available' },
  { id: 'R-102', room_number: '102', type: 'Double', price: 65000, status: 'occupied' },
  { id: 'R-103', room_number: '201', type: 'Suite', price: 120000, status: 'cleaning' },
  { id: 'R-104', room_number: '202', type: 'Double', price: 65000, status: 'available' },
  { id: 'R-105', room_number: '301', type: 'Presidentielle', price: 250000, status: 'occupied' },
];

export const DUMMY_SCHOOL_STATS = {
  total_students: 850,
  teachers_count: 42,
  avg_performance: 14.5,
  pending_payments: 1250000,
  recent_enrollments: [
    { id: 'S-101', name: 'Mabiala Jean', class: '3ème', status: 'enrolled' },
    { id: 'S-102', name: 'Okombi Sarah', class: '6ème', status: 'pending' },
  ]
};
