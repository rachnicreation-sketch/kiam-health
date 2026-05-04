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
    update: (data: any) => apiRequest("users.php", {
      method: "PUT",
      body: JSON.stringify(data)
    }),
    listDocuments: (userId: string) => apiRequest(`users.php?action=list_documents&user_id=${userId}`),
    addDocument: (data: any) => apiRequest("users.php?action=add_document", {
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
  hr: {
    employees: (clinicId: string) => apiRequest(`employees.php?action=list&clinicId=${clinicId}`),
    createEmployee: (data: any) => apiRequest("employees.php", { method: "POST", body: JSON.stringify(data) }),
    listDocuments: (empId: string) => apiRequest(`employees.php?action=list_documents&employee_id=${empId}`),
    addDocument: (data: any) => apiRequest("employees.php?action=add_document", { method: "POST", body: JSON.stringify(data) }),
    payrolls: (clinicId: string) => apiRequest(`payrolls.php?action=list&clinicId=${clinicId}`),
    createPayroll: (data: any) => apiRequest("payrolls.php", { method: "POST", body: JSON.stringify(data) }),
  },
  health: {
    stats: (clinicId: string) => apiRequest(`stats.php?clinicId=${clinicId}`),
    appointments: {
      list: (clinicId: string) => apiRequest(`appointments.php?action=list&clinicId=${clinicId}`),
      create: (data: any) => apiRequest("appointments.php", { method: "POST", body: JSON.stringify(data) }),
      updateStatus: (id: string, status: string) => apiRequest("appointments.php", { method: "PUT", body: JSON.stringify({ id, status }) }),
    },
    admissions: {
      list: (clinicId: string) => apiRequest(`admissions.php?action=list&clinicId=${clinicId}`),
      create: (data: any) => apiRequest("admissions.php", { method: "POST", body: JSON.stringify(data) }),
      discharge: (data: any) => apiRequest("admissions.php", { method: "PUT", body: JSON.stringify(data) }),
      transfers: (clinicId: string) => apiRequest(`admissions.php?action=transfers&clinicId=${clinicId}`),
      transfer: (data: any) => apiRequest("admissions.php?action=transfer", { method: "POST", body: JSON.stringify(data) }),
    },
    beds: {
      list: (clinicId: string) => apiRequest(`beds.php?action=list&clinicId=${clinicId}`),
      create: (data: any) => apiRequest("beds.php", { method: "POST", body: JSON.stringify(data) }),
    },
    lab: {
      services: (clinicId: string) => apiRequest(`lab_services.php?action=list&clinicId=${clinicId}`),
      tests: (clinicId: string) => apiRequest(`lab_tests.php?action=list&clinicId=${clinicId}`),
      createTest: (data: any) => apiRequest("lab_tests.php", { method: "POST", body: JSON.stringify(data) }),
      updateTest: (data: any) => apiRequest("lab_tests.php", { method: "PUT", body: JSON.stringify(data) }),
    }
  },
  inventory: {
    list: (clinicId: string) => apiRequest(`inventory.php?action=list&clinicId=${clinicId}`),
    movements: (clinicId: string) => apiRequest(`inventory.php?action=list_movements&clinicId=${clinicId}`),
    create: (data: any) => apiRequest("inventory.php", {
      method: "POST",
      body: JSON.stringify(data)
    }),
    update: (data: any) => apiRequest("inventory.php", {
      method: "PUT",
      body: JSON.stringify(data)
    }),
    delete: (id: string) => apiRequest(`inventory.php?action=delete&id=${id}`, {
      method: "DELETE"
    }),
    adjustStock: (id: string, adjustment: number, reason: string = "Ajustement manuel") => 
      apiRequest("inventory.php?action=stock_adj", { method: "PUT", body: JSON.stringify({ id, adjustment, reason }) }),
  },
  erp: {
    posSale: (data: any) => apiRequest("erp.php?action=pos_sale", { method: "POST", body: JSON.stringify(data) }),
    transactions: (clinicId: string) => apiRequest(`erp.php?action=list_transactions&clinicId=${clinicId}`),
    stats: (clinicId: string) => apiRequest(`erp.php?action=stats&clinicId=${clinicId}`),
    customers: (clinicId: string) => apiRequest(`erp.php?action=list_customers&clinicId=${clinicId}`),
    addCustomer: (data: any) => apiRequest("erp.php?action=add_customer", { method: "POST", body: JSON.stringify(data) }),
    suppliers: (clinicId: string) => apiRequest(`erp.php?action=list_suppliers&clinicId=${clinicId}`),
    addSupplier: (data: any) => apiRequest("erp.php?action=add_supplier", { method: "POST", body: JSON.stringify(data) }),
    expenses: (clinicId: string) => apiRequest(`erp.php?action=list_expenses&clinicId=${clinicId}`),
    addExpense: (data: any) => apiRequest("erp.php?action=add_expense", { method: "POST", body: JSON.stringify(data) }),
  },
  pharmacy: {
    medications: (clinicId: string) => apiRequest(`medications.php?action=list&clinicId=${clinicId}`),
    createMedication: (data: any) => apiRequest("medications.php", { method: "POST", body: JSON.stringify(data) }),
    sales: (clinicId: string) => apiRequest(`pharmacy_sales.php?action=list&clinicId=${clinicId}`),
    createSale: (data: any) => apiRequest("pharmacy_sales.php", { method: "POST", body: JSON.stringify(data) }),
  },
  school: {
    students: (clinicId: string) => apiRequest(`school.php?action=list_students&clinicId=${clinicId}`),
    addStudent: (data: any) => apiRequest("school.php?action=add_student", { method: "POST", body: JSON.stringify(data) }),
    updateStudent: (data: any) => apiRequest("school.php?action=update_student", { method: "POST", body: JSON.stringify(data) }),
    deleteStudent: (id: string) => apiRequest("school.php?action=delete_student", { method: "POST", body: JSON.stringify({ id }) }),
    
    teachers: (clinicId: string) => apiRequest(`school.php?action=list_teachers&clinicId=${clinicId}`),
    
    classes: (clinicId: string) => apiRequest(`school.php?action=list_classes&clinicId=${clinicId}`),
    addClass: (data: any) => apiRequest("school.php?action=add_class", { method: "POST", body: JSON.stringify(data) }),
    updateClass: (data: any) => apiRequest("school.php?action=update_class", { method: "POST", body: JSON.stringify(data) }),
    deleteClass: (id: string) => apiRequest("school.php?action=delete_class", { method: "POST", body: JSON.stringify({ id }) }),
    
    subjects: (clinicId: string) => apiRequest(`school.php?action=list_subjects&clinicId=${clinicId}`),
    addSubject: (data: any) => apiRequest("school.php?action=add_subject", { method: "POST", body: JSON.stringify(data) }),
    
    attendance: (clinicId: string, classId: string, date: string) => 
      apiRequest(`school.php?action=list_attendance&clinicId=${clinicId}&class_id=${classId}&date=${date}`),
    takeAttendance: (data: any) => apiRequest("school.php?action=take_attendance", { method: "POST", body: JSON.stringify(data) }),
    
    payments: (clinicId: string) => apiRequest(`school.php?action=list_payments&clinicId=${clinicId}`),
    addPayment: (data: any) => apiRequest("school.php?action=add_payment", { method: "POST", body: JSON.stringify(data) }),
    
    grades: (clinicId: string, studentId?: string) => 
      apiRequest(`school.php?action=list_grades&clinicId=${clinicId}${studentId ? `&student_id=${studentId}` : ''}`),
    addGrade: (data: any) => apiRequest("school.php?action=add_grade", { method: "POST", body: JSON.stringify(data) }),
    
    schedule: (clinicId: string, classId?: string) => 
      apiRequest(`school.php?action=list_schedule&clinicId=${clinicId}${classId ? `&class_id=${classId}` : ''}`),
    addSchedule: (data: any) => apiRequest("school.php?action=add_schedule", { method: "POST", body: JSON.stringify(data) }),
    deleteSchedule: (id: string) => apiRequest("school.php?action=delete_schedule", { method: "POST", body: JSON.stringify({ id }) }),
    
    listDocuments: (studentId: string) => apiRequest(`school.php?action=list_documents&student_id=${studentId}`),
    addDocument: (data: any) => apiRequest("school.php?action=add_document", { method: "POST", body: JSON.stringify(data) }),
    
    stats: (clinicId: string) => apiRequest(`school.php?action=stats&clinicId=${clinicId}`),
  },
  stats: {
    get: (clinicId: string) => apiRequest(`stats.php?clinicId=${clinicId}`),
  },
  notifications: {
    list: (clinicId: string) => apiRequest(`notifications.php?clinicId=${clinicId}`),
    markRead: (clinicId: string, notificationId: string) => apiRequest(`notifications.php?action=mark_read&clinicId=${clinicId}`, {
      method: "POST",
      body: JSON.stringify({ notificationId })
    }),
  },
  saas: {
    modules: (tenantId: string) => apiRequest(`saas_admin.php?action=active_modules&tenant_id=${tenantId}`),
    updateTenantStatus: (id: string, status: string) => apiRequest(`saas_admin.php?action=update_status`, {
      method: "POST",
      body: JSON.stringify({ id, status })
    }),
    deleteTenant: (id: string) => apiRequest(`saas_admin.php?action=delete_tenant`, {
      method: "POST",
      body: JSON.stringify({ id })
    }),
  }
};
