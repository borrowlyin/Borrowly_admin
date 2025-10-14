import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useNavigate } from "react-router-dom";

import { API_BASE_URL, API_ENDPOINTS } from "@/lib/api";

const VehicleLoanDetails: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id, table } = location.state || {};
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [loanDetails, setLoanDetails] = useState<any>(null);

  // States for iframe preview and error handling
  const [selectedDocUrl, setSelectedDocUrl] = useState<string | null>(null);
  const [docLoadError, setDocLoadError] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<string | JSX.Element | null>(null);

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

  useEffect(() => {
    if (!id) return;
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/loans/${table}/${id}`);
        if (!res.ok) throw new Error("Failed to fetch loan details");
        const data = await res.json();
        setLoanDetails(data.data);
      } catch {
        toast({
          title: "Error",
          description: "Failed to fetch loan details.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id, table, toast]);

  const personalDetailsKeys = [
    "id",
    "generateduserid",
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
  ];

  if (loading)
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <Loader2 className="animate-spin w-10 h-10 text-primary" />
      </div>
    );

  if (!loanDetails)
    return (
      <div className="text-center p-10 text-gray-600 text-lg">
        Loan details not available.
      </div>
    );

  const personalDetails = Object.entries(loanDetails).filter(
    ([key, value]) =>
      personalDetailsKeys.includes(key) &&
      value &&
      !(Array.isArray(value) || typeof value === "object")
  );

  const coApplicantDetails = Object.entries(loanDetails).filter(
    ([key, value]) =>
      coApplicantKeys.includes(key) &&
      value &&
      !(Array.isArray(value) || typeof value === "object")
  );

  const documents = documentsKeys
    .map((key) => {
      const value = loanDetails[key];
      if (value) {
        return { name: formatKey(key), url: value };
      }
      return null;
    })
    .filter(Boolean);

  const basicDetails = Object.entries(loanDetails).filter(
    ([key, value]) =>
      !excludedKeys.includes(key) &&
      value &&
      !(Array.isArray(value) || typeof value === "object")
  );

  // Fetch the signed URL for the document
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
        description: "Failed to load document.",
        variant: "destructive",
      });
      setDocLoadError(true);
      return null;
    }
  };

  // Modal open and close handlers
  const openModal = async (documentUrl: string) => {
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
        {/* Close button at the top-right */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
        >
          &times;
        </button>

        <div className="w-full h-full">{content}</div>

        {/* Close button at the bottom */}
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
  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 border-blue-500 text-blue-600 hover:bg-blue-600 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <h1 className="text-3xl font-semibold text-gray-800 tracking-tight">
          Vehicle Loan Application Details
        </h1>
      </div>

      {/* Modal */}
      {isModalOpen && <Modal content={modalContent} onClose={closeModal} />}

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
              <p className="text-xs mt-2 italic opacity-90">{loanDetails.reason}</p>
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
                    onClick={() => openModal(value)}
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
};

export default VehicleLoanDetails;
