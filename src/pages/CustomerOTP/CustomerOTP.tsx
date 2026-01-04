import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Loader2, Calendar } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface OTPRecord {
  id: string;
  phone: string;
  email: string | null;
  loan_type: string;
  details: string;
  status: string;
  updated_at: string;
}

const CustomerOTPTable: React.FC = () => {
  const [search, setSearch] = useState("");
  const [loanTypeFilter, setLoanTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [showDateModal, setShowDateModal] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [dateFilter, setDateFilter] = useState({ from: "", to: "" });
  
  const [loading, setLoading] = useState(false);
  const [otpRecords, setOtpRecords] = useState<OTPRecord[]>([]);
  
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const { toast } = useToast();

  const fetchOTPData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/application_auth/verification_data?page=${page}&limit=10`);
      if (!response.ok) {
        throw new Error('Failed to fetch OTP data');
      }
      const data = await response.json();
      setOtpRecords(data.data || []);
      setTotal(data.pagination?.total || 0);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch OTP verification data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOTPData();
  }, [page]);

  const formatDate = (date: string) => {
    const utcDate = new Date(date);
    const day = utcDate.getUTCDate().toString().padStart(2, '0');
    const month = utcDate.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
    const year = utcDate.getUTCFullYear();
    return `${day} ${month} ${year}`;
  };

  const goToPage = (p: number) => {
    const clamped = Math.max(1, Math.min(totalPages, p));
    if (clamped === page) return;
    setPage(clamped);
  };

  const filteredRecords = otpRecords.filter((record) => {
    let matches = true;
    
    if (search.trim()) {
      matches = matches && (
        record.id.toLowerCase().includes(search.toLowerCase()) ||
        record.phone.includes(search)
      );
    }
    
    if (loanTypeFilter !== "all") {
      matches = matches && record.loan_type.toLowerCase().includes(loanTypeFilter.toLowerCase());
    }
    
    if (dateFilter.from || dateFilter.to) {
      const recordDate = new Date(record.date);
      if (dateFilter.from && recordDate < new Date(dateFilter.from)) matches = false;
      if (dateFilter.to && recordDate > new Date(dateFilter.to + "T23:59:59")) matches = false;
    }
    
    return matches;
  });

  return (
    <motion.div
      className="bg-white h-[93dvh] overflow-scroll rounded-xl p-6 shadow-lg"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div>
        <h1 className="text-3xl font-bold mb-2">Customer Leads Management</h1>
        <p className="mb-6 text-gray-500 text-[14px]">
          Monitor and track customer leads with verified OTP status across all loan applications.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <div className="w-full md:w-2/3 flex gap-3 items-center">
          <Input
            placeholder="Search by ID or phone..."
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            className="w-full md:w-80"
          />
        </div>

        <div className="flex items-center gap-3">
          <Select
            value={loanTypeFilter}
            onValueChange={(v) => {
              setPage(1);
              setLoanTypeFilter(v);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by loan type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="personal">Personal</SelectItem>
              <SelectItem value="vehicle">Vehicle</SelectItem>
              <SelectItem value="business">Business</SelectItem>
              <SelectItem value="home">Home</SelectItem>
              <SelectItem value="gold">Gold</SelectItem>
              <SelectItem value="education">Education</SelectItem>
              <SelectItem value="insurance">Insurance</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            onClick={() => setShowDateModal(true)}
            className="flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Date Filter Modal */}
      {showDateModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Filter by Date</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">From Date</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">To Date</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDateModal(false);
                  setFromDate("");
                  setToDate("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setDateFilter({ from: fromDate, to: toDate });
                  setShowDateModal(false);
                  setPage(1);
                }}
              >
                Apply Filter
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Loading / Table */}
      {loading ? (
        <div className="flex justify-center items-center py-20 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading OTP records...
        </div>
      ) : filteredRecords.length === 0 ? (
        <p className="text-center text-gray-500 py-10">No OTP records found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border rounded-md text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="px-4 py-3 border">ID</th>
                <th className="px-4 py-3 border">Phone</th>
                <th className="px-4 py-3 border">Loan Type</th>
                <th className="px-4 py-3 border">Date</th>
                <th className="px-4 py-3 border">Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredRecords.map((record, i) => (
                <tr key={record.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-4 py-3 border font-medium">{record.id}</td>
                  <td className="px-4 py-3 border">{record.phone}</td>
                  <td className="px-4 py-3 border">{record.loan_type.replace('_', ' ')}</td>
                  <td className="px-4 py-3 border">{formatDate(record.updated_at)}</td>
                  <td className="px-4 py-3 border">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      record.status === 'verifying' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-between items-center mt-6">
        <Button variant="outline" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
          Previous
        </Button>

        <p className="text-sm text-gray-600">
          Page {page} of {totalPages} • {filteredRecords.length} of {total} records
        </p>

        <Button variant="outline" disabled={page >= totalPages} onClick={() => goToPage(page + 1)}>
          Next
        </Button>
      </div>
    </motion.div>
  );
};

export default CustomerOTPTable;