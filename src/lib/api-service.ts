/**
 * Service API pour communiquer avec le backend PHP sur WampServer
 */

const API_BASE_URL = "/kiam/api";

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}/${endpoint}`;
  
  const token = localStorage.getItem('kiam_jwt_token');
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
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
    impersonate: (tenantId: string) => apiRequest("auth.php?action=impersonate", {
      method: "POST",
      body: JSON.stringify({ tenantId })
    }),
  },
  tenants: {
    create: (data: { name: string; sector: string; plan_id: string; admin_email?: string; admin_name?: string; admin_password?: string }) =>
      apiRequest("create_tenant.php", {
        method: "POST",
        body: JSON.stringify(data)
      }),
    list: () => apiRequest("saas_admin.php?action=tenants"),
    get: (id: string) => apiRequest(`saas_admin.php?action=tenant_detail&id=${id}`),
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
    }),
    markRead: (clinicId: string, notificationId: string) => apiRequest(`notifications.php?action=mark_read&clinicId=${clinicId}`, {
      method: "POST",
      body: JSON.stringify({ notificationId })
    }),
    markUnread: (clinicId: string, notificationId: string) => apiRequest(`notifications.php?action=mark_unread&clinicId=${clinicId}`, {
      method: "POST",
      body: JSON.stringify({ notificationId })
    }),
    markAllRead: (clinicId: string, notificationIds: string[]) => apiRequest(`notifications.php?action=mark_read&clinicId=${clinicId}`, {
      method: "POST",
      body: JSON.stringify({ notificationIds })
    })
  },
  messages: {
    listUsers: (clinicId: string) => apiRequest(`messages.php?action=list_users&clinicId=${clinicId}`),
    chatHistory: (clinicId: string, user1: string, user2: string) => 
      apiRequest(`messages.php?action=chat&clinicId=${clinicId}&user1=${user1}&user2=${user2}`),
    sendMessage: (clinicId: string, data: any) => apiRequest(`messages.php?clinicId=${clinicId}`, {
      method: "POST",
      body: JSON.stringify(data)
    }),
    unreadCount: (clinicId: string, userId: string) => 
      apiRequest(`messages.php?action=unread_count&clinicId=${clinicId}&userId=${userId}`),
  },
  search: {
    query: (clinicId: string, query: string) => apiRequest(`search.php?clinicId=${clinicId}&query=${query}`),
  },
  saas: {
    stats: () => apiRequest("saas_admin.php?action=stats"),
    tenants: () => apiRequest("saas_admin.php?action=tenants"),
    modules: (tenantId: string) => apiRequest(`saas_admin.php?action=modules&tenant_id=${tenantId}`),
    toggleModule: (data: { tenantId: string, moduleName: string, active: boolean }) => apiRequest("saas_admin.php?action=toggle_module", {
      method: "POST",
      body: JSON.stringify(data)
    }),
    updateTenant: (data: any) => apiRequest("saas_admin.php?action=update_tenant", {
      method: "POST",
      body: JSON.stringify(data)
    }),
    tickets: () => apiRequest("saas_support.php?action=list"),
    createTicket: (data: any) => apiRequest("saas_support.php?action=create_ticket", {
      method: "POST",
      body: JSON.stringify(data)
    }),
    updateTicketStatus: (data: any) => apiRequest("saas_support.php?action=update_status", {
      method: "POST",
      body: JSON.stringify(data)
    }),
    announcements: () => apiRequest("saas_admin.php?action=announcements"),
    createAnnouncement: (data: any) => apiRequest("saas_admin.php?action=create_announcement", {
      method: "POST",
      body: JSON.stringify(data)
    }),
    plans: () => apiRequest("saas_admin.php?action=list_plans"),
    savePlan: (data: any) => apiRequest("saas_admin.php?action=save_plan", {
      method: "POST",
      body: JSON.stringify(data)
    }),
    users: () => apiRequest("saas_admin.php?action=saas_users"),
    invoices: () => apiRequest("saas_admin.php?action=saas_invoices"),
  },
  hotel: {
    rooms: (clinicId: string) => apiRequest(`hotel.php?action=list_rooms&clinicId=${clinicId}`),
    bookings: (clinicId: string) => apiRequest(`hotel.php?action=list_bookings&clinicId=${clinicId}`),
    stats: (clinicId: string) => apiRequest(`hotel.php?action=stats&clinicId=${clinicId}`),
    addRoom: (data: any) => apiRequest("hotel.php?action=add_room", { method: "POST", body: JSON.stringify(data) }),
    checkin: (data: any) => apiRequest("hotel.php?action=checkin", { method: "POST", body: JSON.stringify(data) }),
    checkout: (data: any) => apiRequest("hotel.php?action=checkout", { method: "PUT", body: JSON.stringify(data) }),
  },
  school: {
    students: (clinicId: string) => apiRequest(`school.php?action=list_students&clinicId=${clinicId}`),
    grades: (clinicId: string, studentId?: string) => 
      apiRequest(`school.php?action=list_grades&clinicId=${clinicId}${studentId ? `&student_id=${studentId}` : ''}`),
    stats: (clinicId: string) => apiRequest(`school.php?action=stats&clinicId=${clinicId}`),
    addStudent: (data: any) => apiRequest("school.php?action=add_student", { method: "POST", body: JSON.stringify(data) }),
    addGrade: (data: any) => apiRequest("school.php?action=add_grade", { method: "POST", body: JSON.stringify(data) }),
  },
  inventory: {
    list: (clinicId: string) => apiRequest(`inventory.php?action=list&clinicId=${clinicId}`),
    stats: (clinicId: string) => apiRequest(`inventory.php?action=stats&clinicId=${clinicId}`),
    add: (data: any) => apiRequest("inventory.php?action=add", { method: "POST", body: JSON.stringify(data) }),
    adjust: (data: any) => apiRequest("inventory.php?action=stock_adj", { method: "PUT", body: JSON.stringify(data) }),
  }
};
