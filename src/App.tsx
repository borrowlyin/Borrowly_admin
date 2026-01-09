import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { DashboardCacheProvider } from "@/contexts/DashboardCacheContext";
import { LoanCacheProvider } from "@/contexts/LoanCacheContext";

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
import EducationTable from "./pages/EducationLoan/Education";
import InsuranceTable from "./pages/InsuranceLoan/Insurance";
import HomeTable from "./pages/HomeLoan/Home";
import Careers from "./pages/careers/careers";
import AgentsRegistation from "./pages/Agents/AgentsRegistation";
import AccountCreation from "./pages/Accountcreation/Account";
import BankAggregators from "./pages/BankAggregators/bankaggregators";
import Analysis from "./pages/Analysis/Analysis";
import EarningsManagement from "./pages/Earnings/EarningsManagement";
import AgentBankManagement from "./pages/AgentBank";
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
        <DashboardCacheProvider>
          <LoanCacheProvider>
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
              <Route path="careers" element={<Careers />} />
              <Route path="Agent" element={<AgentsRegistation />} />
              <Route path="Accountcreation" element={<AccountCreation />} />
              <Route path="BankAggregators" element={<BankAggregators />} />
              <Route path="GoldTable" element={<GoldTable />} />
              <Route path="EducationTable" element={<EducationTable />} />
              <Route path="InsuranceTable" element={<InsuranceTable />} />
              <Route path="HomeTable" element={<HomeTable />} />
              <Route path="Analysis" element={<Analysis />} />
              <Route path="earnings" element={<EarningsManagement />} />
              <Route path="agent-bank" element={<AgentBankManagement />} />

            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
            </BrowserRouter>
          </LoanCacheProvider>
        </DashboardCacheProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
