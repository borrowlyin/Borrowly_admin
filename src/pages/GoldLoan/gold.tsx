import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Info, Loader2, FileText } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

import { API_BASE_URL } from "@/lib/api";

interface LoanApplication {
  id: string;
  full_name: string;
  email_address: string;
  mobile: string;
  amount: string;
  loan_type: string;
  status: string;
  status_reason?: string;
  created_at: string;
  pan_card_url?: string;
  aadhar_card_url?: string;
}

const GoldTable: React.FC = () => {
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const [allLoans, setAllLoans] = useState<LoanApplication[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<LoanApplication | null>(null);
  const [selectedDocUrl, setSelectedDocUrl] = useState<string | null>(null);
  const [docLoadError, setDocLoadError] = useState(false);

  const { toast } = useToast();

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

  const openDocument = async (url: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/files/sign-urls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: [url] }),
      });
      if (!res.ok) throw new Error("Failed to fetch signed URL");

      const data = await res.json();
      const signedUrl = data.signedUrls[0];

      // Open in new tab
      window.open(signedUrl, "_blank");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open document.",
        variant: "destructive",
      });
    }
  };


  const fetchLoans = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        table: "gold_loans",
        page: page.toString(),
        limit: limit.toString(),
      });

      const res = await fetch(`${API_BASE_URL}/api/loans?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch loans");

      const data = await res.json();
      if (!data.success || !data.data) throw new Error("Invalid data format");

      const mapped: LoanApplication[] = data.data.map((loan: any) => ({
        id: loan.id,
        full_name: loan.full_name,
        email_address: loan.email || loan.email_address || "",
        mobile: loan.mobile || loan.phone || "",
        amount: loan.loan_amount || "N/A",
        status: loan.status,
        status_reason: loan.reason || loan.status_reason || "",
        created_at: loan.created_at || loan.date || "",
        pan_card_url: loan.pan_card_url || "",
        aadhar_card_url: loan.aadhar_card_url || "",
      }));

      setAllLoans(mapped); // store all fetched loans
      setLoans(mapped);    // show all initially
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
      const res = await fetch(`${API_BASE_URL}/api/loans/gold_loans/${loanId}`);
      if (!res.ok) throw new Error("Failed to fetch loan details");
      const data = await res.json();
      setSelectedLoan(data.data);
      setDocLoadError(false);
      setSelectedDocUrl(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const updateLoanStatus = async (loanId: string, newStatus: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/loans/gold_loans/${loanId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to update status");

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
        loan.full_name.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (loan) => loan.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    setLoans(filtered);
  }, [search, statusFilter, allLoans]);

  // Fetch API only when page changes
  useEffect(() => {
    fetchLoans();
  }, [page]);

  const fieldLabelMap: Record<string, string> = {
    full_name: "Full Name",
    mobile: "Mobile Number",
    loan_amount: "Loan Amount",
    gold_weight: "Gold Weight (kg)",
    status: "Application Status",
    reason: "Rejection Reason",
    created_at: "Created On",
    pan_card_url: "PAN Card",
    aadhar_card_url: "Aadhar Card",
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
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Gold Loans</h2>

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

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left p-3 border-b border-gray-200">Name</th>
                  <th className="text-left p-3 border-b border-gray-200">Phone</th>
                  <th className="text-left p-3 border-b border-gray-200">Status</th>
                  <th className="text-left p-3 border-b border-gray-200">Amount</th>
                  <th className="text-left p-3 border-b border-gray-200">Created On</th>
                  <th className="text-left p-3 border-b border-gray-200">Actions</th>
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
                      <td className="p-3 border-b border-gray-200">{loan.full_name}</td>
                      <td className="p-3 border-b border-gray-200">{loan.mobile}</td>
                      <td className="p-3 border-b border-gray-200">
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
                      <td className="p-3 border-b border-gray-200">{loan.amount}</td>
                      <td className="p-3 border-b border-gray-200">
                        {new Date(loan.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-3 border-b border-gray-200">
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
            onClick={() => setSelectedLoan(null)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Back
          </Button>

          <div className="bg-gradient-to-r from-blue-800 via-blue-600 to-sky-400 text-white p-6 rounded-2xl shadow-lg">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <div>
                <h2 className="text-xl font-semibold">{selectedLoan.full_name}</h2>
                <p className="text-sm opacity-90">{selectedLoan.mobile}</p>
              </div>
              <div className="mt-4 sm:mt-0 flex flex-col items-end">
                <span
                  className={`text-sm font-medium px-3 py-1 rounded-full ${selectedLoan.status === "approved"
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

          {/* Details */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-blue-700 border-b pb-3 mb-4">
              Application Information
            </h2>
            <dl className="grid grid-cols-1 divide-y divide-gray-100">
              {Object.entries(selectedLoan)
                .filter(
                  ([key, value]) =>
                    key !== "pan_card_url" &&
                    key !== "aadhar_card_url" &&
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

          {/* Documents */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-blue-700 border-b pb-3 mb-4">Uploaded Documents</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {["pan_card_url", "aadhar_card_url"].map((key) => (
                <div key={key} className="border rounded-xl p-5 flex flex-col items-center text-center">
                  <FileText className="w-8 h-8 mb-3 text-blue-700" />
                  <p className="font-medium text-gray-700 mb-2 text-sm">{formatKey(key)}</p>
                  {selectedLoan[key as keyof LoanApplication] ? (
                    <button
                      onClick={() =>
                        openDocument(selectedLoan[key as keyof LoanApplication] as string)
                      }
                      className="text-blue-600 text-sm font-semibold hover:underline"
                    >
                      View Document
                    </button>
                  ) : (
                    <p className="text-gray-400 text-sm">Not uploaded</p>
                  )}
                </div>
              ))}
            </div>

            {selectedDocUrl && (
              <div className="mt-4 p-4 border rounded-md bg-gray-50">
                <button
                  className="mb-2 text-sm text-blue-600 hover:underline"
                  onClick={() => setSelectedDocUrl(null)}
                >
                  Close Preview
                </button>
                <iframe
                  src={selectedDocUrl}
                  className="w-full h-[500px] border rounded-md"
                  title="Document Preview"
                  onError={() => setDocLoadError(true)}
                />
                {docLoadError && (
                  <p className="text-red-500 mt-2">Failed to load the document.</p>
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default GoldTable;
