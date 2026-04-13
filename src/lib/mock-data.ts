export type UserRole = 'saas_admin' | 'clinic_admin';

export interface Clinic {
  id: string;
  name: string;
  status: 'active' | 'blocked';
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  passwordHash: string; // for mock purposes, just a plain string simulation
  role: UserRole;
  clinicId: string | null; // null if saas_admin
  name: string;
}

export const initialClinics: Clinic[] = [
  {
    id: 'c1',
    name: 'Clinique Fraternité',
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'c2',
    name: 'Clinique Marion',
    status: 'active',
    createdAt: new Date().toISOString(),
  }
];

export const initialUsers: User[] = [
  {
    id: 'u1',
    email: 'admin@saas.com',
    passwordHash: 'password', 
    role: 'saas_admin',
    clinicId: null,
    name: 'Super Admin',
  },
  {
    id: 'u2',
    email: 'admin@fraternite.com',
    passwordHash: 'password',
    role: 'clinic_admin',
    clinicId: 'c1',
    name: 'Admin Fraternité',
  },
  {
    id: 'u3',
    email: 'admin@marion.com',
    passwordHash: 'password',
    role: 'clinic_admin',
    clinicId: 'c2',
    name: 'Admin Marion',
  }
];

// Helper to initialize local storage if empty
export const initializeStorage = () => {
  if (!localStorage.getItem('kiam_clinics')) {
    localStorage.setItem('kiam_clinics', JSON.stringify(initialClinics));
  }
  if (!localStorage.getItem('kiam_users')) {
    localStorage.setItem('kiam_users', JSON.stringify(initialUsers));
  }
};
