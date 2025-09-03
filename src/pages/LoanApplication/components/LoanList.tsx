import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/lib/api";

interface LoanApplication {
  id: number;
  full_name: string;
  email_address: string;
  contact_number: string;
  loan_type: string;
  status: string;
  status_reason?: string;
  created_at: string;
  modified_status_time?: string;
}

const LoanList: React.FC = () => {
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loanTypeFilter, setLoanTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const { toast } = useToast();

  // Modal states
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState<number | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [reason, setReason] = useState<string>("");

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("limit", String(limit));
      if (search) params.append("search", search);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (loanTypeFilter !== "all") params.append("loanType", loanTypeFilter);

      const res = await fetch(
        `${API_BASE_URL}/api/loan-applications?${params.toString()}`
      );
      const data = await res.json();
      setLoans(data.data || []);
      setTotal(data.total || 0);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch loan applications.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, [page, search, statusFilter, loanTypeFilter]);

  const updateStatus = async (
    id: number,
    status: string,
    status_reason?: string
  ) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/loan-applications/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, status_reason }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      const updated = await res.json();
      setLoans((prev) =>
        prev.map((loan) => (loan.id === id ? { ...loan, ...updated } : loan))
      );
      toast({
        title: "Updated",
        description: `Status updated to "${status}"`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update loan status.",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = (loanId: number, status: string) => {
    if (status === "rejected" || status === "cancel") {
      setSelectedLoanId(loanId);
      setNewStatus(status);
      setReason(""); // reset reason
      setShowReasonModal(true);
    } else {
      updateStatus(loanId, status);
    }
  };

  const formatDate = (date?: string) =>
    date
      ? new Date(date).toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      : "-";

  const totalPages = Math.ceil(total / limit);

  return (
    <motion.div
      className="bg-white rounded-xl p-6 shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Top Controls */}
      <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
        <Input
          placeholder="Search loans..."
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          className="w-full md:w-80"
        />

        <Select
          value={statusFilter}
          onValueChange={(val) => {
            setPage(1);
            setStatusFilter(val);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="cancel">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={loanTypeFilter}
          onValueChange={(val) => {
            setPage(1);
            setLoanTypeFilter(val);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by loan type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="Personal Loan">Personal Loan</SelectItem>
            <SelectItem value="Insurance">Insurance</SelectItem>
            <SelectItem value="Vehicle Loans">Vehicle Loans</SelectItem>
            <SelectItem value="Education Loan">Education Loan</SelectItem>
             <SelectItem value="Business Loan">Business Loan</SelectItem>
              <SelectItem value="Home Loan">Home Loan</SelectItem>

          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center items-center py-20 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading loan applications...
        </div>
      ) : loans.length === 0 ? (
        <p className="text-center text-gray-500 py-10">No loan applications found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border rounded-md text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="px-4 py-3 border">Name</th>
                <th className="px-4 py-3 border">Email</th>
                <th className="px-4 py-3 border">Phone</th>
                <th className="px-4 py-3 border">Loan Type</th>
                <th className="px-4 py-3 border">Status</th>
                <th className="px-4 py-3 border">Reason</th>
                <th className="px-4 py-3 border">Created At</th>
                <th className="px-4 py-3 border">Modified At</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan, i) => (
                <tr key={loan.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-4 py-3 border">{loan.full_name}</td>
                  <td className="px-4 py-3 border">{loan.email_address}</td>
                  <td className="px-4 py-3 border">{loan.contact_number}</td>
                  <td className="px-4 py-3 border">{loan.loan_type}</td>
                  <td className="px-4 py-3 border">
                     <Select
    value={loan.status}
    onValueChange={(val) => handleStatusChange(loan.id, val)}
    disabled={loan.status === "approved" || loan.status === "rejected" || loan.status === "cancel"}
  >
    <SelectTrigger className="w-28">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="pending">Pending</SelectItem>
      <SelectItem value="approved">Approved</SelectItem>
      <SelectItem value="rejected">Rejected</SelectItem>
      <SelectItem value="cancel">Cancelled</SelectItem>
    </SelectContent>
  </Select>
                  </td>
                  <td className="px-4 py-3 border">{loan.status_reason || "-"}</td>
                  <td className="px-4 py-3 border">{formatDate(loan.created_at)}</td>
                  <td className="px-4 py-3 border">{formatDate(loan.modified_status_time)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <p className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </p>
          <Button
            variant="outline"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Reason Modal */}
      {showReasonModal && (
  <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
    <div className="bg-white rounded-2xl p-8 w-1/2 max-w-xl h-[400px] flex flex-col justify-between shadow-lg">
      <h2 className="text-2xl font-semibold mb-6 text-left text-gray-800">
        Enter Reason
      </h2>
      <textarea
        className="flex-1 w-full border border-gray-300 rounded-lg p-4 mb-6 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
        placeholder="Reason for rejection/cancellation"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          className="px-6 py-2"
          onClick={() => setShowReasonModal(false)}
        >
          Cancel
        </Button>
        <Button
          className="px-6 py-2"
          onClick={() => {
            if (selectedLoanId) updateStatus(selectedLoanId, newStatus, reason);
            setShowReasonModal(false);
          }}
        >
          Submit
        </Button>
      </div>
    </div>
  </div>
)}

    </motion.div>
  );
};

export default LoanList;
