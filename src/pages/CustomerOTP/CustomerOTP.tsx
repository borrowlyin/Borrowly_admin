import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Loader2, Calendar } from "lucide-react";
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
  customer_id: string;
  mobile_number: string;
  loan_type: string;
  date: string;
  otp_status: "verified";
}

const CustomerOTPTable: React.FC = () => {
  const [search, setSearch] = useState("");
  const [loanTypeFilter, setLoanTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [showDateModal, setShowDateModal] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [dateFilter, setDateFilter] = useState({ from: "", to: "" });
  
  // Mock data - replace with actual API call later
  const [loading] = useState(false);
  const [otpRecords] = useState<OTPRecord[]>([
    {
      id: "1",
      customer_id: "CUST001",
      mobile_number: "9876543210",
      loan_type: "Personal Loan",
      date: "2024-01-15T10:30:00Z",
      otp_status: "verified"
    },
    {
      id: "2", 
      customer_id: "CUST002",
      mobile_number: "9876543211",
      loan_type: "Vehicle Loan",
      date: "2024-01-14T14:20:00Z",
      otp_status: "verified"
    },
    {
      id: "3",
      customer_id: "CUST003", 
      mobile_number: "9876543212",
      loan_type: "Business Loan",
      date: "2024-01-13T09:15:00Z",
      otp_status: "verified"
    }
  ]);
  
  const totalPages = 1;
  const total = otpRecords.length;
  const { toast } = useToast();

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
        record.customer_id.toLowerCase().includes(search.toLowerCase()) ||
        record.mobile_number.includes(search)
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
            placeholder="Search by customer ID or mobile..."
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
                <th className="px-4 py-3 border">Customer ID</th>
                <th className="px-4 py-3 border">Mobile Number</th>
                <th className="px-4 py-3 border">Loan Type</th>
                <th className="px-4 py-3 border">Date</th>
                <th className="px-4 py-3 border">OTP Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredRecords.map((record, i) => (
                <tr key={record.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-4 py-3 border font-medium">{record.customer_id}</td>
                  <td className="px-4 py-3 border">{record.mobile_number}</td>
                  <td className="px-4 py-3 border">{record.loan_type}</td>
                  <td className="px-4 py-3 border">{formatDate(record.date)}</td>
                  <td className="px-4 py-3 border">
                    <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                      Verified
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