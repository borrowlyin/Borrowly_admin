import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Mail,
  FileText,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "@/lib/api";

// ---------- TYPES ----------
interface Stat {
  title: string;
  value: number | string;
  change: string;
  trend: "up" | "down";
  route?: string | null;
}

interface LoanType {
  rank: number;
  loan_type: string;
  total_querries: number;
  statusCounts: {
    pending: number;
    approved: number;
    rejected: number;
    cancelled: number;
  };
}

// ---------- ICON & COLOR MAPS ----------
const iconMap: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  "loan enquiries": FileText,
  "contacted candidates": Mail,
  "pending loans": TrendingUp,
  "approved loans": TrendingUp,
  "rejected loans": TrendingDown,
  "cancelled loans": TrendingDown,
};

const colorMap: Record<string, string> = {
  "loan enquiries": "from-blue-500 via-blue-400 to-indigo-500",
  "contacted candidates": "from-blue-500 via-blue-400 to-indigo-500",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-gray-200 text-gray-700",
};

// ---------- DASHBOARD COMPONENT ----------
const DashboardStats: React.FC = () => {
  const [stats, setStats] = useState<Stat[]>([]);
  const [loanTypes, setLoanTypes] = useState<LoanType[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
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

        // ---------- STATS ----------
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

        // ---------- LOAN TYPES ----------
        const loansArray: LoanType[] = Object.entries(data.loans || {}).map(
          ([loanTypeKey, loanData], index) => ({
            rank: index + 1,
            loan_type: loanTypeKey.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase()),
            total_querries: loanData.totalApplicants ?? 0,
            statusCounts: loanData.statusCounts ?? {
              pending: 0,
              approved: 0,
              rejected: 0,
              cancelled: 0,
            },
          })
        );
        setLoanTypes(loansArray);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCardClick = (route: string | null | undefined) => {
    if (route) navigate(route);
  };

  const formatNumber = (num: number) => new Intl.NumberFormat("en-IN").format(num);

  // ---------- SKELETON LOADER ----------
  if (loading) {
    return (
      <div className="space-y-8">
        {/* Dashboard Stats Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(2)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="bg-gray-200 animate-pulse h-52 rounded-2xl shadow"
              >
                <div className="flex flex-col justify-between p-6 h-full space-y-4">
                  <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                  <div className="h-8 bg-gray-300 rounded-md w-3/4"></div>
                  <div className="h-5 bg-gray-300 rounded-md w-1/2"></div>
                  <div className="flex space-x-2">
                    <div className="h-4 bg-gray-300 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/6"></div>
                  </div>
                </div>
              </div>
            ))}
        </div>

        {/* Loan Types Skeleton */}
        <Card className="shadow-md mt-6">
          <CardHeader>
            <CardTitle>Total Loan Enquiry Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array(6)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    className="bg-gray-200 animate-pulse h-56 rounded-xl shadow p-5"
                  ></div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ---------- DASHBOARD STATS ---------- */}
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
                  <div className="w-12 h-12 flex items-center justify-center rounded-full bg-white/20 backdrop-blur-md shadow-md">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-4xl font-extrabold drop-shadow-md">{stat.value}</div>
                  <p className="text-base font-semibold uppercase opacity-90 tracking-wide">{stat.title}</p>
                  <div className="flex items-center space-x-2 mt-2 text-white/90">
                    {stat.trend === "up" ? (
                      <TrendingUp className="w-5 h-5 text-green-200" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-200" />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        stat.trend === "up" ? "text-green-100" : "text-red-100"
                      }`}
                    >
                      {stat.change}
                    </span>
                    <span className="text-xs sm:text-sm text-white/80">vs last month</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* ---------- TOP LOAN TYPES ---------- */}
      <Card className="shadow-md mt-6">
        <CardHeader>
          <CardTitle>Total Loan Enquiry Types</CardTitle>
        </CardHeader>
        <CardContent>
          {loanTypes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {loanTypes.map((loan) => (
                <div
                  key={loan.rank}
                  className="bg-white rounded-xl shadow hover:shadow-lg transition-transform transform hover:scale-[1.02] p-5 border border-gray-100"
                >
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{loan.loan_type}</h3>
                  </div>

                  <p className="text-gray-700 mb-4">
                    <span className="font-medium">{formatNumber(loan.total_querries)}</span> total enquiries
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(loan.statusCounts).map(([status, count]) => (
                      <div
                        key={status}
                        className={`flex flex-col items-center justify-center p-3 rounded-lg ${statusColors[status]}`}
                      >
                        <p className="font-semibold capitalize">{status}</p>
                        <p className="text-lg font-bold">{count}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-10">No loan types found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardStats;
