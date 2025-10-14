import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Users,
  BarChart3,
  DollarSign,
  Mail,
  FileText,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";

interface DashboardStatsProps {
  filter: string;
}

interface Stat {
  title: string;
  value: number | string;
  change: string;
  trend: "up" | "down";
  route?: string | null;
}

// ✅ Match API titles exactly
const iconMap: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  "total revenue": DollarSign,
  "total subscription": BarChart3,
  "total users": Users,
  "loan enquiries": FileText,
  "contact messages": Mail,
};

export const DashboardStats: React.FC<DashboardStatsProps> = ({ filter }) => {
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
  const fetchStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(
        `${API_BASE_URL}/api/dashboard/stats`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch dashboard stats");
      const data = await response.json();
      console.log("API Response Status:", data);
      const mappedStats: Stat[] = [
        {
          title: "Loan Enquiries",
          value: data.loan_enquiries?.total ?? 0,
          change: data.loan_enquiries?.monthly_change ?? "0%",
          trend: (data.loan_enquiries?.monthly_change || "").includes("-")
            ? "down"
            : "up",
          route: "/applications",
        },
        {
          title: "Contact Messages",
          value: data.contact_messages?.total ?? 0,
          change: data.contact_messages?.monthly_change ?? "0%",
          trend: (data.contact_messages?.monthly_change || "").includes("-")
            ? "down"
            : "up",
          route: "/contactus",
        },
      ];

      setStats(mappedStats);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  fetchStats();
}, [filter]);


  const handleCardClick = (route: string | null | undefined) => {
    if (route) navigate(route);
  };

  return (
    <>
      {loading ? (
        <div className="w-full text-center py-20 text-gray-500 font-medium">
          Loading...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((stat, index) => {
            // normalize title for safety
            const normalizedTitle = stat.title.trim().toLowerCase();
            const Icon = iconMap[normalizedTitle] || BarChart3;

            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                onClick={() => handleCardClick(stat.route)}
              >
                <Card
                  className={`relative overflow-hidden rounded-2xl shadow-xl transition-transform duration-300 hover:scale-[1.02] ${
                    stat.route ? "cursor-pointer" : ""
                  } bg-gradient-to-br from-blue-600 to-[#0f77d2]`}
                >
                  <CardContent className="flex flex-col space-y-4 p-6 text-white">
                    {/* Icon Bubble */}
                    <div className="w-12 h-12 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-sm shadow-md">
                      <Icon className="w-6 h-6 text-white" />
                    </div>

                    {/* Value */}
                    <div className="text-4xl font-extrabold tracking-tight">
                      {stat.value}
                    </div>

                    {/* Title */}
                    <p className="text-sm font-semibold uppercase opacity-80">
                      {stat.title}
                    </p>

                    {/* Trend */}
                    <div className="flex items-center space-x-2">
                      {stat.trend === "up" ? (
                        <TrendingUp className="w-5 h-5 text-green-400" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-400" />
                      )}
                      <span
                        className={`text-sm font-medium ${
                          stat.trend === "up"
                            ? "text-green-300"
                            : "text-red-300"
                        }`}
                      >
                        {stat.change}
                      </span>
                      <span className="text-xs text-gray-300">
                        vs last month
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </>
  );
};
