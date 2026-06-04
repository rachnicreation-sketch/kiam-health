import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if there is an active session
    const storedUser = localStorage.getItem("kiam_auth_user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user && user.role) {
          if (user.role === 'saas_admin') {
            navigate('/saas/dashboard');
            return;
          } else {
            const sector = user.sector || 'health';
            const sectorHome: Record<string, string> = {
              health:     '/dashboard',
              hotel:      '/hotel/dashboard',
              school:     '/school/dashboard',
              erp:        '/erp',
              shop:       '/erp',
              pharmacy:   '/pharmacy/dashboard',
              enterprise: '/enterprise/dashboard',
            };
            navigate(sectorHome[sector] || '/apps');
            return;
          }
        }
      } catch (e) {
        console.error("Error parsing user session:", e);
      }
    }

    // If no active session, redirect to the public PHP landing page (which has live platform stats)
    window.location.href = "/kiam/";
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#080c18] text-white flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
    </div>
  );
}
