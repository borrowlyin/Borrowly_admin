import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";

import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Info } from "lucide-react";
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
  amount: string;
  loan_type: string;
  status: string;
  status_reason?: string;
  created_at: string;

}

const VehicleTable: React.FC = () => {
  const navigate = useNavigate();
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const [apiMessage, setApiMessage] = useState<string>("");
  const { toast } = useToast();

  const [showReasonModal, setShowReasonModal] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<string>("");
  const [reason, setReason] = useState<string>("");

const handleViewDetails = (id: string, table: string) => {
  navigate("/VehicleLoanDetails", {
    state: { id, table },
  });
};

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

  const table = "vehicle_loans";

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        table: table,
        page: page.toString(),
        limit: limit.toString(),
      });

      const res = await fetch(`${API_BASE_URL}/api/loans?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch loans");

      const data = await res.json();
      if (!data.success || !data.data) throw new Error("Invalid data format");
      setApiMessage(data.message || "No data found");
      let filtered: LoanApplication[] = data.data.map((loan: any) => ({
        id: loan.id,
        full_name: loan.fullname,
        email_address: loan.emailaddress || "",
        contact_number: loan.mobile || loan.phone || "",
        amount: loan.desiredloanamount || "N/A",
        status: loan.status,
        status_reason: loan.reason || loan.status_reason || "",
        created_at: loan.createdat || "",
      }));
      if (search.trim()) {
        filtered = filtered.filter((loan) =>
          loan.full_name.toLowerCase().includes(search.toLowerCase())
        );
      }

      if (statusFilter !== "all") {
        filtered = filtered.filter(
          (loan) => loan.status.toLowerCase() === statusFilter.toLowerCase()
        );
      }

      setTotal(data.total);

      setLoans(filtered);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchLoans();
  }, [search, statusFilter, page]);

  // const openReasonModal = (loanId: string, currentStatus: string) => {
  //   setSelectedLoanId(loanId);
  //   setNewStatus(currentStatus);
  //   setReason("");
  //   setShowReasonModal(true);
  // };

  const closeReasonModal = () => {
    setShowReasonModal(false);
    setSelectedLoanId(null);
  };

  const updateLoanStatus = async (loanId: string, newStatus: string) => {
    try {
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

      fetchLoans();
    } catch (error: any) {
      toast({
        title: "Error Updating Status",
        description: error.message,
        variant: "destructive",
      });
    }
  };


  return (
    <div className="max-w-full p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
        Personal Loans
      </h2>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-3 sm:space-y-0">
        <Input
          type="search"
          placeholder="Search by Full Name"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-xs"
        />

        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="max-w-xs">
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="cancel">Cancel</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th className="text-left p-3 border-b border-gray-200 dark:border-gray-700">Name</th>
              {/* <th className="text-left p-3 border-b border-gray-200 dark:border-gray-700">Email</th> */}
              <th className="text-left p-3 border-b border-gray-200 dark:border-gray-700">Phone</th>
              <th className="text-left p-3 border-b border-gray-200 dark:border-gray-700">Status</th>
              <th className="text-left p-3 border-b border-gray-200 dark:border-gray-700">Amount</th>
              <th className="text-left p-3 border-b border-gray-200 dark:border-gray-700">Created On</th>
              <th className="text-left p-3 border-b border-gray-200 dark:border-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="p-6 text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-500" />
                </td>
              </tr>
            ) : loans.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-gray-500 dark:text-gray-400">
                  {apiMessage || "No loans found."}
                </td>
              </tr>
            ) : (
              loans.map((loan) => (
                <tr key={loan.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="p-3 border-b border-gray-200 dark:border-gray-700">{loan.full_name}</td>
                  {/* <td className="p-3 border-b border-gray-200 dark:border-gray-700">{loan.email_address}</td> */}
                  <td className="p-3 border-b border-gray-200 dark:border-gray-700">{loan.contact_number}</td>
                  <td className="p-3 border-b border-gray-200 dark:border-gray-700">
                    <Select
                      value={loan.status.toLowerCase()}
                      onValueChange={(val) => {
                        setLoans((prevLoans) =>
                          prevLoans.map((l) => (l.id === loan.id ? { ...l, status: val } : l))
                        );
                        updateLoanStatus(loan.id, val);
                      }}
                    >
                      <SelectTrigger className={getStatusColor(loan.status) + " max-w-[150px]"}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="cancel">Cancel</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-3 border-b border-gray-200 dark:border-gray-700">{loan.amount}</td>
                  <td className="p-3 border-b border-gray-200 dark:border-gray-700">
                    {new Date(loan.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-3 border-b border-gray-200 dark:border-gray-700">
                    <Info className="h-5 w-5 inline" 
                    onClick={() => handleViewDetails(loan.id,table)}/>
                  </td>
                </tr>
              ))
            )}
          </tbody>

        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex justify-between items-center">
        <Button
          variant="outline"
          disabled={page === 1}
          onClick={() => setPage((p) => Math.max(p - 1, 1))}
        >
          Previous
        </Button>
        <span>
          Page {page} of {Math.ceil(total / limit) || 1}
        </span>
        <Button
          variant="outline"
          disabled={page * limit >= total}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>


    </div>
  );
};

export default VehicleTable;
