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

interface LoanApplication {
  id: string;
  fullname: string;
  email_address: string;
  mobile: string;
  amount: string;
  loan_type: string;
  status: string;
  status_reason?: string;
  created_at: string;
}

const HomeTable: React.FC = () => {
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [allLoans, setAllLoans] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const { toast } = useToast();

  const [selectedLoan, setSelectedLoan] = useState<LoanApplication | null>(null);

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
      table: "home_loans",
      page: page.toString(),
      limit: limit.toString(),
    });

    const res = await fetch(`${API_BASE_URL}/api/loans?${params.toString()}`);
    if (!res.ok) throw new Error("Failed to fetch loans");

    const data = await res.json();
    if (!data.success || !data.data) throw new Error("Invalid data format");

    const mapped: LoanApplication[] = data.data.map((loan: any) => ({
      id: loan.id,
      fullname: loan.fullname,
      email_address: loan.email || loan.email_address || "",
      mobile: loan.mobile || loan.phone || "",
      amount: loan.desiredloanamount || "N/A",
      status: loan.status,
      status_reason: loan.reason || loan.status_reason || "",
      created_at: loan.created_at || loan.date || "",
    }));

    setAllLoans(mapped);
    setLoans(mapped); // initial display
    setTotal(data.total);
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


  const fetchLoanDetails = async (loanId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/loans/home_loans/${loanId}`);
      if (!res.ok) throw new Error("Failed to fetch loan details");

      const data = await res.json();
      setSelectedLoan(data.data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch loan details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateLoanStatus = async (loanId: string, newStatus: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/loans/home_loans/${loanId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update status");
      }

      toast({ title: "Status Updated", description: `Loan marked as ${newStatus}` });
      fetchLoans();
    } catch (error: any) {
      toast({ title: "Error Updating Status", description: error.message, variant: "destructive" });
    }
  };

useEffect(() => {
  let filtered = [...allLoans];

  if (search.trim()) {
    filtered = filtered.filter((loan) =>
      loan.fullname.toLowerCase().includes(search.toLowerCase())
    );
  }

  if (statusFilter !== "all") {
    filtered = filtered.filter(
      (loan) => loan.status.toLowerCase() === statusFilter.toLowerCase()
    );
  }

  setLoans(filtered);
}, [search, statusFilter, allLoans]);

useEffect(() => {
  fetchLoans();
}, [page]);

  const fieldLabelMap: Record<string, string> = {
    fullname: "Full Name",
    emailaddress: "Email Address",
    mobile: "Mobile Number",
    amount: "Desired Loan Amount",
    loan_type: "Loan Type",
    status: "Application Status",
    reason: "Rejection Reason",
    created_at: "Created On",
  };

  const formatKey = (key: string) =>
    fieldLabelMap[key] || key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

if (loading) {
  return (
    <div className="max-w-full p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-3 sm:space-y-0">
        <div className="h-10 bg-gray-200 rounded w-64 animate-pulse" />
        <div className="h-10 bg-gray-200 rounded w-40 animate-pulse" />
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Phone</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Amount</th>
              <th className="text-left p-3">Created</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, idx) => (
              <tr key={idx} className="animate-pulse">
                <td className="p-3 h-6 bg-gray-200 rounded mb-2"></td>
                <td className="p-3 h-6 bg-gray-200 rounded mb-2"></td>
                <td className="p-3 h-6 bg-gray-200 rounded mb-2"></td>
                <td className="p-3 h-6 bg-gray-200 rounded mb-2"></td>
                <td className="p-3 h-6 bg-gray-200 rounded mb-2"></td>
                <td className="p-3 h-6 bg-gray-200 rounded mb-2"></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


  return (
    <div className="max-w-full p-6">
      {!selectedLoan ? (
        <>
          {/* Table Header */}
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Home Loans
          </h2>

          {/* Search & Filter */}
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

          {/* Loan Table */}
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full border-collapse">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="text-left p-3 border-b border-gray-200 dark:border-gray-700">Name</th>
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
                    <td colSpan={6} className="p-6 text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-500" />
                    </td>
                  </tr>
                ) : loans.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-gray-500 dark:text-gray-400">
                      No loans found.
                    </td>
                  </tr>
                ) : (
                  loans.map((loan) => (
                    <tr key={loan.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="p-3 border-b border-gray-200 dark:border-gray-700">{loan.fullname}</td>
                      <td className="p-3 border-b border-gray-200 dark:border-gray-700">{loan.mobile}</td>
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
                        <Info
                          className="h-5 w-5 inline cursor-pointer"
                          onClick={() => fetchLoanDetails(loan.id)}
                        />
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
        </>
      ) : (
        // === DETAIL VIEW ===
        <div className="space-y-6">
          <Button
            variant="outline"
            onClick={() => setSelectedLoan(null)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>

          <div className="bg-gradient-to-r from-blue-800 via-blue-600 to-sky-400 text-white p-6 rounded-2xl shadow-lg">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <div>
                <h2 className="text-xl font-semibold">{selectedLoan.fullname}</h2>
                <p className="text-sm opacity-90">{selectedLoan.mobile}</p>
              </div>
              <div className="mt-4 sm:mt-0 flex flex-col items-end">
                <span
                  className={`text-sm font-medium px-3 py-1 rounded-full ${
                    selectedLoan.status === "approved"
                      ? "bg-green-500 text-white"
                      : selectedLoan.status === "rejected"
                      ? "bg-red-500 text-white"
                      : "bg-yellow-400 text-black"
                  }`}
                >
                  {selectedLoan.status?.toUpperCase()}
                </span>
                {selectedLoan.status_reason && (
                  <p className="text-xs mt-2 italic opacity-90">{selectedLoan.status_reason}</p>
                )}
              </div>
            </div>
          </div>

          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-blue-700 border-b pb-3 mb-4">
              Application Information
            </h2>
            <dl className="grid grid-cols-1 divide-y divide-gray-100">
              {Object.entries(selectedLoan)
                .filter(
                  ([key, value]) =>
                    key !== "id" &&
                    key !== "created_at" &&
                    key !== "updated_at" &&
                    key !== "generated_user_id" &&
                    value !== null &&
                    value !== "" &&
                    !(typeof value === "object" && !Array.isArray(value))
                )
                .map(([key, value]) => (
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
      )}
    </div>
  );
};

export default HomeTable;
