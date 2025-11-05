import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Loader2, ArrowLeft, RefreshCw, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { ChevronsUpDown, Check } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useBusinessLoanCache } from "@/hooks/useBusinessLoanCache";
interface LoanApplication {
  id: string;
  full_name?: string;
  fullname?: string;
  email_address?: string;
  email?: string;
  contact_number?: string;
  mobile?: string;
  phone?: string;
  amount?: string;
  desiredloanamount?: string;
  loan_type?: string;
  type?: string;
  status?: string;
  status_reason?: string;
  reason?: string;
  created_at?: string;
  createdat?: string;
  [key: string]: any;
}

const fieldLabelMap: Record<string, string> = {
  full_name: "Full Name",
  fullname: "Full Name",
  email_address: "Email Address",
  email: "Email",
  contact_number: "Contact Number",
  mobile: "Mobile",
  phone: "Phone",
  amount: "Desired Loan Amount",
  desiredloanamount: "Desired Loan Amount",
  loan_type: "Loan Type",
  type: "Loan Type",
  status: "Application Status",
  status_reason: "Status Reason",
  reason: "Reason",
};

const formatKey = (key: string) =>
  fieldLabelMap[key] || key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const formatDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";

// Document fields for business loans
const documentsKeys = [
  "pan_url",
  "aadhaar_url"
];

// Signed URL helper
const fetchSignedUrl = async (documentUrl: string, toast: any) => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/files/sign-urls`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ urls: [documentUrl] }),
    });
    if (!res.ok) throw new Error("Failed to fetch signed URL");
    const data = await res.json();
    return data.signedUrls?.[0] ?? null;
  } catch (error) {
    console.error("fetchSignedUrl error:", error);
    toast({
      title: "Error",
      description: "Failed to load document.",
      variant: "destructive",
    });
    return null;
  }
};

const BusinessTable: React.FC = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedLoan, setSelectedLoan] = useState<LoanApplication | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [viewingLoanId, setViewingLoanId] = useState<string | null>(null);

  const table = "business_loans";
  const { toast } = useToast();
  const [assignedBanks, setAssignedBanks] = useState([]);
  
  const { data, loading, error, refresh, isRefreshing } = useBusinessLoanCache(page, search, statusFilter);
  const lastUpdated = data?.timestamp;
  
  const loans = data?.loans || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const fetchLoanDetails = async (id: string) => {
    setViewingLoanId(id);
    setDetailsLoading(true);
    setSelectedLoan(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/loans/${table}/${id}`);
      if (!res.ok) throw new Error("Failed to fetch details");
      const data = await res.json();
      const payload = data?.data ?? data;
      setSelectedLoan(payload);
    } catch (err) {
      console.error("fetchLoanDetails error:", err);
      toast({
        title: "Error",
        description: "Failed to load loan details",
        variant: "destructive",
      });
      setSelectedLoan(null);
      setViewingLoanId(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const clearView = () => {
    setSelectedLoan(null);
    setViewingLoanId(null);
    setDetailsLoading(false);
  };

  const updateLoanStatus = async (loanId: string, newStatus: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/loans/${table}/${loanId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update status");
      await res.json().catch(() => ({}));

      setLoans((prev) => prev.map((l) => (l.id === loanId ? { ...l, status: newStatus } : l)));
      if (selectedLoan?.id === loanId) setSelectedLoan((s) => (s ? { ...s, status: newStatus } : s));

      toast({ title: "Status Updated", description: `Loan marked as ${newStatus}` });
    } catch (err) {
      console.error("updateLoanStatus error:", err);
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };



  const [startDate, setStartDate] = useState<string | "">("");
  const [endDate, setEndDate] = useState<string | "">("");
  const [downloadLoading, setDownloadLoading] = useState(false);

  // New: modal state and modal-local date fields
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [modalStartDate, setModalStartDate] = useState<string>("");
  const [modalEndDate, setModalEndDate] = useState<string>("");


  // Helper: convert array of objects to CSV string
  const jsonToCsv = (data: any[]) => {
    if (!Array.isArray(data) || data.length === 0) return "";
    const cols = Array.from(
      data.reduce((acc, item) => {
        Object.keys(item).forEach((k) => acc.add(k));
        return acc;
      }, new Set<string>())
    );
    const escapeCell = (val: any) => {
      if (val === null || val === undefined) return "";
      const s = String(val);
      // wrap in quotes if contains comma, quote or newline
      if (/[",\n]/.test(s)) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };
    const header = cols.join(",");
    const rows = data.map((row) => cols.map((c) => escapeCell(row[c] ?? "")).join(","));
    return [header, ...rows].join("\n");
  };

  const handleDownload = async (from?: string, to?: string) => {
    setDownloadLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all") params.append("status", statusFilter);
      if (from) params.append("startDate", from);
      if (to) params.append("endDate", to);

      const url = `${API_BASE_URL}/api/businessloan/businessLoanlist/download?${params.toString()}`;

      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        console.error("download non-OK:", res.status, txt);
        throw new Error(`Download failed: ${res.status}`);
      }

      const payload = await res.json().catch((e) => {
        console.error("Failed to parse download JSON:", e);
        return null;
      });

      // Expect server to return { message, count, loans } as in your controller
      const loansData = payload?.loans ?? payload?.data ?? payload;
      if (!Array.isArray(loansData) || loansData.length === 0) {
        toast({
          title: "No records",
          description: "No loan records found for the selected filters.",
          variant: "warning",
        });
        setDownloadLoading(false);
        return;
      }

      const csv = jsonToCsv(loansData);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `Business-loans-${from || "all"}-to-${to || "all"}-${timestamp}.csv`;

      // create link and click
      const link = document.createElement("a");
      const urlBlob = URL.createObjectURL(blob);
      link.href = urlBlob;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(urlBlob);

      toast({
        title: "Downloaded",
        description: `Exported ${loansData.length} records.`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to download list. Check console/network.",
        variant: "destructive",
      });
    } finally {
      setDownloadLoading(false);
    }
  };

  const openDownloadModal = () => {
    setModalStartDate(startDate || "");
    setModalEndDate(endDate || "");
    setShowDownloadModal(true);
  };

  const confirmDownloadFromModal = async () => {
    setStartDate(modalStartDate);
    setEndDate(modalEndDate);
    setShowDownloadModal(false);
    await handleDownload(modalStartDate || undefined, modalEndDate || undefined);
  };
  const filteredLoans = loans.filter((loan) => {
    const name = (loan.full_name ?? loan.fullname ?? "").toLowerCase();
    const phone = (loan.contact_number ?? loan.mobile ?? loan.phone ?? "").toLowerCase();
    const matchesSearch = search ? name.includes(search.toLowerCase()) || phone.includes(search.toLowerCase()) : true;
    const matchesStatus = statusFilter === "all" ? true : (loan.status ?? "pending").toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });




  const [banks, setBanks] = useState<{ id: string; bank_name: string }[]>([]);
  const [banksLoading, setBanksLoading] = useState(false);
  useEffect(() => {
    const fetchBanks = async () => {
      setBanksLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/getAllBanks`);
        if (!res.ok) throw new Error("Failed to fetch banks");
        const data = await res.json();
        const list = data?.data ?? [];
        setBanks(list);
      } catch (err) {
        console.error("Error fetching banks:", err);
        toast({
          title: "Error",
          description: "Failed to load bank list",
          variant: "destructive",
        });
      } finally {
        setBanksLoading(false);
      }
    };

    fetchBanks();
  }, []);
  const [selectedBanks, setSelectedBanks] = useState([]);
  const [open, setOpen] = useState(false);

  const toggleBank = (bank_id) => {
    setSelectedBanks((prev) =>
      prev.includes(bank_id)
        ? prev.filter((bank_id) => bank_id !== bank_id)
        : [...prev, bank_id]
    );
  };
  const handleAssign = async () => {
    if (!selectedLoan?.id) {
      toast({
        title: "Error",
        description: "No loan selected to assign.",
        variant: "destructive",
      });
      return;
    }

    if (selectedBanks.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one bank.",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/loans/${table}/${selectedLoan.id}/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          table,                        // name of table (e.g. "personal_loans")
          loanId: selectedLoan.id,      // the loan id
          bankIds: selectedBanks,       // array of bank ids
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to assign banks");

      toast({
        title: "Success",
        description: `${selectedBanks.length} bank(s) assigned successfully.`,
      });

      setSelectedBanks([]); // reset after success
    } catch (err) {
      console.error("Error assigning loan to bank:", err);
      toast({
        title: "Error",
        description: "Failed to assign bank(s). Check console for details.",
        variant: "destructive",
      });
    }
  };
  const fetchLoanStatuses = async (loanId, loanType) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/loans/${loanType}/${loanId}/statuses`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to fetch statuses");

      if (data.success) {
        setAssignedBanks(data.data || []);
      } else {
        setAssignedBanks([]);
      }
    } catch (err) {
      console.error("Error fetching loan statuses:", err);
      setAssignedBanks([]);
    }
  };
  useEffect(() => {
    if (selectedLoan?.id && table) {
      fetchLoanStatuses(selectedLoan.id, table);
    }
  }, [selectedLoan, table]);

  const availableBanks = banks.filter(
    (bank) => !assignedBanks.some((assigned) => assigned.bank_id === bank.bank_id)
  );
  return (
    <motion.div
      className="bg-white h-[93dvh] overflow-scroll rounded-xl p-6 shadow-lg"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Header */}
      <div className="">
        <h1 className="text-3xl font-bold mb-2">Business Loan Applications</h1>
        <p className="mb-6 text-gray-500 text-[14px]">
          Oversee business loan requests. Verify company details and manage approvals with ease.
        </p>
      </div>

      {/* Cache Status Indicator */}
      {data && (
        <div className="flex items-center justify-end mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center text-sm text-gray-500">
              <RefreshCw className={`w-4 h-4 mr-1 ${isRefreshing ? 'animate-spin text-blue-500' : ''}`} />
              <span className={isRefreshing ? 'text-blue-500' : ''}>
                {isRefreshing ? 'Refreshing...' : `Last updated: ${data.timestamp.toLocaleTimeString('en-US', { hour12: true, hour: 'numeric', minute: '2-digit' })}`}
              </span>
            </div>
            <button
              onClick={refresh}
              disabled={isRefreshing}
              className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Refresh Now
            </button>
          </div>
        </div>
      )}

      {/* Controls — hidden while viewing a loan or loading details */}
      {!viewingLoanId && (
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div className="w-full md:w-2/3 flex gap-3 items-center">
            <Input
              placeholder="Search by name or phone..."
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
              value={statusFilter}
              onValueChange={(v) => {
                setPage(1);
                setStatusFilter(v);
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
                <SelectItem value="cancel">Cancel</SelectItem>
              </SelectContent>
            </Select>
            <div>
              <Button
                onClick={openDownloadModal}
                disabled={downloadLoading}
                title="Download filtered loan list"
              >
                {downloadLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Downloading...
                  </>
                ) : (
                  "Download"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showDownloadModal && (
        // overlay
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowDownloadModal(false)}
            aria-hidden
          />
          <div className="relative bg-white rounded-lg shadow-lg w-[95%] max-w-md p-5 z-10">
            <h3 className="text-lg font-semibold mb-3">Export Loan List</h3>
            <p className="text-sm text-gray-600 mb-4">Choose a date range to export (optional).</p>

            <div className="grid gap-3">
              <label className="text-xs text-gray-700">
                Start date
                <input
                  type="date"
                  value={modalStartDate}
                  onChange={(e) => setModalStartDate(e.target.value)}
                  className="mt-1 w-full border px-2 py-1 rounded text-sm"
                />
              </label>

              <label className="text-xs text-gray-700">
                End date
                <input
                  type="date"
                  value={modalEndDate}
                  onChange={(e) => setModalEndDate(e.target.value)}
                  className="mt-1 w-full border px-2 py-1 rounded text-sm"
                />
              </label>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <Button variant="outline" onClick={() => setShowDownloadModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={confirmDownloadFromModal}
                disabled={downloadLoading}
              >
                {downloadLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Downloading...
                  </>
                ) : (
                  "Confirm & Download"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Loading / Empty / Table / Details */}
      {loading ? (
        <div className="flex justify-center items-center py-20 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading loans...
        </div>
      ) : loans.length === 0 ? (
        <p className="text-center text-gray-500 py-10">No loan applications found.</p>
      ) : viewingLoanId && detailsLoading ? (
        <div className="flex justify-center items-center h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
            <p className="text-gray-600">Loading application...</p>
          </div>
        </div>
      ) : selectedLoan ? (
        // Details view
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={clearView}
                className="flex items-center gap-2 border-blue-500 text-blue-600 hover:bg-blue-600 hover:text-white transition"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
              <h3 className="text-lg font-semibold">Application Details</h3>
            </div>
            <div className="text-sm text-gray-500">Submitted: {formatDate(String(selectedLoan.created_at))}</div>
          </div>

          {detailsLoading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-slate-50 border border-gray-100">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xl font-semibold">{selectedLoan.full_name ?? selectedLoan.fullname}</h4>
                    <p className="text-sm text-gray-600">{selectedLoan.contact_number ?? selectedLoan.mobile ?? selectedLoan.phone}</p>
                    {selectedLoan.email_address && <p className="text-sm text-gray-600 mt-1">{selectedLoan.email_address}</p>}
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-sm font-medium px-3 py-1 rounded-full ${selectedLoan.status === "approved"
                          ? "bg-green-500 text-white"
                          : selectedLoan.status === "rejected"
                            ? "bg-red-500 text-white"
                            : "bg-yellow-400 text-black"
                        }`}
                    >
                      {(selectedLoan.status ?? "pending").toUpperCase()}
                    </span>
                    {selectedLoan.status_reason && <p className="text-xs mt-2 italic opacity-90">{selectedLoan.status_reason}</p>}
                  </div>
                </div>
              </div>
  <div className="mt-6 border-t pt-4">
            <h4 className="text-md font-semibold mb-2">Assign to Bank</h4>

            {banksLoading ? (
              <p className="text-gray-500 text-sm">Loading banks...</p>
            ) : banks.length === 0 ? (
              <p className="text-gray-500 text-sm">No banks available</p>
            ) : (
              <div className="flex gap-3 items-center">
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-64 justify-between"
                    >
                      {selectedBanks.length > 0
                        ? `${selectedBanks.length} bank(s) selected`
                        : "Select banks"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent className="w-64 p-2 max-h-60 overflow-y-auto">
                    {(() => {
                      // ✅ Filter out already assigned banks
                      const availableBanks = banks.filter(
                        (bank) =>
                          !assignedBanks.some((assigned) => assigned.bank_id === bank.bank_id)
                      );

                      return availableBanks.length > 0 ? (
                        availableBanks.map((bank) => {
                          const bankId = bank.bank_id;
                          const bankName = bank.bankname || bank.bank_name || bank.name;

                          return (
                            <div
                              key={bankId}
                              className={cn(
                                "flex items-center gap-2 p-1 rounded-md hover:bg-gray-100 cursor-pointer"
                              )}
                              onClick={() => toggleBank(bankId)}
                            >
                              <Checkbox checked={selectedBanks.includes(bankId)} />
                              <span className="text-sm">
                                {bankName} ({bank.ifsccode})
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-sm text-gray-500 px-2 py-1">
                          All banks already assigned
                        </p>
                      );
                    })()}
                  </PopoverContent>
                </Popover>

                <Button onClick={handleAssign} disabled={selectedBanks.length === 0}>
                  Assign
                </Button>
              </div>

            )}
          </div>
          {assignedBanks.length > 0 && (
            <div className="mt-4 border-t pt-3">
              <h5 className="text-sm font-semibold mb-2">Assigned Banks</h5>
              <ul className="space-y-2">
                {assignedBanks.map((item) => (
                  <li
                    key={item.assignment_id}
                    className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded"
                  >
                    <span>
                      {item.bank_name ? `${item.bank_name} (${item.ifsccode})` : "N/A"} → {item.bank_id}
                    </span>


                    <span
                      className={`px-2 py-1 text-xs rounded ${item.bank_status === "pending"
                        ? "bg-yellow-200 text-yellow-800"
                        : item.bank_status === "approved"
                          ? "bg-green-200 text-green-800"
                          : "bg-gray-200 text-gray-800"
                        }`}
                    >
                      {item.bank_status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
              <section className="bg-white rounded-lg border border-gray-100 p-4">
                <h5 className="font-semibold text-sm text-gray-700 mb-3">Application Information</h5>
                <dl className="grid grid-cols-1 gap-2">
                  {Object.entries(selectedLoan)
                    .filter(([k, v]) => {
                      const excludeFields = ["id", "created_at", "updated_at", "generateduserid", "panurl", "adharurl", "pan_card_url", "aadhar_card_url", "pan_url", "aadhaar_url"];
                      const isUrl = typeof v === "string" && (v.includes("storage.googleapis.com") || v.startsWith("http"));
                      return !excludeFields.includes(k) && !isUrl && v != null && v !== "" && typeof v !== "object";
                    })
                    .map(([k, v]) => (
                      <div key={k} className="flex justify-between items-center py-2 px-2 rounded">
                        <dt className="text-sm text-gray-600">{formatKey(k)}:</dt>
                        <dd className="text-sm text-gray-900">{typeof v === "boolean" ? (v ? "Yes" : "No") : String(v)}</dd>
                      </div>
                    ))}
                </dl>
              </section>

              {/* Uploaded Documents */}
              <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                  <h2 className="text-lg font-semibold text-blue-700">Uploaded Documents</h2>
                  <span className="text-sm text-gray-500">
                    {`${documentsKeys.filter(k => selectedLoan[k]).length} / ${documentsKeys.length} Uploaded`}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {documentsKeys.map((key, idx) => {
                    const value = selectedLoan[key];
                    const isUploaded = Boolean(value);
                    return (
                      <div
                        key={idx}
                        className={`border rounded-xl p-5 flex flex-col items-center text-center transition transform hover:scale-[1.02] ${
                          isUploaded
                            ? "border-blue-200 bg-blue-50 hover:shadow-md"
                            : "border-gray-200 bg-gray-50 opacity-80"
                        }`}
                      >
                        <FileText
                          className={`w-8 h-8 mb-3 ${isUploaded ? "text-blue-700" : "text-gray-400"}`}
                        />
                        <p className="font-medium text-gray-700 mb-2 text-sm">{formatKey(key)}</p>
                        {isUploaded ? (
                          <button
                            onClick={async () => {
                              const signed = await fetchSignedUrl(value, toast);
                              if (signed) window.open(signed, "_blank");
                            }}
                            className="text-blue-600 text-sm font-semibold hover:underline"
                          >
                            View Document
                          </button>
                        ) : (
                          <span className="text-gray-500 text-sm italic">Not Uploaded</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          )}
        </div>
      ) : (
        // Table list
        <div className="overflow-x-auto">
          <table className="min-w-full border rounded-md text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="px-4 py-3 border">Name</th>
                <th className="px-4 py-3 border">Phone</th>
                <th className="px-4 py-3 border">Amount</th>
                <th className="px-4 py-3 border">Status</th>

                <th className="px-4 py-3 border">Submitted</th>
                <th className="px-4 py-3 border">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredLoans.map((loan, i) => (
                <tr key={loan.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-4 py-3 border">{loan.full_name ?? loan.fullname ?? "-"}</td>
                  <td className="px-4 py-3 border">{loan.contact_number ?? loan.mobile ?? loan.phone ?? "-"}</td>
                  <td className="px-4 py-3 border">{loan.amount ?? loan.desiredloanamount ?? "-"}</td>
                  <td className="px-4 py-3 border">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        loan.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : loan.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : loan.status === "cancel"
                          ? "bg-gray-100 text-gray-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {((loan.status ?? "pending").charAt(0).toUpperCase() + (loan.status ?? "pending").slice(1))}
                    </span>
                  </td>

                  <td className="px-4 py-3 border">{formatDate(loan.created_at)}</td>
                  <td className="px-4 py-3 border">
                    <button
                      className="text-blue-600 hover:text-blue-800 font-medium"
                      onClick={() => fetchLoanDetails(String(loan.id))}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination — hidden while viewing a loan */}
      {!viewingLoanId && (
        <div className="flex justify-between items-center mt-6">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            Previous
          </Button>

          <p className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </p>

          <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
            Next
          </Button>
        </div>
      )}
    </motion.div>
  );
};

export default BusinessTable;
