import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, XCircle, Eye, Search, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

const AgentBankManagement = () => {
  const [bankDetails, setBankDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadBankDetails();
  }, [filter]);

  const loadBankDetails = async () => {
    setLoading(true);
    try {
      const url = filter === 'all' 
        ? 'http://localhost:8080/api/agent-bank/all'
        : `http://localhost:8080/api/agent-bank/all?verified=${filter === 'verified'}`;
      
      const res = await fetch(url);
      const data = await res.json();
      setBankDetails(data.bankDetails || []);
    } catch (error) {
      toast.error('Failed to load bank details');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id, verified) => {
    try {
      const res = await fetch(`http://localhost:8080/api/agent-bank/verify/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified })
      });

      if (res.ok) {
        toast.success(`Bank details ${verified ? 'verified' : 'rejected'} successfully`);
        loadBankDetails();
        setShowDialog(false);
      } else {
        toast.error('Failed to update verification status');
      }
    } catch (error) {
      toast.error('Failed to update verification status');
    }
  };

  const filteredDetails = bankDetails.filter(detail => {
    const searchLower = searchTerm.toLowerCase();
    return (
      detail.agent?.full_name?.toLowerCase().includes(searchLower) ||
      detail.agent?.email?.toLowerCase().includes(searchLower) ||
      detail.account_number?.includes(searchTerm) ||
      detail.ifsc_code?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agent Bank Details</h1>
          <p className="text-gray-600 mt-1">Manage and verify agent bank accounts for payouts</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Search by name, email, account..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-80"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Accounts</p>
                <p className="text-2xl font-bold">{bankDetails.length}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <CreditCard className="text-blue-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Verified</p>
                <p className="text-2xl font-bold text-green-600">{bankDetails.filter(d => d.verified).length}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="text-green-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{bankDetails.filter(d => !d.verified).length}</p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <XCircle className="text-yellow-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bank Details Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading bank details...</p>
          </div>
        </div>
      ) : filteredDetails.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500 text-lg">No bank details found</p>
            <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filter</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Agent</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Account Holder</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Account Details</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredDetails.map((detail) => (
                    <tr key={detail.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">{detail.agent?.full_name}</p>
                          <p className="text-sm text-gray-600">{detail.agent?.email}</p>
                          <p className="text-xs text-blue-600 font-medium">{detail.agent?.guide_code}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{detail.account_holder_name}</p>
                          <p className="text-sm text-gray-600 capitalize">{detail.account_type} Account</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-mono text-sm text-gray-900">{detail.account_number}</p>
                          <p className="text-sm text-gray-600">{detail.ifsc_code}</p>
                          <p className="text-sm font-medium text-gray-700">{detail.bank_name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          {detail.verified ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              <CheckCircle size={14} className="mr-1" />
                              Verified
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                              Pending
                            </Badge>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(detail.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedDetail(detail);
                              setShowDialog(true);
                            }}
                          >
                            <Eye size={16} className="mr-1" />
                            View
                          </Button>
                          {!detail.verified && (
                            <>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handleVerify(detail.id, true)}
                              >
                                <CheckCircle size={16} className="mr-1" />
                                Verify
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleVerify(detail.id, false)}
                              >
                                <XCircle size={16} className="mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bank Details</DialogTitle>
          </DialogHeader>
          {selectedDetail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700">Agent Name</label>
                  <p className="text-gray-900">{selectedDetail.agent?.full_name}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Email</label>
                  <p className="text-gray-900">{selectedDetail.agent?.email}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Account Holder</label>
                  <p className="text-gray-900">{selectedDetail.account_holder_name}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Account Number</label>
                  <p className="font-mono text-gray-900">{selectedDetail.account_number}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">IFSC Code</label>
                  <p className="text-gray-900">{selectedDetail.ifsc_code}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Bank Name</label>
                  <p className="text-gray-900">{selectedDetail.bank_name}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Account Type</label>
                  <p className="text-gray-900 capitalize">{selectedDetail.account_type}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Status</label>
                  {selectedDetail.verified ? (
                    <Badge className="bg-green-100 text-green-800">Verified</Badge>
                  ) : (
                    <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                  )}
                </div>
              </div>

              {selectedDetail.passbook_url && (
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">Passbook Document</label>
                  <a
                    href={selectedDetail.passbook_signed_url || selectedDetail.passbook_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    View Passbook Document
                  </a>
                </div>
              )}

              {!selectedDetail.verified && (
                <div className="flex space-x-2 pt-4 border-t">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => handleVerify(selectedDetail.id, true)}
                  >
                    <CheckCircle size={16} className="mr-2" />
                    Verify Bank Details
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => handleVerify(selectedDetail.id, false)}
                  >
                    <XCircle size={16} className="mr-2" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgentBankManagement;
