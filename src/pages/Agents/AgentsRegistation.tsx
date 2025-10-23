import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { FileText, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { API_BASE_URL } from "@/lib/api";

interface Agent {
  id: string;
  full_name?: string;
  phone?: string;
  email?: string;
  professional_type?: string;
  state?: string;
  created_at?: string;
  approval?: boolean | null;
  [key: string]: any;
}

const formatDate = (d?: string) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    : "-";

const fieldLabelMap: Record<string, string> = {
  full_name: "Full Name",
  phone: "Phone",
  email: "Email",
  professional_type: "Professional Type",
  state: "State",
  created_at: "Submitted On",
  pan_card_url: "PAN Card",
  aadhar_card_url: "Aadhaar Card",
  profile_url: "Profile Photo",
};

const formatKey = (key: string) =>
  fieldLabelMap[key] ||
  key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const AgentsRegistration: React.FC = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [approvalFilter, setApprovalFilter] = useState<"all" | "approved" | "pending">("pending");

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const { toast } = useToast();
  // DELETE confirmation modal state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    agentId: string | null;
    loading: boolean;
  }>({ open: false, agentId: null, loading: false });

  // NEW: confirmation modal state
  const [confirming, setConfirming] = useState<{
    open: boolean;
    agentId: string | null;
    newApproval: boolean;
    loading: boolean;
  }>({ open: false, agentId: null, newApproval: false, loading: false });

  // fetch agents list
  // fetch agents list
  const fetchAgents = async (p = page) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", String(p));
      params.append("limit", String(limit));
      if (search) params.append("search", search);
      if (stateFilter !== "all") params.append("state", stateFilter);
      if (typeFilter !== "all") params.append("professional_type", typeFilter);

      // Approval filter logic
      if (approvalFilter === "approved") {
        params.append("approval", "true");
      } else if (approvalFilter === "pending") {
        params.append("approval", "false");
      }
      // if "all", do not append approval => fetch all

      const url = `${API_BASE_URL}/api/agents/admin/agents/newlist?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();

      const items: Agent[] = Array.isArray(data.agents)
        ? data.agents
        : data.data ?? [];
      const meta = data.meta ?? {};

      setAgents(items.map((a) => ({ ...a, id: String(a.id) })));
      setTotalItems(Number(meta.totalItems ?? items.length));
      setTotalPages(Math.max(1, Number(meta.totalPages ?? 1)));
      setPage(
        Math.max(
          1,
          Math.min(
            Number(meta.currentPage ?? p),
            Math.max(1, Number(meta.totalPages ?? 1))
          )
        )
      );
    } catch (err) {
      console.error("fetchAgents error:", err);
      toast({
        title: "Error",
        description: "Failed to fetch agents.",
        variant: "destructive",
      });
      setAgents([]);
      setTotalItems(0);
      setTotalPages(1);
      setPage(1);
    } finally {
      setLoading(false);
    }
  };



  useEffect(() => {
    fetchAgents(1);
  }, [search, stateFilter, typeFilter, approvalFilter]);

  // fetch signed url helper
  const fetchSignedUrl = async (documentUrl: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/files/sign-urls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: [documentUrl] }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        console.error("fetchSignedUrl non-OK:", res.status, txt);
        throw new Error("Failed to fetch signed URL");
      }
      const data = await res.json();
      return data.signedUrls?.[0] ?? null;
    } catch (error) {
      console.error("fetchSignedUrl error:", error);
      toast({
        title: "Error",
        description: "Failed to load document.",
        variant: "destructive",
      });
      return null;
    }
  };

  // fetch single agent details
  const fetchAgentDetails = async (id: string) => {
    setDetailsLoading(true);
    setSelectedAgent(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/agents/admin/agents/${id}`);
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        console.error("fetchAgentDetails non-OK:", res.status, txt);
        throw new Error("Failed to fetch agent details");
      }
      const data = await res.json();
      const agentObj = data?.agent ?? data;
      setSelectedAgent({ ...agentObj, id: String(agentObj.id) });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to load agent details.",
        variant: "destructive",
      });
      setSelectedAgent(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const clearView = () => {
    setSelectedAgent(null);
    setDetailsLoading(false);
  };

  // approve/unapprove - keep this focused on API call and local update
  const toggleApproval = async (agentId: string, newApproval: boolean) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/agents/admin/agents/${agentId}/approval`,
        {
          method: "put",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approval: newApproval }),
        }
      );
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        console.error("toggleApproval non-OK:", res.status, txt);
        throw new Error(`Failed (${res.status})`);
      }

      // If approval succeeded:
      if (newApproval) {
        // Remove from the registration list (approved agents shouldn't stay here)
        setAgents((prev) => prev.filter((a) => String(a.id) !== String(agentId)));
        // If viewing details, close it
        if (selectedAgent?.id === agentId) {
          clearView();
        }
      } else {
        // For unapprove, update row in place
        setAgents((prev) =>
          prev.map((a) =>
            String(a.id) === String(agentId) ? { ...a, approval: newApproval } : a
          )
        );
        if (selectedAgent?.id === agentId)
          setSelectedAgent((s) => (s ? { ...s, approval: newApproval } : s));
      }

      toast({
        title: newApproval ? "Approved" : "Unapproved",
        description: newApproval
          ? "Agent approved and removed from new registrations."
          : "Agent set to unapproved.",
      });
    } catch (err) {
      console.error("toggleApproval error:", err);
      toast({
        title: "Error",
        description: "Failed to update approval.",
        variant: "destructive",
      });
    }
  };

  const goToPage = (p: number) => {
    const clamped = Math.max(1, Math.min(totalPages, p));
    if (clamped === page) return;
    setPage(clamped);
    fetchAgents(clamped);
  };

  // Smart document key detection (case-insensitive)
  const detectDocumentKeys = (agent: Agent | null) => {
    if (!agent) return [];
    return Object.keys(agent).filter((k) => {
      const val = agent[k];
      // we only care about string values that look like URLs (or non-empty strings)
      if (typeof val !== "string" || !val) return false;
      const lower = k.toLowerCase();
      // check key name for common document indicators
      return /(aadhar|aadhaar|adhar|pan|profile|selfie|id_proof|doc|document|upload)/i.test(
        lower
      );
    });
  };

  // NEW: open confirmation modal
  const openConfirm = (agentId: string, newApproval: boolean) => {
    setConfirming({ open: true, agentId, newApproval, loading: false });
  };

  // NEW: confirm handler that calls API and updates UI (shows spinner while running)
  const handleConfirm = async () => {
    if (!confirming.agentId) return;
    setConfirming((c) => ({ ...c, loading: true }));
    await toggleApproval(confirming.agentId, confirming.newApproval);
    setConfirming({ open: false, agentId: null, newApproval: false, loading: false });
  };

  const cancelConfirm = () => {
    setConfirming({ open: false, agentId: null, newApproval: false, loading: false });
  };
const handleDeleteConfirm = async () => {
  if (!deleteConfirm.agentId) return;
  setDeleteConfirm((d) => ({ ...d, loading: true }));

  try {
    const res = await fetch(`${API_BASE_URL}/api/agents/delete/${deleteConfirm.agentId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      console.error("deleteAgent non-OK:", res.status, txt);
      throw new Error(`Failed (${res.status})`);
    }

    toast({
      title: "Deleted",
      description: "Agent deleted successfully and regret mail sent.",
    });

    setAgents((prev) => prev.filter((a) => String(a.id) !== String(deleteConfirm.agentId)));
    if (selectedAgent?.id === deleteConfirm.agentId) clearView();
  } catch (err) {
    console.error("deleteAgent error:", err);
    toast({
      title: "Error",
      description: "Failed to delete agent.",
      variant: "destructive",
    });
  } finally {
    setDeleteConfirm({ open: false, agentId: null, loading: false });
  }
};


  return (
    <motion.div
      className="bg-white h-[93dvh] overflow-scroll rounded-xl p-6 shadow-lg"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div>
        <h1 className="text-3xl font-bold mb-2">Agent Registrations</h1>
        <p className="mb-6 text-gray-500 text-[14px]">
          Review and manage new agent registrations. Approve verified agents to
          activate them.
        </p>
      </div>

      {/* Search + Toggle */}
      {!selectedAgent && (
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          {/* Search Input */}
          <Input
            placeholder="Search by name, phone or email..."
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            className="w-full md:w-80"
          />

          {/* Toggle Switch */}
          <div
            className="relative w-40 h-10 bg-gray-200 rounded-full cursor-pointer flex items-center px-1"
            onClick={() =>
              setApprovalFilter(approvalFilter === "pending" ? "approved" : "pending")
            }
          >
            {/* Slider */}
            <div
              className={`absolute top-1 left-1 h-8 w-1/2 rounded-full transition-all duration-300
          ${approvalFilter === "pending" ? "bg-yellow-400" : "bg-green-500"}`
              }
              style={{
                transform: approvalFilter === "approved" ? "translateX(100%)" : "translateX(0)",
              }}
            ></div>

            {/* Labels */}
            <div className="flex justify-between w-full text-xs font-medium text-gray-700 z-10 px-2">
              <span className={approvalFilter === "pending" ? "text-white" : ""}>Pending</span>
              <span className={approvalFilter === "approved" ? "text-white" : ""}>Approved</span>
            </div>
          </div>
        </div>
      )}


      {/* Loading / List */}
      {loading ? (
        <div className="flex justify-center items-center py-20 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading agents...
        </div>
      ) : agents.length === 0 ? (
        <p className="text-center text-gray-500 py-10">No agent registrations found.</p>
      ) : selectedAgent && detailsLoading ? (
        <div className="flex justify-center items-center h-[60vh]">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
        </div>
      ) : selectedAgent ? (
        // === Agent Details (same as before) ===
        <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={clearView}
              className="flex items-center gap-2 border-blue-500 text-blue-600 hover:bg-blue-600 hover:text-white transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
            <h1 className="text-3xl font-semibold text-gray-800 tracking-tight">
              Agent Application Details
            </h1>
            <div className="text-sm text-gray-500">
              Submitted: {formatDate(String(selectedAgent.created_at))}
            </div>
          </div>

          {/* Blue Gradient Header */}
          <div className="bg-gradient-to-r from-blue-800 via-blue-600 to-sky-400 text-white p-6 rounded-2xl shadow-lg">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <div>
                <h2 className="text-xl font-semibold">
                  {selectedAgent.full_name || "-"}
                </h2>
                <p className="text-sm opacity-90">
                  {selectedAgent.email ?? ""}
                </p>
              </div>
              <div className="mt-4 sm:mt-0 flex flex-col items-end">
                <span
                  className={`text-sm font-medium px-3 py-1 rounded-full ${selectedAgent.approval ? "bg-green-500 text-white" : "bg-yellow-400 text-black"
                    }`}
                >
                  {(selectedAgent.approval ? "APPROVED" : "PENDING").toUpperCase()}
                </span>

              </div>
            </div>
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Personal Details */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-blue-700 border-b pb-3 mb-4">Personal Details</h2>
              <dl className="grid grid-cols-1 divide-y divide-gray-100">
                {[
                  ["full_name", selectedAgent.full_name],
                  ["phone", selectedAgent.phone],
                  ["email", selectedAgent.email],
                  ["created_at", selectedAgent.created_at],
                ]
                  .filter(([, value]) => value !== undefined && value !== null && value !== "")
                  .map(([key, value]) => (
                    <div
                      key={key}
                      className="flex justify-between items-center py-3 px-2 rounded-lg transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100"
                    >
                      <dt className="font-medium text-gray-700">{formatKey(String(key))}:</dt>
                      <dd className="text-gray-900 text-right">
                        {String(key) === "created_at" ? formatDate(String(value)) : String(value)}
                      </dd>
                    </div>
                  ))}
              </dl>
            </section>

            {/* Professional / Other Details */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-blue-700 border-b pb-3 mb-4">Professional Details</h2>
              {Object.keys(selectedAgent)
                .filter((key) => !["id", "full_name", "phone", "email", "created_at", "approval", "AadharURL", "PanURL", "ProfileURL"].includes(key))
                .filter((key) => {
                  const val = selectedAgent[key];
                  return val !== undefined && val !== null && val !== "" && typeof val !== "object";
                })
                .map((key) => (
                  <div
                    key={key}
                    className="flex justify-between items-center py-3 px-2 rounded-lg transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100"
                  >
                    <dt className="font-medium text-gray-700">{formatKey(key)}:</dt>
                    <dd className="text-gray-900 text-right">{String(selectedAgent[key])}</dd>
                  </div>
                ))}
            </section>
          </div>

          {/* Documents */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h2 className="text-lg font-semibold text-blue-700">Uploaded Documents</h2>
              <span className="text-sm text-gray-500">
                {`${detectDocumentKeys(selectedAgent).length} detected`}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {(() => {
                const docKeys = detectDocumentKeys(selectedAgent);
                // fallback keys to show when none detected
                const fallback = ["AadharURL", "PanURL", "ProfileURL", "pan_card_url", "aadhar_card_url", "profile_url"];
                const keysToRender = docKeys.length ? docKeys : fallback;

                return keysToRender.map((key, idx) => {
                  const value = selectedAgent?.[key];
                  const isUploaded = Boolean(value && typeof value === "string" && value.trim() !== "");
                  return (
                    <div
                      key={`${key}-${idx}`}
                      className={`border rounded-xl p-5 flex flex-col items-center text-center transition transform hover:scale-[1.02] ${isUploaded
                        ? "border-blue-200 bg-blue-50 hover:shadow-md"
                        : "border-gray-200 bg-gray-50 opacity-80"
                        }`}
                    >
                      <FileText className={`w-8 h-8 mb-3 ${isUploaded ? "text-blue-700" : "text-gray-400"}`} />
                      <p className="font-medium text-gray-700 mb-2 text-sm">{formatKey(key)}</p>
                      {isUploaded ? (
                        <button
                          onClick={async () => {
                            const signed = await fetchSignedUrl(String(value));
                            if (signed) window.open(signed, "_blank");
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
                });
              })()}
            </div>
          </section>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            {/* OPEN confirmation modal instead of direct API call */}
            <Button
              variant={selectedAgent.approval ? "outline" : "default"}
              onClick={() =>
                openConfirm(String(selectedAgent.id), !Boolean(selectedAgent.approval))
              }
            >
              {selectedAgent.approval ? "Unapprove" : "Approve"}
            </Button>
            <Button
              variant="destructive"
              onClick={() => setDeleteConfirm({ open: true, agentId: selectedAgent?.id ?? null, loading: false })}
            >
              Delete
            </Button>

          </div>
        </div>
      ) : (
        // === Agent list view ===
        <div className="overflow-x-auto">
          <table className="min-w-full border rounded-md text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="px-4 py-3 border">Name</th>
                <th className="px-4 py-3 border">Phone</th>
                <th className="px-4 py-3 border">Email</th>
                <th className="px-4 py-3 border">Type</th>
                <th className="px-4 py-3 border">State</th>
                <th className="px-4 py-3 border">Submitted</th>
                <th className="px-4 py-3 border">Approval</th>
                <th className="px-4 py-3 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {agents
                .filter((agent) => {
                  // Search filter
                  const term = search.toLowerCase();
                  const matchesSearch =
                    !search ||
                    (agent.full_name?.toLowerCase().includes(term)) ||
                    (agent.phone?.toLowerCase().includes(term)) ||
                    (agent.email?.toLowerCase().includes(term));

                  // State filter
                  const matchesState = stateFilter === "all" || agent.state === stateFilter;

                  // Type filter
                  const matchesType =
                    typeFilter === "all" || agent.professional_type === typeFilter;

                  return matchesSearch && matchesState && matchesType;
                })
                .map((agent, i) => (

                  <tr key={agent.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-3 border">{agent.full_name ?? "-"}</td>
                    <td className="px-4 py-3 border">{agent.phone ?? "-"}</td>
                    <td className="px-4 py-3 border">{agent.email ?? "-"}</td>
                    <td className="px-4 py-3 border">{agent.professional_type ?? "-"}</td>
                    <td className="px-4 py-3 border">{agent.state ?? "-"}</td>
                    <td className="px-4 py-3 border">{formatDate(agent.created_at)}</td>
                    <td className="px-4 py-3 border">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${agent.approval ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                          }`}
                      >
                        {agent.approval ? "Approved" : "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3 border">
                      <div className="flex items-center gap-3">
                        <button
                          className="text-blue-600 hover:text-blue-800 font-medium"
                          onClick={() => fetchAgentDetails(String(agent.id))}
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!selectedAgent && (
        <div className="flex justify-between items-center mt-6">
          <Button variant="outline" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
            Previous
          </Button>
          <p className="text-sm text-gray-600">
            Page {page} of {totalPages} • {totalItems} items
          </p>
          <Button variant="outline" disabled={page >= totalPages} onClick={() => goToPage(page + 1)}>
            Next
          </Button>
        </div>
      )}

      {/* ===== Confirmation Modal ===== */}
      {confirming.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={cancelConfirm}
            aria-hidden
          />
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 z-10">
            <h3 className="text-lg font-semibold mb-2">
              {confirming.newApproval ? "Confirm Approval" : "Confirm Action"}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {confirming.newApproval
                ? "Are you sure you want to approve this agent? This will activate the agent and remove them from the new registrations list."
                : "Are you sure you want to set this agent to unapproved?"}
            </p>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={cancelConfirm} disabled={confirming.loading}>
                No
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={confirming.loading}
              >
                {confirming.loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                  </span>
                ) : (
                  "Yes"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}


      {deleteConfirm.open && (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    <div
      className="absolute inset-0 bg-black/40"
      onClick={() => setDeleteConfirm({ open: false, agentId: null, loading: false })}
      aria-hidden
    />
    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 z-10">
      <h3 className="text-lg font-semibold mb-2">Confirm Delete</h3>
      <p className="text-sm text-gray-600 mb-4">
        Are you sure you want to delete this agent? A regret mail will be sent.
      </p>

      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => setDeleteConfirm({ open: false, agentId: null, loading: false })}
          disabled={deleteConfirm.loading}
        >
          No
        </Button>
        <Button onClick={handleDeleteConfirm} disabled={deleteConfirm.loading}>
          {deleteConfirm.loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Deleting...
            </span>
          ) : (
            "Yes"
          )}
        </Button>
      </div>
    </div>
  </div>
)}

    </motion.div>
  );
};

export default AgentsRegistration;
