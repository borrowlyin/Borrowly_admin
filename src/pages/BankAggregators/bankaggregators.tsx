import React, { useState, useEffect } from "react";
import { Eye, ArrowLeft, Image, FileText, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBankAggregatorsCache } from "@/hooks/useBankAggregatorsCache";

// ✅ Signed URL fetcher
const fetchSignedUrl = async (documentUrl) => {
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
    toast({
      title: "Error",
      description: "Failed to load document.",
      variant: "destructive",
    });
    return null;
  }
};

const BankList = () => {
  const { banks, loading, isRefreshing, lastUpdated, refetch } = useBankAggregatorsCache();
  const [selectedBank, setSelectedBank] = useState(null);
  const [signedUrls, setSignedUrls] = useState({});
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;



  const handleViewBank = async (bank) => {
    setSelectedBank(bank);
    if (!signedUrls[bank.id]) {
      const urls = {};
      if (bank.profilephoto) urls.profile = await fetchSignedUrl(bank.profilephoto);
      if (bank.idprooftype) urls.idproof = await fetchSignedUrl(bank.idprooftype);
      setSignedUrls((prev) => ({ ...prev, [bank.id]: urls }));
    }
  };

  const handleBack = () => {
    setSelectedBank(null);
  };

  const formatDate = (date) => 
    date ? new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";

  const filteredBanks = banks.filter((bank) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      bank.fullname?.toLowerCase().includes(s) ||
      bank.bankname?.toLowerCase().includes(s) ||
      bank.email?.toLowerCase().includes(s) ||
      bank.phonenumber?.toLowerCase().includes(s)
    );
  });

  const paginatedBanks = filteredBanks.slice((page - 1) * limit, page * limit);
  const totalPagesCalculated = Math.max(1, Math.ceil(filteredBanks.length / limit));
  
  useEffect(() => {
    setTotalPages(totalPagesCalculated);
    if (page > totalPagesCalculated) setPage(1);
  }, [totalPagesCalculated, page]);

  // 🔹 Table view
  if (!selectedBank) {
    return (
      <motion.div
        className="bg-white h-[93dvh] overflow-scroll rounded-xl p-6 shadow-lg"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        {/* Header */}
        <div className="">
          <h1 className="text-3xl font-bold mb-2">Bank Aggregators</h1>
          <p className="mb-6 text-gray-500 text-[14px]">
            Manage bank aggregator accounts and review their information.
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
                onClick={refetch}
                disabled={isRefreshing}
                className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Refresh Now
              </button>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div className="w-full md:w-2/3 flex gap-3 items-center">
            <Input
              placeholder="Search by name, bank, or email..."
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              className="w-full md:w-80"
            />
          </div>
        </div>

        {/* Loading / Table */}
        {loading ? (
          <div className="flex justify-center items-center py-20 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Loading banks...
          </div>
        ) : paginatedBanks.length === 0 ? (
          <p className="text-center text-gray-500 py-10">No banks found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border rounded-md text-sm">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="px-4 py-3 border">Name</th>
                  <th className="px-4 py-3 border">Bank</th>
                  <th className="px-4 py-3 border">Branch</th>
                  <th className="px-4 py-3 border">Email</th>
                  <th className="px-4 py-3 border">Phone</th>
                  <th className="px-4 py-3 border">Created</th>
                  <th className="px-4 py-3 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedBanks.map((bank, i) => (
                  <tr key={bank.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-3 border">{bank.fullname ?? "-"}</td>
                    <td className="px-4 py-3 border">{bank.bankname ?? "-"}</td>
                    <td className="px-4 py-3 border">{bank.branchname ?? "-"}</td>
                    <td className="px-4 py-3 border">{bank.email ?? "-"}</td>
                    <td className="px-4 py-3 border">{bank.phonenumber ?? "-"}</td>
                    <td className="px-4 py-3 border">{formatDate(bank.created_at)}</td>
                    <td className="px-4 py-3 border">
                      <button
                        className="text-blue-600 hover:text-blue-800 font-medium"
                        onClick={() => handleViewBank(bank)}
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

        {/* Pagination */}
        <div className="flex justify-between items-center mt-6">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </Button>
          <p className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </p>
          <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            Next
          </Button>
        </div>
      </motion.div>
    );
  }

  // 🔹 Detail view
  const urls = signedUrls[selectedBank.id] || {};

  return (
    <motion.div
      className="bg-white h-[93dvh] overflow-scroll rounded-xl p-6 shadow-lg"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
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
            Bank Details
          </h1>
          <div className="text-sm text-gray-500">
            Created: {formatDate(selectedBank.created_at)}
          </div>
        </div>

        {/* Blue Gradient Header */}
        <div className="bg-gradient-to-r from-blue-800 via-blue-600 to-sky-400 text-white p-6 rounded-2xl shadow-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <h2 className="text-xl font-semibold">{selectedBank.fullname}</h2>
              <p className="text-sm opacity-90">{selectedBank.email}</p>
            </div>
            <div className="mt-4 sm:mt-0 flex flex-col items-end">
              <span className="text-sm font-medium px-3 py-1 rounded-full bg-green-500 text-white">
                ACTIVE
              </span>
            </div>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Personal Details */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-blue-700 border-b pb-3 mb-4">Personal Information</h2>
            <dl className="grid grid-cols-1 divide-y divide-gray-100">
              {[
                ["Email", selectedBank.email],
                ["Phone", selectedBank.phonenumber],
                ["Designation", selectedBank.designation],
                ["Created", formatDate(selectedBank.created_at)],
              ]
                .filter(([_, value]) => value !== undefined && value !== null && value !== "")
                .map(([key, value]) => (
                  <div
                    key={key}
                    className="flex justify-between items-center py-3 px-2 rounded-lg transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100"
                  >
                    <dt className="font-medium text-gray-700">{key}:</dt>
                    <dd className="text-gray-900 text-right">{String(value)}</dd>
                  </div>
                ))}
            </dl>
          </section>

          {/* Bank Details */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-blue-700 border-b pb-3 mb-4">Bank Information</h2>
            <dl className="grid grid-cols-1 divide-y divide-gray-100">
              {[
                ["Bank Name", selectedBank.bankname],
                ["Branch", selectedBank.branchname],
                ["IFSC", selectedBank.ifsccode],
                ["Address", selectedBank.bankaddress],
              ]
                .filter(([_, value]) => value !== undefined && value !== null && value !== "")
                .map(([key, value]) => (
                  <div
                    key={key}
                    className="flex justify-between items-center py-3 px-2 rounded-lg transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100"
                  >
                    <dt className="font-medium text-gray-700">{key}:</dt>
                    <dd className="text-gray-900 text-right">{String(value)}</dd>
                  </div>
                ))}
            </dl>
          </section>
        </div>

        {/* Documents */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center border-b pb-3 mb-4">
            <h2 className="text-lg font-semibold text-blue-700">Uploaded Documents</h2>
            <span className="text-sm text-gray-500">
              {Object.entries({
                "Profile Photo": selectedBank.profilephoto,
                "ID Proof": selectedBank.idprooftype,
              }).filter(([_, value]) => !!value).length} / 2 Uploaded
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Object.entries({
              "Profile Photo": selectedBank.profilephoto,
              "ID Proof": selectedBank.idprooftype,
            }).map(([key, value], idx) => {
              const isUploaded = !!value;
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
                  <p className="font-medium text-gray-700 mb-2 text-sm">{key}</p>
                  {isUploaded ? (
                    <button
                      onClick={async () => {
                        const signed = await fetchSignedUrl(value);
                        if (signed) {
                          window.open(signed, '_blank');
                        }
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
    </motion.div>

  );
};

export default BankList;