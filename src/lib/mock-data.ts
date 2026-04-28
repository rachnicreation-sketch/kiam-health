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
  | 'agent'
  | 'school_direction'
  | 'school_admin'
  | 'school_finance'
  | 'school_scolarite'
  | 'school_teacher';

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
  classes_count: 24,
  today_attendance: 94,
  revenue: 4250000,
  avg_performance: 14.5,
  pending_payments: 1250000,
  distribution: [
    { class_level: '6ème', count: 145 },
    { class_level: '5ème', count: 132 },
    { class_level: '4ème', count: 128 },
    { class_level: '3ème', count: 110 },
    { class_level: '2nde', count: 95 },
    { class_level: '1ère', count: 82 },
    { class_level: 'Tle', count: 75 },
  ],
  recent_enrollments: [
    { id: 'S-101', name: 'Mabiala Jean', class: '3ème', date: '2026-04-12', status: 'enrolled' },
    { id: 'S-102', name: 'Okombi Sarah', class: '6ème', date: '2026-04-11', status: 'pending' },
    { id: 'S-103', name: 'Ngouabi Moise', class: '4ème', date: '2026-04-10', status: 'enrolled' },
  ]
};

export const DUMMY_STUDENTS = [
  { id: 'ST-001', name: 'Mabiala', first_name: 'Jean', class_level: '3ème', tutor_name: 'M. Mabiala Pierre', tutor_phone: '06 444 22 11', status: 'active', address: 'Brazzaville, Moungali', cycle: 'Collège', averages: { 'Maths': 14, 'Français': 12, 'Anglais': 15 } },
  { id: 'ST-002', name: 'Okombi', first_name: 'Sarah', class_level: '6ème', tutor_name: 'Mme Okombi Lucie', tutor_phone: '05 555 33 22', status: 'active', address: 'Brazzaville, Poto-Poto', cycle: 'Collège', averages: { 'Maths': 10, 'Français': 16, 'Anglais': 14 } },
  { id: 'ST-003', name: 'Ngouabi', first_name: 'Moise', class_level: '4ème', tutor_name: 'M. Ngouabi Paul', tutor_phone: '06 111 22 33', status: 'active', address: 'Brazzaville, Bacongo', cycle: 'Collège', averages: { 'Maths': 18, 'Français': 15, 'HG': 17 } },
  { id: 'ST-004', name: 'Lekoumou', first_name: 'Alice', class_level: 'Tle', tutor_name: 'Mme Lekoumou Marie', tutor_phone: '05 666 44 55', status: 'active', address: 'Brazzaville, Ouenzé', cycle: 'Lycée', averages: { 'Maths': 16, 'Physique': 17, 'Philo': 11 } },
  { id: 'ST-005', name: 'Tchicaya', first_name: 'Felix', class_level: '2nde', tutor_name: 'M. Tchicaya Jean', tutor_phone: '06 999 88 77', status: 'active', address: 'Pointe-Noire, Centre', cycle: 'Lycée', averages: { 'Maths': 12, 'Français': 13, 'Anglais': 11 } },
];

export const SCHOOL_SUBJECTS = {
  'Collège': ['Mathématiques', 'Français', 'Anglais', 'Physique-Chimie', 'SVT', 'Histoire-Géo', 'EPS', 'Arts'],
  'Lycée': ['Mathématiques', 'Physique-Chimie', 'SVT', 'Philosophie', 'Français', 'Anglais', 'Histoire-Géo', 'EPS'],
  'Primaire': ['Mathématiques', 'Français', 'Éveil', 'Dictée', 'Calcul Mental', 'Sport'],
  'Maternelle': ['Langage', 'Graphisme', 'Mathématiques', 'Activités Physiques', 'Découverte'],
};

export const DUMMY_CLASSES = [
  { id: 'CL-001', name: '6ème A', level: '6ème', room_number: 'B-101', teacher_name: 'M. Kouassi', students_count: 35 },
  { id: 'CL-002', name: '3ème B', level: '3ème', room_number: 'A-202', teacher_name: 'Mme. Zohra', students_count: 28 },
  { id: 'CL-003', name: 'Terminale C', level: 'Lycée', room_number: 'S-001', teacher_name: 'M. Diop', students_count: 22 },
  { id: 'CL-004', name: 'Seconde S', level: 'Lycée', room_number: 'S-003', teacher_name: 'Mme. Sy', students_count: 30 },
];

export const DUMMY_SCHEDULE = [
  { day: "Lundi", start: "08:00", end: "10:00", subject: "Mathématiques", teacher: "M. Kouassi", room: "S-101", class: "6ème A", color: "bg-blue-50 border-blue-100 text-blue-700" },
  { day: "Lundi", start: "10:00", end: "12:00", subject: "Physique", teacher: "Mme. Traoré", room: "Labo 1", class: "6ème A", color: "bg-purple-50 border-purple-100 text-purple-700" },
  { day: "Lundi", start: "14:00", end: "16:00", subject: "Histoire-Géo", teacher: "M. Diop", room: "S-105", class: "6ème A", color: "bg-amber-50 border-amber-100 text-amber-700" },
  { day: "Mardi", start: "08:00", end: "10:00", subject: "Français", teacher: "Mme. Zohra", room: "S-202", class: "6ème A", color: "bg-rose-50 border-rose-100 text-rose-700" },
  { day: "Mardi", start: "10:00", end: "11:00", subject: "Anglais", teacher: "Mr. Smith", room: "S-202", class: "6ème A", color: "bg-indigo-50 border-indigo-100 text-indigo-700" },
  { day: "Mercredi", start: "08:00", end: "12:00", subject: "EPS / Sport", teacher: "M. Diallo", room: "Gymnase", class: "6ème A", color: "bg-emerald-50 border-emerald-100 text-emerald-700" },
  { day: "Jeudi", start: "09:00", end: "11:00", subject: "SVT", teacher: "Mme. Sy", room: "Labo 2", class: "6ème A", color: "bg-teal-50 border-teal-100 text-teal-700" },
  { day: "Vendredi", start: "15:00", end: "17:00", subject: "Informatique", teacher: "M. Bakari", room: "Salle Info", class: "6ème A", color: "bg-slate-50 border-slate-100 text-slate-700" },
];
