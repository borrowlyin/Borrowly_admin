import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Info, Loader2, ArrowLeft } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

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

const PersonalTable: React.FC = () => {
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const limit = 10;
  const table = "personal_loans";
  const { toast } = useToast();

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        table: table,
        page: page.toString(),
        limit: limit.toString(),
      });
      const res = await fetch(`${API_BASE_URL}/api/loans?${params}`);
      const data = await res.json();

      let filtered = data.data.map((loan: any) => ({
        id: loan.id,
        full_name: loan.fullname,
        email_address: loan.email || "",
        contact_number: loan.mobile || "",
        amount: loan.businessdesiredloanamount || "N/A",
        status: loan.status,
        status_reason: loan.reason || "",
        created_at: loan.created_at || "",
      }));

      if (search)
        filtered = filtered.filter((loan: any) =>
          loan.full_name.toLowerCase().includes(search.toLowerCase())
        );
      if (statusFilter !== "all")
        filtered = filtered.filter(
          (loan: any) =>
            loan.status.toLowerCase() === statusFilter.toLowerCase()
        );

      setLoans(filtered);
      setTotal(data.total);
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

  const fetchLoanDetails = async (id: string) => {
    setDetailsLoading(true);
    setSelectedLoan(null); // hide table immediately
    try {
      const res = await fetch(`${API_BASE_URL}/api/loans/${table}/${id}`);
      const data = await res.json();
      setSelectedLoan(data.data);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to load loan details",
        variant: "destructive",
      });
      setSelectedLoan(null);
    } finally {
      setDetailsLoading(false);
    }
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

      if (data.success) {
        toast({
          title: "Status Updated",
          description: `Loan marked as ${newStatus}`,
        });
        setLoans((prev) =>
          prev.map((loan) =>
            loan.id === loanId ? { ...loan, status: newStatus } : loan
          )
        );
      } else {
        toast({
          title: "Failed to update",
          description: data.message || "Something went wrong",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };
  useEffect(() => {
    fetchLoans();
  }, [search, statusFilter, page]);

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

  const fieldLabelMap: Record<string, string> = {
    fullname: "Full Name",
    mobile: "Mobile Number",
    currentcompany: "Current Company",
    employmenttype: "Employment Type",
    residencecity: "City of Residence",
    grossannualincome: "Gross Annual Income",
    businessdesiredloanamount: "Desired Loan Amount",
    businessgrossannualincome: "Business Gross Annual Income",
    businessresidencecity: "Business Residence City",
    currentbusinessvintage: "Business Vintage (Years)",
    pledgeassets: "Assets Pledged",
    professionaltype: "Professional Type",
    status: "Application Status",
    reason: "Rejection Reason",
  };

  const formatKey = (key: string) =>
    fieldLabelMap[key] ||
    key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  if (detailsLoading && !selectedLoan) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <Loader2 className="animate-spin w-10 h-10 text-blue-600 mb-3" />
      </div>
    );
  }

  if (selectedLoan) {
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
            onClick={() => setSelectedLoan(null)}
            className="flex items-center gap-2 border-blue-500 text-blue-600 hover:bg-blue-600 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <h1 className="text-2xl font-semibold text-gray-800">
            Personal Loan Application Details
          </h1>
        </div>

        {detailsLoading ? (
          <div className="flex justify-center items-center h-[50vh]">
            <Loader2 className="animate-spin w-10 h-10 text-primary" />
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-r from-blue-800 via-blue-600 to-sky-400 text-white p-6 rounded-2xl shadow-lg">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                  <h2 className="text-xl font-semibold">
                    {selectedLoan.fullname}
                  </h2>
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
                  {selectedLoan.reason && (
                    <p className="text-xs mt-2 italic opacity-90">
                      {selectedLoan.reason}
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
                    <dt className="font-medium text-gray-700">
                      {formatKey(key)}:
                    </dt>
                    <dd className="text-gray-900 text-right">
                      {typeof value === "boolean"
                        ? value
                          ? "Yes"
                          : "No"
                        : String(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          </>
        )}
      </div>
    );
  }
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <Loader2 className="animate-spin w-10 h-10 text-blue-600 mb-3" />
        <p className="text-gray-600 text-sm">Loading loan applications...</p>
      </div>
    );
  }

  return (
    <div className="max-w-full p-6">
      <h2 className="text-xl font-semibold mb-4">Personal Loans</h2>

      <div className="flex flex-col sm:flex-row justify-between mb-4 gap-3">
        <Input
          type="search"
          placeholder="Search by Name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v)}
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
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Phone</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Amount</th>
              <th className="p-3 text-left">Created</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loans.map((loan) => (
              <tr key={loan.id} className="hover:bg-gray-50">
                <td className="p-3">{loan.full_name}</td>
                <td className="p-3">{loan.contact_number}</td>
                <td className="p-3">
                  <Select
                    value={loan.status}
                    onValueChange={(value) =>
                      updateLoanStatus(loan.id, value)
                    }
                  >
                    <SelectTrigger
                      className={`w-[120px] capitalize ${getStatusColor(
                        loan.status
                      )}`}
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
                <td
                  className="p-3 cursor-pointer text-blue-600"
                  onClick={() => fetchLoanDetails(loan.id)}
                >
                  <Info className="inline w-5 h-5 hover:scale-110 transition" />
                </td>
              </tr>
            ))}
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
export default PersonalTable;
