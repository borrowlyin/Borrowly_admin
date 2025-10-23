import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { API_BASE_URL } from "@/lib/api";
import { Download, Loader2 } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface CareerApplication {
  id: string;
  generatedUserId?: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  cvUrl?: string;
  assistance?: string;
  privacy?: boolean;
  jobRole?: string;
  team?: string;
  location?: string;
  status: string;
  createdAt?: string;
  [key: string]: any;
}

const Careers: React.FC = () => {
  const [applications, setApplications] = useState<CareerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmModal, setConfirmModal] = useState<{ id: string | null; newStatus: string; show: boolean }>({ id: null, newStatus: "", show: false });
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [page, setPage] = useState(1);
  const limit = 10;

  const { toast } = useToast();

  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_BASE_URL}/api/careers`);
        const raw = response.data?.data ?? response.data ?? [];
        const normalized = raw.map((app: any) => ({
          ...app,
          id: String(app.id ?? app.generatedUserId ?? app._id ?? app.uuid),
          firstName: app.firstName ?? app.first_name ?? app.first_name ?? "",
          lastName: app.lastName ?? app.last_name ?? "",
          status: (app.status ?? "pending").toLowerCase(),
        }));
        setApplications(normalized);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch career applications");
        toast({ title: "Error", description: "Failed to fetch career applications", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // reset page when filters/search change
  useEffect(() => setPage(1), [searchTerm, statusFilter]);

  const handleDownloadCV = async (cvUrl: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/files/sign-urls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: [cvUrl] }),
      });
      if (!res.ok) throw new Error("Failed to fetch signed URL");
      const data = await res.json();
      if (data.signedUrls?.[0]) window.open(data.signedUrls[0], "_blank");
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to download CV" , variant: "destructive" });
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

      setApplications((prev) => prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app)));
      toast({ title: "Status Updated", description: `Application marked as ${newStatus}` });
    } catch (err) {
      console.error("Failed to update status", err);
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
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

  const total = filteredApplications.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  // clamp page if filters reduced total pages
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalPages]);

  const paginated = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredApplications.slice(start, start + limit);
  }, [filteredApplications, page]);

  const formatDate = (date?: string) => (date ? new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-");

  const skeletonRows = Array.from({ length: 5 });

  const goToPage = (p: number) => {
    const clamped = Math.max(1, Math.min(totalPages, p));
    if (clamped === page) return;
    setPage(clamped);
  };

  return (
    <motion.div
      className="bg-white h-[93dvh] rounded-xl p-6 shadow-lg"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div>
        <h1 className="text-3xl font-bold mb-2">Career Applications</h1>
        <p className="mb-6 text-gray-500 text-[14px]">Review incoming applications and manage candidate statuses.</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <div className="w-full md:w-2/3 flex gap-3 items-center">
          <Input
            placeholder="Search applications by name, email or phone..."
            value={searchTerm}
            onChange={(e) => {
              setPage(1);
              setSearchTerm(e.target.value);
            }}
            className="w-full md:w-80"
          />
        </div>

        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={(v) => { setPage(1); setStatusFilter(v); }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="selected">Selected</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table / Loading / Empty */}
      {loading ? (
        <div className="flex justify-center items-center py-20 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading applications...
        </div>
      ) : paginated.length === 0 ? (
        <p className="text-center text-gray-500 py-10">No applications found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border rounded-md text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="px-4 py-3 border">Name</th>
                <th className="px-4 py-3 border">Email</th>
                <th className="px-4 py-3 border">Phone</th>
                <th className="px-4 py-3 border">Job Role</th>
                <th className="px-4 py-3 border">Location</th>
                <th className="px-4 py-3 border">Status</th>
                <th className="px-4 py-3 border">Applied</th>
                <th className="px-4 py-3 border">CV</th>
              </tr>
            </thead>

            <tbody>
              {paginated.map((app, i) => (
                <tr key={app.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-4 py-3 border">{app.firstName} {app.lastName ?? ""}</td>
                  <td className="px-4 py-3 border">{app.email ?? "-"}</td>
                  <td className="px-4 py-3 border">{app.phone ?? "-"}</td>
                  <td className="px-4 py-3 border">{app.jobRole ?? "-"}</td>
                  <td className="px-4 py-3 border">{app.location ?? "-"}</td>
                  <td className="px-4 py-3 border">
                    {updatingId === app.id ? (
                      <span className="text-gray-500 italic">Updating...</span>
                    ) : (
                      <Select value={app.status.toLowerCase()} onValueChange={(val) => handleStatusChange(app.id, val)}>
                        <SelectTrigger className={`w-32 capitalize ${getStatusColor(app.status)}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="selected">Selected</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </td>
                  <td className="px-4 py-3 border">{formatDate(app.createdAt)}</td>
                  <td className="px-4 py-3 border text-center">
                    {app.cvUrl ? (
                      <button onClick={() => handleDownloadCV(app.cvUrl)} className="text-blue-600 hover:text-blue-800">
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
      )}

      {/* Pagination */}
      <div className="flex justify-between items-center mt-6">
        <Button variant="outline" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
          Previous
        </Button>

        <p className="text-sm text-gray-600">
          Page {page} of {totalPages}
        </p>

        <Button variant="outline" disabled={page >= totalPages} onClick={() => goToPage(page + 1)}>
          Next
        </Button>
      </div>

      {/* Confirmation Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-[90%] max-w-sm text-center">
            <h2 className="text-lg font-semibold mb-3">Confirm Status Change</h2>
            <p className="text-sm text-gray-600 mb-4">Are you sure you want to set status to <span className="font-medium capitalize text-blue-600">{confirmModal.newStatus}</span> ?</p>
            <div className="flex justify-center gap-4">
              <button onClick={confirmStatusChange} className="bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-700">Yes</button>
              <button onClick={() => setConfirmModal({ id: null, newStatus: "", show: false })} className="bg-gray-300 text-gray-800 px-4 py-1.5 rounded hover:bg-gray-400">No</button>
            </div>
          </div>
        </div>
      )}

    </motion.div>
  );
};

export default Careers;
