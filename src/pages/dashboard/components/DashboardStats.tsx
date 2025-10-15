import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Users,
  BarChart3,
  Mail,
  FileText,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "@/lib/api";
interface DashboardStatsProps {
  filter?: string;
}

interface Stat {
  title: string;
  value: number | string;
  change: string;
  trend: "up" | "down";
  route?: string | null;
}

const iconMap: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  "loan enquiries": FileText,
  "contacted candidates": Mail,
  "pending loans": TrendingUp,
  "approved loans": TrendingUp,
  "rejected loans": TrendingDown,
  "cancelled loans": TrendingDown,
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
        const response = await fetch(`${API_BASE_URL}/api/dashboard-data`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) throw new Error("Failed to fetch dashboard data");
        const data = await response.json();

        const mappedStats: Stat[] = [
          {
            title: "Loan Enquiries",
            value: data.totalApplicants ?? 0,
            change: "+5%",
            trend: "up",
            route: "/applications",
          },
          {
            title: "Contacted Candidates",
            value: data.totalContactedCandidates ?? 0,
            change: "+2%",
            trend: "up",
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

  const colorMap: Record<string, string> = {
    "loan enquiries": "from-blue-500 via-blue-400 to-indigo-500",
    "contacted candidates": "from-blue-500 via-blue-400 to-indigo-500",

  };
  return (
    <>
      {loading ? (
        <div className="w-full text-center py-20 text-gray-500 font-medium text-lg">
          Loading dashboard stats...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((stat, index) => {
            const normalizedTitle = stat.title.trim().toLowerCase();
            const Icon = iconMap[normalizedTitle] || BarChart3;
            const gradient = colorMap[normalizedTitle] || "from-gray-400 to-gray-600";

            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                onClick={() => handleCardClick(stat.route)}
              >
                <Card
                  className={`relative overflow-hidden rounded-2xl border border-gray-100 shadow-lg transition-transform duration-300 hover:shadow-2xl hover:scale-[1.02] ${
                    stat.route ? "cursor-pointer" : ""
                  } bg-gradient-to-br ${gradient} text-white`}
                >
                  <CardContent className="flex flex-col justify-between p-6 space-y-5">
                    {/* Icon */}
                    <div className="w-12 h-12 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md shadow-md">
                      <Icon className="w-6 h-6 text-white" />
                    </div>

                    {/* Value */}
                    <div className="text-4xl font-extrabold drop-shadow-md">
                      {stat.value}
                    </div>

                    {/* Title */}
                    <p className="text-base font-semibold uppercase opacity-90 tracking-wide">
                      {stat.title}
                    </p>

                    {/* Trend */}
                    <div className="flex items-center space-x-2 mt-2 text-white/90">
                      {stat.trend === "up" ? (
                        <TrendingUp className="w-5 h-5 text-green-200" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-200" />
                      )}
                      <span
                        className={`text-sm font-medium ${
                          stat.trend === "up"
                            ? "text-green-100"
                            : "text-red-100"
                        }`}
                      >
                        {stat.change}
                      </span>
                      <span className="text-xs sm:text-sm text-white/80">
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
