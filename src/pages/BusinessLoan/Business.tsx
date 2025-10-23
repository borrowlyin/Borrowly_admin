import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue,} from "@/components/ui/select";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/lib/api";

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

const BusinessTable: React.FC = () => {
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLoan, setSelectedLoan] = useState<LoanApplication | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [viewingLoanId, setViewingLoanId] = useState<string | null>(null);

  const limit = 10;
  const table = "business_loans";
  const { toast } = useToast();

  const fetchLoans = async (p = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("table", table);
      params.append("page", String(p));
      params.append("limit", String(limit));
      if (search) params.append("search", search);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const res = await fetch(`${API_BASE_URL}/api/loans?${params.toString()}`);
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        console.error("fetchLoans non-OK:", res.status, res.statusText, txt);
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json().catch((e) => {
        console.error("Failed to parse JSON:", e);
        return null;
      });

      let items: any[] = [];
      let serverPage = p;
      let serverTotalPages = 1;
      let serverTotal = 0;

      if (Array.isArray(data)) {
        items = data;
        serverTotal = items.length;
      } else if (data && Array.isArray(data.data)) {
        items = data.data;
        serverTotal = Number(data.total ?? items.length) || 0;
        serverPage = Number(data.page ?? p) || p;
        serverTotalPages = Number(data.totalPages ?? Math.max(1, Math.ceil(serverTotal / limit)));
      } else if (data && Array.isArray(data.items)) {
        items = data.items;
        serverTotal = Number(data.total ?? items.length) || 0;
        serverPage = Number(data.page ?? p) || p;
        serverTotalPages = Number(data.totalPages ?? Math.max(1, Math.ceil(serverTotal / limit)));
      } else if (data && Array.isArray(data.result)) {
        items = data.result;
        serverTotal = Number(data.total ?? items.length) || 0;
        serverPage = Number(data.page ?? p) || p;
        serverTotalPages = Number(data.totalPages ?? Math.max(1, Math.ceil(serverTotal / limit)));
      } else {
        console.warn("Unexpected response shape for business loans:", data);
        items = [];
        serverTotal = 0;
      }

      const mapped = items.map((loan: any) => ({
        id: String(loan.id),
        full_name: loan.fullname ?? loan.full_name ?? `${loan.first_name ?? ""} ${loan.last_name ?? ""}`.trim(),
        email_address: loan.email ?? loan.email_address ?? loan.email_address,
        contact_number: loan.mobile ?? loan.contact_number ?? loan.phone,
        amount: loan.desiredloanamount ?? loan.amount ?? loan.desired_loan_amount ?? "N/A",
        loan_type: loan.loan_type ?? loan.type,
        status: (loan.status ?? loan.application_status ?? "pending").toString(),
        status_reason: loan.reason ?? loan.status_reason ?? loan.statusReason ?? "",
        created_at: loan.created_at ?? loan.createdAt ?? loan.date ?? "",
        ...loan,
      }));

      setLoans(mapped);
      setTotal(serverTotal || mapped.length);
      setTotalPages(Math.max(1, serverTotalPages));
      setPage(Math.min(Math.max(1, serverPage), Math.max(1, serverTotalPages)));
    } catch (error) {
      console.error("fetchLoans error:", error);
      toast({
        title: "Error",
        description: "Failed to fetch loans. Check console/network for details.",
        variant: "destructive",
      });
      setLoans([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, statusFilter]);

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
                    {selectedLoan.status_reason && <p className="text-xs mt-2 italic opacity-90">{selectedLoan.status_reason}</p>}
                  </div>
                </div>
              </div>

              <section className="bg-white rounded-lg border border-gray-100 p-4">
                <h5 className="font-semibold text-sm text-gray-700 mb-3">Application Information</h5>
                <dl className="grid grid-cols-1 gap-2">
                  {Object.entries(selectedLoan)
                    .filter(([k, v]) => !["id", "created_at", "updated_at"].includes(k) && v != null && v !== "" && typeof v !== "object")
                    .map(([k, v]) => (
                      <div key={k} className="flex justify-between items-center py-2 px-2 rounded">
                        <dt className="text-sm text-gray-600">{formatKey(k)}:</dt>
                        <dd className="text-sm text-gray-900">{typeof v === "boolean" ? (v ? "Yes" : "No") : String(v)}</dd>
                      </div>
                    ))}
                </dl>
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
              {loans.map((loan, i) => (
                <tr key={loan.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-4 py-3 border">{loan.full_name ?? loan.fullname ?? "-"}</td>
                  <td className="px-4 py-3 border">{loan.contact_number ?? loan.mobile ?? loan.phone ?? "-"}</td>
                  <td className="px-4 py-3 border">{loan.amount ?? loan.desiredloanamount ?? "-"}</td>
                  <td className="px-4 py-3 border">
                    <Select
                      value={(loan.status ?? "pending").toLowerCase()}
                      onValueChange={(v) => updateLoanStatus(String(loan.id), v)}
                    >
                      <SelectTrigger className="w-32">
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
