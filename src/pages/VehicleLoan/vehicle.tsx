import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Info, Loader2, ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { API_BASE_URL } from "@/lib/api";

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
  const { toast } = useToast();
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [allLoans, setAllLoans] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loanDetails, setLoanDetails] = useState<any>(null);
  const [isDetailsView, setIsDetailsView] = useState(false);
  const limit = 10;
  const table = "vehicle_loans";

  // ----------- Field Label Map -----------
  const fieldLabelMap: Record<string, string> = {
    fullname: "Applicant Full Name",
    mobile: "Mobile Number",
    emailaddress: "Email Address",
    dateofbirth: "Date of Birth",
    aadhaarnumber: "Aadhaar Number",
    pannumber: "PAN Number",
    companyname: "Company Name",
    designation: "Designation",
    employmenttype: "Employment Type",
    netmonthlytakehome: "Net Monthly Take Home",
    monthlyincome: "Monthly Income",
    annualturnover: "Annual Turnover",
    businessname: "Business Name",
    businessnature: "Business Nature",
    yearsinemployment: "Years in Employment",
    yearsinbusiness: "Years in Business",
    currentaddress: "Current Address",
    permanentaddress: "Permanent Address",
    cityofresidence: "City of Residence",

    coapplicantfullname: "Co-applicant Full Name",
    coapplicantrelation: "Relationship with Applicant",
    coapplicantcontact: "Co-applicant Contact",
    coapplicantemail: "Co-applicant Email",
    coapplicantaadhaar: "Co-applicant Aadhaar Number",
    coapplicantpan: "Co-applicant PAN Number",
    coapplicantmonthlyincome: "Co-applicant Monthly Income",

    applicantaadhaardcard: "Applicant Aadhaar Card",
    applicantpancard: "Applicant PAN Card",
    applicantphoto: "Applicant Photograph",
    cancelledcheque: "Cancelled Cheque",
    proformainvoice: "Proforma Invoice",
    salaryslips: "Salary Slips",
    recentbankstatement: "Recent Bank Statement",
    coapplicantincomeproof: "Co-applicant Income Proof",
    coapplicantaadhaardcard: "Co-applicant Aadhaar Card",
    coapplicantpancard: "Co-applicant PAN Card",
  };

  const formatKey = (key: string) =>
    fieldLabelMap[key.toLowerCase()] ||
    key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const personalDetailsKeys = [

    "fullname",
    "mobile",
    "emailaddress",
    "dateofbirth",
    "aadhaarnumber",
    "companyname",
    "designation",
    "pannumber",
    "employmenttype",
    "netmonthlytakehome",
    "monthlyincome",
    "annualturnover",
    "businessname",
    "businessnature",
    "yearsinemployment",
    "yearsinbusiness",
    "currentaddress",
    "permanentaddress",
    "cityofresidence",
  ];

  const documentsKeys = [
    "applicantaadhaardcard",
    "applicantpancard",
    "applicantphoto",
    "cancelledcheque",
    "proformainvoice",
    "salaryslips",
    "recentbankstatement",
    "coapplicantincomeproof",
    "coapplicantaadhaardcard",
    "coapplicantpancard",
  ];

  const coApplicantKeys = [
    "hascoapplicant",
    "coapplicantfullname",
    "coapplicantrelation",
    "coapplicantcontact",
    "coapplicantemail",
    "coapplicantaadhaar",
    "coapplicantpan",
    "coapplicantmonthlyincome",
  ];

  const excludedKeys = [
    ...personalDetailsKeys,
    ...documentsKeys,
    ...coApplicantKeys,
    "createdat",
    "updatedat",
    "id",
    "generateduserid"
  ];

  // ------------- Fetch Signed URL -------------
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
      return data.signedUrls[0];
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load document.",
        variant: "destructive",
      });
      return null;
    }
  };

  // ------------- Helpers -------------
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

  // ------------- Fetch Loans -------------
  const fetchLoans = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/loans?table=vehicle_loans&page=1&limit=1000`); // Fetch large batch
      if (!res.ok) throw new Error("Failed to fetch loans");
      const data = await res.json();

      const formatted: LoanApplication[] = data.data.map((loan: any) => ({
        id: loan.id,
        full_name: loan.fullname,
        email_address: loan.emailaddress || "",
        contact_number: loan.mobile || loan.phone || "",
        amount: loan.desiredloanamount || "N/A",
        status: loan.status,
        status_reason: loan.reason || loan.status_reason || "",
        created_at: loan.createdat || "",
      }));

      setAllLoans(formatted);
      setLoans(formatted);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ------------- Fetch Loan Details -------------
  const fetchLoanDetails = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/loans/${table}/${id}`);
      if (!res.ok) throw new Error("Failed to fetch details");
      const data = await res.json();
      setLoanDetails(data.data);
      setIsDetailsView(true);
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

  const handleBack = () => {
    setIsDetailsView(false);
    setLoanDetails(null);
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

    setPage(1); // Reset page whenever filter/search changes
    setLoans(filtered);
  }, [search, statusFilter, allLoans]);

  useEffect(() => {
    fetchLoans();
  }, [page]);

  // ------------- Update Loan Status -------------
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
      if (!res.ok || !data.success)
        throw new Error(data.message || "Failed to update");
      toast({
        title: "Updated",
        description: `Loan marked as ${newStatus}`,
      });
      fetchLoans();
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message,
        variant: "destructive",
      });
    }
  };

  // ------------- Loading State -------------
  // ------------- Loading State -------------
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


  // ------------- Details View -------------
  if (isDetailsView && loanDetails) {
    // Prepare arrays for mapping
    const personalDetails = personalDetailsKeys
      .map((key) => [key, loanDetails[key]])
      .filter(([_, value]) => value !== undefined);

    const basicDetails = Object.keys(loanDetails)
      .filter((key) => !excludedKeys.includes(key))
      .map((key) => [key, loanDetails[key]]);

    const coApplicantDetails =
      loanDetails.hascoapplicant === "yes"
        ? coApplicantKeys
          .map((key) => [key, loanDetails[key]])
          .filter(([_, value]) => value !== undefined)
        : [];

    const documents = documentsKeys
      .map((key) => [key, loanDetails[key]])
      .filter(([_, value]) => value);

    return (
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            className="flex items-center gap-2 border-blue-500 text-blue-600 hover:bg-blue-600 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <h1 className="text-3xl font-semibold text-gray-800 tracking-tight">
            Vehicle Loan Application Details
          </h1>
        </div>

        {/* Blue Gradient Header */}
        <div className="bg-gradient-to-r from-blue-800 via-blue-600 to-sky-400 text-white p-6 rounded-2xl shadow-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <h2 className="text-xl font-semibold">{loanDetails.fullname}</h2>
              <p className="text-sm opacity-90">{loanDetails.emailaddress}</p>
            </div>
            <div className="mt-4 sm:mt-0 flex flex-col items-end">
              <span
                className={`text-sm font-medium px-3 py-1 rounded-full ${loanDetails.status === "approved"
                  ? "bg-green-500 text-white"
                  : loanDetails.status === "rejected"
                    ? "bg-red-500 text-white"
                    : "bg-yellow-400 text-black"
                  }`}
              >
                {loanDetails.status?.toUpperCase()}
              </span>
              {loanDetails.reason && (
                <p className="text-xs mt-2 italic opacity-90">
                  {loanDetails.reason}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Personal Details */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-blue-700 border-b pb-3 mb-4">
              Personal Details
            </h2>
            {personalDetails.length === 0 ? (
              <p className="text-gray-500 text-sm">No personal details available.</p>
            ) : (
              <dl className="grid grid-cols-1 divide-y divide-gray-100">
                {personalDetails.map(([key, value]) => (
                  <div
                    key={key}
                    className="flex justify-between items-center py-3 px-2 rounded-lg transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100"
                  >
                    <dt className="font-medium text-gray-700">{formatKey(key)}:</dt>
                    <dd className="text-gray-900 text-right">{value?.toString() || "-"}</dd>
                  </div>
                ))}
              </dl>
            )}
          </section>

          {/* Loan & Vehicle Details */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-blue-700 border-b pb-3 mb-4">
              Loan & Vehicle Details
            </h2>
            {basicDetails.length === 0 ? (
              <p className="text-gray-500 text-sm">No basic details available.</p>
            ) : (
              <dl className="grid grid-cols-1 divide-y divide-gray-100">
                {basicDetails.map(([key, value]) => (
                  <div
                    key={key}
                    className="flex justify-between items-center py-3 px-2 rounded-lg transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100"
                  >
                    <dt className="font-medium text-gray-700">{formatKey(key)}:</dt>
                    <dd className="text-gray-900 text-right">{value?.toString() || "-"}</dd>
                  </div>
                ))}
              </dl>
            )}
          </section>
        </div>

        {/* Co-applicant Details */}
        {coApplicantDetails.length > 0 && (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-blue-700 border-b pb-3 mb-4">
              Co-applicant Details
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 divide-y divide-gray-100">
              {coApplicantDetails.map(([key, value]) => (
                <div
                  key={key}
                  className="flex justify-between items-center py-3 px-2 rounded-lg transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100"
                >
                  <dt className="font-medium text-gray-700">{formatKey(key)}:</dt>
                  <dd className="text-gray-900 text-right">{value?.toString() || "-"}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {/* Uploaded Documents */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center border-b pb-3 mb-4">
            <h2 className="text-lg font-semibold text-blue-700">Uploaded Documents</h2>
            <span className="text-sm text-gray-500">
              {`${documents.length} / ${documentsKeys.length} Uploaded`}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {documentsKeys.map((key, idx) => {
              const value = loanDetails[key];
              const isUploaded = Boolean(value);

              return (
                <div
                  key={idx}
                  className={`border rounded-xl p-5 flex flex-col items-center text-center transition transform hover:scale-[1.02] ${isUploaded
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
                        const signed = await fetchSignedUrl(value);
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
    );
  }

  return (
    <div className="max-w-full p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-900">
        Vehicle Loan Applications
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
            <SelectItem value="all">All</SelectItem>
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
              <th className="text-left p-3">Created</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loans.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-500">
                  No loans found.
                </td>
              </tr>
            ) : (
              loans.map((loan) => (
                <tr
                  key={loan.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="p-3">{loan.full_name}</td>
                  <td className="p-3">{loan.contact_number}</td>
                  <td className="p-3">
                    <Select
                      value={loan.status.toLowerCase()}
                      onValueChange={(val) => updateLoanStatus(loan.id, val)}
                    >
                      <SelectTrigger
                        className={getStatusColor(loan.status) + " max-w-[150px]"}
                      >
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
                  <td className="p-3">{loan.amount}</td>
                  <td className="p-3">
                    {new Date(loan.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-3 border-b text-blue-600 hover:text-blue-800 cursor-pointer font-medium">
                    <span onClick={() => fetchLoanDetails(loan.id)}>View</span>
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

export default VehicleTable;
