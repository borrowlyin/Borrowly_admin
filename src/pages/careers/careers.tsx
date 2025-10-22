import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { API_BASE_URL } from "@/lib/api";
import { Download } from "lucide-react";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";

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
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

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
        try {
            const res = await fetch(`${API_BASE_URL}/api/files/sign-urls`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ urls: [cvUrl] }),
            });
            if (!res.ok) throw new Error("Failed to fetch signed URL");
            const data = await res.json();
            if (data.signedUrls[0]) window.open(data.signedUrls[0], "_blank");
        } catch (err) {
            console.error(err);
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
      prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
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

    const filteredApplications = useMemo(() => {
        return applications.filter((app) => {
            const statusMatch = statusFilter === "all" || app.status === statusFilter;
            const searchMatch = searchTerm
                ? Object.values(app)
                    .join(" ")
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase())
                : true;
            return statusMatch && searchMatch;
        });
    }, [applications, searchTerm, statusFilter]);

    const skeletonRows = Array.from({ length: 5 });

    return (
        <div className="p-5 relative">
            <h1 className="text-2xl font-semibold mb-4">Career Applications</h1>

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <input
                    type="text"
                    placeholder="Search applications..."
                    className="border rounded px-3 py-2 w-full sm:w-1/2"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />

                {/* Custom Select for filter */}
                <Select
                    value={statusFilter}
                    onValueChange={(val) => setStatusFilter(val)}
                >
                    <SelectTrigger className="border rounded px-3 py-2 w-full sm:w-1/4">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {["all", "pending", "selected", "rejected"].map((status) => (
                            <SelectItem key={status} value={status}>
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

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
                        {loading
                            ? skeletonRows.map((_, idx) => (
                                <tr key={idx} className="animate-pulse">
                                    {Array.from({ length: 8 }).map((__, i) => (
                                        <td key={i} className="py-2.5 px-4 border-b bg-gray-200 rounded"></td>
                                    ))}
                                </tr>
                            ))
                            : filteredApplications.length === 0
                                ? (
                                    <tr>
                                        <td colSpan={8} className="text-center py-4 text-gray-500">
                                            No data found
                                        </td>
                                    </tr>
                                )
                                : filteredApplications.map((app) => (
                                    <tr
                                        key={app.id}
                                        className="text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                                    >
                                        <td className="py-2.5 px-4 border-b">{app.firstName} {app.lastName}</td>
                                        <td className="py-2.5 px-4 border-b">{app.email}</td>
                                        <td className="py-2.5 px-4 border-b">{app.phone}</td>
                                        <td className="py-2.5 px-4 border-b">{app.jobRole}</td>
                                        <td className="py-2.5 px-4 border-b">{app.location}</td>
                                        <td className="py-2.5 px-4 border-b">
                                            {updatingId === app.id ? (
                                                <span className="text-gray-500 italic">Updating...</span>
                                            ) : (
                                                <Select
                                                    value={app.status.toLowerCase()}
                                                    onValueChange={(val) => handleStatusChange(app.id, val)} // just open modal
                                                    disabled={app.status !== "pending"}
                                                >
                                                    <SelectTrigger className={`max-w-[150px] capitalize ${getStatusColor(app.status)}`}>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {["pending", "selected", "rejected"].map((statusOption) => (
                                                            <SelectItem key={statusOption} value={statusOption}>
                                                                {statusOption.charAt(0).toUpperCase() + statusOption.slice(1)}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        </td>

                                        <td className="py-2.5 px-4 border-b">{new Date(app.createdAt).toLocaleString()}</td>
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
                        <h2 className="text-lg font-semibold mb-3">Confirm Status Change</h2>
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
                                onClick={() => setConfirmModal({ id: null, newStatus: "", show: false })}
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
