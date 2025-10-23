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
  status?: string;
  created_at?: string;
  [key: string]: any;
}

const Contactuslist: React.FC = () => {
  const [contacts, setContacts] = useState<ContactInquiry[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;
  const { toast } = useToast();

  const fetchContacts = async (p = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", String(p));
      params.append("limit", String(limit));
      if (search) params.append("search", search);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const res = await fetch(`${API_BASE_URL}/api/contact-us?${params.toString()}`);

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        console.error("fetchContacts non-OK:", res.status, res.statusText, txt);
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json().catch((e) => {
        console.error("Failed to parse JSON:", e);
        return null;
      });

      // Accept multiple shapes: raw array, { data: [...] }, { items: [...] }, { result: [...] }
      let items: any[] = [];
      let totalCount = 0;
      let serverPage = p;
      let serverTotalPages = 1;

      if (Array.isArray(data)) {
        items = data;
        totalCount = data.length;
      } else if (data && Array.isArray(data.data)) {
        items = data.data;
        totalCount = Number(data.total ?? items.length) || 0;
        serverPage = Number(data.page ?? p) || p;
        serverTotalPages = Number(data.totalPages ?? Math.max(1, Math.ceil(totalCount / limit)));
      } else if (data && Array.isArray(data.items)) {
        items = data.items;
        totalCount = Number(data.total ?? items.length) || 0;
        serverPage = Number(data.page ?? p) || p;
        serverTotalPages = Number(data.totalPages ?? Math.max(1, Math.ceil(totalCount / limit)));
      } else if (data && Array.isArray(data.result)) {
        items = data.result;
        totalCount = Number(data.total ?? items.length) || 0;
        serverPage = Number(data.page ?? p) || p;
        serverTotalPages = Number(data.totalPages ?? Math.max(1, Math.ceil(totalCount / limit)));
      } else {
        console.warn("Unexpected response shape for contact-us:", data);
        items = [];
        totalCount = 0;
      }

      // Normalise minimal fields we use
      const mapped: ContactInquiry[] = items.map((c: any) => ({
        id: Number(c.id),
        name: c.name ?? c.fullname ?? `${c.first_name ?? ""} ${c.last_name ?? ""}`.trim(),
        email_address: c.email_address ?? c.email ?? c.emailAddress ?? "",
        phone_number: c.phone_number ?? c.mobile ?? c.contact_number ?? "",
        subject: c.subject ?? c.topic ?? "",
        has_active_loan: Boolean(c.has_active_loan ?? c.hasLoan ?? c.taken_loan),
        message: c.message ?? c.body ?? "",
        status: c.status ?? "pending",
        created_at: c.created_at ?? c.createdAt ?? "",
        ...c,
      }));

      setContacts(mapped);
      setTotal(totalCount);
      setTotalPages(Math.max(1, serverTotalPages));
      setPage(Math.min(Math.max(1, serverPage), Math.max(1, serverTotalPages)));
    } catch (error) {
      console.error("fetchContacts error:", error);
      toast({
        title: "Error",
        description: "Failed to fetch contact messages. Check console/network for details.",
        variant: "destructive",
      });
      setContacts([]);
      setTotal(0);
      setTotalPages(1);
      setPage(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, statusFilter]);

  const updateStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/contact-us/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        console.error("updateStatus non-OK:", res.status, res.statusText, txt);
        throw new Error("Failed to update status");
      }

      const updated = await res.json().catch(() => null);
      // If API returns the updated object or status, use it; otherwise update optimistic
      const newStatus = updated?.status ?? status;
      setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c)));

      toast({
        title: "Updated",
        description: `Status set to "${newStatus}"`,
      });
    } catch (error) {
      console.error("updateStatus error:", error);
      toast({
        title: "Error",
        description: "Failed to update contact status.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (date?: string) =>
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

  const goToPage = (p: number) => {
    const clamped = Math.max(1, Math.min(totalPages, p));
    if (clamped === page) return;
    setPage(clamped);
  };

  return (
    <motion.div
      className="bg-white rounded-xl p-6 shadow-lg h-[93dvh]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="">
        <h1 className="text-3xl font-bold mb-2">Contact Us Messages</h1>
        <p className="mb-6 text-gray-500 text-[14px]">
          Review incoming contact inquiries. Reply to users and update status to keep track of responses.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <div className="w-full md:w-2/3 flex gap-3 items-center">
          <Input
            placeholder="Search contacts by email, phone or message..."
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            className="w-full md:w-80"
          />
        </div>

        <div className="flex items-center gap-3">
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
      </div>

      {/* Loading / Empty / Table */}
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
                <tr key={contact.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-4 py-3 border">{contact.email_address || "-"}</td>
                  <td className="px-4 py-3 border">{contact.phone_number || "-"}</td>
                  <td className="px-4 py-3 border max-w-xs truncate">{contact.message || "-"}</td>
                  <td className="px-4 py-3 border text-center">{contact.has_active_loan ? "Yes" : "No"}</td>
                  <td className="px-4 py-3 border">
                    <Select
                      value={contact.status ?? "pending"}
                      onValueChange={(val) => updateStatus(contact.id, val)}
                      disabled={contact.status === "replied"}
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
                  <td className="px-4 py-3 border">{formatDate(contact.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
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
      )}
    </motion.div>
  );
};

export default Contactuslist;
