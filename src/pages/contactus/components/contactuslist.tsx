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
import { Loader2, RefreshCw } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useContactUsCache } from "@/hooks/useContactUsCache";

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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const { contacts, loading, total, totalPages, isRefreshing, lastUpdated, refetch } = useContactUsCache(page, search, statusFilter);
  const { toast } = useToast();



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
      const newStatus = updated?.status ?? status;
      
      // Refresh cache after status update
      refetch();

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
