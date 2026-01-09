import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft, RefreshCw, FileText, Download, ZoomIn, ZoomOut, Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { ChevronsUpDown, Check } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { API_BASE_URL } from "@/lib/api";
import { useHomeLoanCache } from "@/hooks/useHomeLoanCache";

interface LoanApplication {
  id: string;
  fullname?: string;
  email?: string;
  email_address?: string;
  mobile?: string;
  phone?: string;
  desiredloanamount?: string;
  amount?: string;
  loan_type?: string;
  status?: string;
  reason?: string;
  status_reason?: string;
  created_at?: string;
  [key: string]: any;
}

const HomeTable: React.FC = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [showDateModal, setShowDateModal] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [dateFilter, setDateFilter] = useState({ from: "", to: "" });
  const [selectedLoan, setSelectedLoan] = useState<LoanApplication | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [viewingLoanId, setViewingLoanId] = useState<string | null>(null);
  const table = "home_loans";
  const { toast } = useToast();
  const [assignedBanks, setAssignedBanks] = useState([]);
  const [assignedBanksLoading, setAssignedBanksLoading] = useState(false);
  const [assignmentMethod, setAssignmentMethod] = useState<'database' | 'manual' | ''>('');
  const [manualBankData, setManualBankData] = useState({
    bank_name: '',
    ifsc_code: '',
    branch: '',
    account_number: ''
  });
  const [documentModal, setDocumentModal] = useState<{ isOpen: boolean; url: string; title: string }>({ isOpen: false, url: '', title: '' });
  const [zoomLevel, setZoomLevel] = useState(100);
  const [docLoadError, setDocLoadError] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [approveLoading, setApproveLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionModal, setRejectionModal] = useState<{ isOpen: boolean; bankName: string; reason: string }>({ isOpen: false, bankName: '', reason: '' });
  const [documentLoading, setDocumentLoading] = useState<string | null>(null);
  
  const { data, loading, error, refresh, isRefreshing } = useHomeLoanCache(page, search, statusFilter);
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

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        console.error("updateLoanStatus non-OK:", res.status, txt);
        throw new Error("Failed to update status");
      }
      await res.json();

      if (selectedLoan?.id === loanId) setSelectedLoan((s) => (s ? { ...s, status: newStatus } : s));
      refresh(); // Refresh cached data

      toast({
        title: "Status Updated",
        description: `Loan marked as ${newStatus}`,
      });
    } catch (err) {
      console.error("updateLoanStatus error:", err);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const formatDate = (date?: string) =>
    date ? new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";

  const fieldLabelMap: Record<string, string> = {
    fullname: "Full Name",
    mobile: "Mobile Number",
    phone: "Phone",
    email: "Email",
    email_address: "Email",
    amount: "Amount",
    desiredloanamount: "Desired Loan Amount",
    loan_type: "Loan Type",
    status: "Application Status",
    reason: "Reason",
    status_reason: "Reason",
    created_at: "Created On",
    panurl: "PAN Card",
    adharurl: "Aadhaar Card",
    bankstatement_url: "Bank Statement",
    payslip_url: "Payslip",
  };

  const formatKey = (k: string) => {
    if (k === "adharurl_front") return "AADHAR FRONT";
    if (k === "adharurl_back") return "AADHAR BACK";
    if (k === "panurl") return "PAN";
    if (k === "bankstatement_url") return "BANKSTATEMENT";
    if (k === "payslip_url") return "PAYSLIP";
    return fieldLabelMap[k] ?? k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // Document fields for home loans
  const documentsKeys = [
    "panurl",
    "adharurl_front",
    "adharurl_back",
    "bankstatement_url",
    "payslip_url"
  ];

  // Signed URL helper
  const fetchSignedUrl = async (documentUrl: string) => {
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

  const goToPage = (p: number) => {
    const clamped = Math.max(1, Math.min(totalPages, p));
    if (clamped === page) return;
    setPage(clamped);
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
    
          const url = `${API_BASE_URL}/api/homeloan/HomeLoanist/download?${params.toString()}`;
    
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
          const filename = `Home-loans-${from || "all"}-to-${to || "all"}-${timestamp}.csv`;
    
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
  
        // New: open modal — initialize modal fields with current state values
    const openDownloadModal = () => {
      setModalStartDate(startDate || "");
      setModalEndDate(endDate || "");
      setShowDownloadModal(true);
    };
  
    // New: confirm modal and trigger download
    const confirmDownloadFromModal = async () => {
      // Optionally set global start/end date if you want to reflect picked dates in header inputs
      setStartDate(modalStartDate);
      setEndDate(modalEndDate);
      setShowDownloadModal(false);
      await handleDownload(modalStartDate || undefined, modalEndDate || undefined);
    };
  
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
  const [assignLoading, setAssignLoading] = useState(false);

  const toggleBank = (bank_id) => {
    setSelectedBanks((prev) =>
      prev.includes(bank_id)
        ? prev.filter((id) => id !== bank_id)
        : [...prev, bank_id]
    );
  };

  const handleManualAssign = async () => {
    if (!selectedLoan?.id) {
      toast({
        title: "Error",
        description: "No loan selected to assign.",
        variant: "destructive",
      });
      return;
    }

    setAssignLoading(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/loans/${table}/${selectedLoan.id}/assign-manual`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            table,
            loanId: selectedLoan.id,
            manualBankDetails: {
              bank_name: manualBankData.bank_name,
              ifsc_code: manualBankData.ifsc_code,
              branch: manualBankData.branch,
              account_number: manualBankData.account_number
            }
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to assign manual bank");

      toast({
        title: "Success",
        description: "Manual bank details assigned successfully.",
      });

      setManualBankData({ bank_name: '', ifsc_code: '', branch: '', account_number: '' });
      
      // Refresh assigned banks list
      if (selectedLoan?.id && table) {
        fetchLoanStatuses(selectedLoan.id, table);
      }
    } catch (err) {
      console.error("Error assigning manual bank:", err);
      toast({
        title: "Error",
        description: "Failed to assign manual bank details.",
        variant: "destructive",
      });
    } finally {
      setAssignLoading(false);
    }
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

    setAssignLoading(true);
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
      // Refresh assigned banks list
      if (selectedLoan?.id && table) {
        fetchLoanStatuses(selectedLoan.id, table);
      }
    } catch (err) {
      console.error("Error assigning loan to bank:", err);
      toast({
        title: "Error",
        description: "Failed to assign bank(s). Check console for details.",
        variant: "destructive",
      });
    } finally {
      setAssignLoading(false);
    }
  };
  const fetchLoanStatuses = async (loanId, loanType) => {
    setAssignedBanksLoading(true);
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
    } finally {
      setAssignedBanksLoading(false);
    }
  };

  const updateBankStatus = async (assignmentId: string, status: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/loans/bank-assignment/${assignmentId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error("Failed to update bank status");
      
      if (selectedLoan?.id && table) {
        fetchLoanStatuses(selectedLoan.id, table);
      }

      toast({ 
        title: "Status Updated", 
        description: `Bank assignment ${status}` 
      });
    } catch (err) {
      console.error("updateBankStatus error:", err);
      toast({ 
        title: "Error", 
        description: "Failed to update bank status", 
        variant: "destructive" 
      });
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
      className="bg-white h-[93dvh] overflow-scroll  rounded-xl p-6 shadow-lg"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Home Loan Applications</h1>
        <p className="mb-6 text-gray-500 text-[14px]">
          Manage home loan applications. Verify, review details and update application status.
        </p>
      </div>

      {/* Cache Status Indicator */}
      {lastUpdated && (
        <div className="flex items-center justify-end mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center text-sm text-gray-500">
              <RefreshCw className={`w-4 h-4 mr-1 ${isRefreshing ? 'animate-spin text-blue-500' : ''}`} />
              <span className={isRefreshing ? 'text-blue-500' : ''}>
                {isRefreshing ? 'Refreshing...' : `Last updated: ${lastUpdated.toLocaleTimeString('en-US', { hour12: true, hour: 'numeric', minute: '2-digit' })}`}
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

      {/* Controls — hidden while viewing a loan */}
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
            
            <Button
              variant="outline"
              onClick={() => setShowDateModal(true)}
              className="flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
            </Button>
            
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
                    <h4 className="text-xl font-semibold">{selectedLoan.fullname}</h4>
                    <p className="text-sm text-gray-600">{selectedLoan.mobile}</p>
                    {selectedLoan.email && <p className="text-sm text-gray-600 mt-1">{selectedLoan.email}</p>}
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-sm font-medium px-3 py-1 rounded-full ${
                        selectedLoan.status === "approved"
                          ? "bg-green-500 text-white"
                          : selectedLoan.status === "rejected"
                          ? "bg-red-500 text-white"
                          : "bg-yellow-400 text-black"
                      }`}
                    >
                      {(selectedLoan.status ?? "pending").toUpperCase()}
                    </span>
                    {selectedLoan.reason && <p className="text-xs mt-2 italic opacity-90">{selectedLoan.reason}</p>}
                  </div>
                </div>
              </div>
              <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <h4 className="text-lg font-semibold text-blue-800">Bank Assignment</h4>
                </div>

                {banksLoading ? (
                  <div className="flex items-center gap-2 text-blue-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Loading banks...</span>
                  </div>
                ) : banks.length === 0 ? (
                  <p className="text-gray-600 text-sm bg-white p-3 rounded border">No banks available</p>
                ) : (
                  <div className="space-y-4">
                    {/* Assignment Method Selection */}
                    <div>
                      <label className="text-sm font-medium text-blue-700 mb-2 block">Assignment Method</label>
                      <Select 
                        value={assignmentMethod} 
                        onValueChange={setAssignmentMethod}
                        disabled={assignedBanks.length > 0}
                      >
                        <SelectTrigger className="w-64 bg-white border-blue-300">
                          <SelectValue placeholder="Choose assignment method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="database">Assign from Database</SelectItem>
                          <SelectItem value="manual">Manual Entry</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Database Assignment */}
                    {assignmentMethod === 'database' && (
                      <div className="flex gap-3 items-end">
                        <div className="flex-1">
                          <label className="text-sm font-medium text-blue-700 mb-2 block">Select Bank</label>
                      <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={open}
                            className="w-64 justify-between bg-white border-blue-300 hover:bg-blue-50"
                          >
                            {selectedBanks.length > 0
                              ? `${selectedBanks.length} bank(s) selected`
                              : "Select banks"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>

                        <PopoverContent className="w-64 p-2 max-h-60 overflow-y-auto">
                          {(() => {
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
                                      "flex items-center gap-2 p-2 rounded-md hover:bg-blue-50 cursor-pointer transition-colors"
                                    )}
                                    onClick={() => toggleBank(bankId)}
                                  >
                                    <Checkbox checked={selectedBanks.includes(bankId)} />
                                    <span className="text-sm font-medium">
                                      {bankName}
                                    </span>
                                    <span className="text-xs text-gray-500">({bank.ifsccode})</span>
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

                        </div>
                        <Button 
                          onClick={handleAssign} 
                          disabled={selectedBanks.length === 0 || assignLoading || assignedBanks.length > 0}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {assignLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                              Assigning...
                            </>
                          ) : (
                            "Assign Banks"
                          )}
                        </Button>
                      </div>
                    )}

                    {/* Manual Entry */}
                    {assignmentMethod === 'manual' && assignedBanks.length === 0 && (
                      <div className="bg-white rounded-lg p-4 border border-blue-200">
                        <h5 className="text-sm font-medium text-blue-700 mb-3">Manual Bank Details</h5>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-medium text-gray-700">Bank Name *</label>
                            <input
                              type="text"
                              value={manualBankData.bank_name}
                              onChange={(e) => setManualBankData(prev => ({ ...prev, bank_name: e.target.value }))}
                              className="mt-1 w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              placeholder="Enter bank name"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-700">IFSC Code *</label>
                            <input
                              type="text"
                              value={manualBankData.ifsc_code}
                              onChange={(e) => setManualBankData(prev => ({ ...prev, ifsc_code: e.target.value }))}
                              className="mt-1 w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              placeholder="Enter IFSC code"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-700">Branch *</label>
                            <input
                              type="text"
                              value={manualBankData.branch}
                              onChange={(e) => setManualBankData(prev => ({ ...prev, branch: e.target.value }))}
                              className="mt-1 w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              placeholder="Enter branch name"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-700">Account Number</label>
                            <input
                              type="text"
                              value={manualBankData.account_number}
                              onChange={(e) => setManualBankData(prev => ({ ...prev, account_number: e.target.value }))}
                              className="mt-1 w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              placeholder="Enter account number (optional)"
                            />
                          </div>
                        </div>
                        <div className="mt-3 flex justify-end">
                          <Button
                            onClick={handleManualAssign}
                            disabled={!manualBankData.bank_name || !manualBankData.ifsc_code || !manualBankData.branch || assignLoading}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            {assignLoading ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                Assigning...
                              </>
                            ) : (
                              "Assign Manual Bank"
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {assignedBanksLoading ? (
                <div className="mt-4 bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <h5 className="text-lg font-semibold text-green-800">Assigned Banks</h5>
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Loading assigned banks...</span>
                  </div>
                </div>
              ) : assignedBanks.length > 0 && (
                <div className="mt-4 bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <h5 className="text-lg font-semibold text-green-800">Assigned Banks ({assignedBanks?.length || 0})</h5>
                  </div>
                  <div className="grid gap-3">
                    {assignedBanks.map((item) => (
                      <div
                        key={item.assignment_id}
                        className="flex justify-between items-center bg-white p-3 rounded-lg border border-green-200 shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600 font-bold text-sm">
                              {(item.bank_name || 'B').charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {item.bank_name || "Unknown Bank"}
                            </p>
                            <p className="text-sm text-gray-500">
                              IFSC: {item.ifsccode || "N/A"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Bank status badge */}
                          <span
                            className={`px-3 py-1 text-xs font-medium rounded-full ${
                              item.bank_status === "pending"
                                ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                                : item.bank_status === "approved"
                                ? "bg-green-100 text-green-800 border border-green-200"
                                : item.bank_status === "rejected"
                                ? "bg-red-100 text-red-800 border border-red-200"
                                : "bg-gray-100 text-gray-800 border border-gray-200"
                            }`}
                          >
                            {item.bank_status?.toUpperCase() || "UNKNOWN"}
                          </span>
                          
                          {/* View Details button for rejected status with reason */}
                          {item.bank_status === "rejected" && item.rejection_reason && item.rejection_reason !== "N/A" && (
                            <button
                              onClick={() => setRejectionModal({ 
                                isOpen: true, 
                                bankName: item.bank_name || "Unknown Bank", 
                                reason: item.rejection_reason 
                              })}
                              className="text-xs text-red-600 hover:text-red-800 underline font-medium"
                            >
                              View Details
                            </button>
                          )}
                        </div>

                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Enhanced Loan Actions - Always show for pending loans */}
              {selectedLoan.status === 'pending' && (
                <div className="mt-4 bg-white rounded-lg p-4 border border-gray-200">
                  <h5 className="text-lg font-semibold text-gray-800 mb-4">Loan Actions</h5>
                  <div className="flex justify-end gap-3">
                    <Button
                      variant="destructive"
                      onClick={() => setShowRejectModal(true)}
                      disabled={rejectLoading}
                    >
                      Reject
                    </Button>
                    <Button
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => setShowApproveModal(true)}
                      disabled={approveLoading}
                    >
                      Approve
                    </Button>
                  </div>
                </div>
              )}
              <section className="bg-white rounded-lg border border-gray-100 p-4">
                <h5 className="font-semibold text-sm text-gray-700 mb-3">Application Information</h5>
                <dl className="grid grid-cols-1 gap-2">
                  {Object.entries(selectedLoan)
                    .filter(([k, v]) => {
                      const excludeFields = ["id", "created_at", "updated_at", "generateduserid", "generated_user_id", "panurl", "adharurl", "pan_card_url", "aadhar_card_url", "pan_url", "aadhaar_url", "bankstatement_url", "payslip_url", "ord_id", "payment_status"];
                      const isUrl = typeof v === "string" && (v.includes("storage.googleapis.com") || v.includes("vault.borrowly.in") || v.startsWith("http"));
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
                    {`${documentsKeys.filter(k => {
                      if (k === "adharurl_front") {
                        return Boolean(selectedLoan.adharurl?.front);
                      } else if (k === "adharurl_back") {
                        return Boolean(selectedLoan.adharurl?.back);
                      } else {
                        return Boolean(selectedLoan[k]);
                      }
                    }).length} / ${documentsKeys.length} Uploaded`}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {documentsKeys.map((key, idx) => {
                    let value;
                    if (key === "adharurl_front") {
                      value = selectedLoan.adharurl?.front;
                    } else if (key === "adharurl_back") {
                      value = selectedLoan.adharurl?.back;
                    } else {
                      value = selectedLoan[key];
                    }
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
                              setDocumentLoading(key);
                              const signed = await fetchSignedUrl(value);
                              if (signed) {
                                setDocumentModal({ isOpen: true, url: signed, title: formatKey(key) });
                                setZoomLevel(100);
                                setDocLoadError(false);
                              }
                              setDocumentLoading(null);
                            }}
                            disabled={documentLoading === key}
                            className="text-blue-600 text-sm font-semibold hover:underline disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                          >
                            {documentLoading === key ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Loading...
                              </>
                            ) : (
                              "View Document"
                            )}
                          </button>
                        ) : (
                          <span className="text-gray-500 text-sm italic">Not Uploaded</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Disbursed Button - Show only when status is approved */}
              {selectedLoan.status === 'approved' && (
                <div className="mt-4 bg-white rounded-lg p-4 border border-gray-200">
                  <h5 className="text-lg font-semibold text-gray-800 mb-4">Disbursement</h5>
                  <div className="flex justify-end gap-3">
                    <Button
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={async () => {
                        try {
                          const res = await fetch(`${API_BASE_URL}/api/loans/home_loans/${selectedLoan.id}/status`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ status: 'disbursed' })
                          });
                          if (!res.ok) throw new Error('Failed to update status');
                          toast({ title: 'Success', description: 'Loan marked as disbursed successfully' });
                          fetchLoanDetails(selectedLoan.id);
                          refresh(); // Refresh the main list to show updated status
                        } catch (error) {
                          toast({ title: 'Error', description: error.message, variant: 'destructive' });
                        }
                      }}
                    >
                      Mark as Disbursed
                    </Button>
                  </div>
                </div>
              )}
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
             {loans
                .filter((loan) => {
                  // filter by search
                  const searchLower = search.toLowerCase();
                  const matchesSearch =
                    loan.fullname?.toLowerCase().includes(searchLower) ||
                    loan.mobile?.toLowerCase().includes(searchLower) ||
                    loan.email_address?.toLowerCase().includes(searchLower);

                  // filter by status
                  const matchesStatus = statusFilter === "all" || loan.status?.toLowerCase() === statusFilter;

                  // filter by date
                  let dateMatch = true;
                  if (dateFilter.from || dateFilter.to) {
                    const loanDate = new Date(loan.created_at || '');
                    if (dateFilter.from && loanDate < new Date(dateFilter.from)) dateMatch = false;
                    if (dateFilter.to && loanDate > new Date(dateFilter.to + "T23:59:59")) dateMatch = false;
                  }

                  return matchesSearch && matchesStatus && dateMatch;
                })
                .map((loan, i) => (
                <tr key={loan.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-4 py-3 border">{loan.fullname ?? "-"}</td>
                  <td className="px-4 py-3 border">{loan.mobile ?? "-"}</td>
                  <td className="px-4 py-3 border">{loan.amount ?? "-"}</td>
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
  {(loan.status ?? "pending").charAt(0).toUpperCase() + (loan.status ?? "pending").slice(1)}
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

      {/* Document Viewer Modal */}
      {documentModal.isOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg max-w-4xl w-full relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">{documentModal.title}</h3>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = documentModal.url;
                    link.download = `${documentModal.title}-${Date.now()}.pdf`;
                    link.target = '_blank';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    toast({ title: "Success", description: "Document download started" });
                  }}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
                <div className="w-px h-6 bg-gray-300 mx-2"></div>
                <Button
                  onClick={() => setZoomLevel(prev => Math.max(prev - 25, 50))}
                  disabled={zoomLevel <= 50}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-600 min-w-[60px] text-center">{zoomLevel}%</span>
                <Button
                  onClick={() => setZoomLevel(prev => Math.min(prev + 25, 200))}
                  disabled={zoomLevel >= 200}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <button
                  onClick={() => setDocumentModal({ isOpen: false, url: '', title: '' })}
                  className="ml-4 text-gray-500 hover:text-gray-800 text-2xl font-semibold"
                >
                  &times;
                </button>
              </div>
            </div>
            <div className="overflow-auto max-h-[70vh] border rounded-xl bg-gray-100 flex items-center justify-center">
              <iframe
                src={documentModal.url}
                className="w-full h-full border-0 rounded"
                style={{ 
                  width: `${zoomLevel}%`,
                  height: 'auto',
                  minHeight: '500px'
                }}
                title={documentModal.title}
                onError={() => setDocLoadError(true)}
              />
            </div>
            {docLoadError && (
              <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-md">
                Failed to load the document. It may be restricted or unavailable.
              </div>
            )}
          </div>
        </div>
      )}

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

      {/* Pagination — hidden while viewing a loan */}
      {!viewingLoanId && (
        <div className="flex justify-between items-center mt-6">
          <Button variant="outline" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
            Previous
          </Button>

          <p className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </p>

          <Button variant="outline" disabled={page >= totalPages} onClick={() => goToPage(page + 1)}>
            Next
          </Button>
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-green-700 mb-4">Approve Loan Application</h3>
            
            {assignedBanks.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">This loan will be approved with the assigned bank:</p>
                <div className="bg-green-50 p-3 rounded border">
                  <p className="font-medium">{assignedBanks[0].bank_name}</p>
                  <p className="text-sm text-gray-600">IFSC: {assignedBanks[0].ifsccode}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">Enter bank details to approve this loan:</p>
                <div className="grid gap-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Bank Name *</label>
                    <input
                      type="text"
                      value={manualBankData.bank_name}
                      onChange={(e) => setManualBankData(prev => ({ ...prev, bank_name: e.target.value }))}
                      className="mt-1 w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      placeholder="Enter bank name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">IFSC Code *</label>
                    <input
                      type="text"
                      value={manualBankData.ifsc_code}
                      onChange={(e) => setManualBankData(prev => ({ ...prev, ifsc_code: e.target.value }))}
                      className="mt-1 w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      placeholder="Enter IFSC code"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Branch *</label>
                    <input
                      type="text"
                      value={manualBankData.branch}
                      onChange={(e) => setManualBankData(prev => ({ ...prev, branch: e.target.value }))}
                      className="mt-1 w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      placeholder="Enter branch name"
                    />
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowApproveModal(false);
                  setManualBankData({ bank_name: '', ifsc_code: '', branch: '', account_number: '' });
                }}
              >
                Cancel
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={async () => {
                  if (assignedBanks.length === 0) {
                    if (!manualBankData.bank_name || !manualBankData.ifsc_code || !manualBankData.branch) {
                      toast({ title: 'Error', description: 'Please fill all required fields', variant: 'destructive' });
                      return;
                    }
                  }
                  
                  setApproveLoading(true);
                  try {
                    const res = await fetch(`${API_BASE_URL}/api/loan-status/${table}/${selectedLoan.id}/approve`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        notes: 'Approved by admin',
                        bankName: assignedBanks.length > 0 ? assignedBanks[0].bank_name : manualBankData.bank_name,
                        bankBranch: assignedBanks.length > 0 ? assignedBanks[0].branchname : manualBankData.branch,
                        bankContact: assignedBanks.length > 0 ? assignedBanks[0].ifsccode : manualBankData.ifsc_code
                      })
                    });
                    if (!res.ok) throw new Error('Failed to approve loan');
                    toast({ title: 'Success', description: 'Loan approved successfully' });
                    setShowApproveModal(false);
                    setManualBankData({ bank_name: '', ifsc_code: '', branch: '', account_number: '' });
                    fetchLoanDetails(selectedLoan.id);
                  } catch (error) {
                    toast({ title: 'Error', description: error.message, variant: 'destructive' });
                  } finally {
                    setApproveLoading(false);
                  }
                }}
                disabled={approveLoading}
              >
                {approveLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Approving...
                  </>
                ) : (
                  'Approve Loan'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-red-700 mb-4">Reject Loan Application</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Rejection Reason *</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="mt-1 w-full border border-gray-300 rounded px-3 py-2 text-sm"
                  rows={4}
                  placeholder="Enter reason for rejection..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  if (!rejectionReason.trim()) {
                    toast({ title: 'Error', description: 'Please enter rejection reason', variant: 'destructive' });
                    return;
                  }
                  
                  setRejectLoading(true);
                  try {
                    const res = await fetch(`${API_BASE_URL}/api/loan-status/${table}/${selectedLoan.id}/reject`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ reason: rejectionReason })
                    });
                    if (!res.ok) throw new Error('Failed to reject loan');
                    toast({ title: 'Success', description: 'Loan rejected successfully' });
                    setShowRejectModal(false);
                    setRejectionReason('');
                    fetchLoanDetails(selectedLoan.id);
                  } catch (error) {
                    toast({ title: 'Error', description: error.message, variant: 'destructive' });
                  } finally {
                    setRejectLoading(false);
                  }
                }}
                disabled={rejectLoading}
              >
                {rejectLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Rejecting...
                  </>
                ) : (
                  'Reject Loan'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Details Modal */}
      {rejectionModal && rejectionModal.isOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-red-700">Rejection Details</h3>
              <button
                onClick={() => setRejectionModal({ isOpen: false, bankName: '', reason: '' })}
                className="text-gray-500 hover:text-gray-800 text-2xl font-semibold"
              >
                &times;
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Bank Name:</label>
                <p className="text-gray-900 font-medium">{rejectionModal.bankName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Rejection Reason:</label>
                <p className="text-red-600 font-medium py-3 rounded-md">
                  {rejectionModal.reason}
                </p>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <Button
                onClick={() => setRejectionModal({ isOpen: false, bankName: '', reason: '' })}
                variant="outline"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default HomeTable;
