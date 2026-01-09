import React, { useState, useEffect } from 'react';
import { Check, X, DollarSign, Filter, CreditCard, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

const API_BASE = 'http://localhost:8080/api/admin/earnings';

const EarningsManagement = () => {
  const [earnings, setEarnings] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);
  const [filter, setFilter] = useState('PENDING');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [paymentRef, setPaymentRef] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [bankDetails, setBankDetails] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [earningsRes, statsRes] = await Promise.all([
        fetch(`${API_BASE}/${filter === 'PENDING' ? 'pending' : `all?status=${filter}`}`),
        fetch(`${API_BASE}/stats`)
      ]);
      
      const earningsData = await earningsRes.json();
      const statsData = await statsRes.json();
      
      setEarnings(earningsData.earnings || []);
      setStats(statsData.stats);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadBankDetails = async (agentId: number) => {
    try {
      const res = await fetch(`http://localhost:8080/api/agent-bank/all`);
      const data = await res.json();
      const details = data.bankDetails?.find((b: any) => b.agent_id === agentId);
      setBankDetails(details || null);
    } catch (err) {
      toast.error('Failed to load bank details');
    }
  };

  const handleViewBank = async (agent: any) => {
    setSelectedAgent(agent);
    await loadBankDetails(agent.id);
    setShowBankModal(true);
  };

  const handleApprove = async (id: number) => {
    if (processing) return;
    setProcessing(id);
    
    // Optimistic update
    setEarnings(prev => prev.filter((e: any) => e.id !== id));
    
    try {
      const response = await fetch(`${API_BASE}/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: 'Approved by admin' })
      });
      
      if (response.ok) {
        toast.success('Earning approved successfully');
        loadData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to approve earning');
        loadData(); // Reload on error
      }
    } catch (err) {
      toast.error('Failed to approve earning');
      loadData(); // Reload on error
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (id: number) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    // Optimistic update
    setEarnings(prev => prev.filter((e: any) => e.id !== id));

    try {
      const response = await fetch(`${API_BASE}/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      
      if (response.ok) {
        toast.success('Earning rejected');
        loadData();
      } else {
        toast.error('Failed to reject earning');
        loadData();
      }
    } catch (err) {
      toast.error('Failed to reject earning');
      loadData();
    }
  };

  const handleBulkPayout = async () => {
    if (selectedIds.length === 0) {
      toast.error('Please select earnings to process');
      return;
    }

    if (!paymentRef) {
      toast.error('Please enter payment reference');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/bulk-payout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          earningIds: selectedIds,
          paymentReference: paymentRef,
          notes: 'Bulk payout processed'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success(`${data.processedCount} earnings marked as PAID. Total: ₹${data.totalAmount}`);
        setSelectedIds([]);
        setPaymentRef('');
        setShowBulkModal(false);
        loadData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to process bulk payout');
      }
    } catch (err) {
      toast.error('Failed to process bulk payout');
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === earnings.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(earnings.map((e: any) => e.id));
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      PENDING: 'default',
      APPROVED: 'secondary',
      PAID: 'default',
      REJECTED: 'destructive'
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Earnings Management</h1>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-800">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending.count}</div>
              <p className="text-sm text-yellow-700">₹{stats.pending.amount.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.approved.count}</div>
              <p className="text-sm text-blue-700">₹{stats.approved.amount.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-800">Paid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.paid.count}</div>
              <p className="text-sm text-green-700">₹{stats.paid.amount.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-800">Rejected</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.rejected.count}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filter === 'APPROVED' && selectedIds.length > 0 && (
              <Button onClick={() => setShowBulkModal(true)}>
                <DollarSign className="mr-2 h-4 w-4" />
                Process Payout ({selectedIds.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : earnings.length === 0 ? (
            <div className="text-center py-8 text-gray-600">No earnings found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {filter === 'APPROVED' && (
                    <TableHead className="w-12">
                      <Checkbox checked={selectedIds.length === earnings.length} onCheckedChange={selectAll} />
                    </TableHead>
                  )}
                  <TableHead>Agent</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  {filter === 'PENDING' && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {earnings.map((earning: any) => (
                  <TableRow key={earning.id}>
                    {filter === 'APPROVED' && (
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(earning.id)}
                          onCheckedChange={() => toggleSelect(earning.id)}
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <div>
                        <div className="font-medium">{earning.agent?.full_name}</div>
                        <div className="text-sm text-gray-600">{earning.agent?.guide_code}</div>
                        {filter === 'APPROVED' && (
                          <Button
                            size="sm"
                            variant="link"
                            className="p-0 h-auto text-xs text-blue-600"
                            onClick={() => handleViewBank(earning.agent)}
                          >
                            <CreditCard className="h-3 w-3 mr-1" />
                            View Bank Details
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{earning.source}</TableCell>
                    <TableCell className="font-medium">₹{earning.commission_amount}</TableCell>
                    <TableCell>{new Date(earning.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>{getStatusBadge(earning.payout_status)}</TableCell>
                    {filter === 'PENDING' && (
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleApprove(earning.id)}
                            disabled={processing === earning.id}
                          >
                            <Check className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleReject(earning.id)}
                            disabled={processing === earning.id}
                          >
                            <X className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showBulkModal} onOpenChange={setShowBulkModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Bulk Payout</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">Processing {selectedIds.length} earnings</p>
            <div>
              <label className="text-sm font-medium mb-2 block">Payment Reference Number *</label>
              <Input
                placeholder="Enter transaction/reference number (e.g., TXN123456)"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkModal(false)}>Cancel</Button>
            <Button onClick={handleBulkPayout}>Mark as Paid</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showBankModal} onOpenChange={setShowBankModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Agent Bank Details</DialogTitle>
          </DialogHeader>
          {selectedAgent && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg">{selectedAgent.full_name}</h3>
                <p className="text-sm text-gray-600">{selectedAgent.email}</p>
                <p className="text-sm text-blue-600 font-medium">{selectedAgent.guide_code}</p>
              </div>

              {bankDetails ? (
                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Account Holder Name</label>
                    <p className="text-gray-900">{bankDetails.account_holder_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Account Number</label>
                    <p className="font-mono text-gray-900">{bankDetails.account_number}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">IFSC Code</label>
                    <p className="text-gray-900">{bankDetails.ifsc_code}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Bank Name</label>
                    <p className="text-gray-900">{bankDetails.bank_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Account Type</label>
                    <p className="text-gray-900 capitalize">{bankDetails.account_type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700">Verification Status</label>
                    {bankDetails.verified ? (
                      <Badge className="bg-green-100 text-green-800">Verified</Badge>
                    ) : (
                      <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                    )}
                  </div>
                  {bankDetails.passbook_url && (
                    <div className="col-span-2">
                      <label className="text-sm font-semibold text-gray-700 block mb-2">Passbook Document</label>
                      <a
                        href={bankDetails.passbook_signed_url || bankDetails.passbook_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Document
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CreditCard className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>No bank details found for this agent</p>
                  <p className="text-sm">Agent needs to submit bank details first</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBankModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EarningsManagement;
