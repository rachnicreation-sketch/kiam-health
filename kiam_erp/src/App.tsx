import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// ─── Core Pages (always loaded) ───────────────────────────────────────────────
import Login from "./core/pages/Login";
import Register from "./core/pages/Register";
import LandingPage from "./core/pages/LandingPage";
import NotFound from "./core/pages/NotFound";
import { ModulePlaceholder } from "./core/pages/ModulePlaceholder";
import AuditLogs from "./pages/AuditLogs";

// ─── KIAM Health Module ────────────────────────────────────────────────────────

// ─── Hotel Module ──────────────────────────────────────────────────────────────

// ─── ERP Module (Native React) ─────────────────────────────────────────────
const ERPHome      = React.lazy(() => import("./modules/erp/pages/ErpHome"));
const ERPDashboard = React.lazy(() => import("./modules/erp/pages/ErpDashboard"));
const POS          = React.lazy(() => import("./modules/erp/pages/PointOfSale"));
const Inventory    = React.lazy(() => import("./modules/erp/pages/InventoryManager"));
const Customers    = React.lazy(() => import("./modules/erp/pages/Customers"));
const Suppliers    = React.lazy(() => import("./modules/erp/pages/Suppliers"));
const Expenses     = React.lazy(() => import("./modules/erp/pages/Expenses"));
const Transactions = React.lazy(() => import("./modules/erp/pages/ErpTransactions"));
const Reports      = React.lazy(() => import("./modules/erp/pages/Reports"));
const RegisterClosing = React.lazy(() => import("./modules/erp/pages/RegisterClosing"));
const ErpAccounting   = React.lazy(() => import("./modules/erp/pages/ErpAccounting"));
const PhysicalInventories = React.lazy(() => import("./modules/erp/pages/PhysicalInventories"));
const CommercialDocs  = React.lazy(() => import("./modules/erp/pages/CommercialDocs"));
const ErpHumanResources = React.lazy(() => import("./modules/erp/pages/ErpHumanResources"));
// ─── ERP Procurement Module ────────────────────────────────────────────────
const ProcurementDashboard = React.lazy(() => import("./modules/erp/pages/ProcurementDashboard"));
const PurchaseRequests     = React.lazy(() => import("./modules/erp/pages/PurchaseRequests"));
const PurchaseOrders       = React.lazy(() => import("./modules/erp/pages/PurchaseOrders"));
const GoodsReceipts        = React.lazy(() => import("./modules/erp/pages/GoodsReceipts"));
const SupplierInvoices     = React.lazy(() => import("./modules/erp/pages/SupplierInvoices"));
const SupplierPayments     = React.lazy(() => import("./modules/erp/pages/SupplierPayments"));

// ─── Other Modules ────────────────────────────────────────────────────────────


// ─── SaaS Admin Module ────────────────────────────────────────────────────────
import SuspendedAccount from "./core/pages/SuspendedAccount";
import AppSwitcher from "./core/pages/AppSwitcher";

// ─── KIAM School Module — Lazy Loaded ─────────────────────────────────────────

// ─── Fallback spinner for Suspense ────────────────────────────────────────────
const PageLoader = () => (
  <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <React.Suspense fallback={<PageLoader />}>
            <Routes>
              {/* ── Public Routes ──────────────────────────────────── */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/:clinicId" element={<ClinicLanding />} />
              <Route path="/patient/:clinicId/login" element={<PatientPortal />} />
              <Route path="/suspended" element={<SuspendedAccount />} />

              {/* ── Authenticated Layout ──────────────────────────── */}
              <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route path="/apps"            element={<AppSwitcher />} />

                {/* Health */}
                <Route path="/dashboard"       element={<ProtectedRoute module="dashboard"><Dashboard /></ProtectedRoute>} />
                <Route path="/patients"        element={<ProtectedRoute module="patients"><Patients /></ProtectedRoute>} />
                <Route path="/patients/:id"    element={<ProtectedRoute module="patients"><PatientDetail /></ProtectedRoute>} />
                <Route path="/planning"        element={<ProtectedRoute module="planning"><GuardPlanning /></ProtectedRoute>} />
                <Route path="/consultations"   element={<ProtectedRoute module="consultations"><Consultations /></ProtectedRoute>} />
                <Route path="/appointments"    element={<ProtectedRoute module="appointments"><Appointments /></ProtectedRoute>} />
                <Route path="/hospitalization" element={<ProtectedRoute module="hospitalization"><Hospitalization /></ProtectedRoute>} />
                <Route path="/laboratory"      element={<ProtectedRoute module="laboratory"><Laboratory /></ProtectedRoute>} />
                <Route path="/billing"         element={<ProtectedRoute module="billing"><Billing /></ProtectedRoute>} />
                <Route path="/accounting"      element={<ProtectedRoute module="accounting"><Accounting /></ProtectedRoute>} />
                <Route path="/reports"         element={<ProtectedRoute module="reports"><Reports /></ProtectedRoute>} />
                <Route path="/hr"              element={<ProtectedRoute module="hr"><HumanResources /></ProtectedRoute>} />
                <Route path="/messages"        element={<Messaging />} />
                <Route path="/catalogs"        element={<ProtectedRoute module="catalogs"><Catalogs /></ProtectedRoute>} />
                <Route path="/facilities"      element={<ProtectedRoute module="facilities"><Facilities /></ProtectedRoute>} />
                <Route path="/settings"        element={<ProtectedRoute module="settings"><SettingsPage /></ProtectedRoute>} />
                <Route path="/subscription"    element={<SaaSSubscription />} />
                <Route path="/logs"            element={<AuditLogs />} />

                {/* SaaS Admin */}

                {/* Hotel */}

                {/* School (lazy) */}
                {/* School RH — exclusif secteur École */}

                {/* ERP Module */}
                <Route path="/erp"               element={<ProtectedRoute module="erp"><ERPHome /></ProtectedRoute>} />
                <Route path="/erp/home"          element={<ProtectedRoute module="erp"><ERPHome /></ProtectedRoute>} />
                <Route path="/erp/dashboard"     element={<ProtectedRoute module="erp"><ERPDashboard /></ProtectedRoute>} />
                <Route path="/erp/pos"           element={<ProtectedRoute module="erp"><POS /></ProtectedRoute>} />
                <Route path="/erp/inventory"     element={<ProtectedRoute module="erp"><Inventory /></ProtectedRoute>} />
                <Route path="/erp/customers"     element={<ProtectedRoute module="erp"><Customers /></ProtectedRoute>} />
                <Route path="/erp/suppliers"     element={<ProtectedRoute module="erp"><Suppliers /></ProtectedRoute>} />
                <Route path="/erp/expenses"      element={<ProtectedRoute module="erp"><Expenses /></ProtectedRoute>} />
                <Route path="/erp/reports"       element={<ProtectedRoute module="erp"><Reports /></ProtectedRoute>} />
                <Route path="/erp/transactions"  element={<ProtectedRoute module="erp"><Transactions /></ProtectedRoute>} />
                <Route path="/erp/closing"       element={<ProtectedRoute module="erp"><RegisterClosing /></ProtectedRoute>} />
                <Route path="/erp/accounting"    element={<ProtectedRoute module="erp"><ErpAccounting /></ProtectedRoute>} />
                <Route path="/erp/physical-inventories" element={<ProtectedRoute module="erp"><PhysicalInventories /></ProtectedRoute>} />
                <Route path="/erp/commercial-docs" element={<ProtectedRoute module="erp"><CommercialDocs /></ProtectedRoute>} />
                {/* ERP RH — exclusif secteur ERP/Commerce */}
                <Route path="/erp/hr"            element={<ProtectedRoute module="erp_hr"><ErpHumanResources /></ProtectedRoute>} />
                {/* ERP Procurement */}
                <Route path="/erp/procurement"        element={<ProtectedRoute module="erp"><ProcurementDashboard /></ProtectedRoute>} />
                <Route path="/erp/purchase-requests"  element={<ProtectedRoute module="erp"><PurchaseRequests /></ProtectedRoute>} />
                <Route path="/erp/purchase-orders"    element={<ProtectedRoute module="erp"><PurchaseOrders /></ProtectedRoute>} />
                <Route path="/erp/goods-receipts"     element={<ProtectedRoute module="erp"><GoodsReceipts /></ProtectedRoute>} />
                <Route path="/erp/supplier-invoices"  element={<ProtectedRoute module="erp"><SupplierInvoices /></ProtectedRoute>} />
                <Route path="/erp/supplier-payments"  element={<ProtectedRoute module="erp"><SupplierPayments /></ProtectedRoute>} />
                <Route path="/erp/*"             element={<ProtectedRoute module="erp"><ModulePlaceholder /></ProtectedRoute>} />

                {/* Pharmacy */}

                {/* Enterprise */}

              </Route>{/* End ProtectedRoute/AppLayout */}

              {/* Fallback */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </React.Suspense>
        </HashRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
