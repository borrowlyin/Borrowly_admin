import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import DashboardStats from "./components/DashboardStats";
import { SalesChart } from "./components/SalesChart";
import TopProducts from "./components/TopProducts";


export const Dashboard: React.FC = () => {
  const [filter, setFilter] = useState("thisWeek");
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const minDate = "2025-07-10"; 

  const handleFilterChange = (value: string) => {
    if (value === "custom") {
      setCustomStartDate("");
      setCustomEndDate("");
      setShowCustomModal(true); 
    } else {
      setFilter(value);
    }
  };

  const handleCustomSubmit = () => {
    if (customStartDate && customEndDate) {
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      const formatDate = (d: Date) =>
        `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
      setFilter(`${formatDate(start)}~${formatDate(end)}`);
      setShowCustomModal(false);
    } else {
      alert("Please select both start and end dates");
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-500 text-[14px]">
            Welcome back! Here's the latest overview of{" "}
            <strong>Borrowly Loan</strong> <br/> customer support requests and activity.
          </p>
        </div>
      </motion.div>

      <DashboardStats  />
     
    </div>
  );
};
