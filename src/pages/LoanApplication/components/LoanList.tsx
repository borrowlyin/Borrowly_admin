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
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";
interface LoanApplication {
  id: string;
  full_name: string;
  email_address: string;
  contact_number: string;
  loan_type: string;
  status: string;
  status_reason?: string;
  created_at: string;
}

const LoanList: React.FC = () => {
  const [allLoans, setAllLoans] = useState<LoanApplication[]>([]);
  const [filteredLoans, setFilteredLoans] = useState<LoanApplication[]>([]);
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
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [selectedLoanType, setSelectedLoanType] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [reason, setReason] = useState<string>("");

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "text-green-600 font-semibold";
      case "pending":
        return "text-orange-500 font-semibold";
      case "rejected":
      case "cancel":
        return "text-red-600 font-semibold";
      default:
        return "text-gray-700";
    }
  };


  const fetchLoans = async () => {
    setLoading(true);

    const loanTables = [
      "personal_loans",
      "home_loans",
      "business_loans",
      "gold_loans",
      "education_loans",
      "vehicle_loans",
      "insurance_loans",
    ];

    try {
      const allLoansFetched: LoanApplication[] = [];

      for (const table of loanTables) {
        const response = await fetch(
          `${API_BASE_URL}/api/loans/getallloans?table=${table}&page=1&limit=1000`
        );

        if (!response.ok) throw new Error(`Failed to fetch ${table}`);

        const result = await response.json();

        if (result.success && Array.isArray(result.data)) {
          const typeName = table
            .replace("_loans", " Loan")
            .replace("_", " ")
            .replace(/\b\w/g, (c) => c.toUpperCase());

          result.data.forEach((loan: any) => {
            allLoansFetched.push({
              id: loan.id,
              full_name:
                loan.full_name || loan.name || loan.studentfullname || loan.fullname || "",
              email_address: loan.email || loan.email_address || "",
              contact_number: loan.mobile || loan.phone || "",
              loan_type: typeName,
              status: loan.status ? loan.status.toLowerCase() : "pending",
              status_reason: loan.reason || loan.status_reason || "",
              created_at:
                loan.created_at || loan.createdAt || loan.createdat || "",
            });
          });
        }
      }
      allLoansFetched.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setAllLoans(allLoansFetched);
      setFilteredLoans(allLoansFetched);
      setTotal(allLoansFetched.length);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to fetch loan data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  useEffect(() => {
    let filtered = [...allLoans];

    if (search.trim()) {
      filtered = filtered.filter(
        (loan) =>
          loan.full_name.toLowerCase().includes(search.toLowerCase()) ||
          loan.email_address.toLowerCase().includes(search.toLowerCase()) ||
          loan.contact_number.includes(search)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (loan) => loan.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    if (loanTypeFilter !== "all") {
      filtered = filtered.filter(
        (loan) =>
          loan.loan_type.toLowerCase().trim() ===
          loanTypeFilter.toLowerCase().trim()
      );
    }

    setFilteredLoans(filtered);
    setTotal(filtered.length);
    setPage(1);
  }, [search, statusFilter, loanTypeFilter, allLoans]);

  const updateLoanStatus = async (loanId: string, loanType: string, newStatus: string) => {
    try {
      const typeMap: Record<string, string> = {
        "personal": "personal_loans",
        "vehicle": "vehicle_loans",
        "business": "business_loans",
        "education": "education_loans",
        "home": "home_loans",
        "gold": "gold_loans",
        "insurance": "insurance_loans",
      };
      const cleanType = loanType.toLowerCase().replace("loan", "").trim();
      const table = typeMap[cleanType] || "personal_loans";

      const res = await fetch(
        `${API_BASE_URL}/api/loans/${table}/${loanId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update status");
      }

      toast({
        title: "Status Updated",
        description: `Loan marked as ${newStatus}`,
      });

      fetchLoans(); // ✅ refresh table
    } catch (error: any) {
      toast({
        title: "Error Updating Status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // const handleStatusChange = (loanId: string, loanType: string, status: string) => {
  //   if (status === "rejected" || status === "cancel") {
  //     setSelectedLoanId(loanId);
  //     setSelectedLoanType(loanType);
  //     setNewStatus(status);
  //     setReason("");
  //     setShowReasonModal(true);
  //   } else {
  //     updateLoanStatus(loanId, loanType, status);
  //   }
  // };
  const handleStatusChange = (loanId: string, loanType: string, status: string) => {
    updateLoanStatus(loanId, loanType, status);
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
  const currentLoans = filteredLoans.slice((page - 1) * limit, page * limit);

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
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-80"
        />

        <Select
          value={statusFilter}
          onValueChange={(val) => setStatusFilter(val)}
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
          onValueChange={(val) => setLoanTypeFilter(val)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by loan type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="Personal Loan">Personal Loan</SelectItem>
            <SelectItem value="Insurance Loan">Insurance Loan</SelectItem>
            <SelectItem value="Vehicle Loan">Vehicle Loan</SelectItem>
            <SelectItem value="Education Loan">Education Loan</SelectItem>
            <SelectItem value="Business Loan">Business Loan</SelectItem>
            <SelectItem value="Home Loan">Home Loan</SelectItem>
            <SelectItem value="Gold Loan">Gold Loan</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center items-center py-20 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading loan applications...
        </div>
      ) : currentLoans.length === 0 ? (
        <p className="text-center text-gray-500 py-10">
          No loan applications found.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border rounded-md text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="px-4 py-3 border">Name</th>
                {/* <th className="px-4 py-3 border">Email</th> */}
                <th className="px-4 py-3 border">Phone</th>
                <th className="px-4 py-3 border">Loan Type</th>
                <th className="px-4 py-3 border">Status</th>
                {/* <th className="px-4 py-3 border">Reason</th> */}
                <th className="px-4 py-3 border">Created At</th>
              </tr>
            </thead>
            <tbody>
              {currentLoans.map((loan, i) => (
                <tr key={loan.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-4 py-3 border">{loan.full_name}</td>
                  {/* <td className="px-4 py-3 border">{loan.email_address}</td> */}
                  <td className="px-4 py-3 border">{loan.contact_number}</td>
                  <td className="px-4 py-3 border">{loan.loan_type}</td>
                  <td className="px-4 py-3 border">
                    <Select
                      value={loan.status}
                      onValueChange={(val) =>
                        handleStatusChange(loan.id, loan.loan_type, val)
                      }
                    >
                      <SelectTrigger className={`w-28 ${getStatusColor(loan.status)}`}>
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
                  {/* <td className="px-4 py-3 border">{loan.status_reason || "-"}</td> */}
                  <td className="px-4 py-3 border">{formatDate(loan.created_at)}</td>
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
      {/* {showReasonModal && (
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
                  if (!reason && newStatus === "rejected") {
                    toast({
                      title: "Error",
                      description:
                        "Please enter a reason for rejection/cancellation.",
                      variant: "destructive",
                    });
                    return;
                  }
                  if (selectedLoanId && selectedLoanType)
                    updateStatus(selectedLoanId, selectedLoanType, newStatus, reason);
                  setShowReasonModal(false);
                }}
              >
                Submit
              </Button>
            </div>
          </div>
        </div>
      )} */}
    </motion.div>
  );
};

export default LoanList;
