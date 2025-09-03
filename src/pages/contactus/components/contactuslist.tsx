import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { Button } from "@/components/ui/button";

interface ContactInquiry {
  id: number;
  name?: string;
  email_address?: string;
  phone_number?: string;
  subject?: string;
  has_active_loan?: boolean;
  message?: string;
  status: string;
  created_at: string;
}

const Contactuslist: React.FC = () => {
  const [contacts, setContacts] = useState<ContactInquiry[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const { toast } = useToast();

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", String(page));
      params.append("limit", String(limit));
      if (search) params.append("search", search);
      if (statusFilter !== "all") params.append("status", statusFilter);

     const res = await fetch(`${API_BASE_URL}/api/contact-us?${params.toString()}`);

      const data = await res.json();

      setContacts(data.data || []);
      setTotal(data.total || 0);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch contact messages.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [page, search, statusFilter]);

  const updateStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/contact-us/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      const updated = await res.json();
      setContacts((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: updated.status } : c))
      );

      toast({
        title: "Updated",
        description: `Status set to "${status}"`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update contact status.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (date: string | undefined) =>
    date
      ? new Date(date).toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      : "-";

  const totalPages = Math.ceil(total / limit);

  return (
    <motion.div
      className="bg-white rounded-xl p-6 shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Top Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <Input
          placeholder="Search contacts..."
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          className="w-full md:w-80"
        />

        <Select
          value={statusFilter}
          onValueChange={(val) => {
            setPage(1);
            setStatusFilter(val);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="replied">Replied</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading messages...
        </div>
      ) : contacts.length === 0 ? (
        <p className="text-center text-gray-500 py-10">No contacts found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border rounded-md text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="px-4 py-3 border">Email</th>
                <th className="px-4 py-3 border">Phone</th>
                <th className="px-4 py-3 border">Message</th>
                <th className="px-4 py-3 border">Taken loan</th>
                <th className="px-4 py-3 border">Status</th>
                <th className="px-4 py-3 border">Submitted At</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact, i) => (
                <tr
                  key={contact.id}
                  className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  <td className="px-4 py-3 border">
                    {contact.email_address || "-"}
                  </td>
                  <td className="px-4 py-3 border">
                    {contact.phone_number || "-"}
                  </td>
                  <td className="px-4 py-3 border">{contact.message || "-"}</td>
                  <td className="px-4 py-3 border text-center">
                    {contact?.has_active_loan ? "Yes" : "No"}
                  </td>
                  <td className="px-4 py-3 border">
                   <Select
                    value={contact.status || "pending"}
                    onValueChange={(val) => updateStatus(contact.id, val)}
                    disabled={contact.status === "replied"} // ✅ disable if replied
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="replied">Replied</SelectItem>
                    </SelectContent>
                  </Select>
                  </td>
                  <td className="px-4 py-3 border">
                    {formatDate(contact.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <p className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </p>
          <Button
            variant="outline"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </motion.div>
  );
};

export default Contactuslist;
