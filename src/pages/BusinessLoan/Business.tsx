import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Info, Loader2, ArrowLeft } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/lib/api";
import { motion } from "framer-motion";

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

const fieldLabelMap: Record<string, string> = {
  full_name: "Full Name",
  email_address: "Email Address",
  contact_number: "Contact Number",
  amount: "Desired Loan Amount",
  loan_type: "Loan Type",
  status: "Application Status",
  status_reason: "Status Reason",
  created_at: "Created On",
};

const formatKey = (key: string) =>
  fieldLabelMap[key] || key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const BusinessTable: React.FC = () => {
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const { toast } = useToast();

  const [showDetails, setShowDetails] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);

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
    try {
      const params = new URLSearchParams({
        table: "business_loans",
        page: page.toString(),
        limit: limit.toString(),
      });

      const res = await fetch(`${API_BASE_URL}/api/loans?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch loans");

      const data = await res.json();
      if (!data.success || !data.data) throw new Error("Invalid data format");

      let filtered: LoanApplication[] = data.data.map((loan: any) => ({
        id: loan.id,
        full_name: loan.fullname,
        email_address: loan.email || loan.email_address || "",
        contact_number: loan.mobile || loan.phone || "",
        amount: loan.desiredloanamount || "N/A",
        status: loan.status,
        status_reason: loan.reason || loan.status_reason || "",
        created_at: loan.created_at || loan.date || "",
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
        description: error.message || "Failed to fetch loans",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, [search, statusFilter, page]);

  const updateLoanStatus = async (loanId: string, newStatus: string) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/loans/business_loans/${loanId}/status`,
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

  const fetchLoanDetails = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/loans/business_loans/${id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedLoan(data.data);
        setShowDetails(true);
      } else {
        toast({
          title: "Error",
          description: "Failed to load loan details.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (showDetails && selectedLoan) {
    const entries = Object.entries(selectedLoan).filter(
      ([key, value]) =>
        key !== "id" &&
        key !== "created_at" &&
        key !== "updated_at" &&
        value !== null &&
        value !== "" &&
        !(typeof value === "object" && !Array.isArray(value))
    );

    return (
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setShowDetails(false)}
            className="flex items-center gap-2 border-blue-500 text-blue-600 hover:bg-blue-600 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <h1 className="text-2xl font-semibold text-gray-800">
            Business Loan Details
          </h1>
        </div>

        <div className="bg-gradient-to-r from-blue-800 via-blue-600 to-sky-400 text-white p-6 rounded-2xl shadow-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <h2 className="text-xl font-semibold">
                {selectedLoan.full_name || selectedLoan.fullname}
              </h2>
              <p className="text-sm opacity-90">
                {selectedLoan.contact_number || selectedLoan.mobile || selectedLoan.phone}
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex flex-col items-end">
              <span
                className={`text-sm font-medium px-3 py-1 rounded-full ${
                  selectedLoan.status === "approved"
                    ? "bg-green-600 text-white"
                    : selectedLoan.status === "rejected"
                    ? "bg-red-600 text-white"
                    : "bg-yellow-400 text-black"
                }`}
              >
                {selectedLoan.status?.toUpperCase()}
              </span>
              {selectedLoan.status_reason && (
                <p className="text-xs mt-2 italic opacity-90">
                  {selectedLoan.status_reason}
                </p>
              )}
            </div>
          </div>
        </div>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-blue-700 border-b pb-3 mb-4">
            Application Information
          </h2>
          <dl className="grid grid-cols-1 divide-y divide-gray-100">
            {entries.map(([key, value]) => (
              <div
                key={key}
                className="flex justify-between items-center py-3 px-2 rounded-lg transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100"
              >
                <dt className="font-medium text-gray-700">{formatKey(key)}:</dt>
                <dd className="text-gray-900 text-right">
                  {typeof value === "boolean" ? (value ? "Yes" : "No") : String(value)}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    );
  }

  return (
    <div className="max-w-full p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-900">Business Loans</h2>

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

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Phone</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Amount</th>
              <th className="text-left p-3">Created On</th>
              <th className="text-left p-3">Actions</th>
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
                <td colSpan={7} className="p-6 text-center text-gray-500">
                  No loans found.
                </td>
              </tr>
            ) : (
              loans.map((loan) => (
                <tr key={loan.id} className="hover:bg-gray-50">
                  <td className="p-3 border-b">{loan.full_name}</td>
                  <td className="p-3 border-b">{loan.contact_number}</td>
                  <td className="p-3 border-b">
                    <Select
                      value={loan.status.toLowerCase()}
                      onValueChange={(val) => {
                        setLoans((prev) =>
                          prev.map((l) => (l.id === loan.id ? { ...l, status: val } : l))
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
                  <td className="p-3 border-b">{loan.amount}</td>
                  <td className="p-3 border-b">
                    {new Date(loan.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-3 border-b">
                    <Info
                      className="h-5 w-5 inline cursor-pointer text-blue-600 hover:text-blue-800"
                      onClick={() => fetchLoanDetails(loan.id)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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

export default BusinessTable;
