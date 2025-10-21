import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";

import { AdminLayout } from "@/components/shared/AdminLayout";
import { Login } from "@/pages/auth/Login";
import { Dashboard } from "@/pages/dashboard/Dashboard";
import { Users } from "@/pages/users/Users"
import PersonalTable from "@/pages/PersonalLoan/personal"
import VehicleTable from "@/pages/VehicleLoan/vehicle"
import LoanApplication from "@/pages/LoanApplication/LoanApplication"
import NotFound from "./pages/NotFound";
import ContactUs from "./pages/contactus/contactus";
import BusinessTable from "@/pages/BusinessLoan/Business";
import GoldTable from "@/pages/GoldLoan/gold";
import VehicleLoanDetails from "@/pages/VehicleLoan/VehicleLoanDetails";
import EducationTable from "./pages/EducationLoan/Education";
import InsuranceTable from "./pages/InsuranceLoan/Insurance";
import HomeTable from "./pages/HomeLoan/Home";
import PersonalLoanDetails from "@/pages/PersonalLoan/PersonalLoanDetails";
import InsuranceLoanDetails from "@/pages/InsuranceLoan/InsuranceLoanDetails"
import BusinessLoanDetails from "@/pages/BusinessLoan/BusinessLoanDetails";
import HomeLoanDetails from "@/pages/HomeLoan/HomeLoanDetails"
import GoldLoanDetails from "./pages/GoldLoan/GoldLoanDetails";
import EducationLoanDetails from "./pages/EducationLoan/EducationLoanDetails";
import Careers from "./pages/careers/careers";
const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem("admin_token");
  const user = localStorage.getItem("admin_user");
  if (!token || !user) return <Navigate to="/login" replace />;
  try {
    const parsed = JSON.parse(user);
    if (parsed?.role !== "admin") return <Navigate to="/login" replace />;
  } catch (err) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/*" element={<ProtectedRoute> <AdminLayout /> </ProtectedRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="ContactUs" element={<ContactUs />} />
              <Route path="users" element={<Users />} />
              <Route path="applications" element={<LoanApplication />} />
              <Route path="PersonalTable" element={<PersonalTable />} />
              <Route path="BusinessTable" element={<BusinessTable />} />
              <Route path="VehicleTable" element={<VehicleTable />} />
              {/* <Route path="VehicleLoanDetails" element={<VehicleLoanDetails />} />
              <Route path="PersonalLoanDetails" element={<PersonalLoanDetails />} />
              <Route path="BusinessLoanDetails" element={<BusinessLoanDetails />} />
              <Route path="InsuranceLoanDetails" element={<InsuranceLoanDetails />} />
              <Route path="HomeLoanDetails" element={<HomeLoanDetails />} />
              <Route path="GoldLoanDetails" element={<GoldLoanDetails />} />
              <Route path="EducationLoanDetails" element={<EducationLoanDetails />} /> */}
              <Route path="careers" element={<Careers />} />

              <Route path="GoldTable" element={<GoldTable />} />
              <Route path="EducationTable" element={<EducationTable />} />
              <Route path="InsuranceTable" element={<InsuranceTable />} />
              <Route path="HomeTable" element={<HomeTable />} />

            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
