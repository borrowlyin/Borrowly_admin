import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { API_BASE_URL } from "@/lib/api";

interface Bank {
  bank_id: string;
  bankname: string;
  ifsccode: string;
  branchname: string;
}

interface LoanActionButtonsProps {
  loanId: string;
  table: string;
  status: string;
  referralCode?: string;
  assignedBank?: string;
}

export const LoanActionButtons: React.FC<LoanActionButtonsProps> = ({ 
  loanId, 
  table, 
  status, 
  referralCode,
  assignedBank 
}) => {
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDisburseDialog, setShowDisburseDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [disburseAmount, setDisburseAmount] = useState('');
  
  // Bank assignment states
  const [banks, setBanks] = useState<Bank[]>([]);
  const [selectedBankId, setSelectedBankId] = useState('');
  const [assignedBanks, setAssignedBanks] = useState<any[]>([]);
  
  // Manual bank entry states
  const [manualBankName, setManualBankName] = useState('');
  const [manualIfscCode, setManualIfscCode] = useState('');
  const [manualBranch, setManualBranch] = useState('');
  const [manualAccountNumber, setManualAccountNumber] = useState('');

  useEffect(() => {
    fetchBanks();
    fetchAssignedBanks();
  }, []);

  const fetchBanks = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/banks/getAllBanks`);
      if (res.ok) {
        const data = await res.json();
        setBanks(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching banks:', error);
    }
  };

  const fetchAssignedBanks = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/loan-assignment/statuses/${loanId}/${table}`);
      if (res.ok) {
        const data = await res.json();
        setAssignedBanks(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching assigned banks:', error);
    }
  };

  const handleAssignBank = async () => {
    if (!selectedBankId) {
      toast({ title: 'Error', description: 'Please select a bank', variant: 'destructive' });
      return;
    }
    
    setProcessing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/assign-bank`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loan_id: loanId,
          loan_type: table,
          bank_id: selectedBankId
        })
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to assign bank');
      }
      
      toast({ title: 'Success', description: 'Bank assigned successfully' });
      setSelectedBankId('');
      fetchAssignedBanks();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const handleApprove = async () => {
    setProcessing(true);
    try {
      const body: any = {
        loan_id: loanId,
        loan_type: table
      };

      // Check if using dropdown bank or manual entry
      if (selectedBankId) {
        body.bank_id = selectedBankId;
      } else if (manualBankName && manualIfscCode && manualBranch) {
        body.manual_bank_details = {
          bank_name: manualBankName,
          ifsc_code: manualIfscCode,
          branch: manualBranch,
          account_number: manualAccountNumber
        };
      } else {
        toast({ 
          title: 'Error', 
          description: 'Please either select a bank or fill manual bank details', 
          variant: 'destructive' 
        });
        setProcessing(false);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/admin/approve-loan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to approve loan');
      }
      
      toast({ title: 'Success', description: 'Loan approved successfully' });
      setShowApproveDialog(false);
      resetApproveForm();
      window.location.reload();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast({ title: 'Error', description: 'Please enter rejection reason', variant: 'destructive' });
      return;
    }
    
    setProcessing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/reject-loan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loan_id: loanId,
          loan_type: table,
          rejection_reason: rejectReason
        })
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to reject loan');
      }
      
      toast({ title: 'Success', description: 'Loan rejected successfully' });
      setShowRejectDialog(false);
      setRejectReason('');
      window.location.reload();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const handleDisburse = async () => {
    if (!disburseAmount || parseFloat(disburseAmount) <= 0) {
      toast({ title: 'Error', description: 'Please enter valid disbursed amount', variant: 'destructive' });
      return;
    }
    setProcessing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/loan-status/${table}/${loanId}/disburse`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disbursed_amount: parseFloat(disburseAmount), notes: 'Disbursed' })
      });
      if (!res.ok) throw new Error('Failed to disburse');
      const data = await res.json();
      toast({ 
        title: 'Success', 
        description: `Loan disbursed${data.commissionTriggered ? ' and commission triggered' : ''}` 
      });
      setShowDisburseDialog(false);
      window.location.reload();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const resetApproveForm = () => {
    setSelectedBankId('');
    setManualBankName('');
    setManualIfscCode('');
    setManualBranch('');
    setManualAccountNumber('');
  };

  return (
    <>
      <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-blue-700 border-b pb-3 mb-4">Bank Assignment</h2>
        
        {/* Bank Assignment Section */}
        <div className="space-y-4 mb-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="bankSelect">Select Bank</Label>
              <Select value={selectedBankId} onValueChange={setSelectedBankId}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select banks" />
                </SelectTrigger>
                <SelectContent>
                  {banks.map((bank) => (
                    <SelectItem key={bank.bank_id} value={bank.bank_id}>
                      {bank.bankname} - {bank.ifsccode}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleAssignBank}
              disabled={processing || !selectedBankId}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {processing ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
              Assign Banks
            </Button>
          </div>
        </div>

        {/* Assigned Banks Display */}
        {assignedBanks.length > 0 && (
          <div className="mb-6">
            <h3 className="text-md font-semibold text-green-700 mb-3">Assigned Banks ({assignedBanks.length})</h3>
            <div className="space-y-2">
              {assignedBanks.map((assignment, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div>
                    <span className="font-medium">
                      {assignment.is_manual_entry ? assignment.manual_bank_name : assignment.bank_name}
                    </span>
                    <span className="text-sm text-gray-600 ml-2">
                      IFSC: {assignment.is_manual_entry ? assignment.manual_ifsc_code : assignment.ifsccode}
                    </span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    assignment.bank_status === 'approved' ? 'bg-green-100 text-green-800' :
                    assignment.bank_status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {assignment.bank_status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loan Actions */}
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Loan Actions</h2>
        <div className="flex justify-end space-x-4">
          {status === 'pending' && (
            <>
              <Button
                onClick={() => setShowRejectDialog(true)}
                disabled={processing}
                variant="destructive"
                className="px-6"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
              <Button
                onClick={() => setShowApproveDialog(true)}
                disabled={processing}
                className="px-6 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve
              </Button>
            </>
          )}
          {status === 'approved' && (
            <Button
              onClick={() => setShowDisburseDialog(true)}
              disabled={processing}
              className="px-6 bg-blue-600 hover:bg-blue-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark as Disbursed
            </Button>
          )}
          {status === 'disbursed' && (
            <div className="text-green-600 font-semibold flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              Loan Disbursed
            </div>
          )}
          {status === 'rejected' && (
            <div className="text-red-600 font-semibold flex items-center">
              <XCircle className="w-5 h-5 mr-2" />
              Loan Rejected
            </div>
          )}
        </div>
      </section>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Approve Loan Application</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Dropdown Bank Selection */}
            <div>
              <Label htmlFor="approveBank">Select Bank (Optional)</Label>
              <Select value={selectedBankId} onValueChange={setSelectedBankId}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select from existing banks" />
                </SelectTrigger>
                <SelectContent>
                  {banks.map((bank) => (
                    <SelectItem key={bank.bank_id} value={bank.bank_id}>
                      {bank.bankname} - {bank.ifsccode} - {bank.branchname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="text-center text-gray-500 font-medium">OR</div>

            {/* Manual Bank Entry */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium mb-3">Admin Manual Bank Input (Optional)</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="manualBankName">Bank Name</Label>
                  <Input
                    id="manualBankName"
                    placeholder="Enter bank name"
                    value={manualBankName}
                    onChange={(e) => setManualBankName(e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="manualIfscCode">IFSC Code</Label>
                  <Input
                    id="manualIfscCode"
                    placeholder="Enter IFSC code"
                    value={manualIfscCode}
                    onChange={(e) => setManualIfscCode(e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="manualBranch">Branch</Label>
                  <Input
                    id="manualBranch"
                    placeholder="Enter branch name"
                    value={manualBranch}
                    onChange={(e) => setManualBranch(e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="manualAccountNumber">Account Number (Optional)</Label>
                  <Input
                    id="manualAccountNumber"
                    placeholder="Enter account number"
                    value={manualAccountNumber}
                    onChange={(e) => setManualAccountNumber(e.target.value)}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowApproveDialog(false); resetApproveForm(); }}>Cancel</Button>
            <Button onClick={handleApprove} disabled={processing} className="bg-green-600 hover:bg-green-700">
              {processing ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
              Approve Loan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Loan Application</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="reason">Rejection Reason *</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for rejection..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={processing}>
              {processing ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
              Reject Loan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Loan Application</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="reason">Rejection Reason *</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for rejection..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={processing}>
              {processing ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
              Reject Loan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDisburseDialog} onOpenChange={setShowDisburseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disburse Loan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="amount">Disbursed Amount *</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter disbursed amount"
                value={disburseAmount}
                onChange={(e) => setDisburseAmount(e.target.value)}
                className="mt-2"
              />
            </div>
            <p className="text-sm text-gray-600">
              {referralCode ? 
                '✓ This loan has a referral code. Commission will be automatically triggered.' :
                'ℹ️ No referral code found. No commission will be triggered.'
              }
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisburseDialog(false)}>Cancel</Button>
            <Button onClick={handleDisburse} disabled={processing} className="bg-blue-600 hover:bg-blue-700">
              {processing ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
              Disburse Loan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
