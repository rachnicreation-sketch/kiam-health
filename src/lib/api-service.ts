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
    
    // Si le locataire est suspendu, rediriger vers la page dédiée
    if (response.status === 403 && error.code === 'TENANT_SUSPENDED') {
      window.location.hash = "#/suspended";
    }
    
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
    impersonateDemo: (sector: string, name: string) => apiRequest("auth.php?action=impersonate_demo", {
      method: "POST",
      body: JSON.stringify({ sector, name })
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
    // Advanced OHADA Accounts & General Ledger
    ohadaAccounts: (clinicId: string) => apiRequest(`erp.php?action=ohada_accounts_list&clinicId=${clinicId}`),
    ohadaJournalEntries: (clinicId: string) => apiRequest(`erp.php?action=ohada_journal_entries&clinicId=${clinicId}`),
    ohadaEntryDetails: (clinicId: string, id: string) => apiRequest(`erp.php?action=ohada_entry_details&clinicId=${clinicId}&id=${id}`),
    ohadaLedger: (clinicId: string) => apiRequest(`erp.php?action=ohada_general_ledger&clinicId=${clinicId}`),
    ohadaTrialBalance: (clinicId: string) => apiRequest(`erp.php?action=ohada_trial_balance&clinicId=${clinicId}`),
    ohadaFinancialReports: (clinicId: string) => apiRequest(`erp.php?action=ohada_financial_reports&clinicId=${clinicId}`),
    // Physical Inventory Audits
    physicalInventories: (clinicId: string) => apiRequest(`erp.php?action=physical_inventories_list&clinicId=${clinicId}`),
    physicalInventoryGet: (clinicId: string, id: string) => apiRequest(`erp.php?action=physical_inventories_get&clinicId=${clinicId}&id=${id}`),
    physicalInventoryCreate: (data: any) => apiRequest("erp.php?action=physical_inventories_create", { method: "POST", body: JSON.stringify(data) }),
    physicalInventoryValidate: (data: any) => apiRequest("erp.php?action=physical_inventories_validate", { method: "POST", body: JSON.stringify(data) }),
    // Commercial Quotes & Delivery Slips
    quotesList: (clinicId: string) => apiRequest(`erp.php?action=quotes_list&clinicId=${clinicId}`),
    quoteCreate: (data: any) => apiRequest("erp.php?action=quotes_create", { method: "POST", body: JSON.stringify(data) }),
    quoteUpdateStatus: (data: any) => apiRequest("erp.php?action=quotes_update_status", { method: "POST", body: JSON.stringify(data) }),
    deliverySlipsList: (clinicId: string) => apiRequest(`erp.php?action=delivery_slips_list&clinicId=${clinicId}`),
    deliverySlipCreate: (data: any) => apiRequest("erp.php?action=delivery_slips_create", { method: "POST", body: JSON.stringify(data) }),
    deliverySlipUpdateStatus: (data: any) => apiRequest("erp.php?action=delivery_slips_update_status", { method: "POST", body: JSON.stringify(data) }),
    // Fractional Units Conversions
    addProductUnitConversion: (data: any) => apiRequest("erp.php?action=add_unit_conversion", { method: "POST", body: JSON.stringify(data) }),
    listProductUnits: (clinicId: string, productId: string) => apiRequest(`erp.php?action=list_product_units&clinicId=${clinicId}&product_id=${productId}`),
  },
  procurement: {
    dashboard:       (clinicId: string) => apiRequest(`procurement.php?action=dashboard&clinicId=${clinicId}`),
    // Suppliers
    suppliers:       (clinicId: string, search = '', rating = '') => apiRequest(`procurement.php?action=suppliers_list&clinicId=${clinicId}&search=${search}&rating=${rating}`),
    supplier:        (clinicId: string, id: string) => apiRequest(`procurement.php?action=suppliers_get&clinicId=${clinicId}&id=${id}`),
    supplierBalance: (clinicId: string) => apiRequest(`procurement.php?action=supplier_balance&clinicId=${clinicId}`),
    createSupplier:  (data: any) => apiRequest(`procurement.php?action=suppliers_create`, { method: 'POST', body: JSON.stringify(data) }),
    updateSupplier:  (data: any) => apiRequest(`procurement.php?action=suppliers_update`, { method: 'PUT',  body: JSON.stringify(data) }),
    deleteSupplier:  (clinicId: string, id: string) => apiRequest(`procurement.php?action=suppliers_delete&clinicId=${clinicId}&id=${id}`, { method: 'DELETE' }),
    // Purchase Requests
    prList:          (clinicId: string, status = '') => apiRequest(`procurement.php?action=pr_list&clinicId=${clinicId}&status=${status}`),
    prGet:           (clinicId: string, id: string)  => apiRequest(`procurement.php?action=pr_get&clinicId=${clinicId}&id=${id}`),
    prCreate:        (data: any) => apiRequest(`procurement.php?action=pr_create`,        { method: 'POST', body: JSON.stringify(data) }),
    prUpdateStatus:  (data: any) => apiRequest(`procurement.php?action=pr_update_status`, { method: 'PUT',  body: JSON.stringify(data) }),
    prToPo:          (data: any) => apiRequest(`procurement.php?action=pr_to_po`,         { method: 'POST', body: JSON.stringify(data) }),
    // Purchase Orders
    poList:          (clinicId: string, status = '') => apiRequest(`procurement.php?action=po_list&clinicId=${clinicId}&status=${status}`),
    poGet:           (clinicId: string, id: string)  => apiRequest(`procurement.php?action=po_get&clinicId=${clinicId}&id=${id}`),
    poCreate:        (data: any) => apiRequest(`procurement.php?action=po_create`,        { method: 'POST', body: JSON.stringify(data) }),
    poUpdateStatus:  (data: any) => apiRequest(`procurement.php?action=po_update_status`, { method: 'PUT',  body: JSON.stringify(data) }),
    // Goods Receipts
    grList:          (clinicId: string) => apiRequest(`procurement.php?action=gr_list&clinicId=${clinicId}`),
    grGet:           (clinicId: string, id: string) => apiRequest(`procurement.php?action=gr_get&clinicId=${clinicId}&id=${id}`),
    grCreate:        (data: any) => apiRequest(`procurement.php?action=gr_create`,   { method: 'POST', body: JSON.stringify(data) }),
    grValidate:      (data: any) => apiRequest(`procurement.php?action=gr_validate`, { method: 'PUT',  body: JSON.stringify(data) }),
    // Supplier Invoices
    invList:         (clinicId: string, status = '') => apiRequest(`procurement.php?action=inv_list&clinicId=${clinicId}&status=${status}`),
    invGet:          (clinicId: string, id: string)  => apiRequest(`procurement.php?action=inv_get&clinicId=${clinicId}&id=${id}`),
    invCreate:       (data: any) => apiRequest(`procurement.php?action=inv_create`,        { method: 'POST', body: JSON.stringify(data) }),
    invUpdateStatus: (data: any) => apiRequest(`procurement.php?action=inv_update_status`, { method: 'PUT',  body: JSON.stringify(data) }),
    // Payments
    payList:         (clinicId: string) => apiRequest(`procurement.php?action=pay_list&clinicId=${clinicId}`),
    payCreate:       (data: any) => apiRequest(`procurement.php?action=pay_create`, { method: 'POST', body: JSON.stringify(data) }),
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
    stats: () => apiRequest("saas_admin.php?action=stats"),
    tenants: () => apiRequest("saas_admin.php?action=tenants"),
    tickets: () => apiRequest("saas_support.php?action=list"),
    plans: () => apiRequest("saas_admin.php?action=list_plans"),
    invoices: () => apiRequest("saas_admin.php?action=saas_invoices"),
    savePlan: (data: any) => apiRequest("saas_admin.php?action=save_plan", {
      method: "POST",
      body: JSON.stringify(data)
    }),
    listModules: () => apiRequest("saas_admin.php?action=list_modules"),
    modules: (tenantId: string) => apiRequest(`saas_admin.php?action=active_modules&tenant_id=${tenantId}`),
    updateTenantStatus: (id: string, status: string) => apiRequest(`saas_admin.php?action=update_status`, {
      method: "POST",
      body: JSON.stringify({ id, status })
    }),
    deleteTenant: (id: string) => apiRequest(`saas_admin.php?action=delete_tenant`, {
      method: "POST",
      body: JSON.stringify({ id })
    }),
    announcements: () => apiRequest("saas_admin.php?action=announcements"),
    createAnnouncement: (data: any) => apiRequest("saas_admin.php?action=create_announcement", {
      method: "POST",
      body: JSON.stringify(data)
    }),
    ticketDetails: (id: number) => apiRequest(`saas_admin.php?action=ticket_details&id=${id}`),
    replyTicket: (data: any) => apiRequest("saas_admin.php?action=reply_ticket", {
      method: "POST",
      body: JSON.stringify(data)
    }),
    closeTicket: (id: number) => apiRequest("saas_admin.php?action=close_ticket", {
      method: "POST",
      body: JSON.stringify({ id })
    }),
    auditLogs: (limit?: number) => apiRequest(`saas_admin.php?action=audit_logs${limit ? `&limit=${limit}` : ''}`),
    aiAnalysis: () => apiRequest("saas_admin.php?action=ai_analysis"),
    users: () => apiRequest("saas_admin.php?action=users"),
    saveUser: (data: any) => apiRequest("saas_admin.php?action=save_user", {
      method: "POST",
      body: JSON.stringify(data)
    }),
    deleteUser: (id: string) => apiRequest("saas_admin.php?action=delete_user", {
      method: "POST",
      body: JSON.stringify({ id })
    }),
    toggleUser: (id: string) => apiRequest("saas_admin.php?action=toggle_user", {
      method: "POST",
      body: JSON.stringify({ id })
    }),
  }
};
