import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Package,        // can replace with FolderOpen or Wallet if you prefer
  ContactRound,
  Menu,
  LogOut,
  ChevronDown,
  ChevronRight,
  Briefcase,      // used for Business Loans (and your Careers link currently)
  User,
  Car,
  Coins,
  Home,
  ShieldCheck,
  GraduationCap
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({ collapsed, onToggle }) => {
  const location = useLocation();
  const { logout, user } = useAuth();

  const [openDropdown, setOpenDropdown] = useState(false);

  const handleDropdownToggle = () => {
    setOpenDropdown((prev) => !prev);
  };

  // Auto-open dropdown when any loan page is active
  useEffect(() => {
    if (
      location.pathname.includes("PersonalTable") ||
      location.pathname.includes("VehicleTable") ||
      location.pathname.includes("BusinessTable") ||
      location.pathname === "/applications"
    ) {
      setOpenDropdown(true);
    }
  }, [location.pathname]);

  const mainNavigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Contact Us", href: "/contactus", icon: ContactRound }
  ];

  // Applications + Loan pages inside one dropdown
  const loanNavigation = [
    { name: "Personal Loans", href: "/PersonalTable", icon: User },
    { name: "Vehicle Loans", href: "/VehicleTable", icon: Car },
    { name: "Business Loans", href: "/BusinessTable", icon: Briefcase },
    { name: "Gold Loans", href: "/GoldTable", icon: Coins },
    { name: "Home Loans", href: "/HomeTable", icon: Home },
    { name: "Insurance Loans", href: "/InsuranceTable", icon: ShieldCheck },
    { name: "Education Loans", href: "/EducationTable", icon: GraduationCap },
  ];


  return (
    <motion.div
      initial={false}
      animate={{ width: collapsed ? 70 : 260 }}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className="fixed left-4 top-4 h-[calc(100%-2rem)] bg-white/70 dark:bg-gray-900/80 
                 backdrop-blur-lg border border-gray-200/40 dark:border-gray-700/50 
                 rounded-2xl shadow-2xl z-40 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200/40 dark:border-gray-700/40">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <img src="/Images/CompanyLogo.jpeg" alt="Logo" className="w-10 h-10 rounded-full" />
            <span className="font-semibold text-gray-900 dark:text-gray-100">Borrowly Admin</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className="hover:bg-gray-200/50 dark:hover:bg-gray-700/50 rounded-full"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-2 overflow-y-auto">
        {/* Dashboard */}
        <Tooltip>
          <TooltipTrigger asChild>
            <NavLink
              to="/dashboard"
              className={`relative flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium
                transition-all duration-200
                ${location.pathname === "/dashboard"
                  ? "bg-gradient-to-br from-blue-600 to-[#0f77d2] text-white shadow-md"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
                }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              {!collapsed && <span>Dashboard</span>}
            </NavLink>
          </TooltipTrigger>
          {collapsed && <TooltipContent>Dashboard</TooltipContent>}
        </Tooltip>

        {/* Applications Dropdown */}
        <div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleDropdownToggle}
                className={`relative w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium
                  transition-all duration-200 group
                  ${location.pathname.includes("Table") || location.pathname === "/applications"
                    ? "bg-gradient-to-br from-blue-600 to-[#0f77d2] text-white shadow-md"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
                  }`}
              >
                <div className="flex items-center space-x-3">
                  <Package className="w-5 h-5" />
                  {!collapsed && <span>Applications</span>}
                </div>
                {!collapsed &&
                  (openDropdown ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  ))}
              </button>
            </TooltipTrigger>
            {collapsed && <TooltipContent>Applications</TooltipContent>}
          </Tooltip>

          {/* Dropdown Items */}
          {!collapsed && openDropdown && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="mt-1 ml-4 space-y-1"
            >
              {loanNavigation.map((item, index) => {
                const isActive = location.pathname === item.href;
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                      ${isActive
                        ? "bg-[#00C2CC] text-white"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
                      }
                    `}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </NavLink>
                );
              })}
            </motion.div>
          )}
        </div>

        {/* Contact Us */}
        <Tooltip>
          <TooltipTrigger asChild>
            <NavLink
              to="/contactus"
              className={`relative flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium
                transition-all duration-200
                ${location.pathname === "/contactus"
                  ? "bg-gradient-to-br from-blue-600 to-[#0f77d2] text-white shadow-md"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
                }`}
            >
              <ContactRound className="w-5 h-5" />
              {!collapsed && <span>Contact Us</span>}
            </NavLink>
          </TooltipTrigger>
          {collapsed && <TooltipContent>Contact Us</TooltipContent>}
        </Tooltip>
        {/* Careers */}


        <Tooltip>
          <TooltipTrigger asChild>
            <NavLink
              to="/careers"
              className={`relative flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium
        transition-all duration-200
        ${location.pathname === "/careers"
                  ? "bg-gradient-to-br from-blue-600 to-[#0f77d2] text-white shadow-md"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
                }`}
            >
              <Briefcase className="w-5 h-5" />
              {!collapsed && <span>Careers</span>}
            </NavLink>
          </TooltipTrigger>
          {collapsed && <TooltipContent>Careers</TooltipContent>}
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <NavLink
              to="/Agent"
              className={`relative flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium
        transition-all duration-200
        ${location.pathname === "/Agent"
                  ? "bg-gradient-to-br from-blue-600 to-[#0f77d2] text-white shadow-md"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
                }`}
            >
              <User className="w-5 h-5" />
              {!collapsed && <span>Agents</span>}
            </NavLink>
          </TooltipTrigger>
          {collapsed && <TooltipContent>Agent</TooltipContent>}
        </Tooltip>


      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-200/40 dark:border-gray-700/40">
        {!collapsed && user && (
          <div className="mb-3 p-3 bg-gray-100/60 dark:bg-gray-800/70 rounded-xl">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{user.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
          </div>
        )}
        <Button
          onClick={logout}
          variant="ghost"
          className={`w-full justify-start text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 ${collapsed ? "px-2" : ""
            }`}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span className="ml-3">Logout</span>}
        </Button>
      </div>
    </motion.div>
  );
};
