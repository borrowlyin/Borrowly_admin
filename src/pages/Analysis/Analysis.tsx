import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { DollarSign, Users, FileText, TrendingUp, User, Briefcase, GraduationCap, Coins, Home, ShieldCheck, Car } from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "@/lib/api";
interface ApiResponse {
  summary: {
    total_amount: number;
    total_applications: number;
  };
  breakdown: {
    loan_type: string;
    total_amount: string;
    total_applications: string;
  }[];
}

type TimePeriod = "today" | "3days" | "1week" | "10days" | "1month" | "1year";

const Analysis = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("1month");
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async (range: TimePeriod) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/payments/analysis?range=${range}`);
      setData(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(selectedPeriod);
  }, [selectedPeriod]);

  const convertPaisaToRupee = (paisa: number) => paisa / 100;

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
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
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
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">₹{convertPaisaToRupee(data?.summary.total_amount || 0).toLocaleString()}</div>
            <p className="text-xs text-green-600">+12% from last month</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 bg-gradient-to-r from-green-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enquiries</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{data?.summary.total_applications.toLocaleString() || 0}</div>
            <p className="text-xs text-green-600">+8% from last month</p>
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
            <div className="text-xl font-bold text-blue-700">₹{getLoanAmount('PersonalLoan').toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-100 to-green-50 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Business Loan</CardTitle>
            <Briefcase className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-green-700">₹{getLoanAmount('BusinessLoan').toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-100 to-purple-50 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Education Loan</CardTitle>
            <GraduationCap className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-purple-700">₹{getLoanAmount('EducationLoan').toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-100 to-yellow-50 border-yellow-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-800">Gold Loan</CardTitle>
            <Coins className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-yellow-700">₹{getLoanAmount('GoldLoan').toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-100 to-indigo-50 border-indigo-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-indigo-800">Home Loan</CardTitle>
            <Home className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-indigo-700">₹{getLoanAmount('HomeLoan').toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-100 to-red-50 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Insurance Loan</CardTitle>
            <ShieldCheck className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-red-700">₹{getLoanAmount('InsuranceLoan').toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-teal-100 to-teal-50 border-teal-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-teal-800">Vehicle Loan</CardTitle>
            <Car className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-teal-700">₹{getLoanAmount('VehicleLoan').toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Loan Amount by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="loan_type" />
                <YAxis />
                <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, "Amount"]} />
                <Bar dataKey="amount" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Applications by Loan Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="loan_type" />
                <YAxis />
                <Tooltip formatter={(value) => [value, "Applications"]} />
                <Line type="monotone" dataKey="applications" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analysis;