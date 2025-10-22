import React, { useEffect, useState } from "react";
import axios from "axios";
import * as Select from "@radix-ui/react-select";
import { API_BASE_URL } from "@/lib/api";
import { ChevronDown, Download } from "lucide-react";

interface CareerApplication {
  id: string;
  generatedUserId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  cvUrl: string;
  assistance: string;
  privacy: boolean;
  jobRole: string;
  team: string;
  location: string;
  status: string;
  createdAt: string;
}

const Careers: React.FC = () => {
  const [applications, setApplications] = useState<CareerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmModal, setConfirmModal] = useState<{
    id: string | null;
    newStatus: string;
    show: boolean;
  }>({ id: null, newStatus: "", show: false });

  const [updatingId, setUpdatingId] = useState<string | null>(null); // loader while updating one row

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/careers`);
        const normalized = response.data.data.map((app: CareerApplication) => ({
          ...app,
          status: app.status.toLowerCase(),
        }));
        setApplications(normalized);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch career applications");
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, []);

  const handleDownloadCV = async (cvUrl: string) => {
    const signedUrl = await fetchSignedUrl(cvUrl);
    if (signedUrl) window.open(signedUrl, "_blank");
  };

  const fetchSignedUrl = async (url: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/files/sign-urls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: [url] }),
      });
      if (!res.ok) throw new Error("Failed to fetch signed URL");
      const data = await res.json();
      return data.signedUrls[0];
    } catch {
      return null;
    }
  };

  const handleStatusChange = (id: string, newStatus: string) => {
    setConfirmModal({ id, newStatus, show: true });
  };

  const confirmStatusChange = async () => {
    if (!confirmModal.id) return;
    const { id, newStatus } = confirmModal;
    setConfirmModal({ id: null, newStatus: "", show: false });
    setUpdatingId(id);

    try {
      await axios.put(`${API_BASE_URL}/api/careers/${id}/status`, {
        status: newStatus.charAt(0).toUpperCase() + newStatus.slice(1),
      });
      setApplications((prev) =>
        prev.map((app) =>
          app.id === id ? { ...app, status: newStatus } : app
        )
      );
    } catch (err) {
      console.error("Failed to update status", err);
      alert("Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "selected":
        return "text-green-600";
      case "pending":
        return "text-orange-500";
      case "rejected":
        return "text-red-600";
      default:
        return "text-gray-700";
    }
  };

  if (loading) return <p className="p-4 text-base">Loading...</p>;
  if (error) return <p className="p-4 text-base text-red-600">{error}</p>;

  return (
    <div className="p-5 relative">
      <h1 className="text-2xl font-semibold mb-4">Career Applications</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm uppercase">
              <th className="py-2.5 px-4 border-b">Name</th>
              <th className="py-2.5 px-4 border-b">Email</th>
              <th className="py-2.5 px-4 border-b">Phone</th>
              <th className="py-2.5 px-4 border-b">Job Role</th>
              <th className="py-2.5 px-4 border-b">Location</th>
              <th className="py-2.5 px-4 border-b">Status</th>
              <th className="py-2.5 px-4 border-b">Applied On</th>
              <th className="py-2.5 px-4 border-b">CV</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <tr
                key={app.id}
                className="text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
              >
                <td className="py-2.5 px-4 border-b">
                  {app.firstName} {app.lastName}
                </td>
                <td className="py-2.5 px-4 border-b">{app.email}</td>
                <td className="py-2.5 px-4 border-b">{app.phone}</td>
                <td className="py-2.5 px-4 border-b">{app.jobRole}</td>
                <td className="py-2.5 px-4 border-b">{app.location}</td>
                <td className="py-2.5 px-4 border-b">
                  {updatingId === app.id ? (
                    <span className="text-gray-500 italic">Updating...</span>
                  ) : (
                    <Select.Root
                      value={app.status.toLowerCase()}
                      onValueChange={(val) => handleStatusChange(app.id, val)}
                      disabled={
                        app.status !== "pending" // disable if status is already changed
                      }
                    >
                      <Select.Trigger
                        className={`max-w-[130px] border rounded px-2.5 py-1.5 text-sm flex justify-between items-center ${getStatusColor(
                          app.status
                        )} ${app.status !== "pending" ? "opacity-60 cursor-not-allowed" : ""
                          }`}
                      >
                        <Select.Value />
                        <ChevronDown className="w-4 h-4 ml-1 text-gray-500" />
                      </Select.Trigger>

                      <Select.Content className="bg-white dark:bg-gray-800 rounded shadow-lg text-sm">
                        {["pending", "selected", "rejected"].map(
                          (statusOption) => (
                            <Select.Item
                              key={statusOption}
                              value={statusOption}
                              className={`px-2.5 py-1.5 cursor-pointer ${getStatusColor(
                                statusOption
                              )}`}
                            >
                              <Select.ItemText className="capitalize">
                                {statusOption}
                              </Select.ItemText>
                            </Select.Item>
                          )
                        )}
                      </Select.Content>
                    </Select.Root>
                  )}
                </td>
                <td className="py-2.5 px-4 border-b">
                  {new Date(app.createdAt).toLocaleString()}
                </td>
                <td className="py-2.5 px-4 border-b text-center">
                  {app.cvUrl ? (
                    <button
                      onClick={() => handleDownloadCV(app.cvUrl)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Download className="w-5 h-5 mx-auto" />
                    </button>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Confirmation Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-[90%] max-w-sm text-center">
            <h2 className="text-lg font-semibold mb-3">
              Confirm Status Change
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Are you sure you want to set status to{" "}
              <span className="font-medium capitalize text-blue-600">
                {confirmModal.newStatus}
              </span>
              ?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={confirmStatusChange}
                className="bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-700"
              >
                Yes
              </button>
              <button
                onClick={() =>
                  setConfirmModal({ id: null, newStatus: "", show: false })
                }
                className="bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-4 py-1.5 rounded hover:bg-gray-400 dark:hover:bg-gray-600"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Careers;
