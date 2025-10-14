import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useNavigate } from "react-router-dom";

const API_BASE_URL = "https://borrowly-backend-696063357505.europe-west1.run.app";

const GoldLoanDetails: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { id, table } = location.state || {}; // Get 'id' and 'table' from state
    const { toast } = useToast();

    const [loading, setLoading] = useState(false);
    const [loanDetails, setLoanDetails] = useState<any>(null);
    const [selectedDocUrl, setSelectedDocUrl] = useState<string | null>(null);
    const [docLoadError, setDocLoadError] = useState(false);

    const fieldLabelMap: Record<string, string> = {
        fullname: "Full Name",
        mobile: "Mobile Number",
        loan_amount: "Loan Amount",
        gold_weight: "Gold Weight (kg)",
        status: "Application Status",
        reason: "Rejection Reason",
        created_at: "Created On",
        updated_at: "Updated On",
    };

    const formatKey = (key: string) =>
        fieldLabelMap[key] || key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

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
                navigate("/GoldLoanTable"); // Redirect to the GoldLoanTable if there's an error
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [id, table, toast, navigate]);

    const documents = [
        { name: "PAN Card", url: loanDetails?.pan_card_url },
        { name: "Aadhar Card", url: loanDetails?.aadhar_card_url },
        // Add any other document URLs you need
    ];

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
            setSelectedDocUrl(signedUrl);
            setDocLoadError(false); // reset previous error
        }
    };

    const closeModal = () => {
        setSelectedDocUrl(null);
        setDocLoadError(false);
    };

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

    const entries = Object.entries(loanDetails).filter(
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
    );
    return (
         <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
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
                    Gold Loan Application Details
                </h1>
            </div>

            {/* Summary Header */}
            <div className="bg-gradient-to-r from-blue-800 via-blue-600 to-sky-400  text-white p-6 rounded-2xl shadow-lg">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <div>
                        <h2 className="text-xl font-semibold">{loanDetails.full_name}</h2>
                        <p className="text-sm opacity-90">{loanDetails.mobile}</p>
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

            {/* Application Information */}
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

            {/* Uploaded Documents */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h2 className="text-lg font-semibold text-blue-700">Uploaded Documents</h2>
                    <span className="text-sm text-gray-500">
                        {`${documents.length} / ${documents.length} Uploaded`}
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {documents.map((doc, idx) => (
                        <div
                            key={idx}
                            className="border rounded-xl p-5 flex flex-col items-center text-center transition transform hover:scale-[1.02]"
                        >
                            <FileText className="w-8 h-8 mb-3 text-blue-700" />
                            <p className="font-medium text-gray-700 mb-2 text-sm">{doc.name}</p>
                            <button
                                onClick={() => openModal(doc.url)}
                                className="text-blue-600 text-sm font-semibold hover:underline"
                            >
                                View Document
                            </button>
                        </div>
                    ))}
                </div>


                {selectedDocUrl && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                        <div className="bg-white p-6 rounded-lg max-w-3xl w-full relative">

                            <button
                                onClick={closeModal}
                                className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 z-50 text-3xl font-semibold"
                            >
                                &times;
                            </button>
                            <h3 className="text-lg font-semibold mb-2 text-gray-800">Document Preview</h3>
                            <iframe
                                src={selectedDocUrl}
                                className="w-full h-[600px] border rounded-xl"
                                onError={() => setDocLoadError(true)}
                                title="Document Preview"
                            />
                            {docLoadError && (
                                <div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-md">
                                    Failed to load the document. It may be restricted or unavailable.
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </section>
        </div>
    );
};

export default GoldLoanDetails;
