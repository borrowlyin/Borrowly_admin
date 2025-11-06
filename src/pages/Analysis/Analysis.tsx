import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell } from "recharts";
import { DollarSign, Users, FileText, TrendingUp, User, Briefcase, GraduationCap, Coins, Home, ShieldCheck, Car, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useAnalyticsCache } from "@/hooks/useAnalyticsCache";
type TimePeriod = "today" | "3days" | "1week" | "10days" | "1month" | "1year";

const Analysis = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("1month");
  const { data, loading, isRefreshing, lastUpdated, refetch } = useAnalyticsCache(selectedPeriod);

  const convertPaisaToRupee = (paisa: number) => paisa / 100;
  const formatAmount = (amount: number) => amount.toFixed(2);

  const getLoanAmount = (loanType: string) => {
    const loan = data?.breakdown.find(item => item.loan_type === loanType);
    return loan ? convertPaisaToRupee(parseInt(loan.total_amount)) : 0;
  };

  const chartData = data?.breakdown.map(item => ({
    loan_type: item.loan_type.replace('Loan', ''),
    amount: convertPaisaToRupee(parseInt(item.total_amount)),
    applications: parseInt(item.total_applications)
  })) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-2">Comprehensive loan analytics and insights</p>
          </div>
        <div className="flex items-center gap-4">
          {lastUpdated && (
            <div className="flex items-center gap-3">
              <div className="flex items-center text-sm text-gray-500">
                <RefreshCw className={`w-4 h-4 mr-1 ${isRefreshing ? 'animate-spin text-blue-500' : ''}`} />
                <span className={isRefreshing ? 'text-blue-500' : ''}>
                  {isRefreshing ? 'Refreshing...' : `Last updated: ${lastUpdated.toLocaleTimeString('en-US', { hour12: true, hour: 'numeric', minute: '2-digit' })}`}
                </span>
              </div>
              <button
                onClick={refetch}
                disabled={isRefreshing}
                className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Refresh Now
              </button>
            </div>
          )}
          <Select value={selectedPeriod} onValueChange={(value: TimePeriod) => setSelectedPeriod(value)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select time period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="3days">Last 3 Days</SelectItem>
              <SelectItem value="1week">Last 1 Week</SelectItem>
              <SelectItem value="10days">Last 10 Days</SelectItem>
              <SelectItem value="1month">Last 1 Month</SelectItem>
              <SelectItem value="1year">Last 1 Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-600/5"></div>
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-xl font-semibold text-gray-800">Total Amount</CardTitle>
              <div className="p-3 bg-blue-500/10 rounded-full">
                <DollarSign className="h-7 w-7 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-5xl font-bold text-blue-700 mb-3">₹{formatAmount(convertPaisaToRupee(data?.summary.total_amount || 0))}</div>
              <p className="text-sm text-emerald-600 font-medium">↗ +12% from last month</p>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5"></div>
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-xl font-semibold text-gray-800">Total Enquiries</CardTitle>
              <div className="p-3 bg-emerald-500/10 rounded-full">
                <Users className="h-7 w-7 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-5xl font-bold text-emerald-700 mb-3">{data?.summary.total_applications.toLocaleString() || 0}</div>
              <p className="text-sm text-emerald-600 font-medium">↗ +8% from last month</p>
            </CardContent>
          </Card>
        </div>

      {/* Loan Types Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-100 to-blue-50 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Personal Loan</CardTitle>
            <User className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-blue-700">₹{formatAmount(getLoanAmount('PersonalLoan'))}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-100 to-green-50 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Business Loan</CardTitle>
            <Briefcase className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-green-700">₹{formatAmount(getLoanAmount('BusinessLoan'))}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-100 to-purple-50 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Education Loan</CardTitle>
            <GraduationCap className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-purple-700">₹{formatAmount(getLoanAmount('EducationLoan'))}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-100 to-yellow-50 border-yellow-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-800">Gold Loan</CardTitle>
            <Coins className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-yellow-700">₹{formatAmount(getLoanAmount('GoldLoan'))}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-100 to-indigo-50 border-indigo-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-indigo-800">Home Loan</CardTitle>
            <Home className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-indigo-700">₹{formatAmount(getLoanAmount('HomeLoan'))}</div>
          </CardContent>
        </Card>



        <Card className="bg-gradient-to-br from-teal-100 to-teal-50 border-teal-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-teal-800">Vehicle Loan</CardTitle>
            <Car className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-teal-700">₹{formatAmount(getLoanAmount('VehicleLoan'))}</div>
          </CardContent>
        </Card>
      </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Loan Amount by Type
              </CardTitle>
            </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[300px] flex items-center justify-center text-gray-500 font-medium">
                Loading...
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="loan_type" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`₹${formatAmount(Number(value))}`, "Amount"]} />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorAmount)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No loan data found
              </div>
            )}
          </CardContent>
        </Card>

          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Applications by Loan Type
              </CardTitle>
            </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="applications"
                  label={({ loan_type, applications }) => `${loan_type}: ${applications}`}
                >
                  {chartData.map((entry, index) => {
                    const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#6366f1', '#ef4444', '#14b8a6'];
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                  })}
                </Pie>
                <Tooltip formatter={(value) => [value, "Applications"]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Analysis;