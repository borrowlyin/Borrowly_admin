import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft, RefreshCw, FileText, Download, ZoomIn, ZoomOut, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ChevronsUpDown, Check } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/lib/api";
import { useLoanCache } from "@/hooks/useLoanCache";

interface LoanApplication {
  id: string;
  [key: string]: any;
}

interface LoanTableConfig {
  loanType: string;
  displayName: string;
  documentKeys: string[];
  fieldLabelMap: Record<string, string>;
  statusOptions?: string[];
}

interface GenericLoanTableProps {
  config: LoanTableConfig;
}

const defaultFieldLabelMap: Record<string, string> = {
  full_name: "Full Name",
  fullname: "Full Name",
  email_address: "Email Address",
  email: "Email Address",
  contact_number: "Contact Number",
  phone: "Phone",
  mobile: "Mobile Number",
  amount: "Amount",
  loan_type: "Loan Type",
  status: "Application Status",
  status_reason: "Status Reason",
  reason: "Reason",
  created_at: "Created On",
};

const formatKey = (key: string, fieldLabelMap: Record<string, string>) => {
  if (key === "aadhaar_url_front") return "AADHAR FRONT";
  if (key === "aadhaar_url_back") return "AADHAR BACK";
  if (key === "pan_url") return "PAN";
  return fieldLabelMap[key] || defaultFieldLabelMap[key] || key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

const fetchSignedUrl = async (documentUrl: string, toast: any) => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/files/sign-urls`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

const GenericLoanTable: React.FC<GenericLoanTableProps> = ({ config }) => {
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [showDateModal, setShowDateModal] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [dateFilter, setDateFilter] = useState({ from: "", to: "" });
  const [selectedLoan, setSelectedLoan] = useState<LoanApplication | null>(null);
  const [viewingLoanId, setViewingLoanId] = useState<string | null>(null);
  const [assignedBanks, setAssignedBanks] = useState([]);
  const [assignedBanksLoading, setAssignedBanksLoading] = useState(false);
  const [documentModal, setDocumentModal] = useState<{ isOpen: boolean; url: string; title: string }>({ 
    isOpen: false, url: '', title: '' 
  });
  const [zoomLevel, setZoomLevel] = useState(100);
  const [docLoadError, setDocLoadError] = useState(false);

  const { toast } = useToast();
  const { loans, loading, total, totalPages, isRefreshing, lastUpdated, refetch } = useLoanCache(
    config.loanType, page, search, statusFilter, dateFilter
  );

  const getStatusColor = (status?: string) => {
    switch ((status || "").toLowerCase()) {
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

  const fetchLoanDetails = async (loanId: string) => {
    setViewingLoanId(loanId);
    setDetailsLoading(true);
    setSelectedLoan(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/loans/${config.loanType}_loans/${loanId}`);
      if (!res.ok) throw new Error("Failed to fetch details");
      const data = await res.json();
      setSelectedLoan(data?.data ?? data);
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
      const res = await fetch(`${API_BASE_URL}/api/loans/${config.loanType}_loans/${loanId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update status");
      
      if (selectedLoan?.id === loanId) {
        setSelectedLoan(s => s ? { ...s, status: newStatus } : s);
      }
      refetch();

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

  const openDocument = async (docUrl: string, title: string) => {
    const signedUrl = await fetchSignedUrl(docUrl, toast);
    if (signedUrl) {
      setDocumentModal({ isOpen: true, url: signedUrl, title });
      setZoomLevel(100);
      setDocLoadError(false);
    }
  };

  const closeDocumentModal = () => {
    setDocumentModal({ isOpen: false, url: '', title: '' });
    setZoomLevel(100);
    setDocLoadError(false);
  };

  const downloadDocument = () => {
    if (documentModal.url) {
      const link = document.createElement('a');
      link.href = documentModal.url;
      link.download = documentModal.title;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const applyDateFilter = () => {
    setDateFilter({ from: fromDate, to: toDate });
    setShowDateModal(false);
    setPage(1);
  };

  const clearDateFilter = () => {
    setFromDate("");
    setToDate("");
    setDateFilter({ from: "", to: "" });
    setShowDateModal(false);
    setPage(1);
  };

  // Rest of the component implementation would be similar to the original Insurance.tsx
  // but using the config object for customization
  
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">{config.displayName} Applications</h1>
              <div className="flex items-center gap-2">
                {lastUpdated && (
                  <span className="text-sm text-gray-500">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </span>
                )}
                <Button
                  onClick={refetch}
                  disabled={isRefreshing}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                </Button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {(config.statusOptions || ["pending", "approved", "rejected"]).map(status => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Popover open={showDateModal} onOpenChange={setShowDateModal}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-auto">
                    <Calendar className="h-4 w-4 mr-2" />
                    Date Filter
                    {(dateFilter.from || dateFilter.to) && (
                      <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                        Active
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">From Date</label>
                      <Input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">To Date</label>
                      <Input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={applyDateFilter} size="sm" className="flex-1">
                        Apply Filter
                      </Button>
                      <Button onClick={clearDateFilter} variant="outline" size="sm" className="flex-1">
                        Clear
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Table content - similar structure but using config for customization */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Loading {config.displayName.toLowerCase()}...</span>
              </div>
            ) : loans.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No {config.displayName.toLowerCase()} found</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applicant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loans.map((loan) => (
                    <tr key={loan.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {loan.full_name || loan.fullname || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {loan.email || loan.email_address || "N/A"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {loan.mobile || loan.contact_number || loan.phone || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{loan.amount ? Number(loan.amount).toLocaleString() : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={cn("text-sm", getStatusColor(loan.status))}>
                          {loan.status || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {loan.created_at ? new Date(loan.created_at).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button
                          onClick={() => fetchLoanDetails(loan.id)}
                          variant="outline"
                          size="sm"
                          disabled={detailsLoading && viewingLoanId === loan.id}
                        >
                          {detailsLoading && viewingLoanId === loan.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "View Details"
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-3 border-t bg-gray-50 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing page {page} of {totalPages} ({total} total)
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  variant="outline"
                  size="sm"
                >
                  Previous
                </Button>
                <Button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  variant="outline"
                  size="sm"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Loan Details Modal - similar to original but using config */}
        {selectedLoan && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  {config.displayName} Application Details
                </h2>
                <Button onClick={clearView} variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </div>

              <div className="p-6 space-y-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(selectedLoan)
                      .filter(([key]) => !config.documentKeys.includes(key) && key !== 'id')
                      .map(([key, value]) => (
                        <div key={key} className="border rounded-lg p-3">
                          <label className="text-sm font-medium text-gray-600">
                            {formatKey(key, config.fieldLabelMap)}
                          </label>
                          <p className={cn(
                            "text-sm mt-1",
                            key === 'status' ? getStatusColor(value as string) : "text-gray-900"
                          )}>
                            {key === 'created_at' && value 
                              ? new Date(value as string).toLocaleString()
                              : (value as string) || "N/A"
                            }
                          </p>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Documents */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Documents</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {config.documentKeys.map((docKey) => {
                      const docUrl = selectedLoan[docKey];
                      return (
                        <div key={docKey} className="border rounded-lg p-4 text-center">
                          <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm font-medium mb-2">
                            {formatKey(docKey, config.fieldLabelMap)}
                          </p>
                          {docUrl ? (
                            <Button
                              onClick={() => openDocument(docUrl, formatKey(docKey, config.fieldLabelMap))}
                              size="sm"
                              variant="outline"
                            >
                              View Document
                            </Button>
                          ) : (
                            <p className="text-sm text-gray-500">Not uploaded</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Status Update */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Update Status</h3>
                  <div className="flex gap-2">
                    {(config.statusOptions || ["pending", "approved", "rejected"]).map(status => (
                      <Button
                        key={status}
                        onClick={() => updateLoanStatus(selectedLoan.id, status)}
                        variant={selectedLoan.status === status ? "default" : "outline"}
                        size="sm"
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Document Modal - same as original */}
        {documentModal.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50"
          >
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="text-lg font-semibold">{documentModal.title}</h3>
                <div className="flex items-center gap-2">
                  <Button onClick={() => setZoomLevel(z => Math.max(50, z - 25))} variant="outline" size="sm">
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">{zoomLevel}%</span>
                  <Button onClick={() => setZoomLevel(z => Math.min(200, z + 25))} variant="outline" size="sm">
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button onClick={downloadDocument} variant="outline" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button onClick={closeDocumentModal} variant="ghost" size="sm">
                    ×
                  </Button>
                </div>
              </div>
              <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
                {!docLoadError ? (
                  <img
                    src={documentModal.url}
                    alt={documentModal.title}
                    style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top left' }}
                    onError={() => setDocLoadError(true)}
                    className="max-w-none"
                  />
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">Failed to load document</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default GenericLoanTable;