import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useNavigate } from "react-router-dom";

import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";

// Optional: Map DB keys to friendly labels
const fieldLabelMap: Record<string, string> = {
  full_name: "Full Name",
  email_address: "Email Address",
  contact_number: "Contact Number",
  amount: "Desired Loan Amount",
  loan_type: "Loan Type",
  status: "Application Status",
  status_reason: "Status Reason",
  created_at: "Created On",
  payslip: "Payslip Document",
};

const formatKey = (key: string) =>
  fieldLabelMap[key] || key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const BusinessLoanDetails: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id, table } = location.state || {};
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [loanDetails, setLoanDetails] = useState<Record<string, any> | null>(null);

  // Modal states for payslip viewing
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<string | JSX.Element | null>(null);

  useEffect(() => {
    if (!id || !table) return;

    const fetchDetails = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/loans/${table}/${id}`);
        if (!res.ok) throw new Error("Failed to fetch loan details");

        const data = await res.json();
        setLoanDetails(data.data);
      } catch (err: any) {
        toast({
          title: "Error",
          description: err.message || "Failed to fetch loan details.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id, table, toast]);

  // Fetch the signed URL for the payslip document
  const fetchSignedUrl = async (documentUrl: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/files/sign-urls`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          urls: [documentUrl],
        }),
      });

      if (!res.ok) throw new Error("Failed to fetch signed URL");
      const data = await res.json();
      return data.signedUrls[0];
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load payslip document.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Modal handlers
  const openModal = async (documentUrl: string) => {
    if (!documentUrl || documentUrl.trim() === '') {
      toast({
        title: "Error",
        description: "Document not available.",
        variant: "destructive",
      });
      return;
    }
    
    const signedUrl = await fetchSignedUrl(documentUrl);
    if (signedUrl) {
      setModalContent(<iframe src={signedUrl} className="w-full h-[600px]" />);
      setIsModalOpen(true);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalContent(null);
  };

  const Modal = ({ content, onClose }: { content: string | JSX.Element, onClose: () => void }) => (
    <div className="fixed inset-0 flex items-center justify-center z-40 bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-lg max-w-7xl w-full max-h-[90vh] overflow-auto">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
        >
          &times;
        </button>
        <div className="w-full h-full">{content}</div>
        <div className="mt-4 text-center">
          <button
            onClick={onClose}
            className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <Loader2 className="animate-spin w-10 h-10 text-primary" />
      </div>
    );
  }

  if (!loanDetails) {
    return (
      <div className="text-center p-10 text-gray-600 text-lg">
        Loan details not available.
      </div>
    );
  }

  // Filter out unwanted keys
  const entries = Object.entries(loanDetails).filter(
    ([key, value]) =>
      key !== "id" &&
      key !== "created_at" &&
      key !== "updated_at" &&
      key !== "payslip" &&
      value !== null &&
      value !== "" &&
      !(typeof value === "object" && !Array.isArray(value))
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
      {/* Modal */}
      {isModalOpen && <Modal content={modalContent} onClose={closeModal} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 border-blue-500 text-blue-600 hover:bg-blue-600 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <h1 className="text-2xl font-semibold text-gray-800">
          Business Loan Details
        </h1>
      </div>

      {/* Summary Header */}
      <div className="bg-gradient-to-r from-blue-800 via-blue-600 to-sky-400  text-white p-6 rounded-2xl shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h2 className="text-xl font-semibold">
              {loanDetails.full_name || loanDetails.fullname}
            </h2>
            <p className="text-sm opacity-90">
              {loanDetails.contact_number || loanDetails.mobile || loanDetails.phone}
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex flex-col items-end">
            <span
              className={`text-sm font-medium px-3 py-1 rounded-full ${
                loanDetails.status === "approved"
                  ? "bg-green-600 text-white"
                  : loanDetails.status === "rejected"
                  ? "bg-red-600 text-white"
                  : "bg-yellow-400 text-black"
              }`}
            >
              {loanDetails.status?.toUpperCase()}
            </span>
            {loanDetails.status_reason && (
              <p className="text-xs mt-2 italic opacity-90">{loanDetails.status_reason}</p>
            )}
          </div>
        </div>
      </div>

      {/* Details Section */}
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

      {/* Payslip Document */}
      {loanDetails.payslip && loanDetails.payslip.trim() !== '' && (
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-blue-700 border-b pb-3 mb-4">
            Payslip Document
          </h2>
          <div className="flex items-center justify-center">
            <div className="border border-blue-200 bg-blue-50 rounded-xl p-5 flex flex-col items-center text-center transition transform hover:scale-[1.02] hover:shadow-md">
              <FileText className="w-8 h-8 mb-3 text-blue-700" />
              <p className="font-medium text-gray-700 mb-2 text-sm">Payslip Document</p>
              <button
                onClick={() => openModal(loanDetails.payslip)}
                className="text-blue-600 text-sm font-semibold hover:underline"
              >
                View Document
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default BusinessLoanDetails;
