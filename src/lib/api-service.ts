/**
 * Service API pour communiquer avec le backend PHP sur WampServer
 */

const API_BASE_URL = "/kiam-health/api";

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}/${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Erreur inconnue" }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export const api = {
  auth: {
    login: (credentials: any) => apiRequest("auth.php?action=login", {
      method: "POST",
      body: JSON.stringify(credentials)
    }),
  },
  clinics: {
    list: () => apiRequest("clinics.php?action=list"),
    get: (id: string) => apiRequest(`clinics.php?action=get&id=${id}`),
    create: (data: any) => apiRequest("clinics.php", {
      method: "POST",
      body: JSON.stringify(data)
    }),
    update: (data: any) => apiRequest("clinics.php", {
      method: "PUT",
      body: JSON.stringify(data)
    }),
  },
  users: {
    list: (clinicId: string) => apiRequest(`users.php?action=list&clinicId=${clinicId}`),
    create: (data: any) => apiRequest("users.php", {
      method: "POST",
      body: JSON.stringify(data)
    }),
  },
  patients: {
    list: (clinicId: string) => apiRequest(`patients.php?action=list&clinicId=${clinicId}`),
    get: (id: string) => apiRequest(`patients.php?action=get&id=${id}`),
    create: (data: any) => apiRequest("patients.php", {
      method: "POST",
      body: JSON.stringify(data)
    }),
  },
  consultations: {
    list: (clinicId: string, patientId?: string) => 
      apiRequest(`consultations.php?action=list&clinicId=${clinicId}${patientId ? `&patientId=${patientId}` : ''}`),
    create: (data: any) => apiRequest("consultations.php", {
      method: "POST",
      body: JSON.stringify(data)
    }),
  },
  invoices: {
    list: (clinicId: string) => apiRequest(`invoices.php?action=list&clinicId=${clinicId}`),
    create: (data: any) => apiRequest("invoices.php", {
      method: "POST",
      body: JSON.stringify(data)
    }),
  },
  acts: {
    list: (clinicId: string) => apiRequest(`medical_acts.php?action=list&clinicId=${clinicId}`),
  },
  transactions: {
    list: (clinicId: string) => apiRequest(`transactions.php?action=list&clinicId=${clinicId}`),
    create: (data: any) => apiRequest("transactions.php", {
      method: "POST",
      body: JSON.stringify(data)
    }),
  },
  lab: {
    services: (clinicId: string) => apiRequest(`lab_services.php?action=list&clinicId=${clinicId}`),
    tests: (clinicId: string) => apiRequest(`lab_tests.php?action=list&clinicId=${clinicId}`),
    createTest: (data: any) => apiRequest("lab_tests.php", {
      method: "POST",
      body: JSON.stringify(data)
    }),
    updateTest: (data: any) => apiRequest("lab_tests.php", {
      method: "PUT",
      body: JSON.stringify(data)
    }),
  },
  branches: {
    list: (clinicId: string) => apiRequest(`branches.php?action=list&clinicId=${clinicId}`),
    create: (data: any) => apiRequest("branches.php", {
      method: "POST",
      body: JSON.stringify(data)
    }),
    update: (data: any) => apiRequest("branches.php", {
      method: "PUT",
      body: JSON.stringify(data)
    }),
    delete: (id: string) => apiRequest(`branches.php?action=delete&id=${id}`, {
      method: "DELETE"
    }),
  },
  appointments: {
    list: (clinicId: string) => apiRequest(`appointments.php?action=list&clinicId=${clinicId}`),
    create: (data: any) => apiRequest("appointments.php", {
      method: "POST",
      body: JSON.stringify(data)
    }),
    updateStatus: (id: string, status: string) => apiRequest("appointments.php", {
      method: "PUT",
      body: JSON.stringify({ id, status })
    }),
  },
  pharmacy: {
    medications: (clinicId: string) => apiRequest(`medications.php?action=list&clinicId=${clinicId}`),
    createMedication: (data: any) => apiRequest("medications.php", {
      method: "POST",
      body: JSON.stringify(data)
    }),
    updateMedication: (data: any) => apiRequest("medications.php", {
      method: "PUT",
      body: JSON.stringify(data)
    }),
    sales: (clinicId: string) => apiRequest(`pharmacy_sales.php?action=list&clinicId=${clinicId}`),
    createSale: (data: any) => apiRequest("pharmacy_sales.php", {
      method: "POST",
      body: JSON.stringify(data)
    }),
  },
  hr: {
    employees: (clinicId: string) => apiRequest(`employees.php?action=list&clinicId=${clinicId}`),
    createEmployee: (data: any) => apiRequest("employees.php", {
      method: "POST",
      body: JSON.stringify(data)
    }),
    payrolls: (clinicId: string) => apiRequest(`payrolls.php?action=list&clinicId=${clinicId}`),
    createPayroll: (data: any) => apiRequest("payrolls.php", {
      method: "POST",
      body: JSON.stringify(data)
    }),
  },
  hospitalization: {
    beds: (clinicId: string) => apiRequest(`beds.php?action=list&clinicId=${clinicId}`),
    createBed: (data: any) => apiRequest("beds.php", {
      method: "POST",
      body: JSON.stringify(data)
    }),
    admissions: (clinicId: string) => apiRequest(`admissions.php?action=list&clinicId=${clinicId}`),
    createAdmission: (data: any) => apiRequest("admissions.php", {
      method: "POST",
      body: JSON.stringify(data)
    }),
    discharge: (data: any) => apiRequest("admissions.php", {
      method: "PUT",
      body: JSON.stringify(data)
    }),
    transfers: (clinicId: string) => apiRequest(`admissions.php?action=transfers&clinicId=${clinicId}`),
    transfer: (data: any) => apiRequest("admissions.php?action=transfer", {
      method: "POST",
      body: JSON.stringify(data)
    }),
  },
  guards: {
    list: (clinicId: string) => apiRequest(`guards.php?action=list&clinicId=${clinicId}`),
    create: (data: any) => apiRequest("guards.php", {
      method: "POST",
      body: JSON.stringify(data)
    }),
    delete: (id: string) => apiRequest(`guards.php?id=${id}`, {
      method: "DELETE"
    }),
  },
  catalogs: {
    listActs: (clinicId: string) => apiRequest(`catalogs.php?action=list_acts&clinicId=${clinicId}`),
    listLab: (clinicId: string) => apiRequest(`catalogs.php?action=list_lab&clinicId=${clinicId}`),
    saveAct: (data: any) => apiRequest("catalogs.php?action=save_act", {
      method: "POST",
      body: JSON.stringify(data)
    }),
    saveLab: (data: any) => apiRequest("catalogs.php?action=save_lab", {
      method: "POST",
      body: JSON.stringify(data)
    }),
    delete: (id: string, type: 'act' | 'lab') => apiRequest(`catalogs.php?id=${id}&type=${type}`, {
      method: "DELETE"
    }),
  },
  stats: {
    get: (clinicId: string) => apiRequest(`stats.php?clinicId=${clinicId}`),
  },
  notifications: {
    list: (clinicId: string) => apiRequest(`notifications.php?clinicId=${clinicId}`),
    create: (data: any) => apiRequest("notifications.php", {
      method: "POST",
      body: JSON.stringify(data)
    })
  },
  search: {
    query: (clinicId: string, query: string) => apiRequest(`search.php?clinicId=${clinicId}&query=${query}`),
  },
};
